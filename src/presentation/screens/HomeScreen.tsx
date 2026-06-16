import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions
} from "react-native";

import type {
  EnergyTask,
  Mood,
  TaskCategory,
  TaskPlacement
} from "../../domain/entities/EnergyPlan";
import {
  calculateEnergyBudget,
  getEnergyStatus,
  getTotalEnergyCost
} from "../../domain/rules/energyBudgetRules";
import { theme } from "../theme/theme";

type CategoryOption = { value: TaskCategory; label: string; tone: string };
type SavedPlan = {
  fatigue: number;
  availableHours: string;
  mood: Mood;
  tasks: EnergyTask[];
  categories: CategoryOption[];
};
type PlanBook = Record<string, SavedPlan>;
type ReminderMessage = {
  id: string;
  taskTitle: string;
  message: string;
  minutesLeft: number;
};

const nicknameStorageKey = "energy-budget:nickname";
const planBookStorageKey = "energy-budget:plans";
const notificationEnabledStorageKey = "energy-budget:notification-enabled";

const moodOptions: Array<{ value: Mood; label: string; hint: string }> = [
  { value: "good", label: "좋음", hint: "가볍게 시작" },
  { value: "normal", label: "보통", hint: "평소처럼" },
  { value: "tired", label: "피곤", hint: "무리 금지" },
  { value: "stressed", label: "예민", hint: "작게 쪼개기" }
];

const defaultCategories: CategoryOption[] = [
  { value: "study", label: "공부", tone: "#2F6FED" },
  { value: "assignment", label: "과제", tone: "#7C3AED" },
  { value: "project", label: "프로젝트", tone: "#18B7A8" },
  { value: "exercise", label: "운동", tone: "#F2A71B" },
  { value: "rest", label: "회복", tone: "#1E9D63" },
  { value: "etc", label: "기타", tone: "#64748B" }
];

const placementOptions: Array<{ value: TaskPlacement; label: string; hint: string }> = [
  { value: "auto", label: "자동 추천", hint: "앱이 판단" },
  { value: "recommended", label: "지금 하기", hint: "직접 선택" },
  { value: "postponed", label: "나중에", hint: "미루기" }
];

const categoryEnergyBase: Record<string, number> = {
  study: 18,
  assignment: 24,
  project: 28,
  exercise: 18,
  rest: 8,
  etc: 15
};

const weekdayLabels = ["일", "월", "화", "수", "목", "금", "토"];

const initialTasks: EnergyTask[] = [
  {
    id: "task-1",
    title: "과제 핵심 내용 정리",
    category: "assignment",
    estimatedMinutes: 40,
    dueDate: toDateKey(new Date()),
    dueTime: "18:00",
    energyCost: 18,
    completed: false,
    placement: "auto"
  },
  {
    id: "task-2",
    title: "Energy Budget 화면 구현",
    category: "project",
    estimatedMinutes: 70,
    dueDate: toDateKey(new Date()),
    dueTime: "20:00",
    energyCost: 32,
    completed: false,
    placement: "auto"
  },
  {
    id: "task-3",
    title: "가벼운 산책으로 리셋",
    category: "rest",
    estimatedMinutes: 20,
    dueDate: toDateKey(new Date()),
    dueTime: "21:00",
    energyCost: 8,
    completed: false,
    placement: "recommended"
  }
];

const statusMeta = {
  safe: {
    label: "여유",
    message: "오늘 할 일을 안정적으로 소화할 수 있어요.",
    color: theme.colors.success,
    background: "#E8F7EF"
  },
  caution: {
    label: "주의",
    message: "중요한 일부터 하고 나머지는 줄이는 게 좋아요.",
    color: theme.colors.warning,
    background: theme.colors.warningSoft
  },
  overload: {
    label: "과부하",
    message: "오늘은 미룰 일을 분리해야 오래 갑니다.",
    color: theme.colors.danger,
    background: theme.colors.dangerSoft
  }
} as const;

function clampNumber(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateLabel(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00`);
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${weekdayLabels[date.getDay()]}요일`;
}

function getTaskDueDateTime(task: EnergyTask) {
  if (!task.dueDate || !task.dueTime) {
    return null;
  }

  const due = new Date(`${task.dueDate}T${task.dueTime}:00`);

  if (Number.isNaN(due.getTime())) {
    return null;
  }

  return due;
}

function getDueLabel(task: EnergyTask) {
  if (!task.dueDate || !task.dueTime) {
    return "예상 날짜 없음";
  }

  return `${task.dueDate} ${task.dueTime}`;
}

function buildReminderMessages(tasks: EnergyTask[], now = new Date()): ReminderMessage[] {
  const reminders: ReminderMessage[] = [];

  tasks.forEach((task) => {
    if (task.completed) {
      return;
    }

    const due = getTaskDueDateTime(task);

    if (!due) {
      return;
    }

    const minutesLeft = Math.round((due.getTime() - now.getTime()) / 60000);

    if (minutesLeft <= 0) {
      reminders.push({
        id: `${task.id}-due`,
        taskTitle: task.title,
        message: `"${task.title}" 마감 시간이 지났어요.`,
        minutesLeft
      });
      return;
    }

    if (minutesLeft <= 60) {
      reminders.push({
        id: `${task.id}-1h`,
        taskTitle: task.title,
        message: `"${task.title}"까지 1시간 남았어요.`,
        minutesLeft
      });
      return;
    }

    if (minutesLeft <= 180) {
      reminders.push({
        id: `${task.id}-3h`,
        taskTitle: task.title,
        message: `"${task.title}"까지 3시간 남았어요.`,
        minutesLeft
      });
    }
  });

  return reminders.sort((a, b) => a.minutesLeft - b.minutesLeft);
}

function getDisplayName(nickname: string) {
  const trimmed = nickname.trim();
  return trimmed ? `${trimmed}님` : "나";
}

function createDefaultPlan(): SavedPlan {
  return {
    fatigue: 4,
    availableHours: "5",
    mood: "normal",
    tasks: initialTasks,
    categories: defaultCategories
  };
}

function createBlankPlan(categories: CategoryOption[]): SavedPlan {
  return {
    fatigue: 4,
    availableHours: "5",
    mood: "normal",
    tasks: [],
    categories
  };
}

function getMonthDates(year: number, month: number) {
  const firstDate = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0);
  const dates: Array<string | null> = Array.from({ length: firstDate.getDay() }, () => null);

  for (let day = 1; day <= lastDate.getDate(); day += 1) {
    dates.push(toDateKey(new Date(year, month, day)));
  }

  while (dates.length % 7 !== 0) {
    dates.push(null);
  }

  return dates;
}

function getCategoryMeta(category: TaskCategory, categories: CategoryOption[]) {
  return categories.find((item) => item.value === category) ?? defaultCategories[5];
}

function getCategoryLabel(category: TaskCategory, categories: CategoryOption[]) {
  return getCategoryMeta(category, categories).label;
}

function splitDuration(minutes: number) {
  const safeMinutes = clampNumber(Math.round(minutes), 0, 600);

  return {
    hours: Math.floor(safeMinutes / 60),
    minutes: safeMinutes % 60
  };
}

function formatDuration(minutes: number) {
  const duration = splitDuration(minutes);

  if (duration.hours > 0 && duration.minutes > 0) {
    return `${duration.hours}시간 ${duration.minutes}분`;
  }

  if (duration.hours > 0) {
    return `${duration.hours}시간`;
  }

  return `${duration.minutes}분`;
}

function estimateEnergyCostByAi({
  category,
  fatigue,
  minutes,
  mood,
  title
}: {
  category: TaskCategory;
  fatigue: number;
  minutes: number;
  mood: Mood;
  title: string;
}) {
  const normalizedTitle = title.trim().toLowerCase();
  const base = categoryEnergyBase[category] ?? categoryEnergyBase.etc;
  const timeCost = Math.ceil(minutes / 30) * 4;
  const fatigueCost = fatigue >= 8 ? 8 : fatigue >= 6 ? 5 : fatigue >= 4 ? 2 : 0;
  const moodCost = mood === "stressed" ? 6 : mood === "tired" ? 5 : mood === "good" ? -2 : 0;
  const keywordCost =
    /발표|시험|과제|프로젝트|코딩|보고서|마감|면접|알고리즘|개발/.test(normalizedTitle) ? 7 : 0;
  const restDiscount = category === "rest" ? -8 : 0;

  return clampNumber(base + timeCost + fatigueCost + moodCost + keywordCost + restDiscount, 5, 100);
}

function splitTasksByChoice(budget: number, tasks: EnergyTask[]) {
  let usedEnergy = 0;
  const recommendedTasks: EnergyTask[] = [];
  const postponedTasks: EnergyTask[] = [];
  const activeTasks = tasks.filter((task) => !task.completed);

  for (const task of activeTasks) {
    if (task.placement === "recommended") {
      recommendedTasks.push(task);
      usedEnergy += task.energyCost;
    }
  }

  for (const task of activeTasks) {
    if (task.placement === "postponed") {
      postponedTasks.push(task);
    }
  }

  for (const task of activeTasks) {
    if (task.placement && task.placement !== "auto") {
      continue;
    }

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

export function HomeScreen() {
  const { width } = useWindowDimensions();
  const isDesktopPreview = width > 520;
  const todayKey = useMemo(() => toDateKey(new Date()), []);
  const isApplyingPlan = useRef(false);

  const [nickname, setNickname] = useState("");
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [planBook, setPlanBook] = useState<PlanBook>({});
  const [fatigue, setFatigue] = useState(4);
  const [availableHours, setAvailableHours] = useState("5");
  const [mood, setMood] = useState<Mood>("normal");
  const [tasks, setTasks] = useState<EnergyTask[]>(initialTasks);
  const [categories, setCategories] = useState<CategoryOption[]>(defaultCategories);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskHours, setNewTaskHours] = useState("0");
  const [newTaskMinutes, setNewTaskMinutes] = useState("30");
  const [newTaskDueDate, setNewTaskDueDate] = useState(todayKey);
  const [newTaskDueTime, setNewTaskDueTime] = useState("18:00");
  const [newTaskEnergy, setNewTaskEnergy] = useState("15");
  const [newTaskCategory, setNewTaskCategory] = useState<TaskCategory>("study");
  const [newTaskPlacement, setNewTaskPlacement] = useState<TaskPlacement>("auto");
  const [customCategoryName, setCustomCategoryName] = useState("");
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState("알림 꺼짐");
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [sentReminderIds, setSentReminderIds] = useState<string[]>([]);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadSavedData() {
      const [savedName, savedPlans, savedNotificationEnabled] = await Promise.all([
        AsyncStorage.getItem(nicknameStorageKey),
        AsyncStorage.getItem(planBookStorageKey),
        AsyncStorage.getItem(notificationEnabledStorageKey)
      ]);
      const parsedPlans = savedPlans ? (JSON.parse(savedPlans) as PlanBook) : {};
      const todayPlan = parsedPlans[todayKey] ?? createDefaultPlan();

      if (!parsedPlans[todayKey]) {
        parsedPlans[todayKey] = todayPlan;
      }

      isApplyingPlan.current = true;
      if (savedName) {
        setNickname(savedName);
      }
      const isNotificationEnabled = savedNotificationEnabled === "true";
      setNotificationEnabled(isNotificationEnabled);
      setNotificationStatus(isNotificationEnabled ? "앱 안 알림 켜짐" : "알림 꺼짐");
      setPlanBook(parsedPlans);
      applyPlan(todayPlan);
      isApplyingPlan.current = false;
      setLoaded(true);
    }

    loadSavedData().catch(() => setLoaded(true));
  }, [todayKey]);

  useEffect(() => {
    if (!loaded || isApplyingPlan.current) {
      return;
    }

    const currentPlan: SavedPlan = { fatigue, availableHours, mood, tasks, categories };
    const nextPlanBook = { ...planBook, [selectedDate]: currentPlan };
    setPlanBook(nextPlanBook);
    AsyncStorage.setItem(planBookStorageKey, JSON.stringify(nextPlanBook)).catch(() => undefined);
  }, [availableHours, categories, fatigue, loaded, mood, selectedDate, tasks]);

  useEffect(() => {
    AsyncStorage.setItem(nicknameStorageKey, nickname.trim()).catch(() => undefined);
  }, [nickname]);

  const condition = useMemo(
    () => ({
      fatigue,
      availableHours: clampNumber(Number(availableHours) || 0, 0, 16),
      mood
    }),
    [availableHours, fatigue, mood]
  );

  const activeTasks = tasks.filter((task) => !task.completed);
  const energyBudget = calculateEnergyBudget(condition);
  const totalCost = getTotalEnergyCost(activeTasks);
  const status = getEnergyStatus(energyBudget, activeTasks);
  const statusInfo = statusMeta[status];
  const { recommendedTasks, postponedTasks, remainingEnergy } = splitTasksByChoice(
    energyBudget,
    tasks
  );
  const completedCount = tasks.filter((task) => task.completed).length;
  const totalMinutes = recommendedTasks.reduce((sum, task) => sum + task.estimatedMinutes, 0);
  const usagePercent = clampNumber(Math.round((totalCost / Math.max(energyBudget, 1)) * 100), 0, 100);
  const displayName = getDisplayName(nickname);
  const monthDates = getMonthDates(visibleMonth.getFullYear(), visibleMonth.getMonth());
  const assignmentHeavyWeekdays = getHeavyAssignmentWeekdays(planBook, visibleMonth);
  const reminderMessages = useMemo(() => buildReminderMessages(tasks), [tasks]);

  useEffect(() => {
    function checkReminders() {
      if (!notificationEnabled) {
        return;
      }

      const notificationApi = (globalThis as unknown as { Notification?: typeof Notification }).Notification;
      const activeReminders = buildReminderMessages(tasks);
      const freshReminders = activeReminders.filter((item) => !sentReminderIds.includes(item.id));

      if (freshReminders.length === 0) {
        return;
      }

      setSentReminderIds((current) => [
        ...current,
        ...freshReminders.map((item) => item.id).filter((id) => !current.includes(id))
      ]);

      if (notificationApi?.permission === "granted") {
        freshReminders.forEach((item) => {
          new notificationApi("Energy Budget 알림", {
            body: item.message
          });
        });
      }
    }

    checkReminders();
    const timer = setInterval(checkReminders, 60000);

    return () => clearInterval(timer);
  }, [notificationEnabled, sentReminderIds, tasks]);

  function applyPlan(plan: SavedPlan) {
    setFatigue(plan.fatigue);
    setAvailableHours(plan.availableHours);
    setMood(plan.mood);
    setTasks(plan.tasks);
    setCategories(plan.categories.length > 0 ? plan.categories : defaultCategories);
    setNewTaskCategory(plan.categories[0]?.value ?? "study");
    clearTaskForm();
  }

  function selectDate(dateKey: string) {
    const existingPlan = planBook[dateKey];
    const plan = existingPlan ?? createBlankPlan(categories);

    isApplyingPlan.current = true;
    setSelectedDate(dateKey);
    applyPlan(plan);
    setNewTaskDueDate(dateKey);
    setVisibleMonth(new Date(`${dateKey}T00:00:00`));
    isApplyingPlan.current = false;
  }

  function clearTaskForm() {
    setNewTaskTitle("");
    setNewTaskHours("0");
    setNewTaskMinutes("30");
    setNewTaskDueDate(selectedDate);
    setNewTaskDueTime("18:00");
    setNewTaskEnergy("15");
    setNewTaskPlacement("auto");
    setEditingTaskId(null);
  }

  function saveTask() {
    const title = newTaskTitle.trim();

    if (!title) {
      Alert.alert("할 일 이름이 필요해요", "오늘 해야 할 일을 짧게 적어주세요.");
      return;
    }

    const hours = clampNumber(Number(newTaskHours) || 0, 0, 12);
    const minutePart = clampNumber(Number(newTaskMinutes) || 0, 0, 59);
    const minutes = clampNumber(hours * 60 + minutePart || 10, 5, 720);
    const energyCost = clampNumber(Number(newTaskEnergy) || 1, 1, 100);
    const nextTask: EnergyTask = {
      id: editingTaskId ?? `task-${Date.now()}`,
      title,
      category: newTaskCategory,
      estimatedMinutes: minutes,
      dueDate: newTaskDueDate.trim() || selectedDate,
      dueTime: newTaskDueTime.trim() || "18:00",
      energyCost,
      completed: editingTaskId
        ? tasks.find((task) => task.id === editingTaskId)?.completed ?? false
        : false,
      placement: newTaskPlacement
    };

    setTasks((current) =>
      editingTaskId
        ? current.map((task) => (task.id === editingTaskId ? nextTask : task))
        : [...current, nextTask]
    );
    clearTaskForm();
  }

  function startEditTask(task: EnergyTask) {
    setEditingTaskId(task.id);
    setNewTaskTitle(task.title);
    const duration = splitDuration(task.estimatedMinutes);
    setNewTaskHours(String(duration.hours));
    setNewTaskMinutes(String(duration.minutes));
    setNewTaskDueDate(task.dueDate ?? selectedDate);
    setNewTaskDueTime(task.dueTime ?? "18:00");
    setNewTaskEnergy(String(task.energyCost));
    setNewTaskCategory(task.category);
    setNewTaskPlacement(task.placement ?? "auto");
  }

  function toggleTask(taskId: string) {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  }

  function deleteTask(taskId: string) {
    setTasks((current) => current.filter((task) => task.id !== taskId));
    if (editingTaskId === taskId) {
      clearTaskForm();
    }
  }

  function resetSelectedDay() {
    applyPlan(createBlankPlan(categories));
  }

  function addCustomCategory() {
    const label = customCategoryName.trim();

    if (!label) {
      return;
    }

    const value = `custom-${Date.now()}`;
    const tones = ["#E14B5A", "#0891B2", "#EA580C", "#16A34A", "#9333EA"];
    const nextCategory = {
      value,
      label,
      tone: tones[categories.length % tones.length]
    };

    setCategories((current) => [...current, nextCategory]);
    setNewTaskCategory(value);
    setCustomCategoryName("");
  }

  function recommendEnergyCost() {
    const hours = clampNumber(Number(newTaskHours) || 0, 0, 12);
    const minutePart = clampNumber(Number(newTaskMinutes) || 0, 0, 59);
    const minutes = clampNumber(hours * 60 + minutePart || 10, 5, 720);
    const recommendedCost = estimateEnergyCostByAi({
      category: newTaskCategory,
      fatigue,
      minutes,
      mood,
      title: newTaskTitle
    });

    setNewTaskEnergy(String(recommendedCost));
  }

  function moveMonth(direction: -1 | 1) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
  }

  async function toggleNotification() {
    if (notificationEnabled) {
      setNotificationEnabled(false);
      setNotificationStatus("알림 꺼짐");
      await AsyncStorage.setItem(notificationEnabledStorageKey, "false");
      return;
    }

    const notificationApi = (globalThis as unknown as { Notification?: typeof Notification }).Notification;

    if (!notificationApi) {
      setNotificationEnabled(true);
      setNotificationStatus("앱 안 알림 켜짐");
      await AsyncStorage.setItem(notificationEnabledStorageKey, "true");
      Alert.alert("앱 안 알림", "현재 환경에서는 브라우저 알림 대신 앱 안 메시지로 알려드릴게요.");
      return;
    }

    setNotificationStatus("알림 권한 요청 중");
    const permission = await notificationApi.requestPermission();
    setNotificationEnabled(true);
    setNotificationStatus(
      permission === "granted" ? "브라우저 알림 + 앱 안 알림 켜짐" : "앱 안 알림 켜짐"
    );
    await AsyncStorage.setItem(notificationEnabledStorageKey, "true");
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.container, isDesktopPreview && styles.containerPhone]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.appHeader}>
        <Text style={styles.appName}>Energy Budget</Text>
        <Pressable
          style={styles.notificationIconButton}
          onPress={() => setIsNotificationPanelOpen((current) => !current)}
        >
          <Text style={styles.notificationIcon}>🔔</Text>
          {notificationEnabled && reminderMessages.length > 0 ? (
            <View style={styles.notificationDot}>
              <Text style={styles.notificationDotText}>{reminderMessages.length}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <View style={styles.hero}>
        <Text style={styles.eyebrow}>TODAY ENERGY</Text>
        <Text style={styles.title}>오늘 할 일에 맞춰 에너지를 조절해요</Text>
        <Text style={styles.description}>
          컨디션과 남은 시간을 입력하면 오늘 할 일을 지금 할 일과 나중에 할 일로 정리합니다.
        </Text>

        {isNotificationPanelOpen ? (
          <View style={styles.heroNotificationPanel}>
            <View style={styles.heroNotificationHeader}>
              <View style={styles.headerTextBlock}>
                <Text style={styles.heroNotificationTitle}>알림 현황</Text>
                <Text style={styles.heroNotificationHint}>마감 3시간 전과 1시간 전에 알려줍니다.</Text>
              </View>
              <Pressable
                style={[
                  styles.heroPanelToggle,
                  notificationEnabled && styles.heroPanelToggleActive
                ]}
                onPress={toggleNotification}
              >
                <Text
                  style={[
                    styles.heroPanelToggleText,
                    notificationEnabled && styles.heroPanelToggleTextActive
                  ]}
                >
                  {notificationEnabled ? "끄기" : "켜기"}
                </Text>
              </Pressable>
            </View>
            <Text style={styles.heroNotificationStatus}>{notificationStatus}</Text>
            {!notificationEnabled ? (
              <View style={styles.heroNoticeLine}>
                <Text style={styles.heroNoticeLineText}>알림이 꺼져 있어요. 버튼으로 켤 수 있어요.</Text>
              </View>
            ) : reminderMessages.length > 0 ? (
              reminderMessages.map((item) => (
                <View key={item.id} style={styles.heroNoticeLine}>
                  <Text style={styles.heroNoticeLineText}>{item.message}</Text>
                </View>
              ))
            ) : (
              <View style={styles.heroNoticeLine}>
                <Text style={styles.heroNoticeLineText}>아직 곧 마감되는 할 일이 없어요.</Text>
              </View>
            )}
          </View>
        ) : null}

        <View style={styles.profileCard}>
          <Text style={styles.profileLabel}>사용자 닉네임</Text>
          <TextInput
            value={nickname}
            onChangeText={setNickname}
            style={styles.nicknameInput}
            placeholder="예: 원식"
            placeholderTextColor="#9AA8BA"
            maxLength={12}
          />
          <Text style={styles.profileHint}>{displayName}의 계획은 날짜별로 자동 저장됩니다.</Text>
        </View>
      </View>

      <View style={styles.flowCard}>
        <FlowStep number="1" label="컨디션" />
        <View style={styles.flowLine} />
        <FlowStep number="2" label="할 일" />
        <View style={styles.flowLine} />
        <FlowStep number="3" label="맞춤 추천" />
      </View>

      <View style={styles.dateCard}>
        <View style={styles.headerTextBlock}>
          <Text style={styles.dateTitle}>{getDateLabel(selectedDate)}</Text>
          <Text style={styles.sectionHint}>요일마다 계획이 저장되고, 과제가 많은 날은 달력에 표시됩니다.</Text>
        </View>
        <Pressable style={styles.todayButton} onPress={() => selectDate(todayKey)}>
          <Text style={styles.todayButtonText}>오늘</Text>
        </Pressable>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.energyCard}>
          <View style={styles.energyCardHeader}>
            <Text style={styles.cardLabel}>오늘의 에너지 예산</Text>
            <Text style={styles.scoreBadge}>{statusInfo.label}</Text>
          </View>
          <Text style={styles.energyScore}>{energyBudget}</Text>
          <View style={styles.energyTrack}>
            <View style={[styles.energyFill, { width: `${energyBudget}%` }]} />
          </View>
          <Text style={styles.energyCaption}>{statusInfo.message} 남은 에너지 {remainingEnergy}</Text>
        </View>

        <View style={styles.statPanel}>
          <MiniStat label="지금 하면 좋은 일" value={`${recommendedTasks.length}개`} tone={theme.colors.primary} />
          <MiniStat label="예상 시간" value={formatDuration(totalMinutes)} tone={theme.colors.accent} />
          <MiniStat label="완료" value={`${completedCount}개`} tone={theme.colors.success} />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeading}>
          <View style={styles.headerTextBlock}>
            <Text style={styles.sectionTitle}>1. 오늘 내 상태</Text>
            <Text style={styles.sectionHint}>컨디션을 보고 오늘 할 일을 감당 가능한 양으로 조절합니다.</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: statusInfo.background }]}>
            <Text style={[styles.statusPillText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>

        <View style={styles.controlBlock}>
          <View style={styles.controlHeader}>
            <Text style={styles.controlLabel}>피로도</Text>
            <Text style={styles.controlValue}>{fatigue} / 10</Text>
          </View>
          <View style={styles.stepperRow}>
            <Pressable
              style={styles.stepperButton}
              onPress={() => setFatigue((value) => clampNumber(value - 1, 0, 10))}
            >
              <Text style={styles.stepperText}>-</Text>
            </Pressable>
            <View style={styles.fatigueTrack}>
              <View style={[styles.fatigueFill, { width: `${fatigue * 10}%` }]} />
            </View>
            <Pressable
              style={styles.stepperButton}
              onPress={() => setFatigue((value) => clampNumber(value + 1, 0, 10))}
            >
              <Text style={styles.stepperText}>+</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.inputGrid}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>남은 시간</Text>
            <View style={styles.inputWithUnit}>
              <TextInput
                value={availableHours}
                onChangeText={setAvailableHours}
                keyboardType="numeric"
                style={styles.inputBare}
                placeholder="5"
                placeholderTextColor="#9AA8BA"
              />
              <Text style={styles.inputUnit}>시간</Text>
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>예상 사용량</Text>
            <View style={styles.usageBox}>
              <View style={styles.usageTrack}>
                <View
                  style={[
                    styles.usageFill,
                    { width: `${usagePercent}%`, backgroundColor: statusInfo.color }
                  ]}
                />
              </View>
              <Text style={styles.usageText}>{totalCost} / {energyBudget}</Text>
            </View>
          </View>
        </View>

        <View style={styles.optionGrid}>
          {moodOptions.map((item) => (
            <Pressable
              key={item.value}
              style={[styles.optionChip, mood === item.value && styles.optionChipActive]}
              onPress={() => setMood(item.value)}
            >
              <Text style={[styles.optionText, mood === item.value && styles.optionTextActive]}>
                {item.label}
              </Text>
              <Text style={[styles.optionHint, mood === item.value && styles.optionTextActive]}>
                {item.hint}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{editingTaskId ? "할 일 수정" : "2. 오늘 할 일 추가"}</Text>
        <Text style={styles.sectionHint}>
          자동 추천을 고르면 앱이 에너지 예산에 맞춰 지금 할 일과 미룰 일을 나눕니다.
        </Text>
        <TextInput
          value={newTaskTitle}
          onChangeText={setNewTaskTitle}
          style={styles.input}
          placeholder="예: 발표 대사 연습"
          placeholderTextColor="#9AA8BA"
        />
        <View style={styles.inputGrid}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>예상 시간</Text>
            <View style={styles.durationRow}>
              <View style={[styles.inputWithUnit, styles.durationInput]}>
                <TextInput
                  value={newTaskHours}
                  onChangeText={setNewTaskHours}
                  keyboardType="numeric"
                  style={styles.inputBare}
                  placeholder="0"
                  placeholderTextColor="#9AA8BA"
                />
                <Text style={styles.inputUnit}>시간</Text>
              </View>
              <View style={[styles.inputWithUnit, styles.durationInput]}>
                <TextInput
                  value={newTaskMinutes}
                  onChangeText={setNewTaskMinutes}
                  keyboardType="numeric"
                  style={styles.inputBare}
                  placeholder="30"
                  placeholderTextColor="#9AA8BA"
                />
                <Text style={styles.inputUnit}>분</Text>
              </View>
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>예상 날짜</Text>
            <View style={styles.inputWithUnit}>
              <TextInput
                value={newTaskDueDate}
                onChangeText={setNewTaskDueDate}
                style={styles.inputBare}
                placeholder="2026-06-10"
                placeholderTextColor="#9AA8BA"
              />
            </View>
            <Text style={styles.inputHelp}>YYYY-MM-DD 형식으로 입력하세요.</Text>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>예상 마감 시간</Text>
            <View style={styles.inputWithUnit}>
              <TextInput
                value={newTaskDueTime}
                onChangeText={setNewTaskDueTime}
                style={styles.inputBare}
                placeholder="18:00"
                placeholderTextColor="#9AA8BA"
              />
            </View>
            <Text style={styles.inputHelp}>HH:mm 형식으로 입력하면 알림 기준이 됩니다.</Text>
          </View>
          <View style={styles.inputGroup}>
            <View style={styles.labelActionRow}>
              <Text style={styles.inputLabel}>에너지 소모</Text>
              <Pressable style={styles.aiSuggestButton} onPress={recommendEnergyCost}>
                <Text style={styles.aiSuggestText}>AI 추천</Text>
              </Pressable>
            </View>
            <View style={styles.inputWithUnit}>
              <TextInput
                value={newTaskEnergy}
                onChangeText={setNewTaskEnergy}
                keyboardType="numeric"
                style={styles.inputBare}
                placeholder="15"
                placeholderTextColor="#9AA8BA"
              />
              <Text style={styles.inputUnit}>점</Text>
            </View>
            <Text style={styles.inputHelp}>직접 입력하거나 AI 추천으로 제목, 시간, 컨디션에 맞춰 계산하세요.</Text>
            <View style={styles.energyCostRow}>
              {[8, 15, 25, 35].map((cost) => (
                <Pressable
                  key={cost}
                  style={[
                    styles.costChip,
                    Number(newTaskEnergy) === cost && styles.costChipActive
                  ]}
                  onPress={() => setNewTaskEnergy(String(cost))}
                >
                  <Text
                    style={[
                      styles.costText,
                      Number(newTaskEnergy) === cost && styles.optionTextActive
                    ]}
                  >
                    {cost}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        <Text style={styles.inputLabel}>분류 방식</Text>
        <View style={styles.optionGrid}>
          {placementOptions.map((item) => (
            <Pressable
              key={item.value}
              style={[
                styles.optionChip,
                newTaskPlacement === item.value && styles.optionChipActive
              ]}
              onPress={() => setNewTaskPlacement(item.value)}
            >
              <Text
                style={[
                  styles.optionText,
                  newTaskPlacement === item.value && styles.optionTextActive
                ]}
              >
                {item.label}
              </Text>
              <Text
                style={[
                  styles.optionHint,
                  newTaskPlacement === item.value && styles.optionTextActive
                ]}
              >
                {item.hint}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.inputLabel}>카테고리</Text>
        <View style={styles.categoryRow}>
          {categories.map((item) => (
            <Pressable
              key={item.value}
              style={[
                styles.categoryChip,
                newTaskCategory === item.value && {
                  backgroundColor: item.tone,
                  borderColor: item.tone
                }
              ]}
              onPress={() => setNewTaskCategory(item.value)}
            >
              <Text
                style={[
                  styles.categoryText,
                  newTaskCategory === item.value && styles.optionTextActive
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.addCategoryRow}>
          <TextInput
            value={customCategoryName}
            onChangeText={setCustomCategoryName}
            style={[styles.input, styles.addCategoryInput]}
            placeholder="기타 카테고리 추가"
            placeholderTextColor="#9AA8BA"
          />
          <Pressable style={styles.smallButton} onPress={addCustomCategory}>
            <Text style={styles.smallButtonText}>추가</Text>
          </Pressable>
        </View>

        <Pressable style={styles.primaryButton} onPress={saveTask}>
          <Text style={styles.primaryButtonText}>
            {editingTaskId ? "수정 저장하기" : "할 일 추가하기"}
          </Text>
        </Pressable>
        {editingTaskId ? (
          <Pressable style={styles.cancelButton} onPress={clearTaskForm}>
            <Text style={styles.cancelButtonText}>수정 취소</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeading}>
          <View style={styles.headerTextBlock}>
            <Text style={styles.sectionTitle}>3. 지금 하면 좋은 일</Text>
            <Text style={styles.sectionHint}>자동 추천과 직접 선택한 일을 함께 보여줍니다.</Text>
          </View>
          <Pressable style={styles.resetButton} onPress={resetSelectedDay}>
            <Text style={styles.resetButtonText}>비우기</Text>
          </Pressable>
        </View>
        {recommendedTasks.length === 0 ? (
          <EmptyBox title="지금 할 일이 없어요" text="할 일을 추가하거나 에너지 소모를 낮춰보세요." />
        ) : (
          recommendedTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              categories={categories}
              onDelete={deleteTask}
              onEdit={startEditTask}
              onToggle={toggleTask}
            />
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>나중으로 미뤄도 되는 일</Text>
        <Text style={styles.sectionHint}>오늘 에너지를 넘는 일은 다음에 할 후보로 따로 빼둡니다.</Text>
        {postponedTasks.length === 0 ? (
          <View style={styles.emptyLine}>
            <Text style={styles.emptyLineText}>지금 계획은 오늘 에너지 안에 들어와요.</Text>
          </View>
        ) : (
          postponedTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              categories={categories}
              muted
              onDelete={deleteTask}
              onEdit={startEditTask}
              onToggle={toggleTask}
            />
          ))
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.monthHeader}>
          <Pressable style={styles.monthButton} onPress={() => moveMonth(-1)}>
            <Text style={styles.monthButtonText}>‹</Text>
          </Pressable>
          <View>
            <Text style={styles.sectionTitle}>
              {visibleMonth.getFullYear()}년 {visibleMonth.getMonth() + 1}월
            </Text>
            <Text style={styles.sectionHint}>1달 계획 보기</Text>
          </View>
          <Pressable style={styles.monthButton} onPress={() => moveMonth(1)}>
            <Text style={styles.monthButtonText}>›</Text>
          </Pressable>
        </View>
        <View style={styles.weekdayRow}>
          {weekdayLabels.map((day) => (
            <Text key={day} style={styles.weekdayText}>{day}</Text>
          ))}
        </View>
        <View style={styles.monthGrid}>
          {monthDates.map((dateKey, index) => (
            <MonthCell
              key={`${dateKey ?? "blank"}-${index}`}
              dateKey={dateKey}
              isSelected={dateKey === selectedDate}
              isToday={dateKey === todayKey}
              plan={dateKey ? planBook[dateKey] : undefined}
              onPress={selectDate}
            />
          ))}
        </View>
        {assignmentHeavyWeekdays.length > 0 ? (
          <View style={styles.assignmentNotice}>
            <Text style={styles.assignmentNoticeText}>
              과제가 많은 요일: {assignmentHeavyWeekdays.join(", ")}
            </Text>
          </View>
        ) : (
          <View style={styles.emptyLine}>
            <Text style={styles.emptyLineText}>이번 달은 과제가 몰린 요일이 아직 없어요.</Text>
          </View>
        )}
      </View>

      <View style={styles.bottomNav}>
        <View style={styles.bottomNavItemActive}>
          <Text style={styles.bottomNavIcon}>●</Text>
          <Text style={styles.bottomNavTextActive}>오늘</Text>
        </View>
        <View style={styles.bottomNavItem}>
          <Text style={styles.bottomNavIconMuted}>●</Text>
          <Text style={styles.bottomNavText}>할 일</Text>
        </View>
        <View style={styles.bottomNavItem}>
          <Text style={styles.bottomNavIconMuted}>●</Text>
          <Text style={styles.bottomNavText}>달력</Text>
        </View>
      </View>
    </ScrollView>
  );
}

function FlowStep({ number, label }: { number: string; label: string }) {
  return (
    <View style={styles.flowStep}>
      <Text style={styles.flowNumber}>{number}</Text>
      <Text style={styles.flowText}>{label}</Text>
    </View>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <View style={styles.miniStat}>
      <View style={[styles.miniDot, { backgroundColor: tone }]} />
      <Text style={styles.miniLabel}>{label}</Text>
      <Text style={styles.miniValue}>{value}</Text>
    </View>
  );
}

function TaskRow({
  task,
  categories,
  muted,
  onDelete,
  onEdit,
  onToggle
}: {
  task: EnergyTask;
  categories: CategoryOption[];
  muted?: boolean;
  onDelete: (taskId: string) => void;
  onEdit: (task: EnergyTask) => void;
  onToggle: (taskId: string) => void;
}) {
  const category = getCategoryMeta(task.category, categories);

  return (
    <View style={[styles.taskItem, muted && styles.taskItemMuted, task.completed && styles.taskItemDone]}>
      <Pressable
        style={[styles.checkCircle, task.completed && styles.checkCircleDone]}
        onPress={() => onToggle(task.id)}
      >
        <Text style={styles.checkText}>{task.completed ? "✓" : ""}</Text>
      </Pressable>
      <View style={styles.taskContent}>
        <View style={styles.taskTitleRow}>
          <Text style={[styles.taskTitle, task.completed && styles.taskTitleDone]}>{task.title}</Text>
          <View style={[styles.categoryBadge, { backgroundColor: category.tone }]}>
            <Text style={styles.categoryBadgeText}>{category.label}</Text>
          </View>
        </View>
        <Text style={styles.taskMeta}>
          {formatDuration(task.estimatedMinutes)} · 에너지 {task.energyCost} · {getDueLabel(task)} · {getPlacementLabel(task.placement)}
        </Text>
        <View style={styles.taskActions}>
          <Pressable style={styles.taskActionButton} onPress={() => onEdit(task)}>
            <Text style={styles.taskActionText}>수정</Text>
          </Pressable>
          <Pressable style={styles.taskActionButton} onPress={() => onDelete(task.id)}>
            <Text style={styles.taskActionDanger}>삭제</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function EmptyBox({ title, text }: { title: string; text: string }) {
  return (
    <View style={styles.emptyBox}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

function MonthCell({
  dateKey,
  isSelected,
  isToday,
  plan,
  onPress
}: {
  dateKey: string | null;
  isSelected: boolean;
  isToday: boolean;
  plan?: SavedPlan;
  onPress: (dateKey: string) => void;
}) {
  if (!dateKey) {
    return <View style={styles.monthCellBlank} />;
  }

  const date = new Date(`${dateKey}T00:00:00`);
  const taskCount = plan?.tasks.length ?? 0;
  const assignmentCount =
    plan?.tasks.filter((task) => task.category === "assignment" || getCategoryLabel(task.category, plan.categories) === "과제").length ?? 0;
  const isHeavy = assignmentCount >= 2;

  return (
    <Pressable
      style={[
        styles.monthCell,
        isSelected && styles.monthCellSelected,
        isHeavy && styles.monthCellHeavy
      ]}
      onPress={() => onPress(dateKey)}
    >
      <Text style={[styles.monthDay, isSelected && styles.monthDaySelected]}>
        {date.getDate()}
      </Text>
      {isToday ? <Text style={styles.todayDot}>오늘</Text> : null}
      {taskCount > 0 ? <Text style={styles.monthTaskCount}>{taskCount}개</Text> : null}
      {isHeavy ? <Text style={styles.assignmentBadge}>과제 많음</Text> : null}
    </Pressable>
  );
}

function getPlacementLabel(placement?: TaskPlacement) {
  if (placement === "recommended") {
    return "직접 지금";
  }

  if (placement === "postponed") {
    return "직접 나중";
  }

  return "자동 추천";
}

function getHeavyAssignmentWeekdays(planBook: PlanBook, visibleMonth: Date) {
  const counts: Record<string, number> = {};
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();

  Object.entries(planBook).forEach(([dateKey, plan]) => {
    const date = new Date(`${dateKey}T00:00:00`);

    if (date.getFullYear() !== year || date.getMonth() !== month) {
      return;
    }

    const assignmentCount = plan.tasks.filter(
      (task) => task.category === "assignment" || getCategoryLabel(task.category, plan.categories) === "과제"
    ).length;

    if (assignmentCount >= 2) {
      const weekday = `${weekdayLabels[date.getDay()]}요일`;
      counts[weekday] = (counts[weekday] ?? 0) + 1;
    }
  });

  return Object.entries(counts)
    .filter(([, count]) => count >= 1)
    .map(([weekday]) => weekday);
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: theme.colors.background
  },
  container: {
    padding: theme.spacing.sm,
    paddingBottom: 44,
    gap: theme.spacing.sm
  },
  containerPhone: {
    maxWidth: 360,
    width: "100%",
    alignSelf: "center",
    paddingVertical: theme.spacing.lg
  },
  appHeader: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  appName: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "900"
  },
  notificationIconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderColor: theme.colors.border,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: theme.colors.surface,
    position: "relative"
  },
  notificationIcon: {
    fontSize: 19,
    lineHeight: 23
  },
  notificationDot: {
    position: "absolute",
    top: 3,
    right: 3,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: theme.colors.danger,
    paddingHorizontal: 4
  },
  notificationDotText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900"
  },
  notificationPanel: {
    borderColor: theme.colors.border,
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.sm,
    gap: theme.spacing.sm,
    shadowColor: "#172033",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 }
  },
  notificationPanelHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: theme.spacing.md
  },
  notificationPanelTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "900"
  },
  panelToggle: {
    minWidth: 52,
    minHeight: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: theme.colors.primarySoft,
    paddingHorizontal: theme.spacing.md
  },
  panelToggleActive: {
    backgroundColor: theme.colors.dark
  },
  panelToggleText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: "900"
  },
  panelToggleTextActive: {
    color: "#FFFFFF"
  },
  appBadge: {
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: theme.colors.accentSoft,
    color: "#08766C",
    fontSize: 12,
    fontWeight: "900",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6
  },
  hero: {
    backgroundColor: theme.colors.dark,
    borderRadius: 20,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
    overflow: "hidden"
  },
  heroNotificationPanel: {
    borderColor: "rgba(35, 215, 196, 0.28)",
    borderRadius: theme.radius.md,
    borderWidth: 1,
    backgroundColor: "rgba(35, 215, 196, 0.09)",
    padding: theme.spacing.sm,
    gap: 8
  },
  heroNotificationHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: theme.spacing.sm
  },
  heroNotificationTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900"
  },
  heroNotificationHint: {
    color: "#B9C8DA",
    fontSize: 11,
    lineHeight: 16
  },
  heroNotificationStatus: {
    alignSelf: "flex-start",
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
    color: "#DCE7F5",
    fontSize: 11,
    fontWeight: "800",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 5
  },
  heroPanelToggle: {
    minWidth: 48,
    minHeight: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: theme.spacing.sm
  },
  heroPanelToggleActive: {
    backgroundColor: theme.colors.accent
  },
  heroPanelToggleText: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: "900"
  },
  heroPanelToggleTextActive: {
    color: "#062B2C"
  },
  heroNoticeLine: {
    borderRadius: theme.radius.sm,
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 8
  },
  heroNoticeLineText: {
    color: "#DDF8F5",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 18
  },
  eyebrow: {
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: "900"
  },
  title: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 30
  },
  description: {
    color: "#C9D4E3",
    fontSize: 13,
    lineHeight: 20
  },
  profileCard: {
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: theme.radius.md,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: theme.spacing.sm,
    gap: theme.spacing.sm
  },
  profileLabel: {
    color: "#DCE7F7",
    fontSize: 12,
    fontWeight: "800"
  },
  nicknameInput: {
    minHeight: 44,
    borderRadius: theme.radius.md,
    backgroundColor: "#FFFFFF",
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "900",
    paddingHorizontal: theme.spacing.md
  },
  profileHint: {
    color: "#A9B8CA",
    fontSize: 11,
    lineHeight: 16
  },
  flowCard: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: theme.colors.border,
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.sm
  },
  flowStep: {
    flex: 1,
    alignItems: "center",
    gap: 7
  },
  flowNumber: {
    width: 26,
    height: 26,
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    lineHeight: 26,
    textAlign: "center"
  },
  flowText: {
    color: theme.colors.text,
    fontSize: 11,
    fontWeight: "900",
    textAlign: "center",
    lineHeight: 16
  },
  flowLine: {
    width: 16,
    height: 2,
    borderRadius: 999,
    backgroundColor: theme.colors.border
  },
  dateCard: {
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "flex-start",
    gap: theme.spacing.md,
    borderColor: theme.colors.border,
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.sm
  },
  dateTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "900"
  },
  todayButton: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: theme.colors.primarySoft,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 7,
    maxWidth: "100%"
  },
  todayButtonText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: "900"
  },
  reminderCard: {
    borderColor: theme.colors.border,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    gap: theme.spacing.sm
  },
  reminderHeader: {
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "flex-start",
    gap: theme.spacing.md
  },
  headerTextBlock: {
    flexShrink: 1,
    maxWidth: "100%"
  },
  reminderTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "900"
  },
  notificationToggle: {
    width: "100%",
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 999,
    backgroundColor: theme.colors.surfaceSoft,
    borderColor: theme.colors.border,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md
  },
  notificationToggleActive: {
    backgroundColor: theme.colors.dark,
    borderColor: theme.colors.dark
  },
  notificationKnob: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: "#CBD5E1"
  },
  notificationKnobActive: {
    backgroundColor: theme.colors.accent
  },
  notificationToggleText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "900"
  },
  notificationToggleTextActive: {
    color: "#FFFFFF"
  },
  notificationStatus: {
    alignSelf: "flex-start",
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: theme.colors.primarySoft,
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: "900",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 5
  },
  reminderMessage: {
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.warningSoft,
    padding: theme.spacing.sm
  },
  reminderMessageText: {
    color: "#8A5200",
    fontSize: 12,
    fontWeight: "900",
    lineHeight: 18
  },
  summaryRow: {
    flexDirection: "column",
    gap: theme.spacing.md
  },
  energyCard: {
    borderRadius: 24,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
    gap: theme.spacing.sm
  },
  energyCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.sm
  },
  cardLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900"
  },
  scoreBadge: {
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.22)",
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 5
  },
  energyScore: {
    color: "#FFFFFF",
    fontSize: 62,
    fontWeight: "900",
    lineHeight: 70
  },
  energyTrack: {
    height: 12,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.28)",
    overflow: "hidden"
  },
  energyFill: {
    height: 12,
    borderRadius: 999,
    backgroundColor: "#FFFFFF"
  },
  energyCaption: {
    color: "#EAF1FF",
    fontSize: 14,
    lineHeight: 21
  },
  statPanel: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 24,
    borderWidth: 1,
    padding: theme.spacing.md,
    gap: theme.spacing.sm
  },
  miniStat: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surfaceSoft,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm
  },
  miniDot: {
    width: 10,
    height: 10,
    borderRadius: 999
  },
  miniLabel: {
    flex: 1,
    color: theme.colors.mutedText,
    fontSize: 14,
    fontWeight: "800"
  },
  miniValue: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: "900"
  },
  section: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 24,
    borderWidth: 1,
    padding: theme.spacing.lg,
    gap: theme.spacing.md
  },
  sectionHeading: {
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    gap: theme.spacing.md
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: 0
  },
  sectionHint: {
    color: theme.colors.mutedText,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 4
  },
  statusPill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm
  },
  statusPillText: {
    fontSize: 14,
    fontWeight: "900"
  },
  controlBlock: {
    gap: theme.spacing.sm
  },
  controlHeader: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  controlLabel: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "900"
  },
  controlValue: {
    color: theme.colors.primary,
    fontSize: 15,
    fontWeight: "900"
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm
  },
  stepperButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primarySoft
  },
  stepperText: {
    color: theme.colors.primary,
    fontSize: 25,
    fontWeight: "900"
  },
  fatigueTrack: {
    flex: 1,
    height: 14,
    borderRadius: 999,
    backgroundColor: theme.colors.border,
    overflow: "hidden"
  },
  fatigueFill: {
    height: 14,
    borderRadius: 999,
    backgroundColor: theme.colors.warning
  },
  inputGrid: {
    flexDirection: "column",
    gap: theme.spacing.md
  },
  inputGroup: {
    gap: theme.spacing.xs
  },
  inputLabel: {
    color: theme.colors.mutedText,
    fontSize: 13,
    fontWeight: "900"
  },
  input: {
    minHeight: 52,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    color: theme.colors.text,
    fontSize: 16,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surfaceSoft
  },
  inputWithUnit: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    backgroundColor: theme.colors.surfaceSoft,
    paddingHorizontal: theme.spacing.md
  },
  inputBare: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "900",
    paddingVertical: 0
  },
  inputUnit: {
    color: theme.colors.mutedText,
    fontSize: 14,
    fontWeight: "800"
  },
  inputHelp: {
    color: theme.colors.mutedText,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18
  },
  usageBox: {
    minHeight: 52,
    justifyContent: "center",
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    backgroundColor: theme.colors.surfaceSoft,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.xs
  },
  usageTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: theme.colors.border,
    overflow: "hidden"
  },
  usageFill: {
    height: 8,
    borderRadius: 999
  },
  usageText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: "900"
  },
  optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm
  },
  optionChip: {
    flexGrow: 1,
    flexBasis: 112,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surfaceSoft
  },
  optionChipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary
  },
  optionText: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 4
  },
  optionHint: {
    color: theme.colors.mutedText,
    fontSize: 12,
    fontWeight: "800"
  },
  optionTextActive: {
    color: "#FFFFFF"
  },
  energyCostRow: {
    flexDirection: "row",
    gap: theme.spacing.xs
  },
  durationRow: {
    flexDirection: "row",
    gap: theme.spacing.xs
  },
  durationInput: {
    flex: 1
  },
  labelActionRow: {
    minHeight: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.sm
  },
  aiSuggestButton: {
    minHeight: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: theme.colors.dark,
    paddingHorizontal: theme.spacing.sm
  },
  aiSuggestText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900"
  },
  costChip: {
    flex: 1,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    backgroundColor: theme.colors.surfaceSoft
  },
  costChipActive: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accent
  },
  costText: {
    color: theme.colors.text,
    fontWeight: "900"
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm
  },
  categoryChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderColor: theme.colors.border,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: theme.colors.surfaceSoft
  },
  categoryText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: "900"
  },
  addCategoryRow: {
    flexDirection: "row",
    gap: theme.spacing.sm
  },
  addCategoryInput: {
    flex: 1
  },
  smallButton: {
    minWidth: 64,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.accent
  },
  smallButtonText: {
    color: "#FFFFFF",
    fontWeight: "900"
  },
  primaryButton: {
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.dark
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900"
  },
  cancelButton: {
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceSoft
  },
  cancelButtonText: {
    color: theme.colors.mutedText,
    fontWeight: "900"
  },
  resetButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 999,
    backgroundColor: theme.colors.primarySoft
  },
  resetButtonText: {
    color: theme.colors.primary,
    fontWeight: "900"
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.md,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surfaceSoft
  },
  taskItemMuted: {
    backgroundColor: "#FBFCFF"
  },
  taskItemDone: {
    opacity: 0.55
  },
  checkCircle: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderColor: theme.colors.primary,
    borderRadius: 999,
    borderWidth: 2,
    backgroundColor: "#FFFFFF"
  },
  checkCircleDone: {
    backgroundColor: theme.colors.primary
  },
  checkText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900"
  },
  taskContent: {
    flex: 1,
    gap: 7
  },
  taskTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.sm
  },
  taskTitle: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 22
  },
  taskTitleDone: {
    textDecorationLine: "line-through"
  },
  categoryBadge: {
    borderRadius: 999,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4
  },
  categoryBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900"
  },
  taskMeta: {
    color: theme.colors.mutedText,
    fontSize: 13,
    fontWeight: "800"
  },
  taskActions: {
    flexDirection: "row",
    gap: theme.spacing.sm
  },
  taskActionButton: {
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 7
  },
  taskActionText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: "900"
  },
  taskActionDanger: {
    color: theme.colors.danger,
    fontSize: 12,
    fontWeight: "900"
  },
  emptyBox: {
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surfaceSoft
  },
  emptyTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "900",
    marginBottom: theme.spacing.xs
  },
  emptyText: {
    color: theme.colors.mutedText,
    fontSize: 14,
    lineHeight: 21
  },
  emptyLine: {
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.accentSoft,
    padding: theme.spacing.md
  },
  emptyLineText: {
    color: "#08766C",
    fontSize: 14,
    fontWeight: "900"
  },
  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md
  },
  monthButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: theme.colors.primarySoft
  },
  monthButtonText: {
    color: theme.colors.primary,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "900"
  },
  weekdayRow: {
    flexDirection: "row"
  },
  weekdayText: {
    flex: 1,
    color: theme.colors.mutedText,
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center"
  },
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    borderLeftColor: theme.colors.border,
    borderLeftWidth: 1,
    borderRadius: theme.radius.md,
    overflow: "hidden"
  },
  monthCellBlank: {
    width: `${100 / 7}%`,
    minHeight: 68,
    backgroundColor: "#F8FAFC",
    borderRightColor: theme.colors.border,
    borderRightWidth: 1,
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1
  },
  monthCell: {
    width: `${100 / 7}%`,
    minHeight: 68,
    padding: 4,
    backgroundColor: "#FFFFFF",
    borderRightColor: theme.colors.border,
    borderRightWidth: 1,
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1
  },
  monthCellSelected: {
    backgroundColor: theme.colors.primarySoft
  },
  monthCellHeavy: {
    backgroundColor: "#FFF7ED"
  },
  monthDay: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: "900"
  },
  monthDaySelected: {
    color: theme.colors.primary
  },
  todayDot: {
    color: theme.colors.accent,
    fontSize: 9,
    fontWeight: "900"
  },
  monthTaskCount: {
    color: theme.colors.mutedText,
    fontSize: 10,
    fontWeight: "800",
    marginTop: 2
  },
  assignmentBadge: {
    overflow: "hidden",
    borderRadius: 8,
    backgroundColor: theme.colors.warningSoft,
    color: "#9A5B00",
    fontSize: 8,
    fontWeight: "900",
    marginTop: 2,
    paddingHorizontal: 2,
    paddingVertical: 1,
    textAlign: "center"
  },
  assignmentNotice: {
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.warningSoft,
    padding: theme.spacing.md
  },
  assignmentNoticeText: {
    color: "#8A5200",
    fontSize: 14,
    fontWeight: "900"
  },
  bottomNav: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    borderColor: theme.colors.border,
    borderRadius: 24,
    borderWidth: 1,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    shadowColor: "#172033",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 }
  },
  bottomNavItem: {
    flex: 1,
    alignItems: "center",
    gap: 4
  },
  bottomNavItemActive: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    borderRadius: 18,
    backgroundColor: theme.colors.primarySoft,
    paddingVertical: theme.spacing.sm
  },
  bottomNavIcon: {
    color: theme.colors.primary,
    fontSize: 10
  },
  bottomNavIconMuted: {
    color: "#CBD5E1",
    fontSize: 10
  },
  bottomNavText: {
    color: theme.colors.mutedText,
    fontSize: 12,
    fontWeight: "900"
  },
  bottomNavTextActive: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: "900"
  }
});
