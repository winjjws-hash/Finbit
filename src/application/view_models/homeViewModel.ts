import { createTodayPlan } from "../use_cases/createTodayPlan";
import {
  getEnergyStatus,
  getTotalEnergyCost,
  splitTasksByEnergyBudget
} from "../../domain/rules/energyBudgetRules";

const sampleCondition = {
  fatigue: 4,
  availableHours: 5,
  mood: "normal" as const
};

const sampleTasks = [
  {
    id: "task-1",
    title: "모바일 앱 구조 정리",
    category: "project" as const,
    estimatedMinutes: 60,
    energyCost: 25,
    completed: false
  },
  {
    id: "task-2",
    title: "설정 문서 작성",
    category: "assignment" as const,
    estimatedMinutes: 40,
    energyCost: 15,
    completed: false
  },
  {
    id: "task-3",
    title: "가벼운 산책",
    category: "rest" as const,
    estimatedMinutes: 20,
    energyCost: 5,
    completed: false
  }
];

export function getHomeViewModel() {
  const plan = createTodayPlan(sampleCondition, sampleTasks);
  const totalCost = getTotalEnergyCost(plan.tasks);
  const status = getEnergyStatus(plan.energyBudget, plan.tasks);
  const recommendation = splitTasksByEnergyBudget(plan.energyBudget, plan.tasks);

  return {
    plan,
    totalCost,
    status,
    ...recommendation,
    statusLabel: {
      safe: "여유",
      caution: "주의",
      overload: "과부하"
    }[status]
  };
}
