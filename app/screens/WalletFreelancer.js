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
  Warning,
  CaretRight,
  ArrowDown,
  Sparkle,
  ArrowUpRight,
  ArrowDownLeft,
} from "phosphor-react-native";
import { useAuth } from "../context/NewAuthContext";
import { useTheme } from "../context/ThemeContext";
import apiService from "../lib/apiService";

const WalletFreelancerScreen = ({ navigation }) => {
  const { user, userData } = useAuth();
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentTransactions, setRecentTransactions] = useState([]);
  // Pending Balance comes from the existing freelancer earnings API
  // (summary.pending) — no duplicate endpoint is created for it.
  const [pendingBalance, setPendingBalance] = useState(0);

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];

  const isDark = theme === "dark";
  const primaryColor = isDark ? "#A855F7" : "#4B0082";

  const styles = useMemo(() => getStyles(currentTheme, primaryColor), [currentTheme, primaryColor]);

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
      const walletResponse = await apiService.getFreelancerWalletInfo();
      if (walletResponse.success) {
        setWalletData(walletResponse.data);
      }
    } catch (error) {
      console.error("Error fetching wallet data:", error);
      Alert.alert("Error", "Failed to load wallet data. Please try again.");
    } finally {
      setLoading(false);
    }
    fetchPendingBalance();
    fetchRecentTransactions();
  };

  // Pending Balance via the existing earnings API (summary.pending).
  // Failure here must never block the wallet — falls back to 0.
  const fetchPendingBalance = async () => {
    try {
      const userId = user?.id || userData?.id;
      if (!userId) return;
      const earnings = await apiService.getFreelancerEarnings(userId, "All Time");
      if (earnings?.summary && typeof earnings.summary.pending === "number") {
        setPendingBalance(earnings.summary.pending);
      }
    } catch (error) {
      console.error("Error fetching pending balance:", error);
      setPendingBalance(0);
    }
  };

  // Display-only helper: reads the latest transactions for the list below.
  // It has its own try/catch so a history failure can never block the balance.
  const fetchRecentTransactions = async () => {
    try {
      const response = await apiService.getFreelancerTransactionHistory(1, 5);
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

  const balance = walletData?.withdrawableBalance ?? 0;
  const totalEarnings = walletData?.totalEarnings ?? 0;

  // Same label mapping used by TransactionHistoryFreelancer.js
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
      case "HOLD_RELEASE": return "Earnings Released";
      default:
        return type?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) || "Unknown";
    }
  };

  // Same credit/debit rules used by TransactionHistoryFreelancer.js
  const getTxInfo = (item) => {
    const type = item?.transactionType;
    const absAmount = Math.abs(Number(item?.amount || 0)).toFixed(2);

    if (["DEPOSIT", "JOB_PAYMENT", "JOB_RELEASE", "BONUS", "HOLD_RELEASE"].includes(type)) {
      return {
        formattedAmount: `+₹${absAmount}`,
        color: isDark ? "#4ADE80" : "#16A34A",
        bg: isDark ? "#14532D" : "#DCFCE7",
        isCredit: true,
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={currentTheme.text || "#000"} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Wallet</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <SafeSpinner size={42} color={primaryColor} />
          <Text style={styles.loadingText}>Loading wallet data...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Balance card */}
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
              <Sparkle size={18} color="#E9D5FF" weight="fill" />
            </View>

            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceAmount}>₹{balance.toFixed(2)}</Text>

            {/* Total Earnings + Pending Balance (pending from earnings API) */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total Earnings</Text>
                <Text style={styles.statValue}>₹{totalEarnings.toFixed(2)}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Pending Balance</Text>
                <Text style={styles.statValue}>₹{Number(pendingBalance || 0).toFixed(2)}</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Withdraw — Add Amount removed: freelancer wallets are funded
              only through earnings; deposits stay a client-only flow. */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate("Withdrawal Earning")}
              activeOpacity={0.85}
            >
              <ArrowDown size={19} color={primaryColor} weight="bold" />
              <Text style={styles.secondaryButtonText}>Withdraw</Text>
            </TouchableOpacity>
          </View>

          {/* Outstanding balance (unchanged behaviour) */}
          {balance < 0 && (
            <TouchableOpacity
              style={styles.settleButton}
              activeOpacity={0.85}
              onPress={() =>
                (navigation.getParent?.()?.navigate
                  ? navigation.getParent()?.navigate("Home", { screen: "SettleBalance" })
                  : navigation.navigate("SettleBalance"))
              }
            >
              <Text style={styles.settleButtonText}>Settle Outstanding Balance</Text>
            </TouchableOpacity>
          )}

          {/* Warning (same text, now theme aware) */}
          <View style={styles.warningCard}>
            <Warning size={20} color={isDark ? "#FBBF24" : "#B45309"} weight="fill" />
            <Text style={styles.warningText}>Withdraw amount greater than ₹99</Text>
          </View>

          {/* Transaction History (recent list; See All opens full history) */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transaction History</Text>
            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={() => navigation.navigate("TransactionHistoryFreelancer")}
              activeOpacity={0.7}
            >
              <ClockCounterClockwise size={15} color={primaryColor} weight="bold" />
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
    </SafeAreaView>
  );
};

const getStyles = (currentTheme, primaryColor) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: currentTheme.background || "#FFFFFF",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 8,
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
    headerTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: currentTheme.text || "#000000",
      letterSpacing: 0.3,
    },
    headerSpacer: {
      width: 40,
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
    content: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 40,
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
    earningsText: {
      fontSize: 13,
      color: "#DDD6FE",
      marginTop: 8,
      fontWeight: "500",
    },
    /* ---------- Total Earnings / Pending Balance row ---------- */
    statsRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 18,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: "rgba(255,255,255,0.18)",
    },
    statItem: {
      flex: 1,
    },
    statDivider: {
      width: 1,
      height: 34,
      backgroundColor: "rgba(255,255,255,0.18)",
      marginHorizontal: 12,
    },
    statLabel: {
      fontSize: 11.5,
      color: "#DDD6FE",
      fontWeight: "600",
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
    statValue: {
      fontSize: 16,
      color: "#FFFFFF",
      fontWeight: "700",
      marginTop: 4,
    },

    /* ---------- Action buttons ---------- */
    actionRow: {
      flexDirection: "row",
      gap: 12,
      marginTop: 20,
    },
    primaryButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      height: 54,
      borderRadius: 16,
      backgroundColor: primaryColor,
      shadowColor: primaryColor,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.28,
      shadowRadius: 12,
      elevation: 4,
    },
    primaryButtonText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "700",
      letterSpacing: 0.3,
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

    /* ---------- Settle (unchanged look intent) ---------- */
    settleButton: {
      marginTop: 16,
      height: 50,
      borderRadius: 16,
      backgroundColor: "#DC2626",
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#DC2626",
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.22,
      shadowRadius: 10,
      elevation: 3,
    },
    settleButtonText: {
      color: "#FFFFFF",
      fontWeight: "700",
      fontSize: 15,
    },

    /* ---------- Warning (theme aware) ---------- */
    warningCard: {
      marginTop: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: currentTheme.isDark ? "#3B2A06" : "#FFFBEB",
      borderWidth: 1,
      borderColor: currentTheme.isDark ? "#78350F" : "#FCD34D",
      borderRadius: 16,
      paddingVertical: 12,
      paddingHorizontal: 14,
    },
    warningText: {
      flex: 1,
      fontSize: 13,
      fontWeight: "600",
      color: currentTheme.isDark ? "#FBBF24" : "#92400E",
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
      gap: 3,
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

export default WalletFreelancerScreen;
