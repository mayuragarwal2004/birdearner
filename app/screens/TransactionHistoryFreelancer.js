import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  RefreshControl,
} from "react-native";
import SafeSpinner from "../components/SafeSpinner";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Wallet, ClockCounterClockwise } from "phosphor-react-native";
import { useAuth } from "../context/NewAuthContext";
import { useTheme } from "../context/ThemeContext";
import apiService from "../lib/apiService";

const TransactionHistoryFreelancerScreen = ({ navigation }) => {
  const { userData } = useAuth();
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  
  const isDark = theme === "dark";
  const primaryColor = isDark ? "#C4B5FD" : (currentTheme.primary || "#4B0082");
  
  const styles = useMemo(() => getStyles(currentTheme, primaryColor), [currentTheme, primaryColor]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchTransactionHistory();
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    fetchTransactionHistory();
  }, []);

  const fetchTransactionHistory = async () => {
    try {
      setLoading(true);
      const historyResponse = await apiService.getFreelancerTransactionHistory();
      if (historyResponse.success) {
        setPaymentHistory(historyResponse.data.transactions || []);
      }
    } catch (error) {
      console.error("Error fetching transaction history:", error);
      Alert.alert("Error", "Failed to load transaction history. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTransactionHistory();
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
        <View style={styles.headerContainer}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color={currentTheme.text || "#000"} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Transaction History</Text>
          </View>
          <View style={styles.rightPlaceholder} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <SafeSpinner size={42} color={primaryColor} />
            <Text style={styles.loadingText}>Loading transactions...</Text>
          </View>
        ) : (
          <View style={styles.content}>
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
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconContainer}>
                  <View style={styles.emptyIconBackground}>
                    <Wallet size={48} color={primaryColor} weight="fill" style={{ opacity: 0.8 }} />
                    <View style={styles.clockBadge}>
                      <ClockCounterClockwise size={16} color="#FFF" weight="bold" />
                    </View>
                  </View>
                </View>
                <Text style={styles.emptyTitle}>No transactions yet</Text>
                <Text style={styles.emptySubtitle}>Your transaction history will appear here.</Text>
              </View>
            )}
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
      width: 36,
      height: 36,
      borderRadius: 18,
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
      fontSize: 18,
      fontWeight: "700",
      color: currentTheme.text || "#000",
    },
    rightPlaceholder: {
      width: 36,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: currentTheme.subText || "#666",
    },
    content: {
      flex: 1,
      paddingHorizontal: 24,
    },
    historyList: {
      paddingBottom: 20,
    },
    paymentItem: {
      backgroundColor: currentTheme.cardBackground || "#F9FAFB",
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: currentTheme.border || "#E5E7EB",
    },
    paymentItemHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    paymentItemLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      marginRight: 12,
    },
    transactionDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 10,
    },
    transactionName: {
      fontSize: 14,
      fontWeight: "600",
      color: currentTheme.text || "#000",
    },
    transactionDescription: {
      fontSize: 12,
      color: currentTheme.subText || "#666",
      marginTop: 2,
    },
    transactionAmount: {
      fontSize: 15,
      fontWeight: "700",
    },
    paymentItemFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: currentTheme.border || "#E5E7EB",
    },
    transactionDate: {
      fontSize: 12,
      color: currentTheme.subText || "#666",
    },
    transactionBalance: {
      fontSize: 12,
      color: currentTheme.subText || "#666",
      fontWeight: "500",
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingBottom: 60,
    },
    emptyIconContainer: {
      alignItems: "center",
      marginBottom: 20,
    },
    emptyIconBackground: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: currentTheme.border || "#E5E7EB",
      justifyContent: "center",
      alignItems: "center",
    },
    clockBadge: {
      position: "absolute",
      bottom: -4,
      right: -4,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: primaryColor,
      justifyContent: "center",
      alignItems: "center",
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: currentTheme.text || "#000",
      marginBottom: 6,
    },
    emptySubtitle: {
      fontSize: 13,
      color: currentTheme.subText || "#666",
      textAlign: "center",
    },
  });

export default TransactionHistoryFreelancerScreen;
