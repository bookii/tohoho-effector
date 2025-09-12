export const weightedRandom = <T>(items: T[], weights: number[]): T => {
  if (weights.length !== items.length) {
    throw new Error("Items and weights must have the same length");
  }

  const DEFAULT_WEIGHT = 1;
  const MIN_WEIGHT = 0;

  if (weights.length === 0) {
    weights = Array(items.length).fill(DEFAULT_WEIGHT);
  }

  const totalWeight = weights.reduce((sum, weight) => sum + weight, MIN_WEIGHT);
  let randomValue = Math.random() * totalWeight;

  for (let i = 0; i < items.length; i++) {
    if (randomValue < weights[i]) {
      return items[i];
    }
    randomValue -= weights[i];
  }

  return items[items.length - 1];
};
