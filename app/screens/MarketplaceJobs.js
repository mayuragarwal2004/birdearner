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
  ActivityIndicator,
  ScrollView,
} from "react-native";
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
import apiService from "../lib/apiService";

const SORT_OPTIONS = [
  { key: "none", label: "Default" },
  { key: "lowToHigh", label: "Price: Low to High" },
  { key: "highToLow", label: "Price: High to Low" },
];

const MarketplaceJobs = ({ navigation, route }) => {
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const styles = getStyles(currentTheme);

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
    userServices,
    refreshUserData,
  } = route.params || {};

  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);
  const [sortBy, setSortBy] = useState("none");
  const [allServices, setAllServices] = useState([]);

  // Temporary state for filter panel (before applying)
  const [tempSelectedServices, setTempSelectedServices] = useState([]);
  const [tempSortBy, setTempSortBy] = useState("none");

  // Fetch all services from API
  useEffect(() => {
    const fetchServices = async () => {
      try {
        await apiService.init();
        const url = `${apiService.baseURL}/services`;
        const headers = { "Content-Type": "application/json" };
        if (apiService.token) {
          headers["Authorization"] = `Bearer ${apiService.token}`;
        }
        const res = await fetch(url, { method: "GET", headers });
        if (!res.ok) {
          console.error("[MarketplaceJobs] Services HTTP error:", res.status);
          return;
        }
        const json = await res.json();
        const list = Array.isArray(json.data) ? json.data : [];
        console.log("[MarketplaceJobs] Services loaded:", list.length);
        if (list.length > 0) {
          setAllServices(list.map((s) => ({ id: s.id, name: s.name })));
        }
      } catch (error) {
        console.error("[MarketplaceJobs] Services fetch error:", error.message);
      }
    };
    fetchServices();
  }, []);

  // Fetch jobs when screen mounts
  useEffect(() => {
    fetchJobs(
      !!location,
      location,
      distance || 20,
      currentUserRole || "FREELANCER",
      userServices || [],
      true
    );
  }, []);

  const allJobs = useMemo(() => getAllJobs(), [getAllJobs]);

  // Extract unique services from jobs as fallback / supplement
  const jobServices = useMemo(() => {
    const map = new Map();
    allJobs.forEach((job) => {
      if (job.serviceId && job.serviceName && !map.has(job.serviceId)) {
        map.set(job.serviceId, { id: job.serviceId, name: job.serviceName });
      }
    });
    return Array.from(map.values());
  }, [allJobs]);

  // Use all services from API merged with job services, sorted alphabetically
  const availableServices = useMemo(() => {
    const merged = new Map();
    allServices.forEach((s) => merged.set(s.id, s));
    jobServices.forEach((s) => {
      if (!merged.has(s.id)) merged.set(s.id, s);
    });
    return Array.from(merged.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [allServices, jobServices]);

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

  const openFilterPanel = () => {
    setTempSelectedServices([...selectedServices]);
    setTempSortBy(sortBy);
    setShowFilterPanel(true);
  };

  const applyFilters = () => {
    setSelectedServices(tempSelectedServices);
    setSortBy(tempSortBy);
    setShowFilterPanel(false);
  };

  const closeFilterPanel = () => {
    setShowFilterPanel(false);
  };

  const handleTempToggleService = (serviceId) => {
    setTempSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleTempSelectAllServices = () => {
    setTempSelectedServices(availableServices.map((s) => s.id));
  };

  const handleTempClearAllServices = () => {
    setTempSelectedServices([]);
  };

  const handleRefresh = () => {
    fetchJobs(
      !!location,
      location,
      distance || 20,
      currentUserRole || "FREELANCER",
      userServices || [],
      false
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
          <ActivityIndicator size="large" color="#762BAD" />
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

      {/* Filter Panel - Expandable */}
      {showFilterPanel && (
        <View style={styles.filterPanel}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.filterPanelContent}
          >
            {/* Sort Section */}
            <View style={styles.filterSection}>
              <View style={styles.filterSectionHeader}>
                <View style={styles.filterSectionTitleRow}>
                  <ArrowsDownUp size={16} color="#762BAD" />
                  <Text style={styles.filterSectionTitle}>Sort by Price</Text>
                </View>
              </View>
              {SORT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.filterOptionRow,
                    tempSortBy === option.key && styles.filterOptionRowActive,
                  ]}
                  onPress={() => setTempSortBy(option.key)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      tempSortBy === option.key && styles.filterOptionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {tempSortBy === option.key && (
                    <Check size={18} color="#762BAD" weight="bold" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Services Section */}
            {availableServices.length > 0 && (
              <View style={styles.filterSection}>
                <View style={styles.filterSectionHeader}>
                  <View style={styles.filterSectionTitleRow}>
                    <ListChecks size={16} color="#762BAD" />
                    <Text style={styles.filterSectionTitle}>Services</Text>
                  </View>
                  <View style={styles.serviceActions}>
                    <TouchableOpacity onPress={handleTempSelectAllServices}>
                      <Text style={styles.serviceActionText}>Select All</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleTempClearAllServices}>
                      <Text
                        style={[styles.serviceActionText, { color: "#EF4444" }]}
                      >
                        Clear
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
                {availableServices.map((service) => {
                  const isSelected = tempSelectedServices.includes(service.id);
                  const jobCount = serviceJobCounts[service.id] || 0;
                  return (
                    <TouchableOpacity
                      key={service.id}
                      style={[
                        styles.filterOptionRow,
                        isSelected && styles.filterOptionRowActive,
                      ]}
                      onPress={() => handleTempToggleService(service.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.serviceRowLeft}>
                        <Text
                          style={[
                            styles.filterOptionText,
                            isSelected && styles.filterOptionTextActive,
                          ]}
                        >
                          {service.name}
                        </Text>
                        {jobCount > 0 && (
                          <View style={styles.serviceCountBadge}>
                            <Text style={styles.serviceCountText}>
                              {jobCount}
                            </Text>
                          </View>
                        )}
                      </View>
                      {isSelected && (
                        <Check size={18} color="#762BAD" weight="bold" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {/* Apply Button */}
          <View style={styles.applyButtonContainer}>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={applyFilters}
              activeOpacity={0.8}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

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
    filterPanel: {
      backgroundColor: currentTheme.cardBackground || "#FAFAFA",
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.border || "#F3E8FF",
      maxHeight: 350,
    },
    filterPanelContent: {
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    filterSection: {
      marginBottom: 16,
    },
    filterSectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    filterSectionTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    filterSectionTitle: {
      fontSize: 15,
      fontWeight: "bold",
      color: currentTheme.text || "#1F1D2B",
    },
    serviceActions: {
      flexDirection: "row",
      gap: 12,
    },
    serviceActionText: {
      fontSize: 13,
      fontWeight: "600",
      color: "#762BAD",
    },
    filterOptionRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 12,
      marginBottom: 6,
      backgroundColor:
        currentTheme.theme === "dark" ? "#374151" : "#F8F4FF",
    },
    filterOptionRowActive: {
      backgroundColor:
        currentTheme.theme === "dark" ? "#4B0082" : "#F3E8FF",
      borderWidth: 1,
      borderColor: "#762BAD",
    },
    filterOptionText: {
      fontSize: 15,
      color: currentTheme.text || "#333",
    },
    filterOptionTextActive: {
      fontWeight: "600",
      color: "#762BAD",
    },
    serviceRowLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    serviceCountBadge: {
      backgroundColor: currentTheme.theme === "dark" ? "#4B0082" : "#EDE4FB",
      borderRadius: 10,
      minWidth: 22,
      height: 22,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 6,
    },
    serviceCountText: {
      fontSize: 11,
      fontWeight: "600",
      color: "#762BAD",
    },
    applyButtonContainer: {
      paddingHorizontal: 20,
      paddingBottom: 12,
    },
    applyButton: {
      backgroundColor: "#762BAD",
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: "center",
    },
    applyButtonText: {
      color: "#FFF",
      fontSize: 16,
      fontWeight: "bold",
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

export default MarketplaceJobs;
