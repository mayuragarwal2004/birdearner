import React, { useState, useEffect, useMemo } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Platform,
  RefreshControl,
  TouchableOpacity,
  FlatList,
  Image,
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
  AdvancedFilter,
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
    refreshing,
    filterLoading,
    fetchJobs,
    onRefresh,
    getAllJobs,
  } = useMarketplaceJobs();

  const {
    userServices,
    currentUserRole,
    hasServices,
    isFreelancer,
    refreshUserData,
  } = useUserServices();

  // Filter state
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);
  const [sortBy, setSortBy] = useState("none");

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

  // Extract unique services from all jobs for filter options
  const availableServices = useMemo(() => {
    const serviceMap = new Map();
    allJobs.forEach((job) => {
      const services = job.services || job.serviceNames || [];
      if (Array.isArray(services)) {
        services.forEach((s) => {
          const id = typeof s === "string" ? s : s.id || s.name;
          const name = typeof s === "string" ? s : s.name || s.id;
          if (!serviceMap.has(id)) {
            serviceMap.set(id, { id, name });
          }
        });
      }
      // Also check single service field
      if (job.serviceName && !serviceMap.has(job.serviceName)) {
        serviceMap.set(job.serviceName, {
          id: job.serviceName,
          name: job.serviceName,
        });
      }
    });
    return Array.from(serviceMap.values());
  }, [allJobs]);

  // Filter and sort jobs
  const filteredJobs = useMemo(() => {
    let result = [...allJobs];

    // Apply service filter
    if (selectedServices.length > 0) {
      result = result.filter((job) => {
        const services = job.services || job.serviceNames || [];
        const serviceName = job.serviceName || "";
        const jobServiceIds = Array.isArray(services)
          ? services.map((s) => (typeof s === "string" ? s : s.id || s.name))
          : [];
        if (serviceName) jobServiceIds.push(serviceName);
        return selectedServices.some((id) => jobServiceIds.includes(id));
      });
    }

    // Apply sort
    if (sortBy === "lowToHigh") {
      result.sort(
        (a, b) =>
          (a.budgetAmount || a.budget || 0) -
          (b.budgetAmount || b.budget || 0)
      );
    } else if (sortBy === "highToLow") {
      result.sort(
        (a, b) =>
          (b.budgetAmount || b.budget || 0) -
          (a.budgetAmount || a.budget || 0)
      );
    }

    return result;
  }, [allJobs, selectedServices, sortBy]);

  // Filter handlers
  const handleToggleService = (serviceId) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSelectAllServices = () => {
    setSelectedServices(availableServices.map((s) => s.id));
  };

  const handleClearAllServices = () => {
    setSelectedServices([]);
  };

  const handleAddServicesPress = () => {
    navigation.navigate("Profile");
  };

  // Refresh handler
  const handleRefresh = () => {
    onRefresh(location, currentUserRole, userServices, distance, refreshUserData);
  };

  // Format budget
  const formatBudget = (budget) => {
    if (!budget) return "0";
    return budget >= 1000
      ? `${(budget / 1000).toFixed(budget % 1000 === 0 ? 0 : 1)}k`
      : `${budget}`;
  };

  // Format deadline
  const formatDeadline = (deadline) => {
    if (!deadline) return "No deadline";
    try {
      const currentDate = new Date();
      let deadlineDate =
        deadline instanceof Date ? deadline : new Date(deadline);
      if (isNaN(deadlineDate.getTime())) return "Invalid date";
      const timeDiff = Math.ceil(
        (deadlineDate - currentDate) / (1000 * 60 * 60 * 24)
      );
      return timeDiff > 0 ? `${timeDiff} days` : "Deadline passed";
    } catch {
      return "Date error";
    }
  };

  // Render job item
  const renderJobItem = ({ item: job }) => {
    const clientUserId =
      job.clientUserId || job.client?.userId || job.client?.user?.id;
    const client = job.client?.user
      ? job.client
      : {
          ...job.client,
          id: job.clientId || job.client?.id,
          userId: clientUserId,
          companyName: job.companyName || job.client?.companyName,
          profilePhoto: job.clientPhoto || job.client?.profilePhoto,
          user: {
            id: clientUserId,
            fullName:
              job.clientName ||
              job.client?.user?.fullName ||
              job.companyName ||
              "Unknown User",
          },
        };

    const clientProfileImage =
      client.profilePhoto ||
      "https://via.placeholder.com/95x95/CCCCCC/666666?text=User";
    const full_name =
      client.user?.fullName || client.companyName || "Unknown User";
    const jobTitle = job.jobTitle || job.title || job.name || "Untitled Job";
    const jobBudget = job.budgetAmount || job.budget || job.price || 0;
    const jobDeadline = job.deadlineDate || job.deadline || job.due_date;
    const jobDescription =
      job.jobDescription ||
      job.description ||
      job.details ||
      "No description available";
    const jobId = job.id || job.job_id || job._id;

    return (
      <TouchableOpacity
        style={styles.jobCard}
        onPress={() =>
          navigation.navigate("JobDescription", {
            job: {
              ...job,
              id: jobId,
              title: jobTitle,
              budget: jobBudget,
              deadline: jobDeadline,
              description: jobDescription,
              clientId: client.companyName,
              client: client,
            },
            clientProfileImage,
            full_name,
          })
        }
        activeOpacity={0.8}
      >
        <Image
          source={
            clientProfileImage
              ? { uri: clientProfileImage }
              : require("../assets/profile.png")
          }
          style={styles.profileImage}
        />
        <View style={styles.jobInfo}>
          <Text style={styles.jobTitle} numberOfLines={2}>
            {jobTitle}
          </Text>
          <Text style={styles.jobDetails}>
            Budget: ₹{formatBudget(jobBudget)} | Deadline:{" "}
            {formatDeadline(jobDeadline)}
          </Text>
          <Text style={styles.jobDescription} numberOfLines={2}>
            {jobDescription}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Show loading screen
  if (loading) {
    return <LoadingScreen theme={currentTheme} />;
  }

  const activeFilterCount =
    selectedServices.length + (sortBy !== "none" ? 1 : 0);

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

        <TouchableOpacity
          onPress={() => setFilterVisible(true)}
          style={styles.filterButton}
          activeOpacity={0.7}
        >
          <SlidersHorizontal size={20} color="#762BAD" />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
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
      </View>

      {/* Jobs List Header */}
      <View style={styles.listHeader}>
        <Text style={styles.listHeaderText}>
          All Jobs ({filteredJobs.length})
        </Text>
        {activeFilterCount > 0 && (
          <TouchableOpacity
            onPress={() => {
              setSelectedServices([]);
              setSortBy("none");
            }}
          >
            <Text style={styles.clearFiltersText}>Clear Filters</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* FlatList for all jobs */}
      <FlatList
        data={filteredJobs}
        renderItem={renderJobItem}
        keyExtractor={(item, index) => {
          const jobId = item.id || item.job_id || item._id;
          return jobId ? `${jobId}_${index}` : `job_${index}`;
        }}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#762BAD"]}
            tintColor={"#762BAD"}
            title="Pull to refresh jobs..."
            titleColor={"#762BAD"}
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {activeFilterCount > 0
                ? "No jobs match your filters"
                : "No jobs available"}
            </Text>
          </View>
        )}
      />

      {/* Advanced Filter Modal */}
      <AdvancedFilter
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        services={availableServices}
        selectedServices={selectedServices}
        onToggleService={handleToggleService}
        onSelectAllServices={handleSelectAllServices}
        onClearAllServices={handleClearAllServices}
        sortBy={sortBy}
        onSortChange={setSortBy}
        theme={currentTheme}
      />

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
    filterButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor:
        currentTheme.theme === "dark" ? "#1f2937" : "#F3E8FF",
      alignItems: "center",
      justifyContent: "center",
    },
    filterBadge: {
      position: "absolute",
      top: 2,
      right: 2,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: "#762BAD",
      alignItems: "center",
      justifyContent: "center",
    },
    filterBadgeText: {
      color: "#FFF",
      fontSize: 10,
      fontWeight: "bold",
    },
    topSection: {
      paddingHorizontal: 20,
    },
    listHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    listHeaderText: {
      fontSize: 16,
      fontWeight: "bold",
      color: currentTheme.text || "#000",
    },
    clearFiltersText: {
      fontSize: 13,
      fontWeight: "600",
      color: "#EF4444",
    },
    listContent: {
      paddingHorizontal: 20,
      paddingBottom: Platform.OS === "ios" ? 40 : 30,
    },
    jobCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: currentTheme.cardBackground || "#f5f5f5",
      borderTopLeftRadius: 100,
      borderBottomLeftRadius: 100,
      borderBottomRightRadius: 10,
      borderTopRightRadius: 10,
      marginVertical: 8,
      shadowColor: currentTheme.shadow || "#000",
      shadowOpacity: 0.1,
      shadowRadius: 5,
      shadowOffset: { width: 0, height: 2 },
      elevation: 3,
    },
    profileImage: {
      width: 80,
      height: 80,
      borderRadius: 100,
      marginRight: 12,
    },
    jobInfo: {
      flex: 1,
      paddingVertical: 10,
      paddingRight: 12,
    },
    jobTitle: {
      fontSize: 15,
      fontWeight: "bold",
      color: currentTheme.text,
      marginBottom: 4,
    },
    jobDetails: {
      fontSize: 13,
      color: currentTheme.subText || "#666",
      marginBottom: 4,
    },
    jobDescription: {
      fontSize: 12,
      color: currentTheme.subText || "#999",
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingTop: 50,
    },
    emptyText: {
      fontSize: 16,
      color: currentTheme.subText || "#666",
      textAlign: "center",
      fontStyle: "italic",
    },
  });

export default MarketplaceScreen;
