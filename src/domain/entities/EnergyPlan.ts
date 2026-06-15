export type Mood = "good" | "normal" | "tired" | "stressed";

export type TaskCategory = string;

export type TaskPlacement = "auto" | "recommended" | "postponed";

export type EnergyTask = {
  id: string;
  title: string;
  category: TaskCategory;
  estimatedMinutes: number;
  dueDate?: string;
  dueTime?: string;
  energyCost: number;
  completed: boolean;
  placement?: TaskPlacement;
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
