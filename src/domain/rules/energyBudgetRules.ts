import type { DailyCondition, EnergyTask } from "../entities/EnergyPlan";

const moodScore = {
  good: 15,
  normal: 5,
  tired: -10,
  stressed: -15
} as const;

export function calculateEnergyBudget(condition: DailyCondition): number {
  const timeScore = Math.min(condition.availableHours * 10, 60);
  const fatiguePenalty = condition.fatigue * 5;
  const rawScore = 60 + timeScore + moodScore[condition.mood] - fatiguePenalty;

  return Math.max(10, Math.min(100, Math.round(rawScore)));
}

export function getTotalEnergyCost(tasks: EnergyTask[]): number {
  return tasks.reduce((total, task) => total + task.energyCost, 0);
}

export function getEnergyStatus(budget: number, tasks: EnergyTask[]): "safe" | "caution" | "overload" {
  const totalCost = getTotalEnergyCost(tasks);

  if (totalCost <= budget * 0.8) {
    return "safe";
  }

  if (totalCost <= budget) {
    return "caution";
  }

  return "overload";
}

export function splitTasksByEnergyBudget(
  budget: number,
  tasks: EnergyTask[]
): { recommendedTasks: EnergyTask[]; postponedTasks: EnergyTask[]; remainingEnergy: number } {
  let usedEnergy = 0;
  const recommendedTasks: EnergyTask[] = [];
  const postponedTasks: EnergyTask[] = [];

  for (const task of tasks) {
    if (usedEnergy + task.energyCost <= budget) {
      recommendedTasks.push(task);
      usedEnergy += task.energyCost;
    } else {
      postponedTasks.push(task);
    }
  }

  return {
    recommendedTasks,
    postponedTasks,
    remainingEnergy: Math.max(0, budget - usedEnergy)
  };
}
