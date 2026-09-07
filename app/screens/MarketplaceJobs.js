import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  RefreshControl,
  TouchableOpacity,
  FlatList,
  Image,
  Modal,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SafeSpinner from "../components/SafeSpinner";
import Toast from "react-native-toast-message";
import {
  ArrowLeft,
  SlidersHorizontal,
  X,
  Check,
  ArrowsDownUp,
  ListChecks,
} from "phosphor-react-native";

import { useTheme } from "../context/ThemeContext";
import { useMarketplaceJobs } from "../hooks/marketplace";
import { useAuth } from "../context/NewAuthContext";

// Module-level cache: survives all navigations, re-renders, and remounts
let _cachedFreelancerServices = null;

const MarketplaceJobs = ({ navigation, route }) => {
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const styles = getStyles(currentTheme);
  const { userData } = useAuth();

  const {
    jobs,
    loading,
    refreshing,
    fetchJobs,
    onRefresh,
    getAllJobs,
  } = useMarketplaceJobs();

  const {
    location,
    distance,
    currentUserRole,
    userServices: routeUserServices,
    refreshUserData,
  } = route.params || {};

  const [selectedServices, setSelectedServices] = useState([]);
  const [sortBy, setSortBy] = useState("none");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [tempSelectedServices, setTempSelectedServices] = useState([]);
  const [tempSortBy, setTempSortBy] = useState("none");
  const [activeCategory, setActiveCategory] = useState("sort");

  // Capture freelancer services into module-level cache (once, permanently)
  if (_cachedFreelancerServices === null) {
    if (routeUserServices && Array.isArray(routeUserServices)) {
      _cachedFreelancerServices = routeUserServices
        .filter((s) => s && s.id && s.name)
        .map((s) => ({ id: s.id, name: s.name }));
    } else {
      _cachedFreelancerServices = [];
    }
  }

  // Fetch jobs when screen mounts
  useEffect(() => {
    fetchJobs(
      !!location,
      location,
      distance || 20,
      currentUserRole || "FREELANCER",
      routeUserServices || [],
      true,
      userData?.freelancer?.id || null
    );
  }, []);

  // Freelancer service IDs for pre-filtering
  const freelancerServiceIds = useMemo(() => {
    return (_cachedFreelancerServices || []).map((s) => s.id);
  }, []);

  // Pre-filter: only show jobs matching the freelancer's own services
  const allJobs = useMemo(() => {
    const rawJobs = getAllJobs();
    if (freelancerServiceIds.length === 0) return rawJobs;
    return rawJobs.filter(
      (job) => job.serviceId && freelancerServiceIds.includes(job.serviceId)
    );
  }, [getAllJobs, freelancerServiceIds]);

  // Use only freelancer's own services for filtering
  const availableServices = useMemo(() => {
    return [...(_cachedFreelancerServices || [])].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, []);

  // Count jobs per service for badge display
  const serviceJobCounts = useMemo(() => {
    const counts = {};
    allJobs.forEach((job) => {
      const serviceId = job.serviceId;
      if (serviceId) {
        counts[serviceId] = (counts[serviceId] || 0) + 1;
      }
    });
    return counts;
  }, [allJobs]);

  const filteredJobs = useMemo(() => {
    let result = [...allJobs];

    if (selectedServices.length > 0) {
      result = result.filter((job) => {
        if (job.serviceId && selectedServices.includes(job.serviceId)) {
          return true;
        }
        if (job.serviceName && selectedServices.includes(job.serviceName)) {
          return true;
        }
        const services = job.services || job.serviceNames || [];
        const jobServiceIds = Array.isArray(services)
          ? services.map((s) => (typeof s === "string" ? s : s.id || s.name))
          : [];
        return selectedServices.some((id) => jobServiceIds.includes(id));
      });
    }

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

  // Listen for filter results returned from JobFilterScreen
  useEffect(() => {
    if (route.params?.filterResult) {
      const { selectedServices: newServices, sortBy: newSortBy } =
        route.params.filterResult;
      setSelectedServices(newServices);
      setSortBy(newSortBy);
      navigation.setParams({ filterResult: null });
    }
  }, [route.params?.filterResult]);

  const openFilterPanel = () => {
    setTempSelectedServices([...selectedServices]);
    setTempSortBy(sortBy);
    setActiveCategory("sort");
    setShowFilterPanel(true);
  };

  const handleApplyFilter = () => {
    setSelectedServices(tempSelectedServices);
    setSortBy(tempSortBy);
    setShowFilterPanel(false);
  };

  const handleResetFilter = () => {
    setTempSortBy("none");
    setTempSelectedServices([]);
  };

  const handleToggleTempService = (serviceId) => {
    setTempSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleTempSelectAll = () => {
    setTempSelectedServices(availableServices.map((s) => s.id));
  };

  const handleTempClearAll = () => {
    setTempSelectedServices([]);
  };

  const handleRefresh = () => {
    fetchJobs(
      !!location,
      location,
      distance || 20,
      currentUserRole || "FREELANCER",
      routeUserServices || [],
      false,
      userData?.freelancer?.id || null
    );
  };

  const formatBudget = (budget) => {
    if (!budget) return "0";
    return budget >= 1000
      ? `${(budget / 1000).toFixed(budget % 1000 === 0 ? 0 : 1)}k`
      : `${budget}`;
  };

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
          {job.hasApplied && (
            <View style={styles.appliedBadge}>
              <Text style={styles.appliedBadgeText}>Already Applied</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const activeFilterCount =
    selectedServices.length + (sortBy !== "none" ? 1 : 0);

  // Show loading indicator while fetching initial data
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerContainer}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerButton}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color={currentTheme.text || "#000"} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>All Jobs</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.loadingContainer}>
          <SafeSpinner size={42} color="#762BAD" />
          <Text style={styles.loadingText}>Loading jobs...</Text>
        </View>
      </SafeAreaView>
    );
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

        <Text style={styles.headerTitle}>All Jobs</Text>

        <View style={{ width: 44 }} />
      </View>

      {/* Filter Bar */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[
            styles.filterToggleButton,
            activeFilterCount > 0 && styles.filterToggleButtonActive,
          ]}
          onPress={openFilterPanel}
          activeOpacity={0.7}
        >
          <SlidersHorizontal
            size={16}
            color={activeFilterCount > 0 ? "#FFF" : "#762BAD"}
          />
          <Text
            style={[
              styles.filterToggleText,
              activeFilterCount > 0 && styles.filterToggleTextActive,
            ]}
          >
            Filters
          </Text>
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.jobCountText}>
          {filteredJobs.length} Job{filteredJobs.length !== 1 ? "s" : ""}
        </Text>

        {activeFilterCount > 0 && (
          <TouchableOpacity
            onPress={() => {
              setSelectedServices([]);
              setSortBy("none");
            }}
            style={styles.clearButton}
          >
            <X size={14} color="#EF4444" />
            <Text style={styles.clearFiltersText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Jobs List */}
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

      {/* Filter Bottom Sheet Modal */}
      <Modal
        visible={showFilterPanel}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterPanel(false)}
      >
        <Pressable
          style={styles.filterOverlay}
          onPress={() => setShowFilterPanel(false)}
        >
          <View
            style={styles.filterSheet}
          >
            {/* Filter Header */}
            <View style={styles.filterHeader}>
              <TouchableOpacity
                onPress={() => setShowFilterPanel(false)}
                style={styles.filterHeaderBtn}
                activeOpacity={0.7}
              >
                <X size={22} color={currentTheme.text || "#000"} />
              </TouchableOpacity>
              <Text style={styles.filterHeaderTitle}>Filters</Text>
              <TouchableOpacity onPress={handleResetFilter} style={styles.filterResetBtn}>
                <Text style={styles.filterResetText}>Reset</Text>
              </TouchableOpacity>
            </View>

            {/* Two Panel Layout */}
            <View style={styles.filterTwoPanel}>
              {/* Left Panel - Categories */}
              <View style={styles.filterLeftPanel}>
                {[
                  { key: "sort", label: "Sort by", Icon: ArrowsDownUp },
                  { key: "services", label: "Services", Icon: ListChecks },
                ].map((cat) => {
                  const isActive = activeCategory === cat.key;
                  return (
                    <TouchableOpacity
                      key={cat.key}
                      style={[
                        styles.filterCategoryItem,
                        isActive && styles.filterCategoryItemActive,
                      ]}
                      onPress={() => setActiveCategory(cat.key)}
                      activeOpacity={0.7}
                    >
                      {isActive && <View style={styles.filterActiveIndicator} />}
                      <cat.Icon
                        size={16}
                        color={isActive ? "#762BAD" : currentTheme.subText || "#666"}
                      />
                      <Text
                        style={[
                          styles.filterCategoryText,
                          isActive && styles.filterCategoryTextActive,
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Right Panel - Options */}
              <View style={styles.filterRightPanel}>
                {activeCategory === "sort" && (
                  <FlatList
                    data={[
                      { key: "none", label: "Default" },
                      { key: "lowToHigh", label: "Price: Low to High" },
                      { key: "highToLow", label: "Price: High to Low" },
                    ]}
                    keyExtractor={(item) => item.key}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[
                          styles.filterOptionRow,
                          tempSortBy === item.key && styles.filterOptionRowActive,
                        ]}
                        onPress={() => setTempSortBy(item.key)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.filterOptionText,
                            tempSortBy === item.key && styles.filterOptionTextActive,
                          ]}
                        >
                          {item.label}
                        </Text>
                        {tempSortBy === item.key && (
                          <Check size={18} color="#762BAD" weight="bold" />
                        )}
                      </TouchableOpacity>
                    )}
                    contentContainerStyle={styles.filterOptionContent}
                  />
                )}
                {activeCategory === "services" && (
                  <FlatList
                    data={availableServices}
                    keyExtractor={(item) => item.id}
                    ListHeaderComponent={() => (
                      <View style={styles.filterServiceActions}>
                        <TouchableOpacity onPress={handleTempSelectAll} style={styles.filterServiceActionBtn}>
                          <Text style={styles.filterServiceActionText}>Select All</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleTempClearAll} style={styles.filterServiceActionBtn}>
                          <Text style={[styles.filterServiceActionText, { color: "#EF4444" }]}>Clear</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    renderItem={({ item: service }) => {
                      const isSelected = tempSelectedServices.includes(service.id);
                      const jobCount = serviceJobCounts[service.id] || 0;
                      return (
                        <TouchableOpacity
                          style={[
                            styles.filterOptionRow,
                            isSelected && styles.filterOptionRowActive,
                          ]}
                          onPress={() => handleToggleTempService(service.id)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.filterOptionLeft}>
                            <Text
                              style={[
                                styles.filterOptionText,
                                isSelected && styles.filterOptionTextActive,
                              ]}
                            >
                              {service.name}
                            </Text>
                            {jobCount > 0 && (
                              <View style={styles.filterCountBadge}>
                                <Text style={styles.filterCountBadgeText}>{jobCount}</Text>
                              </View>
                            )}
                          </View>
                          {isSelected && (
                            <Check size={18} color="#762BAD" weight="bold" />
                          )}
                        </TouchableOpacity>
                      );
                    }}
                    contentContainerStyle={styles.filterOptionContent}
                  />
                )}
              </View>
            </View>

            {/* Bottom Apply Bar */}
            <View style={styles.filterBottomBar}>
              <View style={styles.filterBottomInfo}>
                {(tempSelectedServices.length + (tempSortBy !== "none" ? 1 : 0)) > 0 && (
                  <View style={styles.filterActiveCountBadge}>
                    <Text style={styles.filterActiveCountText}>
                      {tempSelectedServices.length + (tempSortBy !== "none" ? 1 : 0)}
                    </Text>
                  </View>
                )}
                <Text style={styles.filterBottomInfoText}>
                  {(tempSelectedServices.length + (tempSortBy !== "none" ? 1 : 0)) > 0
                    ? `${tempSelectedServices.length + (tempSortBy !== "none" ? 1 : 0)} filter${(tempSelectedServices.length + (tempSortBy !== "none" ? 1 : 0)) > 1 ? "s" : ""} selected`
                    : "No filters selected"}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.filterApplyButton}
                onPress={handleApplyFilter}
                activeOpacity={0.8}
              >
                <Text style={styles.filterApplyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

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
      paddingVertical: 10,
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
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: currentTheme.subText || "#666",
    },
    filterBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.border || "#F3E8FF",
    },
    filterToggleButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: currentTheme.cardBackground || "#F3E8FF",
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 10,
    },
    filterToggleButtonActive: {
      backgroundColor: "#762BAD",
    },
    filterToggleText: {
      fontSize: 14,
      fontWeight: "600",
      color: "#762BAD",
    },
    filterToggleTextActive: {
      color: "#FFF",
    },
    filterBadge: {
      backgroundColor: "#FFF",
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 6,
    },
    filterBadgeText: {
      fontSize: 11,
      fontWeight: "bold",
      color: "#762BAD",
    },
    clearButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    jobCountText: {
      fontSize: 14,
      fontWeight: "600",
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
    appliedBadge: {
      backgroundColor: '#10B981',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      alignSelf: 'flex-start',
      marginTop: 6,
    },
    appliedBadgeText: {
      color: '#fff',
      fontSize: 11,
      fontWeight: '600',
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
    filterOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.4)",
      justifyContent: "flex-end",
    },
    filterSheet: {
      height: "55%",
      backgroundColor: currentTheme.background || "#fff",
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      overflow: "hidden",
    },
    filterHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.border || "#F3E8FF",
    },
    filterHeaderBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor:
        currentTheme.theme === "dark" ? "#1f2937" : "#F3E8FF",
      alignItems: "center",
      justifyContent: "center",
    },
    filterHeaderTitle: {
      fontSize: 17,
      fontWeight: "bold",
      color: currentTheme.text,
    },
    filterResetBtn: {
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    filterResetText: {
      fontSize: 14,
      fontWeight: "600",
      color: "#762BAD",
    },
    filterTwoPanel: {
      flex: 1,
      flexDirection: "row",
    },
    filterLeftPanel: {
      width: "30%",
      backgroundColor:
        currentTheme.theme === "dark" ? "#1a1a2e" : "#F8F4FF",
      borderRightWidth: 1,
      borderRightColor: currentTheme.border || "#F3E8FF",
    },
    filterCategoryItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 16,
      paddingHorizontal: 12,
      gap: 8,
      position: "relative",
    },
    filterCategoryItemActive: {
      backgroundColor:
        currentTheme.theme === "dark" ? "#2a1a3e" : "#FFFFFF",
    },
    filterActiveIndicator: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 3,
      backgroundColor: "#762BAD",
      borderTopRightRadius: 3,
      borderBottomRightRadius: 3,
    },
    filterCategoryText: {
      fontSize: 13,
      fontWeight: "500",
      color: currentTheme.subText || "#666",
    },
    filterCategoryTextActive: {
      fontWeight: "700",
      color: "#762BAD",
    },
    filterRightPanel: {
      flex: 1,
      backgroundColor: currentTheme.background || "#fff",
    },
    filterOptionContent: {
      padding: 16,
    },
    filterServiceActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginBottom: 12,
      gap: 16,
    },
    filterServiceActionBtn: {
      paddingVertical: 4,
    },
    filterServiceActionText: {
      fontSize: 13,
      fontWeight: "600",
      color: "#762BAD",
    },
    filterOptionRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 11,
      paddingHorizontal: 14,
      borderRadius: 12,
      marginBottom: 8,
      backgroundColor:
        currentTheme.theme === "dark" ? "#374151" : "#F8F4FF",
    },
    filterOptionRowActive: {
      backgroundColor:
        currentTheme.theme === "dark" ? "#4B0082" : "#F3E8FF",
      borderWidth: 1,
      borderColor: "#762BAD",
    },
    filterOptionLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    filterOptionText: {
      fontSize: 14,
      color: currentTheme.text || "#333",
    },
    filterOptionTextActive: {
      fontWeight: "600",
      color: "#762BAD",
    },
    filterCountBadge: {
      backgroundColor:
        currentTheme.theme === "dark" ? "#4B0082" : "#EDE4FB",
      borderRadius: 10,
      minWidth: 22,
      height: 22,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 6,
    },
    filterCountBadgeText: {
      fontSize: 11,
      fontWeight: "600",
      color: "#762BAD",
    },
    filterBottomBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 20,
      borderTopWidth: 1,
      borderTopColor: currentTheme.border || "#F3E8FF",
      backgroundColor: currentTheme.background || "#fff",
    },
    filterBottomInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    filterActiveCountBadge: {
      backgroundColor: "#762BAD",
      borderRadius: 12,
      minWidth: 24,
      height: 24,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 7,
    },
    filterActiveCountText: {
      fontSize: 12,
      fontWeight: "bold",
      color: "#FFF",
    },
    filterBottomInfoText: {
      fontSize: 13,
      color: currentTheme.subText || "#666",
    },
    filterApplyButton: {
      backgroundColor: "#762BAD",
      paddingVertical: 12,
      paddingHorizontal: 28,
      borderRadius: 12,
    },
    filterApplyButtonText: {
      color: "#FFF",
      fontSize: 15,
      fontWeight: "bold",
    },
  });

export default MarketplaceJobs;
