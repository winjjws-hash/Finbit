import type { DailyEnergyPlan } from "../../domain/entities/EnergyPlan";

export type EnergyPlanRepository = {
  saveTodayPlan(plan: DailyEnergyPlan): Promise<void>;
  getRecentPlans(): Promise<DailyEnergyPlan[]>;
};
