import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/NewAuthContext";
import apiService from "../lib/apiService";
import Toast from "react-native-toast-message";

const AvailabilityScreen = ({ navigation }) => {
  const { userData, refreshUserData } = useAuth();
  const availability =
    userData?.role === "FREELANCER"
      ? userData?.freelancer?.currentlyAvailable
      : userData?.client?.currentlyAvailable;
  
  const [selectedStatus, setSelectedStatus] = useState(availability);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setSelectedStatus(availability);
  }, [availability]);

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const styles = getStyles(currentTheme);

  const handleStatusChange = async (status) => {
    const previousStatus = selectedStatus;
    setSelectedStatus(status);
    try {
      await apiService.updateUserAvailability(
        userData.id,
        userData.role,
        status
      );

      if (refreshUserData) {
        await refreshUserData();
      }
    } catch {
      Toast.show({
        type: "error",
        text1: "Error updating availability",
        text2: "Please try again later",
      });
      setSelectedStatus(previousStatus);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshUserData();
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Failed to refresh",
        text2: "Please try again later",
      });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.handle} />
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
        >
          <Ionicons name="close" size={24} color={currentTheme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Availability</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#762BAD" />
        }
      >
        <View style={styles.illustrationContainer}>
          <View style={styles.illustrationCircle}>
            <MaterialCommunityIcons name="calendar-check" size={50} color="#762BAD" />
            <View style={styles.checkBadge}>
              <Ionicons name="checkmark" size={12} color="#FFF" />
            </View>
            <View style={styles.clockBadge}>
              <Ionicons name="time" size={14} color="#762BAD" />
            </View>
          </View>
        </View>

        <Text style={styles.description}>
          Choose when you're available to take new jobs.
        </Text>

        <TouchableOpacity
          style={[styles.optionCard, selectedStatus === true && styles.selectedCard]}
          onPress={() => handleStatusChange(true)}
          activeOpacity={0.7}
        >
          <View style={[styles.radio, selectedStatus === true && styles.radioActive]}>
            {selectedStatus === true && <View style={styles.radioInner} />}
          </View>
          <View style={styles.optionContent}>
            <View style={styles.optionHeader}>
              <Text style={[styles.optionTitle, { color: selectedStatus === true ? '#000' : '#FFF' }]}>Online</Text>
              <View style={styles.badge}>
                <View style={styles.badgeDot} />
                <Text style={styles.badgeText}>Available Now</Text>
              </View>
            </View>
            <Text style={styles.optionDesc}>
              You're available to receive and work on new jobs.
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionCard, selectedStatus === false && styles.selectedCard]}
          onPress={() => handleStatusChange(false)}
          activeOpacity={0.7}
        >
          <View style={[styles.radio, selectedStatus === false && styles.radioActive]}>
            {selectedStatus === false && <View style={styles.radioInner} />}
          </View>
          <View style={styles.optionContent}>
            <View style={styles.optionHeader}>
              <Text style={[styles.optionTitle, { color: selectedStatus === false ? '#000' : '#FFF' }]}>Offline</Text>
              <View style={[styles.badge, styles.offlineBadge]}>
                <Text style={styles.badgeText}>Not Available</Text>
              </View>
            </View>
            <Text style={styles.optionDesc}>
              You won't receive new job requests.
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <Ionicons name="bulb-outline" size={24} color="#762BAD" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Why set availability?</Text>
            <Text style={styles.infoText}>
              This helps clients know when you're available and increases your chances of getting hired.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (currentTheme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: currentTheme.background || "#FFF",
    },
    header: {
      paddingTop: 10,
      paddingHorizontal: 20,
      paddingBottom: 20,
      alignItems: "center",
    },
    handle: {
      width: 40,
      height: 4,
      backgroundColor: "#E0E0E0",
      borderRadius: 2,
      marginBottom: 10,
    },
    closeButton: {
      position: "absolute",
      right: 20,
      top: 20,
      zIndex: 1,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: currentTheme.text,
      marginTop: 10,
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
      position: "relative",
    },
    checkBadge: {
      position: "absolute",
      top: 10,
      right: 10,
      backgroundColor: "#762BAD",
      width: 20,
      height: 20,
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: "#FFF",
    },
    clockBadge: {
      position: "absolute",
      bottom: 15,
      right: 15,
      backgroundColor: "#FFF",
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: "#762BAD",
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    description: {
      textAlign: "center",
      fontSize: 14,
      color: "#666",
      marginBottom: 30,
      paddingHorizontal: 40,
      lineHeight: 20,
    },
    optionCard: {
      flexDirection: "row",
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#E0E0E0",
      marginBottom: 16,
      backgroundColor: currentTheme.cardBackground || "#FFF",
    },
    selectedCard: {
      borderColor: "#762BAD",
      backgroundColor: "#FAF5FF",
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
      color: currentTheme.text,
    },
    badge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#E8F5E9",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    badgeDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: "#4CAF50",
      marginRight: 4,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: "600",
      color: "#2E7D32",
    },
    offlineBadge: {
      backgroundColor: "#F5F5F5",
    },
    optionDesc: {
      fontSize: 13,
      color: "#666",
      lineHeight: 18,
    },
    infoBox: {
      flexDirection: "row",
      backgroundColor: "#FAF5FF",
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
      color: "#4A148C",
      marginBottom: 4,
    },
    infoText: {
      fontSize: 12,
      color: "#6A1B9A",
      lineHeight: 16,
    },
  });

export default AvailabilityScreen;
