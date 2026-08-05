import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Platform,
  ActivityIndicator,
} from "react-native";
import { FontAwesome, MaterialIcons, Ionicons } from "@expo/vector-icons";
import { Bell, Crown, Clock, Flag, ChatCircleText, Wallet, CreditCard, ArrowCircleUp, ClipboardText, ListDashes, XCircle, Sparkle, ChatCircleDots, Star } from "phosphor-react-native";
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
  const profile = userProfile || userData?.freelancer || {};
  let completed = 0;
  const total = 5;

  if (userData?.fullName && userData?.email) completed += 1;

  if (parseArray(profile.selectedServices).length > 0) completed += 1;

  if (profile.profileHeading && profile.profileDescription) completed += 1;

  if (
    profile.highestQualification &&
    profile.experience !== null &&
    profile.experience !== undefined &&
    profile.city &&
    profile.state
  ) {
    completed += 1;
  }

  if (
    profile.profilePhoto &&
    profile.coverPhoto &&
    parseArray(profile.portfolioImages).length > 0 &&
    profile.termsAccepted
  ) {
    completed += 1;
  }

  return Math.round((completed / total) * 100);
};

const HomeScreen = () => {
  const { userData, userProfile, logout } = useAuth();
  const [profilePercentage, setProfilePercentage] = useState(20);
  const [flagsCount, setFlagsCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [CompletedOrders, setCompletedOrders] = useState(0);
  const [activeOrders, setActiveOrders] = useState(0);
  const [cancelledOrders, setCancelledOrdersOrders] = useState(0);
  const [successScore, setSuccessScore] = useState(0);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [currentSetupStep, setCurrentSetupStep] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const navigation = useNavigation();

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];

  const styles = getStyles(currentTheme);

  // Handle profile setup navigation
  const handleProfileSetupNavigation = () => {
    if (currentSetupStep) {
      navigation.navigate(currentSetupStep);
    }
  };

  // Handle skip profile setup (go to main tabs)
  const handleSkipProfileSetup = () => {
    navigation.replace("MainTabs");
  };

  const fetchOrderRecords = async () => {
    try {
      // TODO: Implement with new backend
      // For now, set some default values to prevent errors
      setCancelledOrdersOrders(0);
      setActiveOrders(0);
      setCompletedOrders(0);
      setSuccessScore(0);

      /* Original Appwrite code - commented out for migration
      const cancelledOrders = userData?.cancelled_jobs.length;
      const assignedJobs = userData?.assigned_jobs;

      setCancelledOrdersOrders(cancelledOrders);

      if (userData?.assigned_jobs.length === 0) {
        setActiveOrders(0);
        setCompletedOrders(0);
      } else {
        const jobPromises = assignedJobs.map((jobId) =>
          databases.getDocument(
            appwriteConfig.databaseId,
            appwriteConfig.jobCollectionID,
            jobId
          )
        );

        const jobs = await Promise.all(jobPromises);

        const completedCount = jobs.filter(
          (job) => job?.completed_status === true
        ).length;
        const activeCount = jobs.filter(
          (job) =>
            job?.completed_status === false || job?.completed_status === null
        ).length;

        setCompletedOrders(completedCount);
        setActiveOrders(activeCount);

        const totalOrders = completedCount + cancelledOrders;
        const calSuccessScore = totalOrders
          ? ((completedCount / totalOrders) * 100).toFixed(0)
          : 0;

        setSuccessScore(calSuccessScore);
      }
      */
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
          setNotifications(response.data.slice(0, 5)); // Show only latest 5
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
    setFlagsCount(0); // TODO: Implement flags in new backend
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

  // TODO: Implement user data fetching with new backend
  /* Original Appwrite code - commented out for migration
  useEffect(() => {
    const flagsData = async () => {
      if (userData) {
        try {
          const freelancerId = userData?.$id;

          const collectionId =
            userData?.role === "client"
              ? appwriteConfig.clientCollectionId
              : appwriteConfig.freelancerCollectionId;

          const freelancerDoc = await databases.getDocument(
            appwriteConfig.databaseId,
            collectionId,
            freelancerId
          );
          setUserData(freelancerDoc);
        } catch (error) {
          Alert.alert("Error updating flags:", error);
        }
      }
    };
    flagsData();
  }, [refreshing]);
  */

  const formatAmount = (xp) => {
    if (xp >= 1000000) {
      return (xp / 1000000).toFixed(1) + "M"; // For millions
    } else if (xp >= 1000) {
      return (xp / 1000).toFixed(1) + "K"; // For thousands
    } else {
      return xp; // For values less than 1000
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    // TODO: Implement refresh with new backend
    // fetchUserData();
    fetchOrderRecords();
    fetchNotifications();
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  return (
    <SafeAreaView>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.safeContainer}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#3b006b"]}
            progressBackgroundColor={currentTheme.cardBackground || "#fff"}
          />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome Back,</Text>
            <Text style={styles.usernameText}>{userData?.fullName}</Text>
          </View>
          <TouchableOpacity
            style={styles.notificationIcon}
            onPress={() => navigation.navigate("Notification")}
          >
            <Bell size={24} color="#FFF" weight="fill" />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>

        {/* Profile Overview Widget */}
        <LinearGradient
          colors={['#762BAD', '#4A148C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.widgetCardPurple}
        >
          <View style={styles.widgetHeader}>
            <View style={styles.widgetHeaderLeft}>
              <Crown size={24} color="#FFF" weight="regular" />
              <Text style={styles.widgetTitleWhite}>Profile Overview</Text>
            </View>
            <TouchableOpacity style={styles.viewDetailsBtn} onPress={() => navigation.navigate('ProfileOverview')}>
              <Text style={styles.viewDetailsTextWhite}>View Details {'>'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.profileInnerCard}>
            <View style={styles.levelCircleContainer}>
              <View style={styles.levelCircle}>
                <Text style={styles.levelLabel}>Level</Text>
                <Text style={styles.levelNumber}>1</Text>
                <Text style={styles.levelStatus}>New</Text>
              </View>
              <View style={styles.levelStarBadge}>
                <Star size={12} color="#FFF" weight="fill" />
              </View>
            </View>

            <View style={styles.profileStatsGrid}>
              <View style={styles.profileStatItem}>
                <Clock size={20} color="#762BAD" />
                <View style={styles.profileStatTextCol}>
                  <Text style={styles.profileStatValue}>0%</Text>
                  <Text style={styles.profileStatLabel}>Success Score</Text>
                </View>
              </View>
              <View style={styles.profileStatItem}>
                <Star size={20} color="#762BAD" weight="regular" />
                <View style={styles.profileStatTextCol}>
                  <Text style={styles.profileStatValue}>0</Text>
                  <Text style={styles.profileStatLabel}>Rating</Text>
                </View>
              </View>
              <View style={styles.profileStatItem}>
                <Clock size={20} color="#762BAD" />
                <View style={styles.profileStatTextCol}>
                  <Text style={styles.profileStatValue}>1 hr</Text>
                  <Text style={styles.profileStatLabel}>Avg. Response Time</Text>
                </View>
              </View>
              <View style={styles.profileStatItem}>
                <Flag size={20} color="#762BAD" />
                <View style={styles.profileStatTextCol}>
                  <Text style={styles.profileStatValue}>NA</Text>
                  <Text style={styles.profileStatLabel}>Flags</Text>
                </View>
              </View>
              <View style={styles.profileStatItem}>
                <ChatCircleText size={20} color="#762BAD" />
                <View style={styles.profileStatTextCol}>
                  <Text style={styles.profileStatValue}>0%</Text>
                  <Text style={styles.profileStatLabel}>Response Rate</Text>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Earnings Overview Widget */}
        <View style={styles.widgetCardWhite}>
          <View style={styles.widgetHeader}>
            <View style={styles.widgetHeaderLeft}>
              <View style={styles.iconCirclePurple}>
                <Wallet size={16} color="#762BAD" weight="fill" />
              </View>
              <Text style={styles.widgetTitleDark}>Earnings Overview</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('EarningsOverview')}>
              <Text style={styles.viewDetailsTextPurple}>View Details {'>'}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.statsRow}>
            <StatItem icon={<Wallet size={20} color="#762BAD" weight="fill" />} iconBg="#F3E8FF" value={`Rs. ${formatAmount(0)}`} label="Total Earnings" />
            <View style={styles.divider} />
            <StatItem icon={<CreditCard size={20} color="#34C759" weight="fill" />} iconBg="#E8F5E9" value={`Rs. ${formatAmount(0)}`} label="Monthly Earnings" />
            <View style={styles.divider} />
            <StatItem icon={<Clock size={20} color="#FF9500" weight="fill" />} iconBg="#FFF9E6" value={formatAmount(0)} label="Outstanding" />
            <View style={styles.divider} />
            <StatItem icon={<ArrowCircleUp size={20} color="#FF3B30" weight="fill" />} iconBg="#FFF0F0" value={`Rs. ${formatAmount(0)}`} label="Withdrawal" />
          </View>
        </View>

        {/* Orders Overview Widget */}
        <View style={styles.widgetCardWhite}>
          <View style={styles.widgetHeader}>
            <View style={styles.widgetHeaderLeft}>
              <View style={styles.iconCirclePurple}>
                <ClipboardText size={16} color="#762BAD" weight="fill" />
              </View>
              <Text style={styles.widgetTitleDark}>Orders Overview</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('OrdersOverview')}>
              <Text style={styles.viewDetailsTextPurple}>View Details {'>'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsRow}>
            <StatItem icon={<ClipboardText size={20} color="#762BAD" weight="fill" />} iconBg="#F3E8FF" value={String(CompletedOrders || 0)} label="Orders Completed" />
            <View style={styles.divider} />
            <StatItem icon={<ListDashes size={20} color="#38BDF8" weight="fill" />} iconBg="#E0F2FE" value={String(activeOrders || 0)} label="Active Orders" />
            <View style={styles.divider} />
            <StatItem icon={<XCircle size={20} color="#FF9500" weight="fill" />} iconBg="#FFF9E6" value={String(cancelledOrders || 0)} label="Cancelled Orders" />
          </View>
        </View>

        {/* Complete Profile Widget */}
        {profilePercentage < 100 ? (
          <View style={styles.completeProfileWidget}>
            <View style={styles.completeProfileLeft}>
              <View style={styles.clipboardIllustration}>
                <ClipboardText size={64} color="#E5D5FF" weight="fill" />
                <Sparkle size={12} color="#762BAD" weight="fill" style={{position: 'absolute', top: -5, right: -5}} />
                <Sparkle size={10} color="#762BAD" weight="fill" style={{position: 'absolute', bottom: -5, left: -5}} />
              </View>
            </View>
            <View style={styles.completeProfileRight}>
              <Text style={styles.completeProfileTitle}>Complete Your Profile</Text>
              <Text style={styles.completeProfileSubtitle}>Your profile is {String(profilePercentage || 0)}% complete</Text>
              
              <View style={styles.progressBlocks}>
                <View style={[styles.progressBlock, profilePercentage >= 20 ? styles.bgRed : styles.bgGray]} />
                <View style={[styles.progressBlock, profilePercentage >= 40 ? styles.bgOrange : styles.bgGray]} />
                <View style={[styles.progressBlock, profilePercentage >= 70 ? styles.bgYellow : styles.bgGray]} />
                <View style={[styles.progressBlock, profilePercentage >= 70 ? styles.bgPurple : styles.bgGray]} />
                <View style={[styles.progressBlock, profilePercentage === 100 ? styles.bgGreen : styles.bgGray]} />
              </View>

              <TouchableOpacity style={styles.completeNowBtn} onPress={handleCompleteProfile}>
                <Text style={styles.completeNowText}>Complete Now {'>'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Smart Messages Box */}
        <View style={styles.smartMessagesBox}>
          <View style={styles.smartMessagesLeft}>
            <View style={styles.smartMessagesIconBg}>
              <ChatCircleDots size={24} color="#FFF" weight="fill" />
            </View>
            <View>
              <Text style={styles.smartMessagesTitle}>Smart Messages</Text>
              <Text style={styles.smartMessagesSubtitle}>You have 0 unread messages</Text>
              <Text style={styles.smartMessagesDesc}>Stay connected and reply to clients.</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.viewMessagesBtn} onPress={() => navigation.navigate(userData?.role === "FREELANCER" ? "FreelancerChatList" : "ClientChatList")}>
            <ChatCircleDots size={16} color="#762BAD" weight="regular" />
            <Text style={styles.viewMessagesText}>View Messages</Text>
          </TouchableOpacity>
        </View>

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
          <FontAwesome name="comments" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const StatItem = ({ icon, iconBg, value, label }) => {
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const isDark = theme === 'dark';
  return (
    <View style={{ alignItems: 'center', flex: 1, paddingVertical: 10 }}>
      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isDark ? '#374151' : iconBg, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
        {icon}
      </View>
      <Text style={{ fontSize: 16, fontWeight: 'bold', color: isDark ? '#FFF' : '#000', marginBottom: 4 }}>{value}</Text>
      <Text style={{ fontSize: 11, color: currentTheme.subText, textAlign: 'center' }}>{label}</Text>
    </View>
  );
};

const getStyles = (currentTheme) =>
  StyleSheet.create({
    safeContainer: {
      // flex: 1,
      backgroundColor: currentTheme.background || "#fff",
      paddingHorizontal: 20,
      paddingTop: 30,
    },
    scrollContent: {
      paddingBottom: Platform.OS === "ios" ? 150 : 130, // Increased bottom padding to prevent tab bar and sticky icon overlap
    },
    header: {
      flexDirection: "column",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
      marginTop: 15,
    },
    welcomeText: {
      fontSize: 24,
      fontWeight: "bold",
      color: currentTheme.primary || "#5A4CAE",
    },
    usernameText: {
      fontSize: 18,
      color: currentTheme.primary || "#5A4CAE",
    },
    notificationIcon: {
      backgroundColor: "#3b006b",
      padding: 10,
      borderRadius: 50,
      position: "absolute",
      right: 10,
    },
    logoutButton: {
      backgroundColor: "#dc3545",
      padding: 10,
      borderRadius: 50,
      position: "absolute",
      right: 70, // Position it next to the notification icon
    },
    notificationBadge: {
      position: 'absolute',
      top: 10,
      right: 12,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#FF3B30',
      borderWidth: 1,
      borderColor: '#3b006b'
    },
    widgetCardPurple: {
      borderRadius: 20,
      padding: 20,
      marginBottom: 20,
      elevation: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    widgetCardWhite: {
      backgroundColor: currentTheme.cardBackground || '#FFF',
      borderRadius: 20,
      padding: 20,
      marginBottom: 20,
      borderWidth: currentTheme.theme === 'dark' ? 1 : 0,
      borderColor: '#374151',
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
    },
    widgetHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    widgetHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    widgetTitleWhite: {
      color: '#FFF',
      fontSize: 16,
      fontWeight: 'bold',
      marginLeft: 10,
    },
    widgetTitleDark: {
      color: currentTheme.text,
      fontSize: 16,
      fontWeight: 'bold',
      marginLeft: 10,
    },
    viewDetailsBtn: {
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.3)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    viewDetailsTextWhite: {
      color: '#FFF',
      fontSize: 12,
      fontWeight: '600',
    },
    viewDetailsTextPurple: {
      color: '#762BAD',
      fontSize: 12,
      fontWeight: 'bold',
    },
    iconCirclePurple: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#F3E8FF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    profileInnerCard: {
      backgroundColor: currentTheme.theme === 'dark' ? '#1F2937' : '#FDF8FF',
      borderRadius: 16,
      padding: 20,
    },
    levelCircleContainer: {
      alignItems: 'center',
      marginBottom: 20,
      position: 'relative',
    },
    levelCircle: {
      width: 90,
      height: 90,
      borderRadius: 45,
      borderWidth: 4,
      borderColor: '#762BAD',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: currentTheme.cardBackground,
    },
    levelLabel: {
      fontSize: 10,
      color: currentTheme.subText,
    },
    levelNumber: {
      fontSize: 28,
      fontWeight: 'bold',
      color: currentTheme.text,
      marginVertical: -2,
    },
    levelStatus: {
      fontSize: 10,
      color: '#762BAD',
      fontWeight: 'bold',
    },
    levelStarBadge: {
      position: 'absolute',
      top: 0,
      right: '35%',
      backgroundColor: '#762BAD',
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: currentTheme.cardBackground,
    },
    profileStatsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    profileStatItem: {
      width: '48%',
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    profileStatTextCol: {
      marginLeft: 8,
    },
    profileStatValue: {
      fontSize: 16,
      fontWeight: 'bold',
      color: currentTheme.text,
    },
    profileStatLabel: {
      fontSize: 10,
      color: currentTheme.subText,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    divider: {
      width: 1,
      height: 40,
      backgroundColor: currentTheme.theme === 'dark' ? '#374151' : '#F3F4F6',
    },
    completeProfileWidget: {
      flexDirection: 'row',
      backgroundColor: currentTheme.theme === 'dark' ? '#1f2937' : '#FDF8FF',
      borderRadius: 20,
      padding: 20,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: '#E5D5FF',
    },
    completeProfileLeft: {
      marginRight: 16,
      justifyContent: 'center',
    },
    clipboardIllustration: {
      position: 'relative',
    },
    completeProfileRight: {
      flex: 1,
    },
    completeProfileTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#762BAD',
      marginBottom: 4,
    },
    completeProfileSubtitle: {
      fontSize: 12,
      color: currentTheme.subText,
      marginBottom: 12,
    },
    progressBlocks: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    progressBlock: {
      height: 6,
      flex: 1,
      borderRadius: 3,
      marginHorizontal: 2,
    },
    bgGray: { backgroundColor: currentTheme.theme === 'dark' ? '#374151' : '#E5E7EB' },
    bgRed: { backgroundColor: '#FF3B30' },
    bgOrange: { backgroundColor: '#FF9500' },
    bgYellow: { backgroundColor: '#FBBF24' },
    bgPurple: { backgroundColor: '#762BAD' },
    bgGreen: { backgroundColor: '#34C759' },
    completeNowBtn: {
      backgroundColor: '#762BAD',
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: 'center',
    },
    completeNowText: {
      color: '#FFF',
      fontSize: 14,
      fontWeight: 'bold',
    },
    smartMessagesBox: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: currentTheme.theme === 'dark' ? '#1f2937' : '#FFF',
      borderRadius: 16,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: currentTheme.theme === 'dark' ? '#374151' : '#F3F4F6',
    },
    smartMessagesLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    smartMessagesIconBg: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#762BAD',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    smartMessagesTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#762BAD',
      marginBottom: 2,
    },
    smartMessagesSubtitle: {
      fontSize: 11,
      color: currentTheme.text,
      fontWeight: '600',
      marginBottom: 2,
    },
    smartMessagesDesc: {
      fontSize: 10,
      color: currentTheme.subText,
    },
    viewMessagesBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#E5D5FF',
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    viewMessagesText: {
      color: '#762BAD',
      fontSize: 11,
      fontWeight: 'bold',
      marginLeft: 4,
    },

    stickyButton: {
      width: 60,
      height: 60,
      borderRadius: 40,
      backgroundColor: "#3b006b",
      position: "absolute",
      bottom: Platform.OS === "ios" ? 105 : 90, // Position above tab bar (85px + 20px buffer for iOS, 70px + 20px for Android)
      right: 20,
      shadowColor: currentTheme.shadow || "#000000",
      shadowOffset: {
        width: 0,
        height: 3,
      },
      shadowOpacity: 0.17,
      shadowRadius: 3.05,
      elevation: 4,
    },
    chatIcon: {
      flex: 1,
      justifyContent: "center",
      alignContent: "center",
      alignItems: "center",
    },
    // Profile Setup Overlay Styles
    profileSetupOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      zIndex: 1000,
      justifyContent: "center",
      alignItems: "center",
    },
    profileSetupContainer: {
      backgroundColor: "white",
      borderRadius: 16,
      padding: 24,
      margin: 20,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    profileSetupTitle: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 12,
      color: "#333",
      textAlign: "center",
    },
    profileSetupMessage: {
      fontSize: 16,
      textAlign: "center",
      marginBottom: 24,
      color: "#666",
      lineHeight: 22,
    },
    profileSetupButton: {
      backgroundColor: currentTheme.primary || "#3b006b",
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      marginVertical: 8,
      minWidth: 200,
    },
    profileSetupButtonText: {
      color: "white",
      fontSize: 16,
      fontWeight: "600",
      textAlign: "center",
    },
    profileSetupSkipButton: {
      backgroundColor: "transparent",
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      marginVertical: 8,
      minWidth: 200,
      borderWidth: 1,
      borderColor: currentTheme.primary || "#3b006b",
    },
    profileSetupSkipButtonText: {
      color: currentTheme.primary || "#3b006b",
      fontSize: 16,
      fontWeight: "600",
      textAlign: "center",
    },
  });

export default HomeScreen;
