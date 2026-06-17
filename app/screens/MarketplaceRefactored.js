import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  RefreshControl,
  TouchableOpacity
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { ArrowLeft, CaretRight } from "phosphor-react-native";

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
    refreshUserData
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

  const {
    priorityIndex,
    rotation,
    wheelPanResponder,
    handlePriorityWheel,
    getCurrentPriority,
    resetToAllJobs,
    cleanupSound
  } = usePriorityWheel((priority) => {
    // Handle priority wheel rotation navigation
    handleWheelPriorityPress(priority);
  });

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

  // Reset wheel to "All Jobs" whenever screen is focused
  useFocusEffect(
    useCallback(() => {
      // Always reset to "All Jobs" when user comes back to Marketplace
      resetToAllJobs();
    }, [resetToAllJobs])
  );

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

  const handleWheelPriorityPress = (priority) => {
    if (priority === "All") {
      // Navigate to all jobs
      const allJobs = getAllJobs();
      navigation.navigate("JobPriority", {
        priority: "All",
        jobs: { All: allJobs, Immediate: [], High: [], Standard: [] }
      });
    } else {
      // Navigate to specific priority
      handlePriorityPress(priority);
    }
  };

  const handleAllJobsPress = () => {
    // Handle wheel button press based on current priority filter
    const currentPriority = getCurrentPriority();
    handleWheelPriorityPress(currentPriority);
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
      refreshUserData
    );
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

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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

        {/* All Jobs Button - Enhanced Priority Wheel */}
        <View style={styles.allJobsWrapper}>
          <AllJobsButton
            onPress={handleAllJobsPress}
            currentPriority={getCurrentPriority()}
            rotation={rotation}
            panHandlers={wheelPanResponder.panHandlers}
            jobs={jobs}
          />
        </View>



      </ScrollView>
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
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 15,
      marginTop: Platform.OS === 'android' ? 20 : 0,
    },
    headerButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: currentTheme.theme === 'dark' ? '#1f2937' : '#F3E8FF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: "bold",
      color: currentTheme.text,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: Platform.OS === "ios" ? 40 : 30, 
    },
    allJobsWrapper: {
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: -20, // Pull it closer to the priority cards if needed
      marginBottom: 20,
    },

  });

export default MarketplaceScreen;