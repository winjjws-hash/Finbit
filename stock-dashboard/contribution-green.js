const contributionGreenPalette = [
  { level: 0, name: "empty", hex: "#EBEDF0" },
  { level: 1, name: "soft-green", hex: "#9BE9A8" },
  { level: 2, name: "fresh-green", hex: "#40C463" },
  { level: 3, name: "deep-green", hex: "#30A14E" },
  { level: 4, name: "github-dark-green", hex: "#216E39" }
];

function getContributionSignal(message = "Planting today's green square") {
  const darkest = contributionGreenPalette[contributionGreenPalette.length - 1];
  return `${darkest.name}:${darkest.hex}:${message}`;
}
