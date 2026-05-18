import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

const NotificationsSettingScreen = ({ navigation }) => {
  const [selectedStatus, setSelectedStatus] = useState("Enable");

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const styles = getStyles(currentTheme);

  const handleStatusChange = (status) => {
    setSelectedStatus(status);
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
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.illustrationContainer}>
          <View style={styles.illustrationCircle}>
            <MaterialCommunityIcons name="bell-ring-outline" size={50} color="#762BAD" />
          </View>
        </View>

        <Text style={styles.description}>
          Stay updated with the right notifications about your jobs.
        </Text>

        <TouchableOpacity
          style={[
            styles.optionCard, 
            selectedStatus === "Enable" && (currentTheme.isDark ? styles.selectedCardDarkTheme : styles.selectedCard)
          ]}
          onPress={() => handleStatusChange("Enable")}
          activeOpacity={0.7}
        >
          <View style={[
            styles.radio, 
            selectedStatus === "Enable" && styles.radioActive,
            selectedStatus === "Enable" && currentTheme.isDark && styles.radioActiveDark
          ]}>
            {selectedStatus === "Enable" && <View style={styles.radioInner} />}
          </View>
          <View style={styles.optionContent}>
            <View style={styles.optionHeader}>
              <Text style={styles.optionTitle}>Enable Notifications</Text>
              <View style={styles.badge}>
                <Ionicons 
                  name="thumbs-up-outline" 
                  size={10} 
                  color={currentTheme.isDark ? "#81C784" : "#2E7D32"} 
                  style={{ marginRight: 2 }} 
                />
                <Text style={styles.badgeText}>Recommended</Text>
              </View>
            </View>
            <Text style={styles.optionDesc}>
              Get instant updates for new jobs, messages, offers and more.
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.optionCard, 
            selectedStatus === "Disable" && (currentTheme.isDark ? styles.selectedCardDarkTheme : styles.selectedCard)
          ]}
          onPress={() => handleStatusChange("Disable")}
          activeOpacity={0.7}
        >
          <View style={[
            styles.radio, 
            selectedStatus === "Disable" && styles.radioActive,
            selectedStatus === "Disable" && currentTheme.isDark && styles.radioActiveDark
          ]}>
            {selectedStatus === "Disable" && <View style={styles.radioInner} />}
          </View>
          <View style={styles.optionContent}>
            <View style={styles.optionHeader}>
              <Text style={styles.optionTitle}>Disable Notifications</Text>
            </View>
            <Text style={styles.optionDesc}>
              You won't receive any push notifications.
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <Ionicons name="notifications-outline" size={24} color={currentTheme.isDark ? "#D1C4E9" : "#762BAD"} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Don't miss important updates!</Text>
            <Text style={styles.infoText}>
              Enable notifications to get timely alerts for new jobs and messages.
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
    backgroundColor: currentTheme.isDark ? "#2D2D2D" : "#F3E5F5",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  downloadBadge: {
    // ...existing code...
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
    color: '#000',
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: currentTheme.isDark ? "#1B5E20" : "#E8F5E9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: currentTheme.isDark ? "#81C784" : "#2E7D32",
  },
  optionDesc: {
    fontSize: 13,
    color: currentTheme.isDark ? "#AAA" : "#666",
    lineHeight: 18,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: currentTheme.isDark ? "#1E1E1E" : "#FAF5FF",
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    alignItems: "flex-start",
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: currentTheme.isDark ? "#D1C4E9" : "#4A148C",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: currentTheme.isDark ? "#B39DDB" : "#6A1B9A",
    lineHeight: 16,
  },
});

export default NotificationsSettingScreen;
