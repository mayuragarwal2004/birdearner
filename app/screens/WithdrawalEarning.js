import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  FlatList,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/NewAuthContext";
import apiService from "../lib/apiService";
import Toast from "react-native-toast-message";
import { useTheme } from "../context/ThemeContext";

const WithdrawalEarningScreen = ({ navigation }) => {
  const [amount, setAmount] = useState("");
  const [warning, setWarning] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [walletData, setWalletData] = useState(null);
  const [fetchingWallet, setFetchingWallet] = useState(true);
  const [withdrawalHistory, setWithdrawalHistory] = useState([]);
  const [fetchingHistory, setFetchingHistory] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { refreshUserData } = useAuth();
  const totalAmountInWallet = walletData?.withdrawableAmount || 0;

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];

  const styles = getStyles(currentTheme);

  // Fetch wallet data when the screen is focused
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchWalletData();
      fetchWithdrawalHistory();
    });
    return unsubscribe;
  }, [navigation]);

  // Initial load
  useEffect(() => {
    fetchWalletData();
    fetchWithdrawalHistory();
  }, []);

  const fetchWalletData = async () => {
    try {
      setFetchingWallet(true);

      // Fetch wallet information
      const walletResponse = await apiService.getFreelancerWalletInfo();
      if (walletResponse.success) {
        setWalletData(walletResponse.data);
      } else {
        handleError("Failed to load wallet data");
      }
    } catch (error) {
      console.error("Error fetching wallet data:", error);
      handleError("Failed to load wallet data. Please try again.");
    } finally {
      setFetchingWallet(false);
    }
  };

  const fetchWithdrawalHistory = async () => {
    try {
      setFetchingHistory(true);

      // Fetch withdrawal requests history
      const historyResponse = await apiService.getMyWithdrawalRequests(1, 10);
      if (historyResponse.success) {
        setWithdrawalHistory(historyResponse.data.requests || []);
      } else {
        console.error("Failed to load withdrawal history");
      }
    } catch (error) {
      console.error("Error fetching withdrawal history:", error);
    } finally {
      setFetchingHistory(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchWalletData(),
        fetchWithdrawalHistory()
      ]);
    } catch (error) {
      console.error("Error during refresh:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleError = (message) => {
    Toast.show({
      type: "error",
      text1: "Error",
      text2: message,
    });
  };

  const handleSuccess = (message) => {
    Toast.show({
      type: "success",
      text1: "Success",
      text2: message,
    });
  };

  const handleAmountChange = (value) => {
    const numericValue = parseFloat(value);

    if (value === "") {
      setAmount("");
      setWarning("");
      return;
    }

    if (isNaN(numericValue) || numericValue < 0) {
      setWarning("Please enter a valid amount.");
      setAmount(value);
    } else if (numericValue > totalAmountInWallet) {
      // If the entered amount exceeds the total amount, adjust it to totalAmount
      setAmount(totalAmountInWallet.toString());
      setWarning("Adjusted to maximum withdrawable amount.");
    } else {
      setWarning("");
      setAmount(value);
    }
  };

  const handleProcess = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      handleError("Please enter a valid amount");
      return;
    }

    const withdrawalAmount = parseFloat(amount);
    
    if (withdrawalAmount > totalAmountInWallet) {
      handleError("Insufficient withdrawable balance");
      return;
    }

    setIsLoading(true);

    try {
      // Create withdrawal request using the new API
      const response = await apiService.createWithdrawalRequest(withdrawalAmount);

      if (response.success) {
        handleSuccess("Withdrawal request submitted successfully! Your request is now pending admin approval.");
        
        // Refresh wallet data to get updated balance
        await fetchWalletData();
        
        // Refresh withdrawal history to show the new request
        await fetchWithdrawalHistory();
        
        // Also refresh user data context
        await refreshUserData();
        
        // Clear the amount field
        setAmount("");
        setWarning("");
        
        // Show history section to see the new request
        setShowHistory(true);
      } else {
        handleError(response.message || "Failed to submit withdrawal request");
      }
    } catch (error) {
      console.error("Withdrawal request error:", error);
      handleError(error.message || "Failed to submit withdrawal request");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return '#FFA500'; // Orange
      case 'APPROVED':
        return '#4CAF50'; // Green
      case 'PROCESSED':
        return '#2196F3'; // Blue
      case 'REJECTED':
        return '#F44336'; // Red
      default:
        return '#9E9E9E'; // Gray
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'PENDING':
        return 'Pending Review';
      case 'APPROVED':
        return 'Approved';
      case 'PROCESSED':
        return 'Processed';
      case 'REJECTED':
        return 'Rejected';
      default:
        return status;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#6A0DAD']}
          tintColor="#6A0DAD"
        />
      }
    >
      <View style={styles.main}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={currentTheme.text || black}
          />
        </TouchableOpacity>
        <Text style={styles.header}>Withdrawal Request</Text>
      </View>

      {fetchingWallet ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6A0DAD" />
          <Text style={styles.loadingText}>Loading wallet data...</Text>
        </View>
      ) : (
        <>
          {/* Total Amount in Wallet */}
          <Text style={styles.label}>Total Amount in Wallet</Text>
          <Text style={styles.colorText}>
            RS. {String(walletData?.withdrawableAmount?.toFixed(2) || "0.00")}
          </Text>

          {/* Info Note */}
          <View style={styles.infoNote}>
            <Ionicons name="information-circle" size={20} color="#2196F3" />
            <Text style={styles.infoText}>
              Your withdrawal request will be reviewed by admin before processing
            </Text>
          </View>

          {/* Withdrawal Amount Input */}
      <Text style={styles.label}>Enter the amount you want to withdraw</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter amount"
        value={amount}
        onChangeText={handleAmountChange}
        keyboardType="numeric"
        autoComplete="off"
        editable={!isLoading}
      />

      {warning !== "" && <Text style={styles.warning}>{warning}</Text>}

      {/* Amount to Withdraw */}
      <Text style={styles.label}>You’re withdrawing</Text>
      <View style={styles.withdrawal}>
        <Text style={styles.withdrawalText}>RS. {amount || "0"}</Text>
      </View>

          <TouchableOpacity 
            style={[
              styles.signupButton, 
              (isLoading || !amount || parseFloat(amount) <= 0) && styles.disabledButton
            ]} 
            onPress={handleProcess}
            disabled={isLoading || !amount || parseFloat(amount) <= 0}
          >
            <Text style={styles.signupButtonText}>
              {isLoading ? "Submitting Request..." : "Submit Withdrawal Request"}
            </Text>
          </TouchableOpacity>

          {/* Withdrawal History Section */}
          <View style={styles.historySection}>
            <TouchableOpacity 
              style={styles.historyToggle}
              onPress={() => setShowHistory(!showHistory)}
            >
              <Text style={styles.historyToggleText}>
                Withdrawal History ({withdrawalHistory.length})
              </Text>
              <Ionicons
                name={showHistory ? "chevron-up" : "chevron-down"}
                size={20}
                color={currentTheme.text}
              />
            </TouchableOpacity>

            {showHistory && (
              <View style={styles.historyContainer}>
                {fetchingHistory ? (
                  <ActivityIndicator size="small" color="#6A0DAD" />
                ) : withdrawalHistory.length === 0 ? (
                  <Text style={styles.noHistoryText}>No withdrawal requests yet</Text>
                ) : (
                  <FlatList
                    data={withdrawalHistory}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <View style={styles.historyItem}>
                        <View style={styles.historyItemHeader}>
                          <Text style={styles.historyAmount}>
                            RS. {parseFloat(item.amount).toFixed(2)}
                          </Text>
                          <View style={[
                            styles.statusBadge,
                            { backgroundColor: getStatusColor(item.status) }
                          ]}>
                            <Text style={styles.statusText}>
                              {getStatusText(item.status)}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.historyDate}>
                          Requested: {formatDate(item.createdAt)}
                        </Text>
                        {item.processedAt && (
                          <Text style={styles.historyDate}>
                            Processed: {formatDate(item.processedAt)}
                          </Text>
                        )}
                        {item.notes && (
                          <Text style={styles.historyNotes}>
                            Note: {item.notes}
                          </Text>
                        )}
                      </View>
                    )}
                    scrollEnabled={false}
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={false}
                  />
                )}
              </View>
            )}
          </View>
        </>
      )}

      <Toast />
    </ScrollView>
  );
};

const getStyles = (currentTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background || "#FFF",
    },
    contentContainer: {
      padding: 20,
      paddingHorizontal: 40,
      paddingBottom: 40,
    },
    main: {
      marginTop: 45,
      marginBottom: 50,
      display: "flex",
      flexDirection: "row",
      gap: 50,
      alignItems: "center",
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingTop: 50,
    },
    loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: currentTheme.text || "#000",
    },
    header: {
      fontSize: 24,
      fontWeight: "bold",
      textAlign: "center",
      color: currentTheme.text,
    },
    label: {
      fontSize: 18,
      color: currentTheme.text || "#000000",
      marginBottom: 8,
      fontWeight: "400",
      textAlign: "center",
    },
    colorText: {
      fontSize: 24,
      fontWeight: "600",
      color: currentTheme.primary || "#4B0082",
      textAlign: "center",
      marginBottom: 20,
    },
    infoNote: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#E3F2FD",
      padding: 12,
      borderRadius: 8,
      marginBottom: 20,
    },
    infoText: {
      marginLeft: 8,
      fontSize: 14,
      color: "#1976D2",
      flex: 1,
    },
    withdrawal: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      marginTop: 10,
    },
    withdrawalText: {
      color: "#fff",
      fontSize: 24,
      fontWeight: "600",
      textAlign: "center",
      backgroundColor: currentTheme.primary || "#4B0082",
      // width: 100,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 12,
    },
    input: {
      // width: "100%",
      height: 44,
      backgroundColor: currentTheme.background3 || "#fff",
      borderRadius: 12,
      paddingHorizontal: 20,
      // marginBottom: 40,
      fontSize: 16,
      borderColor: "#4B0082",
      borderWidth: 2,
      marginVertical: 10,
      margin: "auto",
      color: currentTheme.subText,
    },
    warning: {
      color: "red",
      fontSize: 14,
      textAlign: "center",
      marginBottom: 40,
    },
    signupButton: {
      width: "80%",
      height: 50,
      backgroundColor: currentTheme.primary || "#6A0DAD",
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 30,
      alignSelf: "center",
    },
    disabledButton: {
      backgroundColor: "#ccc",
      opacity: 0.6,
    },
    signupButtonText: {
      color: "white",
      fontSize: 18,
      fontWeight: "700",
      textAlign: "center",
    },
    historySection: {
      marginTop: 40,
    },
    historyToggle: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: currentTheme.background3 || "#f5f5f5",
      padding: 15,
      borderRadius: 12,
      marginBottom: 10,
    },
    historyToggleText: {
      fontSize: 18,
      fontWeight: "600",
      color: currentTheme.text || "#000",
    },
    historyContainer: {
      backgroundColor: currentTheme.background3 || "#f5f5f5",
      borderRadius: 12,
      padding: 15,
    },
    historyItem: {
      backgroundColor: currentTheme.background || "#fff",
      padding: 15,
      borderRadius: 8,
      marginBottom: 10,
      borderLeftWidth: 4,
      borderLeftColor: currentTheme.primary || "#4B0082",
    },
    historyItemHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    historyAmount: {
      fontSize: 18,
      fontWeight: "bold",
      color: currentTheme.text || "#000",
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 20,
    },
    statusText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "600",
    },
    historyDate: {
      fontSize: 12,
      color: currentTheme.subText || "#666",
      marginBottom: 4,
    },
    historyNotes: {
      fontSize: 14,
      color: currentTheme.text || "#000",
      fontStyle: "italic",
      marginTop: 8,
    },
    noHistoryText: {
      textAlign: "center",
      color: currentTheme.subText || "#666",
      fontSize: 16,
      fontStyle: "italic",
      padding: 20,
    },
  });

export default WithdrawalEarningScreen;
