const contributionGreenPalette = [
  { level: 0, name: "empty", hex: "#EBEDF0" },
  { level: 1, name: "soft-green", hex: "#9BE9A8" },
  { level: 2, name: "fresh-green", hex: "#40C463" },
  { level: 3, name: "deep-green", hex: "#30A14E" },
  { level: 4, name: "github-dark-green", hex: "#216E39" }
];

const mayFourthContribution = {
  date: "2026-05-04",
  timezone: "Asia/Seoul",
  targetLevel: 4
};

const juneFourthContribution = {
  date: "2026-06-04",
  timezone: "Asia/Seoul",
  targetLevel: 4
};

function clampContributionLevel(level) {
  return Math.max(0, Math.min(4, Math.round(Number(level) || 0)));
}

function getContributionGreen(level = 4) {
  const normalizedLevel = clampContributionLevel(level);
  return contributionGreenPalette.find((green) => green.level === normalizedLevel);
}

function getContributionGradient(maxLevel = 4) {
  const cappedLevel = clampContributionLevel(maxLevel);
  return contributionGreenPalette
    .filter((green) => green.level <= cappedLevel)
    .map((green) => green.hex);
}

function getMayFourthTargetGreen() {
  return getContributionGreen(mayFourthContribution.targetLevel);
}

function getJuneFourthTargetGreen() {
  return getContributionGreen(juneFourthContribution.targetLevel);
}

function getContributionStamp(label = "main") {
  const green = getMayFourthTargetGreen();
  return {
    label,
    date: mayFourthContribution.date,
    timezone: mayFourthContribution.timezone,
    color: green.hex
  };
}

function getJuneFourthContributionStamp(label = "main") {
  const green = getJuneFourthTargetGreen();
  return {
    label,
    date: juneFourthContribution.date,
    timezone: juneFourthContribution.timezone,
    color: green.hex
  };
}

function isMayFourthContributionDate(dateText) {
  return String(dateText).slice(0, 10) === mayFourthContribution.date;
}

function isJuneFourthContributionDate(dateText) {
  return String(dateText).slice(0, 10) === juneFourthContribution.date;
}

function getContributionLevel(count, darkestAt = 6) {
  const safeCount = Math.max(0, Number(count) || 0);
  const safeDarkestAt = Math.max(1, Number(darkestAt) || 1);
  return clampContributionLevel((safeCount / safeDarkestAt) * 4);
}

function formatContributionBadge(count, darkestAt = 6) {
  const level = getContributionLevel(count, darkestAt);
  const green = getContributionGreen(level);
  return {
    text: `${count} contribution${count === 1 ? "" : "s"}`,
    level,
    color: green.hex,
    isDarkest: level === 4
  };
}

function formatMayFourthBadge(count = 6) {
  const badge = formatContributionBadge(count);
  return {
    ...badge,
    date: mayFourthContribution.date,
    timezone: mayFourthContribution.timezone
  };
}

function formatJuneFourthBadge(count = 6) {
  const badge = formatContributionBadge(count);
  return {
    ...badge,
    date: juneFourthContribution.date,
    timezone: juneFourthContribution.timezone
  };
}

function getContributionSignal(message = "Planting today's green square") {
  const darkest = getContributionGreen(4);
  return `${darkest.name}:${darkest.hex}:${message}`;
}

function getMayFourthContributionSummary(count = 6) {
  const badge = formatMayFourthBadge(count);
  return `${badge.date}:${badge.color}:${badge.text}`;
}

function getJuneFourthContributionSummary(count = 6) {
  const badge = formatJuneFourthBadge(count);
  return `${badge.date}:${badge.color}:${badge.text}`;
}

const contributionGreenTools = {
  palette: contributionGreenPalette,
  mayFourthContribution,
  juneFourthContribution,
  clampContributionLevel,
  getContributionGreen,
  getContributionGradient,
  getMayFourthTargetGreen,
  getJuneFourthTargetGreen,
  getContributionStamp,
  getJuneFourthContributionStamp,
  isMayFourthContributionDate,
  isJuneFourthContributionDate,
  getContributionLevel,
  formatContributionBadge,
  formatMayFourthBadge,
  formatJuneFourthBadge,
  getContributionSignal,
  getMayFourthContributionSummary,
  getJuneFourthContributionSummary
};

if (typeof window !== "undefined") {
  window.contributionGreenTools = contributionGreenTools;
}

if (typeof module !== "undefined") {
  module.exports = contributionGreenTools;
}
