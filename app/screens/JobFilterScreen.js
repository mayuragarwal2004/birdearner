import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import {
  ArrowLeft,
  Check,
  ArrowsDownUp,
  ListChecks,
} from "phosphor-react-native";
import { CommonActions } from "@react-navigation/native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../context/ThemeContext";

const SORT_OPTIONS = [
  { key: "none", label: "Default" },
  { key: "lowToHigh", label: "Price: Low to High" },
  { key: "highToLow", label: "Price: High to Low" },
];

const FILTER_CATEGORIES = [
  { key: "sort", label: "Sort by", icon: ArrowsDownUp },
  { key: "services", label: "Services", icon: ListChecks },
];

const JobFilterScreen = ({ navigation, route }) => {
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const insets = useSafeAreaInsets();
  const styles = getStyles(currentTheme, insets);

  const {
    availableServices = [],
    serviceJobCounts = {},
    currentSelectedServices = [],
    currentSortBy = "none",
  } = route.params || {};

  const [activeCategory, setActiveCategory] = useState("sort");
  const [tempSelectedServices, setTempSelectedServices] = useState([
    ...currentSelectedServices,
  ]);
  const [tempSortBy, setTempSortBy] = useState(currentSortBy);

  const activeFilterCount =
    tempSelectedServices.length + (tempSortBy !== "none" ? 1 : 0);

  const handleApply = () => {
    navigation.dispatch(
      CommonActions.navigate({
        name: "MarketplaceJobs",
        params: {
          filterResult: {
            selectedServices: tempSelectedServices,
            sortBy: tempSortBy,
          },
        },
        merge: true,
      })
    );
  };

  const handleToggleService = (serviceId) => {
    setTempSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSelectAll = () => {
    setTempSelectedServices(availableServices.map((s) => s.id));
  };

  const handleClearAll = () => {
    setTempSelectedServices([]);
  };

  const handleReset = () => {
    setTempSortBy("none");
    setTempSelectedServices([]);
  };

  const renderSortOptions = () => (
    <ScrollView
      style={styles.rightPanelScroll}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.rightPanelContent}
    >
      {SORT_OPTIONS.map((option) => (
        <TouchableOpacity
          key={option.key}
          style={[
            styles.optionRow,
            tempSortBy === option.key && styles.optionRowActive,
          ]}
          onPress={() => setTempSortBy(option.key)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.optionText,
              tempSortBy === option.key && styles.optionTextActive,
            ]}
          >
            {option.label}
          </Text>
          {tempSortBy === option.key && (
            <Check size={18} color="#762BAD" weight="bold" />
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderServiceOptions = () => (
    <ScrollView
      style={styles.rightPanelScroll}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.rightPanelContent}
    >
      <View style={styles.serviceActionsRow}>
        <TouchableOpacity onPress={handleSelectAll} style={styles.serviceActionBtn}>
          <Text style={styles.serviceActionText}>Select All</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleClearAll} style={styles.serviceActionBtn}>
          <Text style={[styles.serviceActionText, { color: "#EF4444" }]}>
            Clear
          </Text>
        </TouchableOpacity>
      </View>
      {availableServices.map((service) => {
        const isSelected = tempSelectedServices.includes(service.id);
        const jobCount = serviceJobCounts[service.id] || 0;
        return (
          <TouchableOpacity
            key={service.id}
            style={[
              styles.optionRow,
              isSelected && styles.optionRowActive,
            ]}
            onPress={() => handleToggleService(service.id)}
            activeOpacity={0.7}
          >
            <View style={styles.optionRowLeft}>
              <Text
                style={[
                  styles.optionText,
                  isSelected && styles.optionTextActive,
                ]}
              >
                {service.name}
              </Text>
              {jobCount > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{jobCount}</Text>
                </View>
              )}
            </View>
            {isSelected && (
              <Check size={18} color="#762BAD" weight="bold" />
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerBtn}
            activeOpacity={0.7}
          >
            <ArrowLeft size={22} color={currentTheme.text || "#000"} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Filters</Text>
          <TouchableOpacity onPress={handleReset} style={styles.resetBtn}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        {/* Two Panel Layout */}
        <View style={styles.twoPanelContainer}>
          <View style={styles.leftPanel}>
            {FILTER_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.key;
              return (
                <TouchableOpacity
                  key={cat.key}
                  style={[
                    styles.categoryItem,
                    isActive && styles.categoryItemActive,
                  ]}
                  onPress={() => setActiveCategory(cat.key)}
                  activeOpacity={0.7}
                >
                  {isActive && <View style={styles.activeIndicator} />}
                  <Icon
                    size={16}
                    color={isActive ? "#762BAD" : currentTheme.subText || "#666"}
                  />
                  <Text
                    style={[
                      styles.categoryText,
                      isActive && styles.categoryTextActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.rightPanel}>
            {activeCategory === "sort" && renderSortOptions()}
            {activeCategory === "services" && renderServiceOptions()}
          </View>
        </View>

        {/* Bottom Apply Bar */}
        <View style={styles.bottomBar}>
          <View style={styles.bottomInfo}>
            {activeFilterCount > 0 && (
              <View style={styles.filterCountBadge}>
                <Text style={styles.filterCountText}>{activeFilterCount}</Text>
              </View>
            )}
            <Text style={styles.bottomInfoText}>
              {activeFilterCount > 0
                ? `${activeFilterCount} filter${activeFilterCount > 1 ? "s" : ""} selected`
                : "No filters selected"}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.applyButton}
            onPress={handleApply}
            activeOpacity={0.8}
          >
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const getStyles = (currentTheme, insets) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: currentTheme.background || "#fff",
    },
    container: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.border || "#F3E8FF",
    },
    headerBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor:
        currentTheme.theme === "dark" ? "#1f2937" : "#F3E8FF",
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: currentTheme.text,
    },
    resetBtn: {
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    resetText: {
      fontSize: 14,
      fontWeight: "600",
      color: "#762BAD",
    },
    twoPanelContainer: {
      flex: 1,
      flexDirection: "row",
    },
    leftPanel: {
      width: "30%",
      backgroundColor:
        currentTheme.theme === "dark" ? "#1a1a2e" : "#F8F4FF",
      borderRightWidth: 1,
      borderRightColor: currentTheme.border || "#F3E8FF",
    },
    categoryItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 16,
      paddingHorizontal: 12,
      gap: 8,
      position: "relative",
    },
    categoryItemActive: {
      backgroundColor:
        currentTheme.theme === "dark" ? "#2a1a3e" : "#FFFFFF",
    },
    activeIndicator: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 3,
      backgroundColor: "#762BAD",
      borderTopRightRadius: 3,
      borderBottomRightRadius: 3,
    },
    categoryText: {
      fontSize: 13,
      fontWeight: "500",
      color: currentTheme.subText || "#666",
    },
    categoryTextActive: {
      fontWeight: "700",
      color: "#762BAD",
    },
    rightPanel: {
      flex: 1,
      backgroundColor: currentTheme.background || "#fff",
    },
    rightPanelScroll: {
      flex: 1,
    },
    rightPanelContent: {
      padding: 16,
    },
    serviceActionsRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginBottom: 12,
      gap: 16,
    },
    serviceActionBtn: {
      paddingVertical: 4,
    },
    serviceActionText: {
      fontSize: 13,
      fontWeight: "600",
      color: "#762BAD",
    },
    optionRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 14,
      paddingHorizontal: 14,
      borderRadius: 12,
      marginBottom: 8,
      backgroundColor:
        currentTheme.theme === "dark" ? "#374151" : "#F8F4FF",
    },
    optionRowActive: {
      backgroundColor:
        currentTheme.theme === "dark" ? "#4B0082" : "#F3E8FF",
      borderWidth: 1,
      borderColor: "#762BAD",
    },
    optionRowLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    optionText: {
      fontSize: 14,
      color: currentTheme.text || "#333",
    },
    optionTextActive: {
      fontWeight: "600",
      color: "#762BAD",
    },
    countBadge: {
      backgroundColor:
        currentTheme.theme === "dark" ? "#4B0082" : "#EDE4FB",
      borderRadius: 10,
      minWidth: 22,
      height: 22,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 6,
    },
    countBadgeText: {
      fontSize: 11,
      fontWeight: "600",
      color: "#762BAD",
    },
    bottomBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: Math.max(insets.bottom, 14) + 56,
      borderTopWidth: 1,
      borderTopColor: currentTheme.border || "#F3E8FF",
      backgroundColor: currentTheme.background || "#fff",
    },
    bottomInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    filterCountBadge: {
      backgroundColor: "#762BAD",
      borderRadius: 12,
      minWidth: 24,
      height: 24,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 7,
    },
    filterCountText: {
      fontSize: 12,
      fontWeight: "bold",
      color: "#FFF",
    },
    bottomInfoText: {
      fontSize: 13,
      color: currentTheme.subText || "#666",
    },
    applyButton: {
      backgroundColor: "#762BAD",
      paddingVertical: 12,
      paddingHorizontal: 28,
      borderRadius: 12,
    },
    applyButtonText: {
      color: "#FFF",
      fontSize: 15,
      fontWeight: "bold",
    },
  });

export default JobFilterScreen;
