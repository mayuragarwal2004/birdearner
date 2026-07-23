import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  ChatCircleText,
  Star,
  Briefcase,
  Medal,
  UsersThree,
} from "phosphor-react-native";
import { useTheme } from "../context/ThemeContext";
import apiService from "../lib/apiService";

const PURPLE = "#7B2CFF";
const SOFT_PURPLE = "#F3EAFF";
const BORDER = "#E7E1EF";

const formatExperience = (experience) => {
  const months = Number(experience || 0);
  if (!months) return "New";
  const years = months / 12;
  if (years < 1) return `${months} mo`;
  const rounded = Number.isInteger(years) ? years : years.toFixed(1);
  return `${rounded} yr${years === 1 ? "" : "s"}`;
};

const AppliersScreen = ({ navigation, route }) => {
  const { title, jobId, job, proposalCount } = route.params || {};
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const isDark = theme === "dark";
  const styles = useMemo(() => getStyles(currentTheme, isDark), [currentTheme, isDark]);

  const [freelancers, setFreelancers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const summary = useMemo(() => {
    const total = freelancers.length;
    const accepted = freelancers.filter(
      (item) => item.isAccepted || job?.assignedFreelancerId === item.id
    ).length;
    return { total, accepted };
  }, [freelancers, job?.assignedFreelancerId]);

  const fetchApplicants = async () => {
    setError(false);
    try {
      await apiService.init();
      const response = await apiService.makeRequest(`/jobs/${jobId}/applicants`);
      if (response.success) {
        setFreelancers(Array.isArray(response.data) ? response.data : []);
      } else {
        setError(true);
        Alert.alert("Error", "Failed to fetch applicants");
      }
    } catch (err) {
      setError(true);
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchApplicants();
  }, [jobId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchApplicants();
  };

  const handleNavigateToChat = (freelancer) => {
    navigation.navigate("ClientChat", {
      jobId,
      full_name: freelancer?.user?.fullName || freelancer?.fullName,
      freelancer,
      receiverId: freelancer.userId,
    });
  };

  const isAccepted = (item) =>
    !!item.isAccepted || job?.assignedFreelancerId === item?.id;

  const renderItem = ({ item }) => {
    const accepted = isAccepted(item);
    const accent = isDark ? "#B794FF" : PURPLE;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleNavigateToChat(item)}
        activeOpacity={0.86}
      >
        <View style={styles.cardTop}>
          <View style={styles.avatarWrap}>
            <Image
              source={
                item.profilePhoto
                  ? { uri: apiService.loadImageURI(item.profilePhoto) }
                  : require("../assets/logo.png")
              }
              style={styles.avatar}
            />
            {accepted && (
              <View style={styles.acceptedDot}>
                <Ionicons name="checkmark" size={12} color="#FFFFFF" />
              </View>
            )}
          </View>

          <View style={styles.cardBody}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {item?.user?.fullName || "Freelancer"}
              </Text>
              {accepted && (
                <View style={styles.acceptedPill}>
                  <Text style={styles.acceptedPillText}>Accepted</Text>
                </View>
              )}
            </View>
            <Text style={styles.heading} numberOfLines={2}>
              {item.profileHeading || "Freelancer"}
            </Text>
          </View>

          <View style={styles.chatIcon}>
            <ChatCircleText size={22} color={accent} weight="fill" />
          </View>
        </View>

        <View style={styles.metaRow}>
          <MetaChip
            styles={styles}
            icon={<Briefcase size={14} color={accent} />}
            label={formatExperience(item.experience)}
          />
          <MetaChip
            styles={styles}
            icon={<Star size={14} color={accent} weight="fill" />}
            label={`${Number(item.rating || 0).toFixed(1)}/5`}
          />
          <MetaChip
            styles={styles}
            icon={<Medal size={14} color={accent} />}
            label={`Level ${item.level || 1}`}
          />
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.chatHint}>Tap to open chat</Text>
          <Ionicons name="chevron-forward" size={18} color={styles.chevronColor.color} />
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
          <Text style={styles.headerTitle}>Applicants</Text>
          {!!title && (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {title}
            </Text>
          )}
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Ionicons name="refresh" size={22} color={PURPLE} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={loading ? [] : freelancers}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          !loading && !error ? (
            <View style={styles.summaryRow}>
              <SummaryItem
                styles={styles}
                label="Total"
                value={summary.total || proposalCount || 0}
              />
              <SummaryItem styles={styles} label="Accepted" value={summary.accepted} />
              <SummaryItem
                styles={styles}
                label="Pending"
                value={Math.max(summary.total - summary.accepted, 0)}
              />
            </View>
          ) : null
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.stateContainer}>
              <ActivityIndicator size="large" color={PURPLE} />
              <Text style={styles.stateText}>Loading applicants...</Text>
            </View>
          ) : error ? (
            <View style={styles.stateContainer}>
              <Ionicons name="warning-outline" size={38} color="#EF4444" />
              <Text style={styles.stateTitle}>Failed to load applicants</Text>
              <Text style={styles.stateText}>Please try again in a moment.</Text>
              <TouchableOpacity onPress={fetchApplicants} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.stateContainer}>
              <UsersThree size={46} color={isDark ? "#B794FF" : PURPLE} />
              <Text style={styles.stateTitle}>No applicants yet</Text>
              <Text style={styles.stateText}>
                Freelancers who apply to this job will show up here.
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

function MetaChip({ styles, icon, label }) {
  return (
    <View style={styles.metaChip}>
      {icon}
      <Text style={styles.metaChipText}>{label}</Text>
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
  const acceptedBg = isDark ? "rgba(34,197,94,0.18)" : "#EAF8EF";
  const acceptedColor = isDark ? "#4ADE80" : "#22C55E";

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
    acceptedDot: {
      position: "absolute",
      right: -2,
      bottom: -2,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: acceptedColor,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: card,
    },
    cardBody: {
      flex: 1,
      minWidth: 0,
    },
    nameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    name: {
      flexShrink: 1,
      color: text,
      fontSize: 17,
      fontWeight: "900",
    },
    acceptedPill: {
      backgroundColor: acceptedBg,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
    },
    acceptedPillText: {
      color: acceptedColor,
      fontSize: 11,
      fontWeight: "900",
    },
    heading: {
      color: muted,
      fontSize: 13,
      fontWeight: "600",
      marginTop: 4,
      lineHeight: 18,
    },
    chatIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: accentSoft,
    },
    metaRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 14,
    },
    metaChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: border,
      backgroundColor: isDark ? currentTheme.background3 : "#FBFAFE",
    },
    metaChipText: {
      color: text,
      fontSize: 12,
      fontWeight: "700",
    },
    cardFooter: {
      marginTop: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    chatHint: {
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

export default AppliersScreen;
