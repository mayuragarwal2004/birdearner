import React, { useState, useEffect, useRef } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  RefreshControl,
} from "react-native";
import Toast from "react-native-toast-message";

// Theme and Context
import { useTheme } from "../context/ThemeContext";

// Custom Hooks
import { 
  useLocation, 
  useMarketplaceJobs, 
  useDistanceSlider, 
  useUserServices, 
  usePriorityWheel 
} from "../hooks/marketplace";

// Components
import {
  LoadingScreen,
  UserServicesSection,
  DistanceSlider,
  JobsMap,
  PrioritySection,
  AllJobsButton
} from "../components/marketplace";

// Utils
import apiService from "../lib/apiService";
import { MARKETPLACE_CONSTANTS } from "../utils/marketplaceUtils";

const MarketplaceScreen = ({ navigation }) => {
  const mapRef = useRef(null);
  
  // Theme
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const styles = getStyles(currentTheme);

  // Custom Hooks
  const { location, getLocation } = useLocation();
  const { 
    jobs, 
    loading, 
    refreshing,
    filterLoading,
    fetchJobs, 
    onRefresh, 
    getAllJobs 
  } = useMarketplaceJobs();
  
  const { 
    userServices, 
    currentUserRole, 
    hasServices, 
    isFreelancer, 
    fetchUserProfile 
  } = useUserServices();

  // Distance slider with callback to fetch jobs (not initial load)
  const handleDistanceChange = (newDistance) => {
    fetchJobs(location ? true : false, location, newDistance, currentUserRole, userServices, false);
  };

  const {
    distance,
    isSliding,
    sliderRef,
    panResponder,
    incrementDistance,
    decrementDistance,
    onSliderLayout,
    handleSliderPress
  } = useDistanceSlider(handleDistanceChange);

  const { cleanupSound } = usePriorityWheel();

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Ensure API service is initialized
        await apiService.init();
        // Initial jobs fetch (this is initial load)
        fetchJobs(false, null, MARKETPLACE_CONSTANTS.DEFAULT_DISTANCE, 'FREELANCER', [], true);
      } catch (error) {
        console.error('Error initializing app:', error);
        Toast.show({
          type: "error",
          text1: "Error", 
          text2: "Failed to initialize app",
          position: "top"
        });
      }
    };

    initializeApp();
  }, []);

  // Fetch jobs when location or user data changes (but not while sliding)
  useEffect(() => {
    if (location && !isSliding) {
      fetchJobs(true, location, distance, currentUserRole, userServices, false);
    }
  }, [location, currentUserRole, userServices]);

  // Cleanup sound on unmount
  useEffect(() => {
    return cleanupSound;
  }, []);

  // Navigation handlers
  const handlePriorityPress = (priority) => {
    // Pass the jobs data with the new backend format
    const jobsData = {
      Immediate: jobs.Immediate,
      High: jobs.High,
      Standard: jobs.Standard,
    };
    navigation.navigate("JobPriority", { priority, jobs: jobsData });
  };

  const handleAllJobsPress = () => {
    // Navigate to a screen showing all jobs regardless of priority
    const allJobs = getAllJobs();
    navigation.navigate("JobPriority", { 
      priority: "All", 
      jobs: { All: allJobs, Immediate: [], High: [], Standard: [] }
    });
  };

  const handleAddServicesPress = () => {
    navigation.navigate('Profile');
  };

  // Refresh handler
  const handleRefresh = () => {
    onRefresh(
      location,
      currentUserRole,
      userServices,
      distance,
      fetchUserProfile
    );
  };

  // Show loading screen
  if (loading) {
    return <LoadingScreen theme={currentTheme} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#762BAD']} // Android
            tintColor={'#762BAD'} // iOS
            title="Pull to refresh jobs..."
            titleColor={'#762BAD'}
          />
        }
      >
        {/* Header */}
        <Text style={styles.title}>Marketplace</Text>

        {/* User Services Section */}
        <UserServicesSection
          isFreelancer={isFreelancer}
          userServices={userServices}
          hasServices={hasServices}
          onAddServicesPress={handleAddServicesPress}
          theme={currentTheme}
        />

        {/* Distance Slider */}
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

        {/* Jobs Map */}
        <JobsMap
          location={location}
          distance={distance}
          jobs={jobs}
          mapRef={mapRef}
        />

        {/* Priority Sections */}
        <PrioritySection
          jobs={jobs}
          onPriorityPress={handlePriorityPress}
          theme={currentTheme}
        />
      </ScrollView>

      {/* All Jobs Button */}
      <AllJobsButton onPress={handleAllJobsPress} />

      <Toast />
    </SafeAreaView>
  );
};

const getStyles = (currentTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background || "#fff",
      paddingTop: 30,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: Platform.OS === "ios" ? 90 : 75, // Add bottom padding to prevent tab bar overlap
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 20,
      color: currentTheme.text,
    },
  });

export default MarketplaceScreen;