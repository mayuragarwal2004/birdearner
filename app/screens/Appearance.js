import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

const AppearanceScreen = ({ navigation }) => {
  const { theme, toggleTheme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const styles = getStyles(currentTheme);

  const handleThemeChange = (newTheme) => {
    toggleTheme(newTheme);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
        >
          <Ionicons name="close" size={24} color={currentTheme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appearance</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.illustrationContainer}>
          <View style={[styles.illustrationCircle, theme === 'dark' && styles.illustrationCircleDark]}>
            <MaterialCommunityIcons 
              name={theme === 'dark' ? "moon-waning-crescent" : "white-balance-sunny"} 
              size={50} 
              color={theme === 'dark' ? "#FFF" : "#762BAD"} 
            />
          </View>
        </View>

        <Text style={styles.description}>
          Choose the theme that is easy on your eyes.
        </Text>

        <TouchableOpacity
          style={[
            styles.optionCard, 
            theme === "light" && (currentTheme.isDark ? { backgroundColor: "#1e1e1e", borderColor: "#762BAD" } : styles.selectedCard)
          ]}
          onPress={() => handleThemeChange("light")}
          activeOpacity={0.7}
        >
          <View style={[styles.radio, theme === "light" && styles.radioActive]}>
            {theme === "light" && <View style={styles.radioInner} />}
          </View>
          <View style={styles.optionContent}>
            <View style={styles.optionHeader}>
              <Text style={styles.optionTitle}>Light Theme</Text>
              <View style={styles.iconBadge}>
                <Ionicons name="sunny-outline" size={18} color="#762BAD" />
              </View>
            </View>
            <Text style={styles.optionDesc}>
              Enjoy a bright and clean viewing experience for daylight.
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.optionCard, 
            theme === "dark" && (currentTheme.isDark ? styles.selectedCardDarkTheme : styles.selectedCard)
          ]}
          onPress={() => handleThemeChange("dark")}
          activeOpacity={0.7}
        >
          <View style={[
            styles.radio, 
            theme === "dark" && styles.radioActive,
            theme === "dark" && currentTheme.isDark && styles.radioActiveDark
          ]}>
            {theme === "dark" && <View style={styles.radioInner} />}
          </View>
          <View style={styles.optionContent}>
            <View style={styles.optionHeader}>
              <Text style={styles.optionTitle}>Dark Theme</Text>
              <View style={[styles.iconBadge, styles.darkBadge, theme === "dark" && styles.iconBadgeActiveDark]}>
                <Ionicons name="moon" size={18} color={theme === "dark" ? "#E1BEE7" : "#FFF"} />
              </View>
            </View>
            <Text style={styles.optionDesc}>
              Reduce eye strain in low light with a modern dark interface.
            </Text>
          </View>
        </TouchableOpacity>

        <View style={[styles.infoBox, currentTheme.isDark && styles.infoBoxDark]}>
          <MaterialCommunityIcons name="palette-outline" size={24} color={currentTheme.isDark ? "#D1C4E9" : "#762BAD"} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, currentTheme.isDark && styles.infoTitleDark]}>Auto-switching soon!</Text>
            <Text style={[styles.infoText, currentTheme.isDark && styles.infoTextDark]}>
              The app automatically updates its interface based on your selection.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (currentTheme) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: currentTheme.background || "#FFF",
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: "center",
    justifyContent: "center",
    height: 60,
  },
  closeButton: {
    position: "absolute",
    right: 20,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: currentTheme.text,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  illustrationContainer: {
    alignItems: "center",
    marginVertical: 30,
  },
  illustrationCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F3E5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  illustrationCircleDark: {
    backgroundColor: "#2D2D2D",
  },
  description: {
    textAlign: "center",
    fontSize: 14,
    color: currentTheme.isDark ? "#AAA" : "#666",
    marginBottom: 30,
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  optionCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: currentTheme.isDark ? "#333" : "#E0E0E0",
    marginBottom: 16,
    backgroundColor: currentTheme.isDark ? "#121212" : "#FFF",
  },
  selectedCard: {
    borderColor: "#762BAD",
    backgroundColor: "#FAF5FF",
  },
  selectedCardDarkTheme: {
    borderColor: "#9C4DCC",
    backgroundColor: "#2D1B3D",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#762BAD",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  radioActive: {
    backgroundColor: "#762BAD",
  },
  radioActiveDark: {
    backgroundColor: "#9C4DCC",
    borderColor: "#9C4DCC",
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFF",
  },
  optionContent: {
    flex: 1,
  },
  optionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: currentTheme.isDark ? "#FFFFFF" : "#000000",
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: currentTheme.isDark ? "#2D2D2D" : "#F3E5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  iconBadgeActiveDark: {
    backgroundColor: "#3D2450",
    borderWidth: 1,
    borderColor: "#9C4DCC",
  },
  darkBadge: {
    backgroundColor: "#1A1A1A",
  },
  optionDesc: {
    fontSize: 13,
    color: currentTheme.isDark ? "#AAAAAA" : "#666666",
    lineHeight: 18,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#FAF5FF",
    padding: 16,
    borderRadius: 16,
    marginTop: 20,
    alignItems: "flex-start",
  },
  infoBoxDark: {
    backgroundColor: "#1E1E1E",
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4A148C",
    marginBottom: 4,
  },
  infoTitleDark: {
    color: "#D1C4E9",
  },
  infoText: {
    fontSize: 12,
    color: "#6A1B9A",
    lineHeight: 16,
  },
  infoTextDark: {
    color: "#B39DDB",
  },
});

export default AppearanceScreen;
