import { StyleSheet, Text, View } from "react-native";

import { getHomeViewModel } from "../../application/view_models/homeViewModel";
import { theme } from "../theme/theme";

export function HomeScreen() {
  const { plan, totalCost, statusLabel } = getHomeViewModel();

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>Hello World</Text>
      <Text style={styles.title}>Energy Budget</Text>
      <Text style={styles.description}>
        오늘의 에너지를 기준으로 무리하지 않는 계획을 추천하는 모바일 앱입니다.
      </Text>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>오늘의 에너지 예산</Text>
        <Text style={styles.energyScore}>{plan.energyBudget}</Text>
        <Text style={styles.meta}>예상 사용량 {totalCost} · 상태 {statusLabel}</Text>
      </View>

      <View style={styles.taskList}>
        {plan.tasks.map((task) => (
          <View key={task.id} style={styles.taskItem}>
            <Text style={styles.taskTitle}>{task.title}</Text>
            <Text style={styles.taskMeta}>
              {task.estimatedMinutes}분 · 에너지 {task.energyCost}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: "center"
  },
  eyebrow: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: theme.spacing.sm
  },
  title: {
    color: theme.colors.text,
    fontSize: 34,
    fontWeight: "800",
    marginBottom: theme.spacing.sm
  },
  description: {
    color: theme.colors.mutedText,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: theme.spacing.lg
  },
  panel: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md
  },
  panelTitle: {
    color: theme.colors.mutedText,
    fontSize: 14,
    fontWeight: "700"
  },
  energyScore: {
    color: theme.colors.primary,
    fontSize: 52,
    fontWeight: "800",
    marginTop: theme.spacing.xs
  },
  meta: {
    color: theme.colors.text,
    fontSize: 15
  },
  taskList: {
    gap: theme.spacing.sm
  },
  taskItem: {
    backgroundColor: theme.colors.primarySoft,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md
  },
  taskTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "700"
  },
  taskMeta: {
    color: theme.colors.mutedText,
    fontSize: 14,
    marginTop: 4
  }
});
