import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Wallet, ClockCounterClockwise } from "phosphor-react-native";
import { useAuth } from "../context/NewAuthContext";
import { useTheme } from "../context/ThemeContext";
import apiService from "../lib/apiService";

const WalletFreelancerScreen = ({ navigation }) => {
  const { userData } = useAuth();
  const [walletData, setWalletData] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  
  const isDark = theme === "dark";
  const primaryColor = isDark ? "#C4B5FD" : (currentTheme.primary || "#4B0082");
  
  const styles = useMemo(() => getStyles(currentTheme, primaryColor), [currentTheme, primaryColor]);

  // Fetch wallet data when the screen is focused
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchWalletData();
    });
    return unsubscribe;
  }, [navigation]);

  // Initial load
  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      setLoading(true);

      // Fetch wallet information
      const walletResponse = await apiService.getFreelancerWalletInfo();
      if (walletResponse.success) {
        setWalletData(walletResponse.data);
      }

      // Fetch transaction history
      const historyResponse = await apiService.getFreelancerTransactionHistory();
      if (historyResponse.success) {
        setPaymentHistory(historyResponse.data.transactions || []);
      }
    } catch (error) {
      console.error("Error fetching wallet data:", error);
      Alert.alert("Error", "Failed to load wallet data. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchWalletData();
  };

  const formatTransactionType = (type) => {
    switch (type) {
      case "DEPOSIT": return "Wallet Deposit";
      case "WITHDRAWAL": return "Wallet Withdrawal";
      case "JOB_PAYMENT": return "Job Payment";
      case "JOB_REFUND": return "Job Refund";
      case "JOB_RESERVE": return "Job Reserve";
      case "JOB_RELEASE": return "Job Release";
      case "PENALTY": return "Late Penalty";
      case "BONUS": return "Early Bonus";
      case "PLATFORM_FEE": return "Platform Fee";
      default:
        return type?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) || "Unknown";
    }
  };

  const renderItem = ({ item }) => {
    const createdAt = item?.createdAt || item?.date;
    const date = new Date(createdAt);

    // Format the date and time
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

    // Determine if this is a credit or debit transaction
    const isDebit = [
      "DEPOSIT", "JOB_REFUND", "JOB_RELEASE", "BONUS", 
      "PLATFORM_FEE", "PENALTY", "WITHDRAWAL"
    ].includes(item?.transactionType);
    const isCredit = ["JOB_PAYMENT"].includes(item?.transactionType);

    return (
      <View style={styles.paymentItem}>
        <View style={styles.paymentItemHeader}>
          <View style={styles.paymentItemLeft}>
            <View style={[styles.transactionDot, { backgroundColor: isCredit ? "#4CAF50" : "#FF3B30" }]} />
            <View>
              <Text style={styles.transactionName}>{formatTransactionType(item?.transactionType)}</Text>
              {item?.description && (
                <Text style={styles.transactionDescription} numberOfLines={1}>{item.description}</Text>
              )}
            </View>
          </View>
          <Text style={[styles.transactionAmount, { color: isCredit ? "#4CAF50" : "#FF3B30" }]}>
            {isDebit ? "-" : "+"}₹{parseFloat(item?.amount || 0).toFixed(2)}
          </Text>
        </View>

        <View style={styles.paymentItemFooter}>
          <Text style={styles.transactionDate}>{formattedDate} | {formattedTime}</Text>
          <Text style={styles.transactionBalance}>Bal: ₹{parseFloat(item?.balanceAfter || 0).toFixed(2)}</Text>
        </View>
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
            <ActivityIndicator size="large" color={primaryColor} />
            <Text style={styles.loadingText}>Loading wallet data...</Text>
          </View>
        ) : (
          <View style={styles.content}>
            {/* Wallet Balance Section */}
            <View style={styles.balanceSection}>
              <Text style={styles.balanceLabel}>Total Amount in Wallet</Text>
              <Text style={styles.balanceAmount}>
                ₹{walletData?.withdrawableBalance?.toFixed(2) || "0.00"}
              </Text>
              
              {walletData?.withdrawableBalance?.toFixed(2) !== walletData?.totalEarnings?.toFixed(2) && (
                <Text style={styles.secondaryBalance}>
                  Total Earnings: ₹{walletData?.totalEarnings?.toFixed(2) || "0.00"}
                </Text>
              )}

              {walletData?.withdrawableBalance < 0 && (
                <TouchableOpacity
                  style={styles.settleButton}
                  onPress={() =>
                    (navigation.getParent?.()?.navigate
                      ? navigation.getParent()?.navigate("Home", { screen: "SettleBalance" })
                      : navigation.navigate("SettleBalance"))
                  }
                >
                  <Text style={styles.settleButtonText}>Settle Outstanding Balance</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* History Section */}
            <View style={styles.historySection}>
              <Text style={styles.historyTitle}>Payment History</Text>

              {paymentHistory.length > 0 ? (
                <FlatList
                  data={paymentHistory}
                  renderItem={renderItem}
                  keyExtractor={(item, index) => item?.id || index.toString()}
                  contentContainerStyle={styles.historyList}
                  showsVerticalScrollIndicator={false}
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={onRefresh}
                      colors={[primaryColor]}
                      tintColor={primaryColor}
                    />
                  }
                />
              ) : (
                <View style={styles.emptyHistoryContainer}>
                  <View style={styles.emptyIconContainer}>
                    <View style={styles.emptyIconBackground}>
                      <Wallet size={48} color={primaryColor} weight="fill" style={{ opacity: 0.8 }} />
                      <View style={styles.clockBadge}>
                        <ClockCounterClockwise size={16} color="#FFF" weight="bold" />
                      </View>
                    </View>
                  </View>
                  <Text style={styles.emptyHistoryTitle}>No payment history available.</Text>
                  <Text style={styles.emptyHistorySubtitle}>Your transactions will appear here.</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const getStyles = (currentTheme, primaryColor) =>
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
      paddingHorizontal: 24,
      paddingTop: 20,
      marginBottom: 30,
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
      backgroundColor: currentTheme.background || "#FFFFFF",
    },
    headerTitleContainer: {
      flex: 1,
      alignItems: "center",
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: currentTheme.text || "#000000",
    },
    rightPlaceholder: {
      width: 40,
    },
    content: {
      flex: 1,
      paddingHorizontal: 24,
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
    balanceSection: {
      alignItems: "center",
      marginBottom: 30,
    },
    balanceLabel: {
      fontSize: 16,
      color: currentTheme.text || "#333",
      marginBottom: 8,
    },
    balanceAmount: {
      fontSize: 40,
      fontWeight: "bold",
      color: primaryColor,
    },
    secondaryBalance: {
      fontSize: 14,
      color: currentTheme.subText || "#666",
      marginTop: 8,
    },
    settleButton: {
      marginTop: 20,
      backgroundColor: "#FF3B30",
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 12,
    },
    settleButtonText: {
      color: "#FFF",
      fontWeight: "bold",
      fontSize: 16,
    },
    divider: {
      height: 1,
      backgroundColor: currentTheme.border || "#F0F0F0",
      width: "100%",
      marginBottom: 24,
    },
    historySection: {
      flex: 1,
    },
    historyTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: currentTheme.text || "#000",
      marginBottom: 20,
    },
    emptyHistoryContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingBottom: 50,
    },
    emptyIconContainer: {
      marginBottom: 24,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyIconBackground: {
      width: 100,
      height: 80,
      backgroundColor: currentTheme.theme === "dark" ? "#2e1f4a" : "#F3E8FF",
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    },
    clockBadge: {
      position: "absolute",
      bottom: -6,
      right: -6,
      backgroundColor: primaryColor,
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: currentTheme.background || "#FFF",
    },
    emptyHistoryTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: currentTheme.text || "#000",
      marginBottom: 8,
    },
    emptyHistorySubtitle: {
      fontSize: 14,
      color: currentTheme.subText || "#666",
    },
    historyList: {
      paddingBottom: 40,
    },
    paymentItem: {
      backgroundColor: currentTheme.theme === "dark" ? "#1f2937" : "#F9FAFB",
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    },
    paymentItemHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 12,
    },
    paymentItemLeft: {
      flexDirection: "row",
      alignItems: "flex-start",
      flex: 1,
      marginRight: 10,
    },
    transactionDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginTop: 6,
      marginRight: 10,
    },
    transactionName: {
      fontSize: 15,
      fontWeight: "600",
      color: currentTheme.text || "#000",
      marginBottom: 4,
    },
    transactionDescription: {
      fontSize: 13,
      color: currentTheme.subText || "#666",
    },
    transactionAmount: {
      fontSize: 16,
      fontWeight: "bold",
    },
    paymentItemFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderTopWidth: 1,
      borderTopColor: currentTheme.border || "#E5E7EB",
      paddingTop: 12,
    },
    transactionDate: {
      fontSize: 12,
      color: currentTheme.subText || "#666",
    },
    transactionBalance: {
      fontSize: 12,
      color: primaryColor,
      fontWeight: "500",
    },
  });

export default WalletFreelancerScreen;
