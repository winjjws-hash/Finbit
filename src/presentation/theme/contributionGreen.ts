export const contributionGreen = {
  name: "github-dark-green",
  hex: "#216E39",
  rgb: {
    red: 33,
    green: 110,
    blue: 57
  }
} as const;

export function getContributionSignal(message = "Planting today's green square"): string {
  return `${contributionGreen.name}:${contributionGreen.hex}:${message}`;
}
