const STORAGE_KEY = "workspot:laptop-place-finder:v2";
const OVERPASS_ENDPOINT = "https://overpass-api.de/api/interpreter";
const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/search";

const fallbackPlaces = [
  {
    id: "demo-green-lab",
    name: "그린랩 워크카페",
    type: "카페",
    distance: 180,
    open: "08:00-23:00",
    coords: [38, 38],
    outlets: 96,
    tables: 92,
    wifi: 94,
    quiet: 82,
    tags: ["콘센트 좌석 많음", "긴 테이블", "5G 와이파이"],
    source: "demo",
    reviews: [
      { author: "민지", rating: 5, body: "벽면 좌석마다 콘센트가 있고 테이블이 넓어서 작업하기 편했어요." },
      { author: "현우", rating: 4, body: "오후에는 조금 붐비지만 와이파이는 안정적입니다." }
    ]
  },
  {
    id: "demo-focus-library",
    name: "포커스 스터디 라운지",
    type: "스터디카페",
    distance: 310,
    open: "24시간",
    coords: [62, 42],
    outlets: 98,
    tables: 95,
    wifi: 91,
    quiet: 96,
    tags: ["매우 조용함", "개별 조명", "예약 가능"],
    source: "demo",
    reviews: [{ author: "도윤", rating: 5, body: "회의 없는 날 집중해서 코딩하기 좋습니다. 의자도 편해요." }]
  },
  {
    id: "demo-blue-desk",
    name: "블루데스크 공유라운지",
    type: "공유오피스",
    distance: 520,
    open: "09:00-21:00",
    coords: [54, 68],
    outlets: 94,
    tables: 97,
    wifi: 98,
    quiet: 87,
    tags: ["초고속 와이파이", "모니터 대여", "넓은 책상"],
    source: "demo",
    reviews: [{ author: "서연", rating: 5, body: "화상회의 부스가 있어서 노트북 작업과 미팅을 같이 하기 좋아요." }]
  },
  {
    id: "demo-sunny-corner",
    name: "써니코너 커피",
    type: "카페",
    distance: 760,
    open: "10:00-22:00",
    coords: [28, 65],
    outlets: 78,
    tables: 88,
    wifi: 86,
    quiet: 74,
    tags: ["창가 좌석", "브런치", "2인 테이블 많음"],
    source: "demo",
    reviews: [{ author: "지훈", rating: 4, body: "밝고 편안한 분위기라 가벼운 작업에 좋아요." }]
  },
  {
    id: "demo-night-archive",
    name: "나이트 아카이브",
    type: "북카페",
    distance: 940,
    open: "11:00-01:00",
    coords: [74, 24],
    outlets: 89,
    tables: 90,
    wifi: 88,
    quiet: 91,
    tags: ["늦게까지 운영", "조용한 음악", "큰 테이블"],
    source: "demo",
    reviews: [{ author: "예린", rating: 5, body: "밤 작업할 때 안정적으로 갈 수 있는 곳이에요." }]
  }
];

const originalPlaceState = new Map(
  fallbackPlaces.map((place) => [place.id, { distance: place.distance, coords: [...place.coords] }])
);

let state = loadState();
let apiPlaces = [];
let apiStatus = "demo";
let activePlaceId = fallbackPlaces[0].id;
let locationLabel = "내 주변";
let sortMode = "score";
let currentPosition = null;

const els = {
  tabs: document.querySelectorAll(".tab-button"),
  homeTab: document.querySelector("#homeTab"),
  mypageTab: document.querySelector("#mypageTab"),
  searchForm: document.querySelector("#searchForm"),
  locationInput: document.querySelector("#locationInput"),
  useLocationButton: document.querySelector("#useLocationButton"),
  locationCard: document.querySelector("#locationCard"),
  locationTitle: document.querySelector("#locationTitle"),
  locationDetail: document.querySelector("#locationDetail"),
  mapCanvas: document.querySelector("#mapCanvas"),
  mapStatus: document.querySelector("#mapStatus"),
  placeCount: document.querySelector("#placeCount"),
  recommendSubtitle: document.querySelector("#recommendSubtitle"),
  sortSelect: document.querySelector("#sortSelect"),
  recommendList: document.querySelector("#recommendList"),
  placeTemplate: document.querySelector("#placeTemplate"),
  detailPanel: document.querySelector("#detailPanel"),
  closeDetailButton: document.querySelector("#closeDetailButton"),
  detailContent: document.querySelector("#detailContent"),
  savedCount: document.querySelector("#savedCount"),
  reviewCount: document.querySelector("#reviewCount"),
  savedList: document.querySelector("#savedList"),
  myReviewList: document.querySelector("#myReviewList"),
  profileSummary: document.querySelector("#profileSummary")
};

init();

function init() {
  fallbackPlaces.forEach(cachePlace);
  bindEvents();
  renderAll();
  openPlace(activePlaceId, false);
}

function bindEvents() {
  els.tabs.forEach((tab) => {
    tab.addEventListener("click", () => switchTab(tab.dataset.tab));
  });

  els.searchForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const query = els.locationInput.value.trim();
    if (!query) {
      await useCurrentLocation();
      return;
    }
    await searchLocation(query);
  });

  els.useLocationButton.addEventListener("click", useCurrentLocation);
  els.mapCanvas.addEventListener("click", async () => {
    if (currentPosition) {
      await loadNearbyPlaces(currentPosition.latitude, currentPosition.longitude, "현재 위치");
    } else {
      await useCurrentLocation();
    }
  });
  els.mapCanvas.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      els.mapCanvas.click();
    }
  });

  els.sortSelect.addEventListener("change", () => {
    sortMode = els.sortSelect.value;
    renderHome();
  });

  els.closeDetailButton.addEventListener("click", closeDetail);
  els.detailPanel.addEventListener("click", (event) => {
    if (event.target === els.detailPanel) {
      closeDetail();
    }
  });
}

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return {
      saved: stored?.saved || [],
      reviews: stored?.reviews || [],
      placeCache: stored?.placeCache || {}
    };
  } catch {
    return { saved: [], reviews: [], placeCache: {} };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function cachePlace(place) {
  state.placeCache[place.id] = {
    id: place.id,
    name: place.name,
    type: place.type,
    distance: place.distance,
    open: place.open,
    outlets: place.outlets,
    tables: place.tables,
    wifi: place.wifi,
    quiet: place.quiet,
    tags: place.tags,
    source: place.source
  };
}

function getPlaces() {
  const sourcePlaces = apiPlaces.length ? apiPlaces : fallbackPlaces;
  return sourcePlaces
    .map((place) => {
      const userReviews = state.reviews.filter((review) => review.placeId === place.id);
      const score = Math.round((place.outlets * 0.28 + place.tables * 0.24 + place.wifi * 0.28 + place.quiet * 0.2) * 10) / 10;
      return {
        ...place,
        reviews: [...(place.reviews || []), ...userReviews],
        score
      };
    })
    .sort((a, b) => {
      if (sortMode === "wifi") return b.wifi - a.wifi;
      if (sortMode === "outlets") return b.outlets - a.outlets;
      if (sortMode === "quiet") return b.quiet - a.quiet;
      return b.score - a.score;
    });
}

function renderAll() {
  renderHome();
  renderMyPage();
}

function renderHome() {
  const places = getPlaces();
  const statusText = apiStatus === "api" ? "실제 지도 API 결과" : apiStatus === "loading" ? "실제 API 검색 중" : "데모 추천";
  els.mapStatus.textContent = `${locationLabel} 기준 ${statusText}로 노트북 작업 장소를 보여줍니다.`;
  els.recommendSubtitle.textContent =
    apiStatus === "api"
      ? "OpenStreetMap 실제 장소를 노트북 작업 조건으로 다시 점수화했어요."
      : "API 결과가 없거나 아직 호출 전이라 데모 추천을 보여줘요.";
  els.placeCount.textContent = `${places.length}곳`;
  renderMapPins(places);
  renderRecommendations(places);
}

function renderMapPins(places) {
  els.mapCanvas.querySelectorAll(".map-pin").forEach((pin) => pin.remove());
  places.forEach((place, index) => {
    const pin = document.createElement("button");
    pin.type = "button";
    pin.className = `map-pin ${index === 0 ? "best" : ""}`;
    pin.style.left = `${place.coords[0]}%`;
    pin.style.top = `${place.coords[1]}%`;
    pin.setAttribute("aria-label", `${place.name} 상세 보기`);
    pin.innerHTML = `<span>${index + 1}</span>`;
    pin.addEventListener("click", (event) => {
      event.stopPropagation();
      openPlace(place.id);
    });
    els.mapCanvas.appendChild(pin);
  });
}

function renderRecommendations(places) {
  els.recommendList.innerHTML = "";
  places.forEach((place, index) => {
    const node = els.placeTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector(".rank").textContent = index + 1;
    node.querySelector(".place-name").textContent = place.name;
    node.querySelector(".place-meta").textContent = `${place.type} · ${place.distance}m · ${place.open} · 추천 ${place.score}점`;
    node.querySelector(".place-main").addEventListener("click", () => openPlace(place.id));
    node.querySelector(".score-row").innerHTML = scoreMarkup(place);
    node.querySelector(".tag-row").innerHTML = [
      `<span class="tag ${place.source === "api" ? "source-live" : ""}">${place.source === "api" ? "실제 API" : "데모"}</span>`,
      ...place.tags.map((tag) => `<span class="tag">${escapeHTML(tag)}</span>`)
    ].join("");
    els.recommendList.appendChild(node);
  });
}

function scoreMarkup(place) {
  return [
    ["콘센트", place.outlets],
    ["테이블", place.tables],
    ["와이파이", place.wifi],
    ["조용함", place.quiet]
  ]
    .map(([label, value]) => `<span class="score"><span>${label}</span><strong>${value}</strong></span>`)
    .join("");
}

function openPlace(placeId, showPanel = true) {
  activePlaceId = placeId;
  const place = findPlace(placeId);
  if (!place) return;
  cachePlace(place);
  saveState();

  const isSaved = state.saved.includes(place.id);
  els.detailContent.innerHTML = `
    <div class="detail-title">
      <h2>${escapeHTML(place.name)}</h2>
      <p>${escapeHTML(place.type)} · ${place.distance}m · ${escapeHTML(place.open)} · 노트북 추천 ${place.score}점</p>
    </div>
    <div class="detail-actions">
      <button id="savePlaceButton" class="primary-button" type="button">${isSaved ? "저장 해제" : "장소 저장"}</button>
      <button id="focusReviewButton" class="ghost-button" type="button">리뷰 작성</button>
    </div>
    <div class="fit-grid">
      <article class="fit-card"><span>콘센트</span><strong>${place.outlets}</strong></article>
      <article class="fit-card"><span>테이블</span><strong>${place.tables}</strong></article>
      <article class="fit-card"><span>와이파이</span><strong>${place.wifi}</strong></article>
      <article class="fit-card"><span>조용함</span><strong>${place.quiet}</strong></article>
    </div>
    <div class="tag-row">
      <span class="tag ${place.source === "api" ? "source-live" : ""}">${place.source === "api" ? "OpenStreetMap API" : "데모 데이터"}</span>
      ${place.tags.map((tag) => `<span class="tag">${escapeHTML(tag)}</span>`).join("")}
    </div>
    <section>
      <div class="section-heading"><h2>리뷰</h2><span class="count-pill">${place.reviews.length}개</span></div>
      <div class="review-list">
        ${place.reviews.length ? place.reviews.map((review) => reviewMarkup(review)).join("") : `<div class="empty-state">아직 리뷰가 없습니다.</div>`}
      </div>
    </section>
    <form id="reviewForm" class="review-form">
      <h2>리뷰 작성</h2>
      <div class="form-row">
        <input id="reviewName" type="text" placeholder="이름" required />
        <select id="reviewRating" aria-label="별점">
          <option value="5">5점</option>
          <option value="4">4점</option>
          <option value="3">3점</option>
          <option value="2">2점</option>
          <option value="1">1점</option>
        </select>
      </div>
      <textarea id="reviewBody" placeholder="콘센트, 테이블, 와이파이 상태를 중심으로 알려주세요." required></textarea>
      <button class="primary-button" type="submit">리뷰 등록</button>
    </form>
  `;

  document.querySelector("#savePlaceButton").addEventListener("click", () => toggleSaved(place.id));
  document.querySelector("#focusReviewButton").addEventListener("click", () => document.querySelector("#reviewBody").focus());
  document.querySelector("#reviewForm").addEventListener("submit", (event) => submitReview(event, place.id));

  if (showPanel) {
    els.detailPanel.classList.add("open");
    els.detailPanel.setAttribute("aria-hidden", "false");
  }
}

function findPlace(placeId) {
  const livePlace = getPlaces().find((item) => item.id === placeId);
  if (livePlace) return livePlace;
  const cached = state.placeCache[placeId];
  if (!cached) return null;
  const reviews = state.reviews.filter((review) => review.placeId === placeId);
  const score = Math.round((cached.outlets * 0.28 + cached.tables * 0.24 + cached.wifi * 0.28 + cached.quiet * 0.2) * 10) / 10;
  return { ...cached, reviews, coords: [50, 50], score };
}

function reviewMarkup(review) {
  return `
    <article class="review-item">
      <strong>${"★".repeat(Number(review.rating))} ${escapeHTML(review.author)}</strong>
      <span>${escapeHTML(review.body)}</span>
    </article>
  `;
}

function closeDetail() {
  els.detailPanel.classList.remove("open");
  els.detailPanel.setAttribute("aria-hidden", "true");
}

function toggleSaved(placeId) {
  const place = findPlace(placeId);
  if (place) cachePlace(place);
  if (state.saved.includes(placeId)) {
    state.saved = state.saved.filter((id) => id !== placeId);
  } else {
    state.saved = [...state.saved, placeId];
  }
  saveState();
  openPlace(placeId);
  renderMyPage();
}

function submitReview(event, placeId) {
  event.preventDefault();
  const author = document.querySelector("#reviewName").value.trim();
  const body = document.querySelector("#reviewBody").value.trim();
  const rating = Number(document.querySelector("#reviewRating").value);
  if (!author || !body) return;

  const place = findPlace(placeId);
  if (place) cachePlace(place);
  state.reviews = [
    {
      id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : String(Date.now()),
      placeId,
      author,
      rating,
      body,
      createdAt: new Date().toISOString()
    },
    ...state.reviews
  ];
  saveState();
  openPlace(placeId);
  renderAll();
}

function renderMyPage() {
  const savedPlaces = state.saved.map((placeId) => findPlace(placeId) || state.placeCache[placeId]).filter(Boolean);
  els.savedCount.textContent = savedPlaces.length;
  els.reviewCount.textContent = state.reviews.length;
  els.profileSummary.textContent =
    savedPlaces.length || state.reviews.length
      ? "자주 가는 작업 장소와 내 리뷰가 저장되어 있어요."
      : "장소를 저장하거나 리뷰를 작성하면 이곳에 모입니다.";

  els.savedList.innerHTML = savedPlaces.length
    ? savedPlaces.map((place) => compactPlaceMarkup(place)).join("")
    : `<div class="empty-state">아직 저장한 장소가 없습니다.</div>`;

  els.myReviewList.innerHTML = state.reviews.length
    ? state.reviews.map((review) => compactReviewMarkup(review)).join("")
    : `<div class="empty-state">아직 작성한 리뷰가 없습니다.</div>`;

  els.savedList.querySelectorAll("[data-place-id]").forEach((button) => {
    button.addEventListener("click", () => {
      switchTab("home");
      openPlace(button.dataset.placeId);
    });
  });
}

function compactPlaceMarkup(place) {
  return `
    <button class="compact-item" type="button" data-place-id="${place.id}">
      <strong>${escapeHTML(place.name)}</strong>
      <span>${escapeHTML(place.type)} · ${place.distance}m · 콘센트 ${place.outlets} · 와이파이 ${place.wifi}</span>
    </button>
  `;
}

function compactReviewMarkup(review) {
  const place = findPlace(review.placeId) || state.placeCache[review.placeId];
  return `
    <article class="compact-item">
      <strong>${escapeHTML(place?.name || "장소")} · ${review.rating}점</strong>
      <span>${escapeHTML(review.body)}</span>
    </article>
  `;
}

function switchTab(tabName) {
  els.tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === tabName));
  els.homeTab.classList.toggle("active", tabName === "home");
  els.mypageTab.classList.toggle("active", tabName === "mypage");
  if (tabName === "mypage") {
    renderMyPage();
  }
}

async function searchLocation(query) {
  setApiLoading(`${query} 위치를 찾는 중입니다.`);
  try {
    const url = `${NOMINATIM_ENDPOINT}?format=json&limit=1&accept-language=ko&q=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("위치 검색 API 응답 오류");
    const results = await response.json();
    if (!results.length) throw new Error("검색한 위치를 찾지 못했습니다.");
    const place = results[0];
    currentPosition = {
      latitude: Number(place.lat),
      longitude: Number(place.lon),
      accuracy: 0,
      capturedAt: new Date()
    };
    renderLocationStatus("live", "검색 위치 확인 완료", place.display_name);
    await loadNearbyPlaces(currentPosition.latitude, currentPosition.longitude, query);
  } catch (error) {
    apiStatus = "error";
    locationLabel = query;
    renderLocationStatus("error", "위치 검색 실패", error.message || "검색 위치를 가져오지 못했습니다.");
    shuffleFallback(query);
    renderHome();
  }
}

async function useCurrentLocation() {
  if (!navigator.geolocation) {
    locationLabel = "현재 위치";
    apiStatus = "error";
    renderLocationStatus("error", "위치 API 사용 불가", "이 브라우저에서는 위치 정보를 가져올 수 없습니다.");
    shuffleFallback("fallback");
    renderHome();
    return;
  }

  setApiLoading("현재 위치를 확인하는 중입니다.");
  renderLocationStatus("loading", "현재 위치 확인 중", "브라우저 위치 권한을 허용하면 실제 좌표를 가져옵니다.");

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      currentPosition = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        capturedAt: new Date(position.timestamp)
      };
      renderLocationStatus(
        "live",
        "실제 위치 확인 완료",
        `${formatCoord(currentPosition.latitude)}, ${formatCoord(currentPosition.longitude)} · 정확도 약 ${Math.round(currentPosition.accuracy)}m`
      );
      await loadNearbyPlaces(currentPosition.latitude, currentPosition.longitude, "현재 위치");
    },
    (error) => {
      apiStatus = "error";
      locationLabel = "위치 권한 없이 내 주변";
      currentPosition = null;
      renderLocationStatus("error", "위치 권한이 필요해요", geolocationMessage(error));
      shuffleFallback("blocked");
      renderHome();
    },
    { enableHighAccuracy: true, timeout: 7000, maximumAge: 60000 }
  );
}

async function loadNearbyPlaces(latitude, longitude, label) {
  locationLabel = label;
  setApiLoading(`${label} 주변 실제 장소를 불러오는 중입니다.`);
  try {
    const query = buildOverpassQuery(latitude, longitude);
    const response = await fetch(`${OVERPASS_ENDPOINT}?data=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error("장소 API 응답 오류");
    const data = await response.json();
    const parsed = parseOverpassPlaces(data.elements || [], latitude, longitude);
    if (!parsed.length) throw new Error("주변 실제 장소 결과가 없습니다.");
    apiPlaces = parsed;
    apiStatus = "api";
    parsed.forEach(cachePlace);
    saveState();
    activePlaceId = parsed[0].id;
    renderLocationStatus(
      "live",
      "실제 장소 API 연결 완료",
      `${label} 주변 ${parsed.length}곳을 OpenStreetMap에서 가져왔습니다.`
    );
    renderAll();
    openPlace(activePlaceId, false);
  } catch (error) {
    apiPlaces = [];
    apiStatus = "error";
    renderLocationStatus("error", "실제 장소 API 실패", `${error.message || "API 호출 실패"} 데모 추천을 대신 보여줍니다.`);
    shuffleFallback(`${latitude},${longitude}`);
    renderHome();
  }
}

function setApiLoading(message) {
  apiStatus = "loading";
  apiPlaces = [];
  els.mapStatus.textContent = message;
  els.recommendSubtitle.textContent = "공개 지도 API에서 주변 카페, 도서관, 공유오피스를 찾고 있어요.";
  renderHome();
}

function buildOverpassQuery(latitude, longitude) {
  return `
    [out:json][timeout:15];
    (
      node["amenity"~"cafe|library|coworking_space"](around:1800,${latitude},${longitude});
      way["amenity"~"cafe|library|coworking_space"](around:1800,${latitude},${longitude});
      relation["amenity"~"cafe|library|coworking_space"](around:1800,${latitude},${longitude});
      node["office"="coworking"](around:1800,${latitude},${longitude});
      way["office"="coworking"](around:1800,${latitude},${longitude});
      relation["office"="coworking"](around:1800,${latitude},${longitude});
      node["amenity"="restaurant"]["internet_access"~"wlan|yes"](around:1800,${latitude},${longitude});
      way["amenity"="restaurant"]["internet_access"~"wlan|yes"](around:1800,${latitude},${longitude});
    );
    out center tags 40;
  `;
}

function parseOverpassPlaces(elements, latitude, longitude) {
  return elements
    .map((element) => normalizeOsmElement(element, latitude, longitude))
    .filter(Boolean)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 12)
    .map((place, index, places) => ({
      ...place,
      coords: projectToMap(place.latitude, place.longitude, places, index),
      reviews: []
    }));
}

function normalizeOsmElement(element, latitude, longitude) {
  const tags = element.tags || {};
  const name = tags.name || tags["name:ko"] || tags.brand;
  const lat = Number(element.lat ?? element.center?.lat);
  const lon = Number(element.lon ?? element.center?.lon);
  if (!name || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  const type = placeType(tags);
  if (!isUsefulPlace(tags, type)) return null;
  const distance = Math.round(distanceMeters(latitude, longitude, lat, lon));
  const fit = laptopFit(tags, type);
  return {
    id: `osm-${element.type}-${element.id}`,
    osmId: `${element.type}/${element.id}`,
    name,
    type,
    distance,
    open: tags.opening_hours || "영업시간 정보 없음",
    latitude: lat,
    longitude: lon,
    outlets: fit.outlets,
    tables: fit.tables,
    wifi: fit.wifi,
    quiet: fit.quiet,
    tags: fit.tags,
    source: "api"
  };
}

function isUsefulPlace(tags, type) {
  if (type === "공유오피스" || type === "도서관" || type === "카페") return true;
  return type === "음식점" && (tags.internet_access === "wlan" || tags.internet_access === "yes");
}

function placeType(tags) {
  if (tags.office === "coworking" || tags.amenity === "coworking_space") return "공유오피스";
  if (tags.amenity === "library") return "도서관";
  if (tags.amenity === "cafe") return "카페";
  if (tags.amenity === "restaurant") return "음식점";
  return "작업 가능 장소";
}

function laptopFit(tags, type) {
  const hasWifi = tags.internet_access === "wlan" || tags.internet_access === "yes";
  const wifiFee = tags.internet_access_fee;
  const isCoworking = type === "공유오피스";
  const isLibrary = type === "도서관";
  const isCafe = type === "카페";
  const tagsOut = [];

  let outlets = isCoworking ? 92 : isLibrary ? 84 : isCafe ? 76 : 68;
  let tables = isCoworking ? 94 : isLibrary ? 88 : isCafe ? 80 : 70;
  let wifi = hasWifi ? 92 : isCoworking ? 90 : isLibrary ? 82 : 72;
  let quiet = isLibrary ? 94 : isCoworking ? 84 : isCafe ? 68 : 62;

  if (hasWifi) tagsOut.push("와이파이 등록됨");
  if (wifiFee === "no") {
    wifi += 4;
    tagsOut.push("무료 와이파이");
  }
  if (tags.outdoor_seating === "yes") tagsOut.push("야외 좌석");
  if (tags.opening_hours) tagsOut.push("영업시간 제공");
  if (tags.wheelchair === "yes") tagsOut.push("접근성 좋음");
  if (isCoworking) tagsOut.push("작업 특화");
  if (isLibrary) tagsOut.push("조용한 환경");
  if (isCafe) tagsOut.push("카페 좌석");

  return {
    outlets: clamp(Math.round(outlets), 45, 99),
    tables: clamp(Math.round(tables), 45, 99),
    wifi: clamp(Math.round(wifi), 45, 99),
    quiet: clamp(Math.round(quiet), 45, 99),
    tags: tagsOut.length ? tagsOut.slice(0, 4) : ["지도 데이터 기반", "작업 적합도 추정"]
  };
}

function projectToMap(latitude, longitude, places, index) {
  const lats = places.map((place) => place.latitude);
  const lons = places.map((place) => place.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const x = maxLon === minLon ? 30 + index * 8 : 18 + ((longitude - minLon) / (maxLon - minLon)) * 64;
  const y = maxLat === minLat ? 30 + index * 7 : 18 + ((maxLat - latitude) / (maxLat - minLat)) * 64;
  return [clamp(Math.round(x), 14, 86), clamp(Math.round(y), 18, 84)];
}

function renderLocationStatus(status, title, detail) {
  els.locationCard.classList.toggle("live", status === "live");
  els.locationCard.classList.toggle("error", status === "error");
  els.locationTitle.textContent = title;
  els.locationDetail.textContent = detail;
}

function geolocationMessage(error) {
  if (error.code === error.PERMISSION_DENIED) return "브라우저에서 위치 권한을 허용해야 실제 위치 기반 추천을 사용할 수 있어요.";
  if (error.code === error.POSITION_UNAVAILABLE) return "현재 기기에서 위치 신호를 가져오지 못했습니다.";
  if (error.code === error.TIMEOUT) return "위치 확인 시간이 초과되었습니다. 다시 눌러보세요.";
  return "위치 정보를 가져오지 못했습니다.";
}

function formatCoord(value) {
  return Number(value).toFixed(5);
}

function shuffleFallback(seed) {
  const base = String(seed || "nearby")
    .split("")
    .reduce((total, char) => total + char.charCodeAt(0), 0);
  fallbackPlaces.forEach((place, index) => {
    const original = originalPlaceState.get(place.id);
    const offset = ((base + index * 137) % 420) - 120;
    place.distance = Math.max(90, original.distance + offset);
    place.coords = [
      clamp(original.coords[0] + (((base + index * 17) % 15) - 7), 16, 84),
      clamp(original.coords[1] + (((base + index * 23) % 15) - 7), 18, 82)
    ];
  });
}

function distanceMeters(lat1, lon1, lat2, lon2) {
  const radius = 6371000;
  const toRad = (value) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
