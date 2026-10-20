import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { ArrowLeft, Bookmark } from "phosphor-react-native";
import SafeSpinner from "../components/SafeSpinner";
import apiService from "../lib/apiService";
import { useTheme } from "../context/ThemeContext";

const PLACEHOLDER_PROFILE = "https://via.placeholder.com/95x95/CCCCCC/666666?text=User";
// Used when the job's service has no image (same placeholder source as the service list)
const PLACEHOLDER_SERVICE_IMAGE = "https://picsum.photos/seed/";

// Same rule as the marketplace cards: work duration first, otherwise days left until the deadline
const formatDeadlineDays = (job) => {
  const dayLabel = (n) => `${n} ${n === 1 ? "Day" : "Days"}`;
  if (job.workDurationDays) return dayLabel(job.workDurationDays);
  const deadline = job.deadlineDate || job.deadline || job.due_date;
  if (!deadline) return "1 Day";
  const deadlineDate = new Date(deadline);
  if (isNaN(deadlineDate.getTime())) return "1 Day";
  const daysLeft = Math.ceil((deadlineDate - new Date()) / (1000 * 60 * 60 * 24));
  return dayLabel(daysLeft > 0 ? daysLeft : 1);
};

const BookmarkedJobsScreen = ({ navigation }) => {
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme] || themeStyles.light;
  const styles = getStyles(currentTheme);

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  const loadBookmarks = async () => {
    try {
      const data = await apiService.getBookmarkedJobs(1, 50);
      setJobs(Array.isArray(data) ? data : []);
      setLoadFailed(false);
    } catch (error) {
      console.warn("Could not load bookmarked jobs:", error?.message);
      setLoadFailed(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Reload every time the screen is opened, so jobs un-bookmarked on the job page disappear
  useFocusEffect(
    useCallback(() => {
      loadBookmarks();
    }, [])
  );

  const openJob = (job) => {
    const client = job.client || null;
    const clientProfileImage = client?.profilePhoto || PLACEHOLDER_PROFILE;
    const full_name = client?.user?.fullName || client?.companyName || "Unknown User";
    const title = job.jobTitle || job.title || "Untitled Job";
    navigation.navigate("JobDescription", {
      job: {
        ...job,
        id: job.id,
        title,
        budget: job.budgetAmount || job.budget || 0,
        deadline: job.deadlineDate || job.deadline,
        description: job.jobDescription || job.description || "",
        clientId: client?.companyName,
        client,
      },
      clientProfileImage,
      full_name,
    });
  };

  const renderJob = ({ item: job }) => {
    const title = job.jobTitle || job.title || "Untitled Job";
    const budget = job.budgetAmount || job.budget || 0;
    return (
      <TouchableOpacity style={styles.card} onPress={() => openJob(job)} activeOpacity={0.8}>
        <Image
          source={{
            uri: job.service?.imageUrl
              ? apiService.loadImageURI(job.service.imageUrl)
              : `${PLACEHOLDER_SERVICE_IMAGE}${encodeURIComponent(job.service?.name || "job")}/200/200`,
          }}
          style={styles.avatar}
        />
        <View style={styles.cardBody}>
          <Text style={styles.jobTitle} numberOfLines={2}>
            {title}
          </Text>
          {!!job.service?.name && (
            <Text style={styles.serviceName} numberOfLines={1}>
              {job.service.name}
            </Text>
          )}
          <Text style={styles.meta}>Budget: ₹{Number(budget).toFixed(2)}</Text>
          <Text style={styles.meta}>Deadline: {formatDeadlineDays(job)}</Text>
        </View>
        <Bookmark size={20} color="#762BAD" weight="fill" />
      </TouchableOpacity>
    );
  };

  const emptyText = loadFailed
    ? "Couldn't load bookmarked jobs. Pull down to try again."
    : "You haven't bookmarked any jobs yet. Tap the bookmark icon on a job to save it here.";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton} activeOpacity={0.7}>
          <ArrowLeft size={24} color={currentTheme.text || "#000"} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bookmarked Jobs</Text>
        <View style={{ width: 44 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <SafeSpinner size="large" color="#762BAD" />
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item, index) => String(item.id || index)}
          renderItem={renderJob}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Bookmark size={36} color="#A78BFA" />
              <Text style={styles.emptyText}>{emptyText}</Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadBookmarks();
              }}
              colors={["#762BAD"]}
              tintColor="#762BAD"
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const getStyles = (currentTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background || "#fff",
    },
    header: {
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
      backgroundColor: currentTheme.isDark ? "#2A2A2A" : "#F3E8FF",
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: currentTheme.text || "#000",
    },
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    listContent: {
      paddingHorizontal: 20,
      paddingBottom: 32,
      flexGrow: 1,
    },
    card: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: currentTheme.cardBackground || (currentTheme.isDark ? "#1E1E1E" : "#FFFFFF"),
      borderRadius: 14,
      borderWidth: 1,
      borderColor: currentTheme.border || "#F3E8FF",
      padding: 12,
      marginBottom: 12,
    },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      marginRight: 12,
    },
    cardBody: {
      flex: 1,
      marginRight: 8,
    },
    jobTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: currentTheme.text || "#000",
    },
    serviceName: {
      fontSize: 12,
      color: "#762BAD",
      fontWeight: "600",
      marginTop: 2,
    },
    meta: {
      fontSize: 12,
      color: currentTheme.subText || "#666",
      marginTop: 3,
    },
    emptyBox: {
      alignItems: "center",
      paddingVertical: 60,
      paddingHorizontal: 32,
      gap: 12,
    },
    emptyText: {
      fontSize: 14,
      color: currentTheme.subText || "#666",
      textAlign: "center",
      lineHeight: 20,
    },
  });

export default BookmarkedJobsScreen;
