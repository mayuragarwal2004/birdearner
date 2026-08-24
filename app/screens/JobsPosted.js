import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import SafeSpinner from "../components/SafeSpinner";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Briefcase, CalendarBlank, ChatCircleText, CurrencyInr } from "phosphor-react-native";
import { format, isValid } from "date-fns";
import { useAuth } from "../context/NewAuthContext";
import { useTheme } from "../context/ThemeContext";
import apiService from "../lib/apiService";

const PURPLE = "#7B2CFF";
const SOFT_PURPLE = "#F3EAFF";
const BORDER = "#E7E1EF";

const getStatusMeta = (status, isDark = false) => {
  const value = (status || "PENDING").toUpperCase();
  if (value === "COMPLETED") {
    return {
      label: "Completed",
      color: isDark ? "#4ADE80" : "#22C55E",
      bg: isDark ? "rgba(34,197,94,0.18)" : "#EAF8EF",
    };
  }
  if (value === "ACTIVE" || value === "ASSIGNED" || value === "IN_PROGRESS") {
    return {
      label: "Active",
      color: isDark ? "#60A5FA" : "#2563EB",
      bg: isDark ? "rgba(37,99,235,0.22)" : "#EAF1FF",
    };
  }
  if (value === "CANCELLED" || value === "REJECTED") {
    return {
      label: "Cancelled",
      color: isDark ? "#F87171" : "#EF4444",
      bg: isDark ? "rgba(239,68,68,0.2)" : "#FDECEC",
    };
  }
  return {
    label: "Pending",
    color: isDark ? "#FBBF24" : "#F59E0B",
    bg: isDark ? "rgba(245,158,11,0.2)" : "#FFF6DF",
  };
};

const formatDate = (dateValue) => {
  if (!dateValue) return "No date";
  const date = new Date(dateValue);
  return isValid(date) ? format(date, "MMM dd, yyyy") : "No date";
};

const formatTime = (dateValue) => {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  return isValid(date) ? format(date, "hh:mm a") : "";
};

const formatAmount = (value) => {
  const amount = Number(value || 0);
  if (!amount) return "Not set";
  return `₹${amount.toLocaleString("en-IN")}`;
};

const normalizeJobs = (jobs) =>
  jobs.map((job) => {
    // Prefer applicantsCount (live) over proposalCount (DB column is not maintained)
    const rawCount =
      job.applicantsCount ?? job.applicationsCount ?? job.proposalCount;
    const proposalCount = Number(rawCount ?? 0);
    return {
      ...job,
      proposalCount,
      proposalLabel:
        proposalCount === 1
          ? "1 applicant"
          : `${proposalCount} applicants`,
    };
  });

const JobsPostedScreen = ({ navigation }) => {
  const { userProfile } = useAuth();
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const isDark = theme === "dark";
  const styles = useMemo(() => getStyles(currentTheme, isDark), [currentTheme, isDark]);

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const cachedJobs = useRef([]);

  const summary = useMemo(() => {
    const total = jobs.length;
    const open = jobs.filter((job) => !["COMPLETED", "CANCELLED", "REJECTED"].includes((job.jobStatus || "").toUpperCase())).length;
    const proposals = jobs.reduce((sum, job) => sum + Number(job.proposalCount || 0), 0);
    return { total, open, proposals };
  }, [jobs]);

  const fetchJobs = async () => {
    setLoading(true);
    setError(false);
    try {
      await apiService.init();

      if (!userProfile?.id) {
        setJobs([]);
        cachedJobs.current = [];
        return;
      }

      const response = await apiService.getJobsByClientId(userProfile.id, 1, 100);
      const fetchedJobs = response?.jobs || response || [];
      const nextJobs = normalizeJobs(Array.isArray(fetchedJobs) ? fetchedJobs : []);

      if (JSON.stringify(nextJobs) !== JSON.stringify(cachedJobs.current)) {
        cachedJobs.current = nextJobs;
        setJobs(nextJobs);
      }
    } catch (err) {
      console.error("Error fetching jobs:", err);
      setError(true);
      Alert.alert("Error", `Failed to fetch jobs: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", fetchJobs);
    return unsubscribe;
  }, [navigation, userProfile?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchJobs();
    setRefreshing(false);
  };

  const openOptions = (job) => {
    setSelectedJob(job);
    setModalVisible(true);
  };

  const openApplicants = (job) => {
    navigation.navigate("AppliersScreen", {
      title: job.jobTitle,
      proposalCount: job.proposalCount || 0,
      color: getStatusMeta(job.jobStatus, isDark).color,
      item: job,
      jobId: job.id,
      job,
    });
  };

  const deleteJob = async (jobId) => {
    try {
      await apiService.init();
      await apiService.deleteJob(jobId);
      Alert.alert("Success", "Job deleted successfully.");
      await fetchJobs();
    } catch (err) {
      console.error("Error deleting job:", err);
      Alert.alert("Error", `Failed to delete job: ${err.message}`);
    }
  };

  const handleOptionSelect = (option) => {
    const job = selectedJob;
    setModalVisible(false);
    if (!job) return;

    if (option === "View Details") {
      navigation.navigate("JobDetailsChat", { jobId: job.id });
    } else if (option === "Update") {
      navigation.navigate("UpdateJobDetailsScreen", { jobId: job.id });
    } else if (option === "Chat") {
      navigation.navigate("ClientChat", {
        jobId: job.id,
        freelancer: job.assignedFreelancer,
        receiverId: job.assignedFreelancer?.userId,
      });
    } else if (option === "Delete") {
      Alert.alert("Delete Job", "Are you sure you want to delete this job?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteJob(job.id),
        },
      ]);
    }
  };

  const renderJobItem = ({ item }) => (
    <JobCard
      job={item}
      styles={styles}
      isDark={isDark}
      onPress={() => openApplicants(item)}
      onOptions={() => openOptions(item)}
    />
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={currentTheme.text || "#000"} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Jobs Posted</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Ionicons name="refresh" size={20} color={PURPLE} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={jobs}
        renderItem={renderJobItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.summaryRow}>
            <SummaryItem styles={styles} label="Total" value={summary.total} />
            <SummaryItem styles={styles} label="Open" value={summary.open} />
            <SummaryItem styles={styles} label="Entries" value={summary.proposals} />
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.stateContainer}>
              <SafeSpinner size={42} color={PURPLE} />
              <Text style={styles.stateText}>Loading jobs...</Text>
            </View>
          ) : error ? (
            <View style={styles.stateContainer}>
              <Ionicons name="warning-outline" size={38} color="#EF4444" />
              <Text style={styles.stateTitle}>Failed to load jobs</Text>
              <Text style={styles.stateText}>Please try again in a moment.</Text>
              <TouchableOpacity onPress={fetchJobs} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.stateContainer}>
              <Briefcase size={42} color={isDark ? "#B794FF" : PURPLE} />
              <Text style={styles.stateTitle}>No jobs posted yet</Text>
              <Text style={styles.stateText}>
                Your posted jobs will appear here once you create them.
              </Text>
            </View>
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[PURPLE]}
            tintColor={PURPLE}
            progressBackgroundColor={currentTheme.cardBackground || "#fff"}
          />
        }
      />

      <JobOptionsModal
        visible={modalVisible}
        job={selectedJob}
        styles={styles}
        onClose={() => setModalVisible(false)}
        onSelect={handleOptionSelect}
      />
    </SafeAreaView>
  );
};

function SummaryItem({ styles, label, value }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function JobCard({ job, styles, isDark, onPress, onOptions }) {
  const status = getStatusMeta(job.jobStatus, isDark);
  const service = job.service;
  const postedDate = formatDate(job.createdAt);
  const postedTime = formatTime(job.createdAt);
  const deadline = formatDate(job.deadlineDate || job.deadline);
  const budget = formatAmount(job.budgetAmount || job.budget);
  const iconTint = isDark ? "#B794FF" : PURPLE;

  return (
    <TouchableOpacity style={styles.jobCard} onPress={onPress} activeOpacity={0.86}>
      <View style={styles.jobTopRow}>
        <View style={styles.serviceIcon}>
          {service?.imageUrl ? (
            <Image
              source={{ uri: apiService.loadImageURI(service.imageUrl) }}
              style={styles.serviceImage}
            />
          ) : (
            <Briefcase size={28} color={iconTint} />
          )}
        </View>

        <View style={styles.jobTitleWrap}>
          <Text style={styles.jobTitle} numberOfLines={2}>
            {job.jobTitle || "Untitled job"}
          </Text>
          {!!service?.name && (
            <Text style={styles.serviceName} numberOfLines={1}>
              {service.name}
            </Text>
          )}
        </View>

        <TouchableOpacity style={styles.optionsButton} onPress={onOptions}>
          <Ionicons name="ellipsis-horizontal" size={22} color={styles.iconColor.color} />
        </TouchableOpacity>
      </View>

      <View style={styles.metaGrid}>
        <MetaItem styles={styles} icon={<CurrencyInr size={17} color={iconTint} />} label={budget} />
        <MetaItem styles={styles} icon={<CalendarBlank size={17} color={iconTint} />} label={`Posted ${postedDate}${postedTime ? `, ${postedTime}` : ""}`} />
        <MetaItem styles={styles} icon={<CalendarBlank size={17} color={iconTint} />} label={`Due ${deadline}`} />
      </View>

      <View style={styles.jobBottomRow}>
        <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: status.color }]} />
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
        <Text style={styles.applicantsLink}>View applicants({job.proposalCount || 0})</Text>
      </View>
    </TouchableOpacity>
  );
}

function MetaItem({ styles, icon, label }) {
  return (
    <View style={styles.metaItem}>
      {icon}
      <Text style={styles.metaText} numberOfLines={1}>{label}</Text>
    </View>
  );
}

function JobOptionsModal({ visible, job, styles, onClose, onSelect }) {
  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.actionSheet} activeOpacity={1}>
          <View style={styles.sheetHandle} />
          <Text style={styles.modalTitle} numberOfLines={2}>
            {job?.jobTitle || "Job options"}
          </Text>

          <ActionRow styles={styles} icon="document-text-outline" label="View Job Details" onPress={() => onSelect("View Details")} />
          <ActionRow styles={styles} icon="create-outline" label="Update Job Details" onPress={() => onSelect("Update")} />
          {!!job?.assignedFreelancer && (
            <ActionRow styles={styles} icon={<ChatCircleText size={23} color={PURPLE} />} label="Chat with Freelancer" onPress={() => onSelect("Chat")} />
          )}
          <ActionRow styles={styles} icon="trash-outline" label="Delete This Job" danger onPress={() => onSelect("Delete")} />

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

function ActionRow({ styles, icon, label, danger, onPress }) {
  return (
    <TouchableOpacity style={styles.actionRow} onPress={onPress}>
      {typeof icon === "string" ? (
        <Ionicons name={icon} size={20} color={danger ? "#EF4444" : PURPLE} />
      ) : (
        icon
      )}
      <Text style={[styles.actionText, danger && styles.actionTextDanger]}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={styles.chevronColor.color} />
    </TouchableOpacity>
  );
}

const getStyles = (currentTheme, isDark) => {
  const surface = currentTheme.background || "#FFFFFF";
  const card = currentTheme.cardBackground || surface;
  const text = currentTheme.text || "#101114";
  const muted = currentTheme.subText || "#656B7A";
  const border = currentTheme.border || BORDER;
  const softSurface = isDark
    ? currentTheme.background3 || "#2A2A2A"
    : SOFT_PURPLE;
  const accentSoft = isDark ? "#2A2034" : "#F7F2FF";
  const accentLink = isDark ? "#B794FF" : PURPLE;

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: surface,
    },
    header: {
      minHeight: 52,
      paddingHorizontal: 16,
      paddingTop: 4,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: surface,
    },
    backButton: {
      width: 36,
      height: 36,
      justifyContent: "center",
      alignItems: "flex-start",
    },
    headerTitle: {
      color: text,
      fontSize: 18,
      fontWeight: "700",
      textAlign: "center",
    },
    refreshButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: accentSoft,
    },
    listContainer: {
      paddingHorizontal: 16,
      paddingBottom: 110,
    },
    summaryRow: {
      flexDirection: "row",
      gap: 10,
      marginTop: 8,
      marginBottom: 6,
    },
    summaryItem: {
      flex: 1,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: "center",
      borderWidth: 1,
      borderColor: border,
      backgroundColor: card,
    },
    summaryValue: {
      color: text,
      fontSize: 22,
      fontWeight: "900",
    },
    summaryLabel: {
      color: muted,
      fontSize: 12,
      fontWeight: "700",
      marginTop: 4,
    },
    jobCard: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: border,
      backgroundColor: card,
      padding: 14,
      marginTop: 14,
      shadowColor: isDark ? "#000000" : "#2C1B3F",
      shadowOpacity: isDark ? 0 : 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: isDark ? 0 : 2,
    },
    jobTopRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    serviceIcon: {
      width: 58,
      height: 58,
      borderRadius: 14,
      backgroundColor: softSurface,
      borderWidth: 1,
      borderColor: border,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    serviceImage: {
      width: "100%",
      height: "100%",
    },
    jobTitleWrap: {
      flex: 1,
      minWidth: 0,
    },
    jobTitle: {
      color: text,
      fontSize: 17,
      fontWeight: "900",
      lineHeight: 23,
    },
    serviceName: {
      color: accentLink,
      fontSize: 13,
      fontWeight: "800",
      marginTop: 5,
    },
    optionsButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: accentSoft,
    },
    iconColor: {
      color: text,
    },
    metaGrid: {
      marginTop: 14,
      gap: 8,
    },
    metaItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    metaText: {
      flex: 1,
      color: muted,
      fontSize: 13,
      fontWeight: "600",
    },
    jobBottomRow: {
      marginTop: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    statusPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      paddingHorizontal: 11,
      paddingVertical: 7,
      borderRadius: 999,
    },
    statusDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    statusText: {
      fontSize: 12,
      fontWeight: "900",
    },
    applicantsLink: {
      color: accentLink,
      fontSize: 13,
      fontWeight: "900",
    },
    stateContainer: {
      minHeight: 330,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
    },
    stateTitle: {
      color: text,
      fontSize: 19,
      fontWeight: "900",
      marginTop: 12,
      textAlign: "center",
    },
    stateText: {
      color: muted,
      fontSize: 14,
      lineHeight: 20,
      marginTop: 8,
      textAlign: "center",
    },
    primaryButton: {
      marginTop: 18,
      borderRadius: 12,
      backgroundColor: PURPLE,
      paddingHorizontal: 22,
      paddingVertical: 12,
    },
    primaryButtonText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "900",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: isDark ? "rgba(0,0,0,0.72)" : "rgba(0,0,0,0.48)",
      justifyContent: "flex-end",
    },
    actionSheet: {
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 28,
      backgroundColor: isDark ? currentTheme.background2 || "#111111" : card,
      borderTopWidth: isDark ? 1 : 0,
      borderColor: border,
    },
    sheetHandle: {
      alignSelf: "center",
      width: 42,
      height: 4,
      borderRadius: 2,
      backgroundColor: isDark ? "#555555" : border,
      marginBottom: 16,
    },
    modalTitle: {
      color: text,
      fontSize: 19,
      fontWeight: "900",
      marginBottom: 12,
    },
    actionRow: {
      minHeight: 48,
      borderBottomWidth: 1,
      borderBottomColor: border,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    actionText: {
      flex: 1,
      color: text,
      fontSize: 14,
      fontWeight: "500",
    },
    actionTextDanger: {
      color: isDark ? "#F87171" : "#EF4444",
    },
    chevronColor: {
      color: muted,
    },
    cancelButton: {
      marginTop: 16,
      minHeight: 50,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: accentSoft,
    },
    cancelText: {
      color: accentLink,
      fontSize: 16,
      fontWeight: "900",
    },
  });
};

export default JobsPostedScreen;
