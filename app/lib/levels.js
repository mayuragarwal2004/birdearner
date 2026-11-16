// Client-side mirror of the backend XP -> level rule.
// Source of truth: bird-earner-api/lib/services/reviews.ts -> calculateLevel
// (baseXP = 100, incrementXP = 100  =>  L1: 0, L2: 100, L3: 300, L4: 600, L5: 1000, L6: 1500, L7: 2100)
// Do not invent or change thresholds here - keep this in sync with the backend.

export const calculateLevel = (totalXP) => {
  const baseXP = 100;
  const incrementXP = 100;
  let level = 1;
  let xpForNextLevel = baseXP;
  let tempXP = Number(totalXP) || 0;

  while (tempXP >= xpForNextLevel) {
    level += 1;
    tempXP -= xpForNextLevel;
    xpForNextLevel += incrementXP;
  }
  return level;
};

export default calculateLevel;
