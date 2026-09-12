import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import {
  Bell,
  Crown,
  Clock,
  Flag,
  ChatCircleText,
  Wallet,
  CreditCard,
  ArrowCircleUp,
  ClipboardText,
  ListDashes,
  XCircle,
  Sparkle,
  ChatCircleDots,
  Star,
  Megaphone,
  ShoppingBag,
} from "phosphor-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../context/NewAuthContext";
import { useTheme } from "../context/ThemeContext";
import { useNavigation } from "@react-navigation/native";
import apiService from "../lib/apiService";

const parseArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return value ? [value] : [];
    }
  }
  return [];
};

const getFreelancerProfileCompletion = (userData, userProfile) => {
  const profile = userData?.freelancer || (userProfile?.freelancerCategory || userProfile?.selectedServices || userProfile?.profileHeading ? userProfile : {});
  if (!profile || (Object.keys(profile).length === 0 && !userData?.freelancer)) {
    return 0;
  }

  let completed = 0;
  const total = 15;

  // 1. Name
  if (userData?.fullName) completed += 1;

  // 2. Email
  if (userData?.email) completed += 1;

  // 3. Phone
  if (userData?.mobile || profile?.mobileNumber) completed += 1;

  // 4. Profile photo
  if (profile?.profilePhoto || userData?.profilePhoto || profile?.coverPhoto) completed += 1;

  // 5. Freelancer type / Organization type
  if (profile?.freelancerCategory || profile?.organizationType || profile?.companyName) completed += 1;

  // 6. Write about yourself / Bio / Heading / Description
  if (profile?.profileHeading || profile?.profileDescription || profile?.bio) completed += 1;

  // 7. Date of birth
  if (userData?.dob) completed += 1;

  // 8. Gender
  if (userData?.gender) completed += 1;

  // 9. Experience / Qualification
  if ((profile?.experience !== null && profile?.experience !== undefined) || profile?.highestQualification) completed += 1;

  // 10. Location (City / State / Country / Address)
  if (profile?.city || profile?.state || profile?.country || (userData?.addresses && userData.addresses.length > 0)) completed += 1;

  // 11. Languages
  if (parseArray(profile?.languages).length > 0) completed += 1;

  // 12. Skills
  if (parseArray(profile?.skills).length > 0) completed += 1;

  // 13. Certification
  if (parseArray(profile?.certifications).length > 0) completed += 1;

  // 14. Services (at least 1)
  if (parseArray(profile?.selectedServices).length > 0) completed += 1;

  // 15. Portfolio (at least 1 image or PDF)
  if (parseArray(profile?.portfolioImages).length > 0) completed += 1;

  return Math.round((completed / total) * 100);
};

const HomeScreen = () => {
  const { userData, userProfile } = useAuth();
  const [profilePercentage, setProfilePercentage] = useState(20);
  const [flagsCount, setFlagsCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [CompletedOrders, setCompletedOrders] = useState(0);
  const [activeOrders, setActiveOrders] = useState(0);
  const [cancelledOrders, setCancelledOrdersOrders] = useState(0);
  const [successScore, setSuccessScore] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const navigation = useNavigation();

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const isDark = theme === "dark";

  const styles = getStyles(currentTheme, isDark);

  const fetchOrderRecords = async () => {
    try {
      setCancelledOrdersOrders(0);
      setActiveOrders(0);
      setCompletedOrders(0);
      setSuccessScore(0);
    } catch (error) {
      throw error;
    }
  };

  const fetchNotifications = async () => {
    try {
      if (userData?.id) {
        setLoadingNotifications(true);
        const response = await apiService.getNotifications(userData.id, 1);
        if (response && response.data) {
          setNotifications(response.data.slice(0, 5));
        }
      }
    } catch (error) {
      console.error("Error fetching notifications in Home:", error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    fetchOrderRecords();
    if (userData?.id) {
      fetchNotifications();
    }
  }, [userData]);

  useEffect(() => {
    setProfilePercentage(getFreelancerProfileCompletion(userData, userProfile));
    setFlagsCount(0);
  }, [userData, userProfile]);

  const handleCompleteProfile = () => {
    const profileData = userProfile || userData?.freelancer || null;
    const mode = profileData?.id ? "update" : "create";
    const params = {
      mode,
      profileData,
      title: mode === "update" ? "Complete Freelancer Profile" : "Create Freelancer Profile",
    };

    const rootNavigation =
      navigation.getParent?.()?.getParent?.() ||
      navigation.getParent?.() ||
      navigation;

    rootNavigation.navigate("FreelancerSignup", params);
  };

  const formatAmount = (xp) => {
    if (!xp || xp === 0) return "0";
    if (xp >= 1000000) {
      return (xp / 1000000).toFixed(1) + "M";
    } else if (xp >= 1000) {
      return (xp / 1000).toFixed(1) + "K";
    } else {
      return xp;
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrderRecords();
    fetchNotifications();
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.safeContainer}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#5B21B6"]}
            progressBackgroundColor={currentTheme.cardBackground || "#fff"}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <View style={styles.headerTitleCol}>
            <Text style={styles.welcomeText}>Welcome Back,</Text>
            <Text style={styles.usernameText}>
              {userData?.fullName || "Irshad Khan"}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.notificationIcon}
            onPress={() => navigation.navigate("Notification")}
          >
            <Bell size={22} color="#FFF" weight="fill" />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>

        {/* Profile Overview Widget */}
        <LinearGradient
          colors={["#4C1D95", "#2E1065"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.widgetCardPurple}
        >
          <View style={styles.widgetHeader}>
            <View style={styles.widgetHeaderLeft}>
              <Crown size={22} color="#FFF" weight="regular" />
              <Text style={styles.widgetTitleWhite}>Profile Overview</Text>
            </View>
            <TouchableOpacity
              style={styles.viewDetailsBtnWhite}
              onPress={() => navigation.navigate("ProfileOverview")}
            >
              <Text style={styles.viewDetailsTextWhite}>View Details {">"}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.profileInnerCard}>
            {/* Left Side: Level Circle */}
            <View style={styles.levelSection}>
              <View style={styles.levelCircle}>
                <Text style={styles.levelLabel}>Level</Text>
                <Text style={styles.levelNumber}>1</Text>
                <Text style={styles.levelStatus}>New</Text>
              </View>
              <View style={styles.levelStarBadge}>
                <Star size={12} color="#FFF" weight="fill" />
              </View>
            </View>

            {/* Vertical Divider */}
            <View style={styles.verticalDivider} />

            {/* Right Side: Stats Grid */}
            <View style={styles.profileStatsSection}>
              {/* Top Row: Success Score & Rating */}
              <View style={styles.profileStatsRowTop}>
                <View style={styles.profileStatItemSmall}>
                  <Clock size={18} color="#5B21B6" />
                  <View style={styles.profileStatTextCol}>
                    <Text style={styles.profileStatValue}>{successScore}%</Text>
                    <Text style={styles.profileStatLabel}>Success Score</Text>
                  </View>
                </View>
                <View style={styles.gridVerticalDivider} />
                <View style={styles.profileStatItemSmall}>
                  <Star size={18} color="#5B21B6" weight="regular" />
                  <View style={styles.profileStatTextCol}>
                    <Text style={styles.profileStatValue}>0</Text>
                    <Text style={styles.profileStatLabel}>Rating</Text>
                  </View>
                </View>
              </View>

              {/* Horizontal Line */}
              <View style={styles.gridHorizontalDivider} />

              {/* Bottom Row: Avg Response, Flags, Response Rate */}
              <View style={styles.profileStatsRowBottom}>
                <View style={styles.profileStatItemMicro}>
                  <Clock size={16} color="#5B21B6" />
                  <View style={styles.profileStatTextCol}>
                    <Text style={styles.profileStatValue}>1 hr</Text>
                    <Text style={styles.profileStatLabel}>Avg. Response Time</Text>
                  </View>
                </View>
                <View style={styles.gridVerticalDividerSmall} />
                <View style={styles.profileStatItemMicro}>
                  <Flag size={16} color="#5B21B6" />
                  <View style={styles.profileStatTextCol}>
                    <Text style={styles.profileStatValue}>NA</Text>
                    <Text style={styles.profileStatLabel}>Flags</Text>
                  </View>
                </View>
                <View style={styles.gridVerticalDividerSmall} />
                <View style={styles.profileStatItemMicro}>
                  <ChatCircleText size={16} color="#5B21B6" />
                  <View style={styles.profileStatTextCol}>
                    <Text style={styles.profileStatValue}>0%</Text>
                    <Text style={styles.profileStatLabel}>Response Rate</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Earnings Overview Widget */}
        <View style={styles.widgetCardWhite}>
          <View style={styles.widgetHeader}>
            <View style={styles.widgetHeaderLeft}>
              <View style={[styles.iconCircle, { backgroundColor: "#F3E8FF" }]}>
                <Wallet size={16} color="#6B21A8" weight="fill" />
              </View>
              <Text style={styles.widgetTitleDark}>Earnings Overview</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate("EarningsOverview")}>
              <Text style={styles.viewDetailsTextPurple}>View Details {">"}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsCardInnerContainer}>
            <StatItem
              icon={<Wallet size={18} color="#6B21A8" weight="fill" />}
              iconBg="#F3E8FF"
              value={`Rs. ${formatAmount(0)}`}
              label="Total Earnings"
              styles={styles}
            />
            <View style={styles.statsColumnDivider} />
            <StatItem
              icon={<CreditCard size={18} color="#16A34A" weight="fill" />}
              iconBg="#DCFCE7"
              value={`Rs. ${formatAmount(0)}`}
              label="Monthly Earnings"
              styles={styles}
            />
            <View style={styles.statsColumnDivider} />
            <StatItem
              icon={<Clock size={18} color="#EA580C" weight="fill" />}
              iconBg="#FFEDD5"
              value={`Rs. ${formatAmount(0)}`}
              label="Outstanding"
              styles={styles}
            />
            <View style={styles.statsColumnDivider} />
            <StatItem
              icon={<ArrowCircleUp size={18} color="#DC2626" weight="fill" />}
              iconBg="#FEE2E2"
              value={`Rs. ${formatAmount(0)}`}
              label="Withdrawal"
              styles={styles}
            />
          </View>
        </View>

        {/* Orders Overview Widget */}
        <View style={styles.widgetCardWhite}>
          <View style={styles.widgetHeader}>
            <View style={styles.widgetHeaderLeft}>
              <View style={[styles.iconCircle, { backgroundColor: "#F3E8FF" }]}>
                <ShoppingBag size={16} color="#6B21A8" weight="fill" />
              </View>
              <Text style={styles.widgetTitleDark}>Orders Overview</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate("OrdersOverview")}>
              <Text style={styles.viewDetailsTextPurple}>View Details {">"}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsCardInnerContainer}>
            <StatItem
              icon={<ClipboardText size={18} color="#6B21A8" weight="fill" />}
              iconBg="#F3E8FF"
              value={String(CompletedOrders || 0)}
              label="Orders Completed"
              styles={styles}
            />
            <View style={styles.statsColumnDivider} />
            <StatItem
              icon={<ListDashes size={18} color="#0284C7" weight="fill" />}
              iconBg="#E0F2FE"
              value={String(activeOrders || 0)}
              label="Active Orders"
              styles={styles}
            />
            <View style={styles.statsColumnDivider} />
            <StatItem
              icon={<XCircle size={18} color="#D97706" weight="fill" />}
              iconBg="#FEF3C7"
              value={String(cancelledOrders || 0)}
              label="Cancelled Orders"
              styles={styles}
            />
          </View>
        </View>

        {/* Complete Profile Widget */}
        <View style={styles.completeProfileWidget}>
          {/* Left Graphic Illustration */}
          <View style={styles.clipboardGraphicContainer}>
            <View style={styles.clipboardBoard}>
              <View style={styles.clipboardHeaderBar} />
              <View style={styles.clipboardBody}>
                <View style={styles.clipboardAvatarCircle}>
                  <Ionicons name="person" size={20} color="#7C3AED" />
                </View>
                <View style={styles.clipboardTextLines}>
                  <View style={styles.clipboardLineLong} />
                  <View style={styles.clipboardLineShort} />
                </View>
              </View>
              {/* Pencil edit graphic */}
              <View style={styles.pencilGraphic}>
                <Ionicons name="pencil" size={14} color="#FFF" />
              </View>
            </View>
            <Sparkle size={10} color="#A855F7" weight="fill" style={{ position: 'absolute', top: 4, left: 2 }} />
            <Sparkle size={12} color="#A855F7" weight="fill" style={{ position: 'absolute', bottom: 8, right: 0 }} />
          </View>

          {/* Right Text & Progress */}
          <View style={styles.completeProfileRight}>
            <Text style={styles.completeProfileTitle}>
              {profilePercentage >= 100 ? "Profile Complete" : "Complete Your Profile"}
            </Text>
            <Text style={styles.completeProfileSubtitle}>
              Your profile is {String(profilePercentage)}% complete
            </Text>

            <View style={styles.progressBlocks}>
              <View style={[styles.progressBlock, profilePercentage >= 20 ? styles.bgRed : styles.bgGray]} />
              <View style={[styles.progressBlock, profilePercentage >= 40 ? styles.bgOrange : styles.bgGray]} />
              <View style={[styles.progressBlock, profilePercentage >= 60 ? styles.bgYellow : styles.bgGray]} />
              <View style={[styles.progressBlock, profilePercentage >= 80 ? styles.bgPurple : styles.bgGray]} />
              <View style={[styles.progressBlock, profilePercentage >= 100 ? styles.bgGreen : styles.bgGray]} />
            </View>

            <TouchableOpacity style={styles.completeNowBtn} onPress={handleCompleteProfile}>
              <Text style={styles.completeNowText}>
                {profilePercentage >= 100 ? "Edit Profile >" : "Complete Now >"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Smart Messages Box */}
        <View style={styles.smartMessagesBox}>
          <View style={styles.smartMessagesLeft}>
            <View style={styles.smartMessagesIconBg}>
              <ChatCircleDots size={22} color="#FFF" weight="fill" />
            </View>
            <View style={styles.smartMessagesTextCol}>
              <Text style={styles.smartMessagesTitle}>Smart Messages</Text>
              <Text style={styles.smartMessagesSubtitle}>You have 0 unread messages</Text>
              <Text style={styles.smartMessagesDesc}>Stay connected and reply to clients.</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.viewMessagesBtn}
            onPress={() =>
              navigation.navigate(
                userData?.role === "FREELANCER" ? "FreelancerChatList" : "ClientChatList"
              )
            }
          >
            <ChatCircleDots size={14} color="#6B21A8" weight="regular" />
            <Text style={styles.viewMessagesText}>View Messages</Text>
          </TouchableOpacity>
        </View>

        {/* What's New Card */}
        <TouchableOpacity
          style={styles.whatsNewBox}
          activeOpacity={0.8}
          onPress={() => navigation.navigate("Notification")}
        >
          <View style={styles.whatsNewLeft}>
            <View style={styles.whatsNewIconBg}>
              <Megaphone size={20} color="#6B21A8" weight="fill" />
            </View>
            <View style={styles.whatsNewTextCol}>
              <Text style={styles.whatsNewTitle}>What's New</Text>
              <Text style={styles.whatsNewSubtitle}>
                Stay updated with the latest notifications and updates.
              </Text>
            </View>
          </View>
          <View style={styles.whatsNewBellGraphic}>
            <View style={styles.whatsNewBellCircle}>
              <Bell size={20} color="#FFF" weight="fill" />
              <View style={styles.whatsNewBellBadge} />
            </View>
          </View>
        </TouchableOpacity>

        {/* Outstanding balance prompt if any */}
        {userProfile?.withdrawableAmount < 0 && (
          <View style={styles.sectionContainer}>
            <View style={[styles.profileContainers, { backgroundColor: "#FFF5F5", borderColor: "#FFD2D2", borderWidth: 1 }]}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                <Ionicons name="warning" size={24} color="#FF3B30" />
                <Text style={[styles.profileText, { color: "#FF3B30", marginLeft: 10 }]}>Outstanding Balance</Text>
              </View>
              <Text style={{ fontSize: 14, color: "#666", textAlign: "center", marginBottom: 10 }}>
                You have an outstanding balance of ₹{Math.abs(userProfile.withdrawableAmount).toFixed(2)}.
                Please settle it to continue applying for new jobs.
              </Text>
              <TouchableOpacity
                style={[styles.loginButton, { backgroundColor: "#FF3B30", marginTop: 15 }]}
                onPress={() =>
                  (navigation.getParent?.()?.navigate
                    ? navigation.getParent()?.navigate("Home", { screen: "SettleBalance" })
                    : navigation.navigate("SettleBalance"))
                }
              >
                <Text style={styles.loginButtonText}>Settle Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Floating Chat Icon */}
      <View style={styles.stickyButton}>
        <TouchableOpacity
          style={styles.chatIcon}
          onPress={() =>
            navigation.navigate(
              userData?.role === "FREELANCER"
                ? "FreelancerChatList"
                : "ClientChatList"
            )
          }
        >
          <FontAwesome name="comments" size={26} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const StatItem = ({ icon, iconBg, value, label, styles }) => {
  return (
    <View style={styles.statItemContainer}>
      <View style={[styles.statIconCircle, { backgroundColor: iconBg }]}>
        {icon}
      </View>
      <Text style={styles.statValueText}>{value}</Text>
      <Text style={styles.statLabelText}>{label}</Text>
    </View>
  );
};

const getStyles = (currentTheme, isDark) => {
  const bg = currentTheme.background || "#F8FAFC";
  const cardBg = currentTheme.cardBackground || (isDark ? "#1E1E1E" : "#FFFFFF");
  const text = currentTheme.text || "#0F172A";
  const subText = currentTheme.subText || "#64748B";
  const border = currentTheme.border || (isDark ? "#2E2E2E" : "#F1F5F9");

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: bg,
    },
    safeContainer: {
      flex: 1,
      backgroundColor: bg,
      paddingHorizontal: 16,
      paddingTop: 10,
    },
    scrollContent: {
      paddingBottom: Platform.OS === "ios" ? 140 : 120,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
      marginTop: 10,
    },
    headerTitleCol: {
      flex: 1,
      alignItems: "center",
    },
    headerSpacer: {
      width: 44,
    },
    welcomeText: {
      fontSize: 16,
      fontWeight: "600",
      color: isDark ? "#C084FC" : "#5B21B6",
      textAlign: "center",
    },
    usernameText: {
      fontSize: 24,
      fontWeight: "bold",
      color: text,
      marginTop: 2,
      textAlign: "center",
    },
    notificationIcon: {
      backgroundColor: "#3B0764",
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    },
    notificationBadge: {
      position: "absolute",
      top: 10,
      right: 12,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#EF4444",
      borderWidth: 1,
      borderColor: "#3B0764",
    },
    widgetCardPurple: {
      borderRadius: 20,
      padding: 16,
      marginBottom: 16,
      elevation: 4,
      shadowColor: "#4C1D95",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
    },
    widgetHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 14,
    },
    widgetHeaderLeft: {
      flexDirection: "row",
      alignItems: "center",
    },
    widgetTitleWhite: {
      color: "#FFF",
      fontSize: 16,
      fontWeight: "bold",
      marginLeft: 8,
    },
    widgetTitleDark: {
      color: text,
      fontSize: 16,
      fontWeight: "bold",
      marginLeft: 8,
    },
    viewDetailsBtnWhite: {
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.4)",
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 16,
    },
    viewDetailsTextWhite: {
      color: "#FFF",
      fontSize: 12,
      fontWeight: "600",
    },
    viewDetailsTextPurple: {
      color: isDark ? "#C084FC" : "#6B21A8",
      fontSize: 12,
      fontWeight: "bold",
    },
    profileInnerCard: {
      backgroundColor: cardBg,
      borderRadius: 16,
      padding: 14,
      flexDirection: "row",
      alignItems: "center",
    },
    levelSection: {
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      paddingRight: 6,
    },
    levelCircle: {
      width: 84,
      height: 84,
      borderRadius: 42,
      borderWidth: 4,
      borderColor: "#4C1D95",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: cardBg,
    },
    levelLabel: {
      fontSize: 10,
      color: subText,
    },
    levelNumber: {
      fontSize: 24,
      fontWeight: "bold",
      color: text,
      marginVertical: -2,
    },
    levelStatus: {
      fontSize: 10,
      color: isDark ? "#C084FC" : "#4C1D95",
      fontWeight: "bold",
    },
    levelStarBadge: {
      position: "absolute",
      top: -2,
      right: 4,
      backgroundColor: "#4C1D95",
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: "#FFF",
    },
    verticalDivider: {
      width: 1,
      height: "85%",
      backgroundColor: border,
      marginHorizontal: 10,
    },
    profileStatsSection: {
      flex: 1,
      flexDirection: "column",
    },
    profileStatsRowTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-around",
    },
    profileStatsRowBottom: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    profileStatItemSmall: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      justifyContent: "center",
    },
    profileStatItemMicro: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      justifyContent: "center",
    },
    profileStatTextCol: {
      marginLeft: 6,
    },
    profileStatValue: {
      fontSize: 14,
      fontWeight: "bold",
      color: text,
    },
    profileStatLabel: {
      fontSize: 9,
      color: subText,
    },
    gridVerticalDivider: {
      width: 1,
      height: 28,
      backgroundColor: border,
      marginHorizontal: 4,
    },
    gridVerticalDividerSmall: {
      width: 1,
      height: 24,
      backgroundColor: border,
      marginHorizontal: 2,
    },
    gridHorizontalDivider: {
      height: 1,
      backgroundColor: border,
      marginVertical: 8,
    },
    widgetCardWhite: {
      backgroundColor: cardBg,
      borderRadius: 20,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: border,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.2 : 0.04,
      shadowRadius: 8,
    },
    iconCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    statsCardInnerContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 4,
    },
    statItemContainer: {
      alignItems: "center",
      flex: 1,
    },
    statIconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },
    statValueText: {
      fontSize: 14,
      fontWeight: "bold",
      color: text,
      marginBottom: 2,
    },
    statLabelText: {
      fontSize: 10,
      color: subText,
      textAlign: "center",
    },
    statsColumnDivider: {
      width: 1,
      height: 40,
      backgroundColor: border,
    },
    completeProfileWidget: {
      flexDirection: "row",
      backgroundColor: isDark ? "#1E1A26" : "#FDF8FF",
      borderRadius: 20,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: isDark ? "#3A2A55" : "#F3E8FF",
      alignItems: "center",
    },
    clipboardGraphicContainer: {
      width: 90,
      height: 90,
      position: "relative",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    clipboardBoard: {
      width: 70,
      height: 80,
      backgroundColor: isDark ? "#2A2A2A" : "#FFFFFF",
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: isDark ? "#3A2A55" : "#DDD6FE",
      position: "relative",
      alignItems: "center",
      paddingTop: 12,
      elevation: 2,
      shadowColor: "#6B21A8",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
    },
    clipboardHeaderBar: {
      position: "absolute",
      top: -8,
      width: 32,
      height: 12,
      backgroundColor: "#7C3AED",
      borderRadius: 4,
    },
    clipboardBody: {
      alignItems: "center",
      width: "100%",
      paddingHorizontal: 8,
    },
    clipboardAvatarCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: isDark ? "#3A2A55" : "#F3E8FF",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 6,
    },
    clipboardTextLines: {
      width: "100%",
      alignItems: "center",
    },
    clipboardLineLong: {
      width: "80%",
      height: 3,
      backgroundColor: isDark ? "#3A2A55" : "#DDD6FE",
      borderRadius: 2,
      marginBottom: 3,
    },
    clipboardLineShort: {
      width: "50%",
      height: 3,
      backgroundColor: isDark ? "#3A2A55" : "#DDD6FE",
      borderRadius: 2,
    },
    pencilGraphic: {
      position: "absolute",
      bottom: -6,
      right: -6,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: "#7C3AED",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: "#FFF",
    },
    completeProfileRight: {
      flex: 1,
    },
    completeProfileTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: isDark ? "#C084FC" : "#4C1D95",
      marginBottom: 2,
    },
    completeProfileSubtitle: {
      fontSize: 12,
      color: subText,
      marginBottom: 10,
    },
    progressBlocks: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    progressBlock: {
      height: 6,
      flex: 1,
      borderRadius: 3,
      marginHorizontal: 2,
    },
    bgGray: { backgroundColor: isDark ? "#333" : "#E2E8F0" },
    bgRed: { backgroundColor: "#EF4444" },
    bgOrange: { backgroundColor: "#F97316" },
    bgYellow: { backgroundColor: "#EAB308" },
    bgPurple: { backgroundColor: "#7C3AED" },
    bgGreen: { backgroundColor: "#16A34A" },
    completeNowBtn: {
      backgroundColor: "#4C1D95",
      paddingVertical: 10,
      borderRadius: 12,
      alignItems: "center",
    },
    completeNowText: {
      color: "#FFF",
      fontSize: 14,
      fontWeight: "bold",
    },
    smartMessagesBox: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: cardBg,
      borderRadius: 16,
      padding: 14,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: border,
    },
    smartMessagesLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    smartMessagesIconBg: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "#6B21A8",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
    },
    smartMessagesTextCol: {
      flex: 1,
    },
    smartMessagesTitle: {
      fontSize: 14,
      fontWeight: "bold",
      color: isDark ? "#C084FC" : "#4C1D95",
      marginBottom: 2,
    },
    smartMessagesSubtitle: {
      fontSize: 11,
      color: text,
      fontWeight: "600",
      marginBottom: 2,
    },
    smartMessagesDesc: {
      fontSize: 10,
      color: subText,
    },
    viewMessagesBtn: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: isDark ? "#3A2A55" : "#DDD6FE",
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    viewMessagesText: {
      color: isDark ? "#C084FC" : "#6B21A8",
      fontSize: 11,
      fontWeight: "bold",
      marginLeft: 4,
    },
    whatsNewBox: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: cardBg,
      borderRadius: 16,
      padding: 14,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: border,
    },
    whatsNewLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    whatsNewIconBg: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDark ? "#3A2A55" : "#F3E8FF",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
    },
    whatsNewTextCol: {
      flex: 1,
      paddingRight: 8,
    },
    whatsNewTitle: {
      fontSize: 14,
      fontWeight: "bold",
      color: text,
      marginBottom: 2,
    },
    whatsNewSubtitle: {
      fontSize: 11,
      color: subText,
      lineHeight: 15,
    },
    whatsNewBellGraphic: {
      alignItems: "center",
      justifyContent: "center",
    },
    whatsNewBellCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "#7C3AED",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    },
    whatsNewBellBadge: {
      position: "absolute",
      top: 9,
      right: 9,
      width: 7,
      height: 7,
      borderRadius: 3.5,
      backgroundColor: "#EF4444",
      borderWidth: 1,
      borderColor: "#7C3AED",
    },
    stickyButton: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: "#3B0764",
      position: "absolute",
      bottom: Platform.OS === "ios" ? 100 : 85,
      right: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 5,
    },
    chatIcon: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    sectionContainer: {
      marginVertical: 10,
    },
    profileContainers: {
      borderRadius: 16,
      padding: 16,
      alignItems: "center",
    },
    profileText: {
      fontSize: 16,
      fontWeight: "bold",
    },
    loginButton: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 8,
    },
    loginButtonText: {
      color: "#FFF",
      fontWeight: "bold",
    },
  });
};

export default HomeScreen;
