import type { DailyCondition, DailyEnergyPlan, EnergyTask } from "../../domain/entities/EnergyPlan";
import { calculateEnergyBudget } from "../../domain/rules/energyBudgetRules";

export function createTodayPlan(condition: DailyCondition, tasks: EnergyTask[]): DailyEnergyPlan {
  return {
    date: new Date().toISOString().slice(0, 10),
    condition,
    energyBudget: calculateEnergyBudget(condition),
    tasks
  };
}
