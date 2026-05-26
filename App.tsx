import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native";

import { HomeScreen } from "./src/presentation/screens/HomeScreen";
import { theme } from "./src/presentation/theme/theme";

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <HomeScreen />
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}
