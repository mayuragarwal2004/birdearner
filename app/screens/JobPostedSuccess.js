import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

const JobPostedSuccessScreen = ({ navigation }) => {
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme] || themeStyles.light;
  const styles = getStyles(currentTheme);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        // Reset current stack to top (JobRequirementsScreen)
        navigation.popToTop();

        // Switch to the "Job Posted" tab in parent bottom tab navigator
        const parent = navigation.getParent();
        if (parent) {
          parent.navigate("Job Posted");
        } else {
          navigation.navigate("MainTabs", { screen: "Job Posted" });
        }
      } catch (err) {
        console.warn("Navigation redirect error:", err);
        navigation.navigate("MainTabs", { screen: "Job Posted" });
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.container}>
        <View style={styles.outerGlow}>
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark-sharp" size={48} color="#FFFFFF" />
          </View>
        </View>

        <Text style={styles.successTitle}>Job posted successfully</Text>
      </View>
    </SafeAreaView>
  );
};

const getStyles = (currentTheme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: "#FFFFFF",
    },
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 24,
    },
    outerGlow: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: "rgba(34, 197, 94, 0.12)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20,
    },
    iconCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: "#22C55E",
      alignItems: "center",
      justifyContent: "center",
      elevation: 4,
      shadowColor: "#22C55E",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
    },
    successTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: "#1F192F",
      textAlign: "center",
    },
  });

export default JobPostedSuccessScreen;
