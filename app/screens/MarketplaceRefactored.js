import React, { useState, useEffect, useMemo } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from "react-native";
import Toast from "react-native-toast-message";
import { ArrowLeft, SlidersHorizontal } from "phosphor-react-native";

// Theme and Context
import { useTheme } from "../context/ThemeContext";

// Custom Hooks
import {
  useLocation,
  useMarketplaceJobs,
  useDistanceSlider,
  useUserServices,
} from "../hooks/marketplace";

// Components
import {
  LoadingScreen,
  UserServicesSection,
  DistanceSlider,
  JobsMap,
} from "../components/marketplace";

// Utils
import apiService from "../lib/apiService";
import { MARKETPLACE_CONSTANTS } from "../utils/marketplaceUtils";

const MarketplaceScreen = ({ navigation }) => {

  // Theme
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const styles = getStyles(currentTheme);

  // Custom Hooks
  const { location, getLocation } = useLocation();
  const {
    jobs,
    loading,
    filterLoading,
    fetchJobs,
    getAllJobs,
  } = useMarketplaceJobs();

  const {
    userServices,
    currentUserRole,
    hasServices,
    isFreelancer,
    refreshUserData,
  } = useUserServices();

  // Distance slider with callback to fetch jobs
  const handleDistanceChange = (newDistance) => {
    fetchJobs(
      location ? true : false,
      location,
      newDistance,
      currentUserRole,
      userServices,
      false
    );
  };

  const {
    distance,
    isSliding,
    sliderRef,
    panResponder,
    incrementDistance,
    decrementDistance,
    onSliderLayout,
    handleSliderPress,
  } = useDistanceSlider(handleDistanceChange);

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await apiService.init();
        fetchJobs(
          false,
          null,
          MARKETPLACE_CONSTANTS.DEFAULT_DISTANCE,
          "FREELANCER",
          [],
          true
        );
      } catch (error) {
        console.error("Error initializing app:", error);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to initialize app",
          position: "top",
        });
      }
    };

    initializeApp();
  }, []);

  // Fetch jobs when location or user data changes
  useEffect(() => {
    if (location && !isSliding) {
      fetchJobs(true, location, distance, currentUserRole, userServices, false);
    }
  }, [location, currentUserRole, userServices]);

  // Get all jobs as flat list
  const allJobs = useMemo(() => {
    return getAllJobs();
  }, [getAllJobs]);

  const handleAddServicesPress = () => {
    navigation.navigate("Settings");
  };

  const handleViewJobs = () => {
    navigation.navigate("MarketplaceJobs", {
      location,
      distance,
      currentUserRole,
      userServices,
      refreshUserData,
    });
  };

  // Show loading screen
  if (loading) {
    return <LoadingScreen theme={currentTheme} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={currentTheme.text || "#000"} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Marketplace</Text>

        <View style={{ width: 44 }} />
      </View>

      {/* Top section: Services + Distance + Map */}
      <View style={styles.topSection}>
        <UserServicesSection
          isFreelancer={isFreelancer}
          userServices={userServices}
          hasServices={hasServices}
          onAddServicesPress={handleAddServicesPress}
          theme={currentTheme}
        />

        <DistanceSlider
          distance={distance}
          sliderRef={sliderRef}
          panResponder={panResponder}
          onSliderLayout={onSliderLayout}
          onIncrementDistance={incrementDistance}
          onDecrementDistance={decrementDistance}
          isLoading={filterLoading}
          theme={currentTheme}
        />

        <JobsMap
          location={location}
          distance={distance}
          jobs={jobs}
        />

        {/* View Jobs Button */}
        <View style={styles.viewJobsContainer}>
          <TouchableOpacity
            style={styles.viewJobsButton}
            onPress={handleViewJobs}
            activeOpacity={0.8}
          >
            <SlidersHorizontal size={20} color="#FFF" />
            <Text style={styles.viewJobsButtonText}>
              View Jobs ({allJobs.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Toast />
    </SafeAreaView>
  );
};

const getStyles = (currentTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background || "#fff",
    },
    headerContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 15,
      marginTop: Platform.OS === "android" ? 20 : 0,
    },
    headerButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor:
        currentTheme.theme === "dark" ? "#1f2937" : "#F3E8FF",
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: "bold",
      color: currentTheme.text,
    },
    topSection: {
      paddingHorizontal: 20,
    },
    viewJobsContainer: {
      marginTop: 16,
      paddingHorizontal: 20,
    },
    viewJobsButton: {
      backgroundColor: "#762BAD",
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 16,
      paddingHorizontal: 32,
      borderRadius: 14,
      width: "100%",
      justifyContent: "center",
      shadowColor: "#762BAD",
      shadowOpacity: 0.3,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 5,
    },
    viewJobsButtonText: {
      color: "#FFF",
      fontSize: 16,
      fontWeight: "bold",
    },
  });

export default MarketplaceScreen;
