import type { DailyEnergyPlan } from "../../domain/entities/EnergyPlan";
import type { EnergyPlanRepository } from "../repositories/energyPlanRepository";

const plans: DailyEnergyPlan[] = [];

export const memoryEnergyPlanStore: EnergyPlanRepository = {
  async saveTodayPlan(plan) {
    plans.unshift(plan);
  },
  async getRecentPlans() {
    return plans.slice(0, 7);
  }
};
