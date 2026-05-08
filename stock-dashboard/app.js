const STORAGE_KEY = "personal-stock-board:v1";

const defaults = {
  token: "",
  refreshSeconds: 15,
  stocks: [
    { symbol: "AAPL", name: "Apple", shares: 3, avgCost: 180 },
    { symbol: "NVDA", name: "NVIDIA", shares: 2, avgCost: 860 },
    { symbol: "TSLA", name: "Tesla", shares: 1, avgCost: 210 },
    { symbol: "005930.KS", name: "Samsung Electronics", shares: 10, avgCost: 75000 }
  ],
  quotes: {}
};

const demoSeeds = {
  AAPL: 188.7,
  NVDA: 925.25,
  TSLA: 216.4,
  "005930.KS": 77400,
  MSFT: 414.9,
  AMZN: 184.2,
  META: 492.8,
  "000660.KS": 181500
};

let state = loadState();
let refreshTimer = null;
let demoTimer = null;
let countdownTimer = null;
let nextRefreshAt = Date.now();
let visibleMode = "table";

const els = {
  connectionDot: document.querySelector("#connectionDot"),
  connectionLabel: document.querySelector("#connectionLabel"),
  lastUpdated: document.querySelector("#lastUpdated"),
  providerBadge: document.querySelector("#providerBadge"),
  apiToken: document.querySelector("#apiToken"),
  refreshInterval: document.querySelector("#refreshInterval"),
  saveSettings: document.querySelector("#saveSettings"),
  clearToken: document.querySelector("#clearToken"),
  refreshButton: document.querySelector("#refreshButton"),
  addForm: document.querySelector("#addForm"),
  symbolInput: document.querySelector("#symbolInput"),
  nameInput: document.querySelector("#nameInput"),
  sharesInput: document.querySelector("#sharesInput"),
  avgCostInput: document.querySelector("#avgCostInput"),
  searchInput: document.querySelector("#searchInput"),
  stockRows: document.querySelector("#stockRows"),
  rowTemplate: document.querySelector("#rowTemplate"),
  tableTab: document.querySelector("#tableTab"),
  heatTab: document.querySelector("#heatTab"),
  tableView: document.querySelector("#tableView"),
  heatView: document.querySelector("#heatView"),
  totalValue: document.querySelector("#totalValue"),
  totalCost: document.querySelector("#totalCost"),
  totalProfit: document.querySelector("#totalProfit"),
  totalProfitRate: document.querySelector("#totalProfitRate"),
  dayChange: document.querySelector("#dayChange"),
  dayChangeRate: document.querySelector("#dayChangeRate"),
  watchCount: document.querySelector("#watchCount"),
  nextRefresh: document.querySelector("#nextRefresh")
};

init();

function init() {
  els.apiToken.value = state.token;
  els.refreshInterval.value = String(state.refreshSeconds);
  bindEvents();
  ensureQuoteShape();
  render();
  refreshQuotes();
  startTimers();
}

function bindEvents() {
  els.saveSettings.addEventListener("click", () => {
    state.token = els.apiToken.value.trim();
    state.refreshSeconds = Number(els.refreshInterval.value);
    persist();
    setConnection(state.token ? "live" : "demo");
    startTimers();
    refreshQuotes();
  });

  els.clearToken.addEventListener("click", () => {
    state.token = "";
    els.apiToken.value = "";
    persist();
    setConnection("demo");
    refreshQuotes();
  });

  els.refreshButton.addEventListener("click", refreshQuotes);

  els.addForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const symbol = normalizeSymbol(els.symbolInput.value);
    if (!symbol) return;

    const existing = state.stocks.find((stock) => stock.symbol === symbol);
    if (existing) {
      existing.name = els.nameInput.value.trim() || existing.name;
      existing.shares = toNumber(els.sharesInput.value, existing.shares);
      existing.avgCost = toNumber(els.avgCostInput.value, existing.avgCost);
    } else {
      state.stocks.push({
        symbol,
        name: els.nameInput.value.trim() || symbol,
        shares: toNumber(els.sharesInput.value, 0),
        avgCost: toNumber(els.avgCostInput.value, 0)
      });
    }

    ensureQuoteShape();
    persist();
    els.addForm.reset();
    render();
    refreshQuotes();
  });

  els.searchInput.addEventListener("input", render);

  els.tableTab.addEventListener("click", () => switchMode("table"));
  els.heatTab.addEventListener("click", () => switchMode("heat"));
}

function startTimers() {
  window.clearInterval(refreshTimer);
  window.clearInterval(demoTimer);
  window.clearInterval(countdownTimer);

  refreshTimer = window.setInterval(refreshQuotes, state.refreshSeconds * 1000);
  demoTimer = window.setInterval(tickDemoPrices, 1200);
  countdownTimer = window.setInterval(renderCountdown, 500);
  nextRefreshAt = Date.now() + state.refreshSeconds * 1000;
}

async function refreshQuotes() {
  nextRefreshAt = Date.now() + state.refreshSeconds * 1000;

  if (!state.token) {
    tickDemoPrices(true);
    setConnection("demo");
    return;
  }

  setConnection("loading");
  const results = await Promise.allSettled(state.stocks.map((stock) => fetchFinnhubQuote(stock.symbol)));
  let successCount = 0;

  results.forEach((result, index) => {
    if (result.status !== "fulfilled" || !result.value) return;
    successCount += 1;
    const stock = state.stocks[index];
    state.quotes[stock.symbol] = mergeQuote(stock.symbol, result.value);
  });

  if (successCount > 0) {
    setConnection("live");
    stampUpdated();
    persist();
    render();
  } else {
    setConnection("error");
    tickDemoPrices(true);
  }
}

async function fetchFinnhubQuote(symbol) {
  const url = new URL("https://finnhub.io/api/v1/quote");
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("token", state.token);

  const response = await fetch(url.toString());
  if (!response.ok) throw new Error(`Quote request failed: ${response.status}`);
  const data = await response.json();
  if (!data || typeof data.c !== "number" || data.c <= 0) return null;

  return {
    price: data.c,
    change: data.d ?? data.c - data.pc,
    changePercent: data.dp ?? percentage(data.d ?? data.c - data.pc, data.pc),
    previousClose: data.pc || data.c,
    open: data.o || data.c,
    high: data.h || data.c,
    low: data.l || data.c,
    time: data.t ? data.t * 1000 : Date.now()
  };
}

function tickDemoPrices(forceStamp = false) {
  state.stocks.forEach((stock) => {
    const quote = state.quotes[stock.symbol];
    const base = quote?.price || demoSeeds[stock.symbol] || demoBase(stock.symbol);
    const volatility = stock.symbol.endsWith(".KS") ? 0.006 : 0.012;
    const drift = (Math.random() - 0.48) * volatility;
    const price = Math.max(0.01, base * (1 + drift));
    const previousClose = quote?.previousClose || base * (1 - (Math.random() - 0.5) * volatility * 2);
    const change = price - previousClose;
    state.quotes[stock.symbol] = mergeQuote(stock.symbol, {
      price,
      previousClose,
      change,
      changePercent: percentage(change, previousClose),
      open: quote?.open || previousClose,
      high: Math.max(quote?.high || price, price),
      low: Math.min(quote?.low || price, price),
      time: Date.now()
    });
  });

  if (forceStamp) stampUpdated();
  persist();
  render();
}

function mergeQuote(symbol, next) {
  const existing = state.quotes[symbol] || {};
  const history = [...(existing.history || []), next.price].slice(-42);
  return { ...existing, ...next, history };
}

function render() {
  const query = els.searchInput.value.trim().toLowerCase();
  const stocks = state.stocks.filter((stock) => {
    return stock.symbol.toLowerCase().includes(query) || stock.name.toLowerCase().includes(query);
  });

  renderSummary();
  renderRows(stocks);
  renderHeat(stocks);
}

function renderSummary() {
  const totals = state.stocks.reduce(
    (acc, stock) => {
      const quote = state.quotes[stock.symbol];
      const price = quote?.price || 0;
      const previousClose = quote?.previousClose || price;
      const value = price * stock.shares;
      const cost = stock.avgCost * stock.shares;
      const currency = currencyForSymbol(stock.symbol);
      acc[currency].value += value;
      acc[currency].cost += cost;
      acc[currency].dayChange += (price - previousClose) * stock.shares;
      acc[currency].previousValue += previousClose * stock.shares;
      return acc;
    },
    {
      KRW: { value: 0, cost: 0, dayChange: 0, previousValue: 0 },
      USD: { value: 0, cost: 0, dayChange: 0, previousValue: 0 }
    }
  );

  const profit = {
    KRW: totals.KRW.value - totals.KRW.cost,
    USD: totals.USD.value - totals.USD.cost
  };
  const profitRate = {
    KRW: percentage(profit.KRW, totals.KRW.cost),
    USD: percentage(profit.USD, totals.USD.cost)
  };
  const dayRate = {
    KRW: percentage(totals.KRW.dayChange, totals.KRW.previousValue),
    USD: percentage(totals.USD.dayChange, totals.USD.previousValue)
  };
  const combinedProfitTone = profit.KRW + profit.USD;
  const combinedDayTone = totals.KRW.dayChange + totals.USD.dayChange;

  els.totalValue.textContent = groupedMoney({ KRW: totals.KRW.value, USD: totals.USD.value });
  els.totalCost.textContent = `매입금액 ${groupedMoney({ KRW: totals.KRW.cost, USD: totals.USD.cost })}`;
  els.totalProfit.textContent = groupedSignedMoney(profit);
  els.totalProfit.className = toneClass(combinedProfitTone);
  els.totalProfitRate.textContent = groupedPercent(profitRate, totals);
  els.totalProfitRate.className = toneClass(combinedProfitTone);
  els.dayChange.textContent = groupedSignedMoney({
    KRW: totals.KRW.dayChange,
    USD: totals.USD.dayChange
  });
  els.dayChange.className = toneClass(combinedDayTone);
  els.dayChangeRate.textContent = groupedPercent(dayRate, totals, "previousValue");
  els.dayChangeRate.className = toneClass(combinedDayTone);
  els.watchCount.textContent = `${state.stocks.length}개`;
}

function renderRows(stocks) {
  els.stockRows.innerHTML = "";

  if (stocks.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 8;
    cell.className = "empty-state";
    cell.textContent = "표시할 종목이 없습니다.";
    row.append(cell);
    els.stockRows.append(row);
    return;
  }

  stocks.forEach((stock) => {
    const row = els.rowTemplate.content.firstElementChild.cloneNode(true);
    const quote = state.quotes[stock.symbol] || {};
    const price = quote.price || 0;
    const previousClose = quote.previousClose || 0;
    const change = quote.change ?? price - previousClose;
    const profit = (price - stock.avgCost) * stock.shares;
    const profitRate = percentage(price - stock.avgCost, stock.avgCost);

    setText(row, "symbol", stock.symbol);
    setText(row, "name", stock.name);
    setText(row, "price", formatPrice(stock.symbol, price));
    setText(row, "previousClose", `전일 ${formatPrice(stock.symbol, previousClose)}`);
    setText(row, "change", signedPrice(stock.symbol, change));
    setText(row, "changeRate", signedPercent(quote.changePercent || 0));
    setText(row, "profit", signedPrice(stock.symbol, profit));
    setText(row, "profitRate", signedPercent(profitRate));

    row.querySelector('[data-field="change"]').className = toneClass(change);
    row.querySelector('[data-field="changeRate"]').className = toneClass(change);
    row.querySelector('[data-field="profit"]').className = toneClass(profit);
    row.querySelector('[data-field="profitRate"]').className = toneClass(profit);

    const shares = row.querySelector('[data-field="shares"]');
    const avgCost = row.querySelector('[data-field="avgCost"]');
    shares.value = trimNumber(stock.shares);
    avgCost.value = trimNumber(stock.avgCost);
    shares.addEventListener("change", () => updateStock(stock.symbol, { shares: toNumber(shares.value, 0) }));
    avgCost.addEventListener("change", () => updateStock(stock.symbol, { avgCost: toNumber(avgCost.value, 0) }));

    row.querySelector('[data-field="remove"]').addEventListener("click", () => removeStock(stock.symbol));
    drawSparkline(row.querySelector('[data-field="sparkline"]'), quote.history || [], change);
    els.stockRows.append(row);
  });
}

function renderHeat(stocks) {
  els.heatView.innerHTML = "";

  stocks.forEach((stock) => {
    const quote = state.quotes[stock.symbol] || {};
    const changePercent = quote.changePercent || 0;
    const card = document.createElement("article");
    card.className = `heat-card ${toneClass(changePercent)}`;
    card.innerHTML = `
      <strong>${escapeHtml(stock.symbol)}</strong>
      <small>${escapeHtml(stock.name)}</small>
      <span class="heat-price">${formatPrice(stock.symbol, quote.price || 0)}</span>
      <span>${signedPercent(changePercent)}</span>
    `;
    els.heatView.append(card);
  });

  if (stocks.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "표시할 종목이 없습니다.";
    els.heatView.append(empty);
  }
}

function drawSparkline(canvas, values, toneValue) {
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  if (values.length < 2) {
    ctx.fillStyle = "#d8e0e4";
    ctx.fillRect(0, height / 2, width, 1);
    return;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);

  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.strokeStyle = toneValue > 0 ? "#c73535" : toneValue < 0 ? "#256cc2" : "#677780";
  ctx.beginPath();

  values.forEach((value, index) => {
    const x = index * step;
    const y = height - 5 - ((value - min) / range) * (height - 10);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.stroke();
}

function updateStock(symbol, patch) {
  const stock = state.stocks.find((item) => item.symbol === symbol);
  if (!stock) return;
  Object.assign(stock, patch);
  persist();
  render();
}

function removeStock(symbol) {
  state.stocks = state.stocks.filter((stock) => stock.symbol !== symbol);
  delete state.quotes[symbol];
  persist();
  render();
}

function switchMode(mode) {
  visibleMode = mode;
  els.tableTab.classList.toggle("active", mode === "table");
  els.heatTab.classList.toggle("active", mode === "heat");
  els.tableView.classList.toggle("hidden", mode !== "table");
  els.heatView.classList.toggle("hidden", mode !== "heat");
}

function ensureQuoteShape() {
  state.stocks.forEach((stock) => {
    if (state.quotes[stock.symbol]) return;
    const seed = demoSeeds[stock.symbol] || demoBase(stock.symbol);
    state.quotes[stock.symbol] = {
      price: seed,
      previousClose: seed * 0.992,
      change: seed * 0.008,
      changePercent: 0.8,
      open: seed,
      high: seed,
      low: seed,
      time: Date.now(),
      history: [seed * 0.992, seed * 0.997, seed]
    };
  });
}

function setConnection(mode) {
  els.connectionDot.className = "status-dot";
  if (mode === "live") {
    els.connectionDot.classList.add("live");
    els.connectionLabel.textContent = "실시간 연결";
    els.providerBadge.textContent = "Finnhub";
  } else if (mode === "loading") {
    els.connectionDot.classList.add("live");
    els.connectionLabel.textContent = "업데이트 중";
    els.providerBadge.textContent = "Finnhub";
  } else if (mode === "error") {
    els.connectionDot.classList.add("error");
    els.connectionLabel.textContent = "연결 확인 필요";
    els.providerBadge.textContent = "Demo";
  } else {
    els.connectionDot.classList.add("demo");
    els.connectionLabel.textContent = "데모 실시간";
    els.providerBadge.textContent = "Demo";
  }
}

function stampUpdated() {
  const now = new Date();
  els.lastUpdated.textContent = `${now.toLocaleTimeString("ko-KR")} 업데이트`;
}

function renderCountdown() {
  const remaining = Math.max(0, Math.ceil((nextRefreshAt - Date.now()) / 1000));
  els.nextRefresh.textContent = `${remaining}초 후 자동 갱신`;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaults);
    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(defaults),
      ...parsed,
      stocks: Array.isArray(parsed.stocks) ? parsed.stocks : structuredClone(defaults.stocks),
      quotes: parsed.quotes || {}
    };
  } catch {
    return structuredClone(defaults);
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function normalizeSymbol(value) {
  return value.trim().toUpperCase();
}

function setText(root, field, value) {
  root.querySelector(`[data-field="${field}"]`).textContent = value;
}

function toNumber(value, fallback) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function percentage(value, base) {
  if (!base) return 0;
  return (value / base) * 100;
}

function signedPercent(value) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function signedPrice(symbol, value) {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${formatPrice(symbol, Math.abs(value))}`;
}

function formatMoney(value) {
  return formatCurrency(value, "KRW", 0);
}

function formatCurrency(value, currency, maximumFractionDigits) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency,
    maximumFractionDigits
  }).format(value || 0);
}

function formatPrice(symbol, value) {
  const currency = currencyForSymbol(symbol);
  return formatCurrency(value, currency, currency === "KRW" ? 0 : 2);
}

function groupedMoney(values) {
  return Object.entries(values)
    .filter(([, value]) => Math.abs(value) > 0.0001)
    .map(([currency, value]) => formatCurrency(value, currency, currency === "KRW" ? 0 : 2))
    .join(" + ") || formatCurrency(0, "KRW", 0);
}

function groupedSignedMoney(values) {
  const parts = Object.entries(values)
    .filter(([, value]) => Math.abs(value) > 0.0001)
    .map(([currency, value]) => {
      const sign = value > 0 ? "+" : value < 0 ? "-" : "";
      return `${sign}${formatCurrency(Math.abs(value), currency, currency === "KRW" ? 0 : 2)}`;
    });
  return parts.join(" / ") || formatCurrency(0, "KRW", 0);
}

function groupedPercent(rates, totals, basis = "cost") {
  return Object.entries(rates)
    .filter(([currency]) => Math.abs(totals[currency][basis]) > 0.0001)
    .map(([currency, rate]) => `${currency} ${signedPercent(rate)}`)
    .join(" / ") || "0.00%";
}

function currencyForSymbol(symbol) {
  return symbol.endsWith(".KS") || symbol.endsWith(".KQ") ? "KRW" : "USD";
}

function trimNumber(value) {
  return Number(value || 0).toString();
}

function toneClass(value) {
  if (value > 0) return "up";
  if (value < 0) return "down";
  return "flat";
}

function demoBase(symbol) {
  let sum = 0;
  for (const char of symbol) sum += char.charCodeAt(0);
  return symbol.endsWith(".KS") || symbol.endsWith(".KQ") ? 20000 + sum * 190 : 40 + sum * 0.7;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return map[char];
  });
}
