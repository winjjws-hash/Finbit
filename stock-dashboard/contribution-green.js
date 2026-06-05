const contributionGreenPalette = [
  { level: 0, name: "empty", hex: "#EBEDF0" },
  { level: 1, name: "soft-green", hex: "#9BE9A8" },
  { level: 2, name: "fresh-green", hex: "#40C463" },
  { level: 3, name: "deep-green", hex: "#30A14E" },
  { level: 4, name: "github-dark-green", hex: "#216E39" }
];

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

function getContributionLevel(count, darkestAt = 6) {
  const safeCount = Math.max(0, Number(count) || 0);
  const safeDarkestAt = Math.max(1, Number(darkestAt) || 1);
  return clampContributionLevel((safeCount / safeDarkestAt) * 4);
}

function getContributionSignal(message = "Planting today's green square") {
  const darkest = getContributionGreen(4);
  return `${darkest.name}:${darkest.hex}:${message}`;
}
