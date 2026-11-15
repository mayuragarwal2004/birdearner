import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import SafeSpinner from "../components/SafeSpinner";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowLeft,
  ClockCounterClockwise,
  Wallet,
  CaretRight,
  ArrowUpRight,
  ArrowDownLeft,
} from "phosphor-react-native";
import { useAuth } from "../context/NewAuthContext";
import { useTheme } from "../context/ThemeContext";
import apiService from "../lib/apiService";

const WalletClientScreen = ({ navigation }) => {
  const { userData } = useAuth();
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentTransactions, setRecentTransactions] = useState([]);

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];

  const isDark = theme === "dark";
  const primaryColor = isDark ? "#A855F7" : "#4B0082";
  const buttonColor = isDark ? "#7B2CFF" : "#4B0082";

  const styles = useMemo(() => getStyles(currentTheme, primaryColor, buttonColor), [currentTheme, primaryColor, buttonColor]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchWalletData();
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const walletResponse = await apiService.getClientWalletInfo();
      if (walletResponse.success) {
        setWalletData(walletResponse.data);
      }
    } catch (error) {
      console.error("Error fetching wallet data:", error);
      Alert.alert("Error", "Failed to load wallet data. Please try again.");
    } finally {
      setLoading(false);
    }
    fetchRecentTransactions();
  };

  // Display-only helper: reads the latest transactions for the list below.
  // It has its own try/catch so a history failure can never block the balance.
  const fetchRecentTransactions = async () => {
    try {
      const response = await apiService.getClientTransactionHistory(1, 5);
      if (response?.success) {
        const rawList = response.data?.transactions || [];
        const sortedList = [...rawList].sort((a, b) => {
          const timeA = new Date(a.createdAt || a.date || 0).getTime();
          const timeB = new Date(b.createdAt || b.date || 0).getTime();
          return timeB - timeA;
        });
        setRecentTransactions(sortedList.slice(0, 5));
      }
    } catch (error) {
      console.error("Error fetching recent transactions:", error);
      setRecentTransactions([]);
    }
  };

  // Same label mapping used by TransactionHistoryClient.js
  const formatTransactionType = (type) => {
    switch (type) {
      case "DEPOSIT": return "Wallet Deposit";
      case "WITHDRAWAL": return "Wallet Withdrawal";
      case "JOB_PAYMENT": return "Job Payment";
      case "JOB_REFUND": return "Job Refund";
      case "JOB_RESERVE": return "Job Reserve";
      case "JOB_RELEASE": return "Job Release";
      case "PENALTY": return "Cancellation Penalty";
      case "BONUS": return "Early Bonus";
      case "PLATFORM_FEE": return "Platform Fee";
      default:
        return type?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) || "Unknown";
    }
  };

  // Same credit/debit rules used by TransactionHistoryClient.js
  const getTxInfo = (item) => {
    const type = item?.transactionType;
    const absAmount = Math.abs(Number(item?.amount || 0)).toFixed(2);

    if (["DEPOSIT", "JOB_REFUND", "JOB_RELEASE", "BONUS"].includes(type)) {
      return {
        formattedAmount: `+₹${absAmount}`,
        color: isDark ? "#4ADE80" : "#16A34A",
        bg: isDark ? "#14532D" : "#DCFCE7",
        isCredit: true,
      };
    }
    if (type === "JOB_RESERVE") {
      return {
        formattedAmount: `-₹${absAmount}`,
        color: isDark ? "#FBBF24" : "#B45309",
        bg: isDark ? "#451A03" : "#FEF3C7",
        isCredit: false,
      };
    }
    return {
      formattedAmount: `-₹${absAmount}`,
      color: isDark ? "#F87171" : "#DC2626",
      bg: isDark ? "#450A0A" : "#FEE2E2",
      isCredit: false,
    };
  };

  const renderTransactionRow = (item) => {
    const createdAt = item?.createdAt || item?.date;
    const date = new Date(createdAt);

    const formattedDate = date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    const formattedTime = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const info = getTxInfo(item);
    const context = item?.jobTitle || item?.description;
    const meta = context ? `${context} · ${formattedDate}` : `${formattedDate} · ${formattedTime}`;

    return (
      <View key={item?.id} style={styles.txRow}>
        <View style={[styles.txIcon, { backgroundColor: info.bg }]}>
          {info.isCredit ? (
            <ArrowUpRight size={20} color={info.color} weight="bold" />
          ) : (
            <ArrowDownLeft size={20} color={info.color} weight="bold" />
          )}
        </View>

        <View style={styles.txBody}>
          <Text style={styles.txTitle} numberOfLines={1}>
            {formatTransactionType(item?.transactionType)}
          </Text>
          <Text style={styles.txMeta} numberOfLines={1}>
            {meta}
          </Text>
        </View>

        <Text style={[styles.txAmount, { color: info.color }]}>
          {info.formattedAmount}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color={currentTheme.text || "#000"} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Wallet</Text>
          </View>
          <View style={styles.rightPlaceholder} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <SafeSpinner size={42} color={primaryColor} />
            <Text style={styles.loadingText}>Loading wallet data...</Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Wallet Balance Card */}
            <LinearGradient
              colors={["#6D28D9", "#5B21B6", "#4B0082"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.balanceCard}
            >
              <View style={styles.balanceTopRow}>
                <View style={styles.walletIconCircle}>
                  <Wallet size={22} color="#FFFFFF" weight="fill" />
                </View>
              </View>

              <Text style={styles.balanceLabel}>Total Balance</Text>
              <Text style={styles.balanceAmount}>
                ₹{walletData?.totalBalance?.toFixed(2) || "0.00"}
              </Text>

              <View style={styles.cardDivider} />

              <View style={styles.statRow}>
                <View style={styles.statColumn}>
                  <Text style={styles.statLabel}>Available</Text>
                  <Text style={[styles.statValue, { color: "#86EFAC" }]}>
                    ₹{walletData?.availableBalance !== undefined && walletData?.availableBalance !== null ? Number(walletData.availableBalance).toFixed(2) : "0.00"}
                  </Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statColumn}>
                  <Text style={styles.statLabel}>Reserved</Text>
                  <Text style={[styles.statValue, { color: "#FDE68A" }]}>
                    ₹{walletData?.reservedAmount !== undefined && walletData?.reservedAmount !== null ? Number(walletData.reservedAmount).toFixed(2) : "0.00"}
                  </Text>
                </View>
              </View>
            </LinearGradient>

            {/* History — Add Amount removed: the Client Wallet is funded only
                through checkout top-ups (Payment screen) and admin refund credits. */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => navigation.navigate("TransactionHistoryClient")}
                activeOpacity={0.85}
              >
                <ClockCounterClockwise size={18} color={primaryColor} weight="bold" />
                <Text style={styles.secondaryButtonText}>History</Text>
              </TouchableOpacity>
            </View>

            {/* Recent transactions */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <TouchableOpacity
                style={styles.seeAllButton}
                onPress={() => navigation.navigate("TransactionHistoryClient")}
                activeOpacity={0.7}
              >
                <Text style={styles.seeAllText}>See All</Text>
                <CaretRight size={14} color={primaryColor} weight="bold" />
              </TouchableOpacity>
            </View>

            {recentTransactions.length > 0 ? (
              recentTransactions.map((item) => renderTransactionRow(item))
            ) : (
              <View style={styles.emptyCard}>
                <Wallet size={26} color={primaryColor} weight="fill" />
                <Text style={styles.emptyTitle}>No transactions yet</Text>
                <Text style={styles.emptySubtitle}>
                  Your wallet activity will appear here.
                </Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

const getStyles = (currentTheme, primaryColor, buttonColor) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: currentTheme.background || "#FFFFFF",
    },
    container: {
      flex: 1,
    },
    headerContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 16,
      marginBottom: 16,
      justifyContent: "space-between",
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: currentTheme.border || "#E5E7EB",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: currentTheme.cardBackground || "#FFFFFF",
    },
    headerTitleContainer: {
      flex: 1,
      alignItems: "center",
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: currentTheme.text || "#000000",
      letterSpacing: 0.3,
    },
    rightPlaceholder: {
      width: 40,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 4,
      paddingBottom: 40,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      marginTop: 12,
      fontSize: 15,
      color: currentTheme.text || "#000",
    },

    /* ---------- Balance card ---------- */
    balanceCard: {
      borderRadius: 24,
      padding: 22,
      shadowColor: "#4B0082",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.18,
      shadowRadius: 18,
      elevation: 6,
    },
    balanceTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    walletIconCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: "rgba(255,255,255,0.18)",
      justifyContent: "center",
      alignItems: "center",
    },
    balanceLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: "#E9D5FF",
      letterSpacing: 0.8,
      textTransform: "uppercase",
      marginTop: 20,
    },
    balanceAmount: {
      fontSize: 40,
      fontWeight: "800",
      color: "#FFFFFF",
      marginTop: 6,
      letterSpacing: 0.5,
    },
    cardDivider: {
      height: 1,
      backgroundColor: "rgba(255,255,255,0.16)",
      marginTop: 18,
      marginBottom: 14,
    },
    statRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    statColumn: {
      flex: 1,
    },
    statDivider: {
      width: 1,
      height: 34,
      backgroundColor: "rgba(255,255,255,0.16)",
      marginHorizontal: 14,
    },
    statLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: "#DDD6FE",
      marginBottom: 4,
    },
    statValue: {
      fontSize: 17,
      fontWeight: "700",
    },

    /* ---------- Action buttons ---------- */
    actionRow: {
      flexDirection: "row",
      gap: 12,
      marginTop: 20,
    },
    secondaryButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      height: 54,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: primaryColor,
      backgroundColor: currentTheme.cardBackground || "#FFFFFF",
    },
    secondaryButtonText: {
      color: primaryColor,
      fontSize: 15,
      fontWeight: "700",
      letterSpacing: 0.3,
    },

    /* ---------- Section header ---------- */
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 26,
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: currentTheme.text || "#000000",
    },
    seeAllButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
    },
    seeAllText: {
      fontSize: 13,
      fontWeight: "700",
      color: primaryColor,
    },

    /* ---------- Transaction rows ---------- */
    txRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: currentTheme.cardBackground || "#F8F8F8",
      borderRadius: 16,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: currentTheme.border || "#E0E0E0",
    },
    txIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    txBody: {
      flex: 1,
      minWidth: 0,
      marginRight: 10,
    },
    txTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: currentTheme.text || "#000000",
    },
    txMeta: {
      fontSize: 12,
      fontWeight: "500",
      color: currentTheme.subText || "#666666",
      marginTop: 3,
    },
    txAmount: {
      fontSize: 15,
      fontWeight: "700",
    },

    /* ---------- Empty state ---------- */
    emptyCard: {
      alignItems: "center",
      paddingVertical: 28,
      paddingHorizontal: 16,
      backgroundColor: currentTheme.cardBackground || "#F8F8F8",
      borderRadius: 16,
      borderWidth: 1,
      borderColor: currentTheme.border || "#E0E0E0",
    },
    emptyTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: currentTheme.text || "#000000",
      marginTop: 10,
    },
    emptySubtitle: {
      fontSize: 13,
      color: currentTheme.subText || "#666666",
      marginTop: 4,
      textAlign: "center",
    },
  });

export default WalletClientScreen;
