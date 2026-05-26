export type Mood = "good" | "normal" | "tired" | "stressed";

export type TaskCategory = "study" | "assignment" | "project" | "exercise" | "rest";

export type EnergyTask = {
  id: string;
  title: string;
  category: TaskCategory;
  estimatedMinutes: number;
  energyCost: number;
  completed: boolean;
};

export type DailyCondition = {
  fatigue: number;
  availableHours: number;
  mood: Mood;
};

export type DailyEnergyPlan = {
  date: string;
  condition: DailyCondition;
  energyBudget: number;
  tasks: EnergyTask[];
};
