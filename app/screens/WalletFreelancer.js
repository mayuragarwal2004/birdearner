import React, { useEffect, useState } from "react";
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
import { Ionicons } from "@expo/vector-icons";
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
  const styles = getStyles(currentTheme);

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
      const historyResponse =
        await apiService.getFreelancerTransactionHistory();
      if (historyResponse.success) {
        console.log({ transactions: historyResponse.data.transactions });
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

  console.log({ walletData });

  const formatTransactionType = (type) => {
    switch (type) {
      case "DEPOSIT":
        return "Wallet Deposit";
      case "WITHDRAWAL":
        return "Wallet Withdrawal";
      case "JOB_PAYMENT":
        return "Job Payment";
      case "JOB_REFUND":
        return "Job Refund";
      case "JOB_RESERVE":
        return "Job Reserve";
      case "JOB_RELEASE":
        return "Job Release";
      case "PENALTY":
        return "Late Penalty";
      case "BONUS":
        return "Early Bonus";
      case "PLATFORM_FEE":
        return "Platform Fee";
      default:
        return (
          type?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) ||
          "Unknown"
        );
    }
  };

  const renderItem = ({ item }) => {
    const createdAt = item?.createdAt || item?.date;
    const date = new Date(createdAt);

    // Format the date and time
    const formattedDate = date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const formattedTime = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    // Determine if this is a credit or debit transaction
    const isDebit = [
      "DEPOSIT",
      "JOB_REFUND",
      "JOB_RELEASE",
      "BONUS",
      "PLATFORM_FEE",
      "PENALTY",
      "WITHDRAWAL",
    ].includes(item?.transactionType);
    const isCredit = ["JOB_PAYMENT"].includes(item?.transactionType);

    return (
      <View style={[styles.paymentItem]}>
        {/* Triangle Indicator and Payment Details */}
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {/* Payment Details */}
          <View style={styles.paymentDetails}>
            {/* Triangle Indicator */}
            <View style={styles.indicatorName}>
              <View
                style={[
                  styles.triangleIndicator,
                  {
                    borderLeftColor: isCredit ? "#71C232" : "#FF3B30",
                  },
                ]}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>
                  {formatTransactionType(item?.transactionType)}
                </Text>
                {item?.description && (
                  <Text style={styles.description}>{item.description}</Text>
                )}
                {item?.jobTitle && (
                  <Text style={styles.jobTitle}>Job: {item.jobTitle}</Text>
                )}
              </View>
            </View>
            <Text
              style={[
                styles.amount,
                {
                  color: isCredit ? "#71C232" : "#FF3B30",
                },
              ]}
            >
              {isDebit ? "-" : "+"}₹{parseFloat(item?.amount || 0).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Date and Balance Info */}
        <View
          style={[
            styles.paymentDetailsn,
            {
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            },
          ]}
        >
          <Text style={styles.date}>
            {formattedDate} | {formattedTime}
          </Text>
          <Text style={styles.balanceInfo}>
            Balance: ₹{parseFloat(item?.balanceAfter || 0).toFixed(2)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.main}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={currentTheme.text || "black"}
          />
        </TouchableOpacity>
        <Text style={styles.header}>Wallet</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6A0DAD" />
          <Text style={styles.loadingText}>Loading wallet data...</Text>
        </View>
      ) : (
        <>
          <Text style={styles.label}>Total Amount in Wallet</Text>
          <Text style={styles.colorText}>
            ₹{walletData?.withdrawableAmount?.toFixed(2) || "0.00"}
          </Text>

          {walletData?.withdrawableAmount?.toFixed(2) !==
            walletData?.totalEarnings?.toFixed(2) && (
              <View style={styles.availableContainer}>
                <Text style={styles.availableLabel}>Total Earnings</Text>
                <Text style={styles.availableAmount}>
                  ₹{walletData?.totalEarnings?.toFixed(2) || "0.00"}
                </Text>
              </View>
            )}

          {walletData?.withdrawableAmount < 0 && (
            <TouchableOpacity
              style={[styles.addAmountButton, { backgroundColor: "#FF3B30", marginBottom: 20 }]}
              onPress={() => navigation.navigate("SettleBalance")}
            >
              <Text style={styles.addAmount}>Settle Outstanding Balance</Text>
            </TouchableOpacity>
          )}

          <View style={styles.historyContainer}>
            <Text style={styles.headerPay}>Payment History</Text>
            {paymentHistory.length > 0 ? (
              <FlatList
                data={paymentHistory}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                style={styles.historyList}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={["#6A0DAD"]}
                    tintColor="#6A0DAD"
                  />
                }
              />
            ) : (
              <Text style={styles.noHistory}>
                No payment history available.
              </Text>
            )}
          </View>
        </>
      )}
    </View>
  );
};

const getStyles = (currentTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: currentTheme.background || "#FFF",
      paddingHorizontal: 40,
    },
    main: {
      marginTop: 45,
      marginBottom: 50,
      display: "flex",
      flexDirection: "row",
      gap: 100,
      alignItems: "center",
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: currentTheme.text || "#000",
    },
    reservedContainer: {
      marginVertical: 10,
      padding: 15,
      backgroundColor: "#FFF3CD",
      borderRadius: 8,
      borderLeftWidth: 4,
      borderLeftColor: "#FFB000",
    },
    reservedLabel: {
      fontSize: 14,
      color: "#856404",
      fontWeight: "500",
    },
    reservedAmount: {
      fontSize: 18,
      color: "#856404",
      fontWeight: "bold",
    },
    availableContainer: {
      marginBottom: 20,
      padding: 10,
      backgroundColor: currentTheme.cardBackground || "#F8F9FA",
      borderRadius: 8,
      alignItems: "center",
    },
    availableLabel: {
      fontSize: 14,
      color: currentTheme.subText || "#666",
      marginBottom: 5,
    },
    availableAmount: {
      fontSize: 20,
      color: "#28A745",
      fontWeight: "600",
    },
    addAmountButton: {
      width: "90%",
      margin: "auto",
      padding: 10,
      backgroundColor: "#6A0DAD",
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    addAmount: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 20,
    },
    header: {
      fontSize: 24,
      fontWeight: "bold",
      textAlign: "center",
      color: currentTheme.text,
    },
    headerPay: {
      fontSize: 22,
      fontWeight: "600",
      marginBottom: 20,
      textAlign: "center",
      marginTop: 25,
      color: "#8F8F8F",
    },
    label: {
      fontSize: 18,
      color: currentTheme.text || "#000000",
      marginBottom: 8,
      fontWeight: "400",
      textAlign: "center",
    },
    colorText: {
      fontSize: 30,
      fontWeight: "600",
      color: "#4B0082",
      textAlign: "center",
      marginBottom: 20,
    },
    historyContainer: {
      flex: 1,
      marginTop: 20,
    },
    historyList: {
      marginTop: 10,
    },
    paymentItem: {
      backgroundColor: currentTheme.cardBackground || "#fff",
      marginVertical: 5,
      borderRadius: 8,
      elevation: 3,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 1.5,
      paddingVertical: 10,
      paddingHorizontal: 15,
    },
    triangleIndicator: {
      width: 0,
      height: 0,
      borderTopWidth: 8,
      borderBottomWidth: 8,
      borderLeftWidth: 16,
      borderStyle: "solid",
      borderTopColor: "transparent",
      borderBottomColor: "transparent",
      marginRight: 10,
    },
    paymentDetails: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 5,
    },
    indicatorName: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "flex-start",
      alignItems: "center",
    },
    name: {
      fontSize: 15,
      fontWeight: "500",
      color: currentTheme.text || "#333",
      marginBottom: 2,
    },
    description: {
      fontSize: 12,
      color: currentTheme.subText || "#666",
      fontStyle: "italic",
    },
    jobTitle: {
      fontSize: 11,
      color: "#4B0082",
      fontWeight: "500",
      marginTop: 2,
    },
    amount: {
      fontSize: 16,
      fontWeight: "600",
    },
    date: {
      fontSize: 12,
      color: "#666",
    },
    balanceInfo: {
      fontSize: 12,
      color: "#4B0082",
      fontWeight: "500",
    },
    noHistory: {
      fontSize: 16,
      color: "#888",
      textAlign: "center",
      marginTop: 20,
    },
    paymentDetailsn: {
      // Additional styles if needed
    },
  });

export default WalletFreelancerScreen;
