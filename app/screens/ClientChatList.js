import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import SafeSpinner from "../components/SafeSpinner";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  ChatCircleDots,
  ChatCircleText,
  CheckCircle,
  Clock,
  Prohibit,
  WarningCircle,
} from "phosphor-react-native";
import { format, isValid, isToday, isYesterday } from "date-fns";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/NewAuthContext";
import { useTheme } from "../context/ThemeContext";
import apiService from "../lib/apiService";

const PURPLE = "#7B2CFF";
const SOFT_PURPLE = "#F3EAFF";
const BORDER = "#E7E1EF";

const getThreadStatusMeta = (thread, isDark = false) => {
  const jobStatus = (thread.jobStatus || thread.job?.status || thread.jobData?.status || "").toUpperCase();
  const threadStatus = (thread.status || "").toUpperCase();

  if (jobStatus === "COMPLETED" || threadStatus === "COMPLETED") {
    return {
      label: "Completed",
      color: isDark ? "#4ADE80" : "#22C55E",
      bg: isDark ? "rgba(34,197,94,0.18)" : "#EAF8EF",
      Icon: CheckCircle,
    };
  }
  if (threadStatus === "REJECTED" || jobStatus === "CANCELLED" || jobStatus === "REJECTED") {
    return {
      label: "Rejected",
      color: isDark ? "#F87171" : "#EF4444",
      bg: isDark ? "rgba(239,68,68,0.2)" : "#FDECEC",
      Icon: Prohibit,
    };
  }
  if (threadStatus === "BLOCKED") {
    return {
      label: "Blocked",
      color: isDark ? "#FB923C" : "#F97316",
      bg: isDark ? "rgba(249,115,22,0.2)" : "#FFF4E8",
      Icon: WarningCircle,
    };
  }
  if (
    (jobStatus === "IN_PROGRESS" || jobStatus === "ASSIGNED" || jobStatus === "ACTIVE") &&
    (threadStatus === "ACCEPTED" || thread.isAccepted)
  ) {
    return {
      label: "Active",
      color: isDark ? "#4ADE80" : "#16A34A",
      bg: isDark ? "rgba(22,163,74,0.2)" : "#EAF8EF",
      Icon: CheckCircle,
    };
  }
  if (jobStatus === "IN_PROGRESS" || threadStatus === "ACCEPTED" || threadStatus === "PENDING") {
    return {
      label: threadStatus === "PENDING" ? "Pending" : "In progress",
      color: isDark ? "#60A5FA" : "#2563EB",
      bg: isDark ? "rgba(37,99,235,0.22)" : "#EAF1FF",
      Icon: Clock,
    };
  }
  if (jobStatus === "OPEN") {
    return {
      label: "Open",
      color: isDark ? "#A78BFA" : "#7B2CFF",
      bg: isDark ? "rgba(123,44,255,0.2)" : "#F3EAFF",
      Icon: ChatCircleDots,
    };
  }
  return {
    label: threadStatus || jobStatus || "Chat",
    color: isDark ? "#FBBF24" : "#F59E0B",
    bg: isDark ? "rgba(245,158,11,0.2)" : "#FFF6DF",
    Icon: Clock,
  };
};

const formatMessageTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (!isValid(date)) return "";
  if (isToday(date)) return format(date, "hh:mm a");
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMM d");
};

const ClientChatList = () => {
  const [chatThreads, setChatThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const { userData } = useAuth();
  const navigation = useNavigation();
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const isDark = theme === "dark";
  const styles = useMemo(() => getStyles(currentTheme, isDark), [currentTheme, isDark]);
  const accent = isDark ? "#B794FF" : PURPLE;

  const summary = useMemo(() => {
    const total = chatThreads.length;
    const active = chatThreads.filter((thread) => {
      const meta = getThreadStatusMeta(thread);
      return meta.label === "Active" || meta.label === "In progress" || meta.label === "Open";
    }).length;
    const completed = chatThreads.filter(
      (thread) => getThreadStatusMeta(thread).label === "Completed"
    ).length;
    return { total, active, completed };
  }, [chatThreads]);

  const fetchChatThreads = useCallback(
    async (isRefreshing = false) => {
      if (!isRefreshing) setLoading(true);
      setError(false);
      try {
        await apiService.init();
        const clientId = userData?.client?.id;
        if (!clientId) {
          setChatThreads([]);
          return;
        }
        const response = await apiService.getClientConversations(clientId);
        const threads = Array.isArray(response) ? response : [];
        setChatThreads(
          threads.map((conv) => ({
            ...conv,
            isStarred: conv.isStarred || false,
          }))
        );
      } catch (err) {
        console.log("Error fetching chat threads:", err);
        if (!err?.isAuthError) setError(true);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userData?.client?.id]
  );

  useFocusEffect(
    useCallback(() => {
      fetchChatThreads();
    }, [fetchChatThreads])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchChatThreads(true);
  };

  const openChat = (item) => {
    navigation.navigate("ClientChat", {
      threadId: item.id,
      freelancer: item.otherUser,
      projectId: item.jobId,
      jobId: item.jobId,
      jobData: {
        id: item.jobId,
        jobTitle: item.jobTitle,
        jobStatus: item.jobStatus,
        deadlineDate: item.deadlineDate,
        title: item.jobTitle,
        status: item.jobStatus,
      },
      receiverId: item.otherUser?.userId,
      full_name: item.otherUser?.user?.fullName,
    });
  };

  const renderChatThread = ({ item }) => {
    const status = getThreadStatusMeta(item, isDark);
    const StatusIcon = status.Icon;
    const freelancerName = item.otherUser?.user?.fullName || "Freelancer";
    const jobTitle = item.jobTitle || item.job?.jobTitle || item.jobData?.title || "Untitled job";
    const lastMessage = item.lastMessage || "No messages yet";
    const timeLabel = formatMessageTime(item.lastMessageAt || item.updatedAt);
    const profileImage = item.otherUser?.profilePhoto
      ? { uri: apiService.loadImageURI(item.otherUser.profilePhoto) }
      : require("../assets/profile.png");

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => openChat(item)}
        activeOpacity={0.86}
      >
        <View style={styles.cardTop}>
          <View style={styles.avatarWrap}>
            <Image source={profileImage} style={styles.avatar} />
            <View style={[styles.statusDot, { backgroundColor: status.color }]} />
          </View>

          <View style={styles.cardBody}>
            <View style={styles.titleRow}>
              <Text style={styles.jobTitle} numberOfLines={1}>
                {jobTitle}
              </Text>
              {!!timeLabel && <Text style={styles.timeText}>{timeLabel}</Text>}
            </View>
            <Text style={styles.username} numberOfLines={1}>
              @{freelancerName}
            </Text>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {lastMessage}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
            <StatusIcon size={13} color={status.color} weight="fill" />
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
          <View style={styles.openChatHint}>
            <ChatCircleText size={16} color={accent} weight="fill" />
            <Text style={styles.openChatText}>Open chat</Text>
            <Ionicons name="chevron-forward" size={16} color={styles.chevronColor.color} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color={currentTheme.text || "#000"} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Client Inbox</Text>
          <Text style={styles.headerSubtitle}>Your job conversations</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Ionicons name="refresh" size={22} color={PURPLE} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={loading ? [] : chatThreads}
        keyExtractor={(item) => item.id}
        renderItem={renderChatThread}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          !loading && !error ? (
            <View style={styles.summaryRow}>
              <SummaryItem styles={styles} label="Total" value={summary.total} />
              <SummaryItem styles={styles} label="Active" value={summary.active} />
              <SummaryItem styles={styles} label="Done" value={summary.completed} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.stateContainer}>
              <SafeSpinner size={24} color={PURPLE} />
              <Text style={styles.stateText}>Loading conversations...</Text>
            </View>
          ) : error ? (
            <View style={styles.stateContainer}>
              <Ionicons name="warning-outline" size={38} color="#EF4444" />
              <Text style={styles.stateTitle}>Failed to load inbox</Text>
              <Text style={styles.stateText}>Please try again in a moment.</Text>
              <TouchableOpacity onPress={() => fetchChatThreads()} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.stateContainer}>
              <ChatCircleDots size={46} color={accent} />
              <Text style={styles.stateTitle}>No conversations yet</Text>
              <Text style={styles.stateText}>
                When freelancers message you about a job, threads will show up here.
              </Text>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.secondaryButton}
              >
                <Ionicons name="arrow-back" size={18} color={PURPLE} />
                <Text style={styles.secondaryButtonText}>Go back</Text>
              </TouchableOpacity>
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

const getStyles = (currentTheme, isDark) => {
  const surface = currentTheme.background || "#FFFFFF";
  const card = currentTheme.cardBackground || surface;
  const text = currentTheme.text || "#101114";
  const muted = currentTheme.subText || "#656B7A";
  const border = currentTheme.border || BORDER;
  const accentSoft = isDark ? "#2A2034" : "#F7F2FF";
  const accentLink = isDark ? "#B794FF" : PURPLE;

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: surface,
    },
    header: {
      minHeight: 68,
      paddingHorizontal: 22,
      paddingTop: 4,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: surface,
    },
    backButton: {
      width: 44,
      height: 44,
      justifyContent: "center",
      alignItems: "flex-start",
    },
    headerCenter: {
      flex: 1,
      alignItems: "center",
      paddingHorizontal: 8,
    },
    headerTitle: {
      color: text,
      fontSize: 24,
      fontWeight: "900",
      textAlign: "center",
    },
    headerSubtitle: {
      color: muted,
      fontSize: 13,
      fontWeight: "600",
      marginTop: 2,
      textAlign: "center",
    },
    refreshButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: accentSoft,
    },
    listContainer: {
      paddingHorizontal: 20,
      paddingBottom: 110,
      flexGrow: 1,
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
    card: {
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
    cardTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    avatarWrap: {
      position: "relative",
    },
    avatar: {
      width: 58,
      height: 58,
      borderRadius: 18,
      backgroundColor: isDark ? currentTheme.background3 : SOFT_PURPLE,
      borderWidth: 1,
      borderColor: border,
    },
    statusDot: {
      position: "absolute",
      right: -1,
      bottom: -1,
      width: 14,
      height: 14,
      borderRadius: 7,
      borderWidth: 2,
      borderColor: card,
    },
    cardBody: {
      flex: 1,
      minWidth: 0,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    jobTitle: {
      flex: 1,
      color: text,
      fontSize: 16,
      fontWeight: "900",
    },
    timeText: {
      color: muted,
      fontSize: 11,
      fontWeight: "700",
    },
    username: {
      color: accentLink,
      fontSize: 13,
      fontWeight: "800",
      marginTop: 3,
    },
    lastMessage: {
      color: muted,
      fontSize: 13,
      fontWeight: "600",
      marginTop: 4,
    },
    cardFooter: {
      marginTop: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    statusPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
    },
    statusText: {
      fontSize: 12,
      fontWeight: "900",
    },
    openChatHint: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    openChatText: {
      color: accentLink,
      fontSize: 13,
      fontWeight: "900",
    },
    chevronColor: {
      color: muted,
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
    secondaryButton: {
      marginTop: 18,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderRadius: 12,
      backgroundColor: accentSoft,
      paddingHorizontal: 18,
      paddingVertical: 12,
    },
    secondaryButtonText: {
      color: PURPLE,
      fontSize: 15,
      fontWeight: "900",
    },
  });
};

export default ClientChatList;
