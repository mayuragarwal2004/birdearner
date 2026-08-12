import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  FlatList,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import SafeSpinner from "../components/SafeSpinner";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Info, CurrencyInr, CaretUp, CaretDown, Archive } from "phosphor-react-native";
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
  const [showHistory, setShowHistory] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { refreshUserData } = useAuth();
  const totalAmountInWallet = walletData?.withdrawableBalance || 0;

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];

  const isDark = theme === "dark";
  const primaryColor = isDark ? "#C4B5FD" : (currentTheme.primary || "#4B0082");
  const buttonColor = isDark ? "#762BAD" : (currentTheme.primary || "#4B0082");

  const styles = useMemo(() => getStyles(currentTheme, primaryColor, buttonColor), [currentTheme, primaryColor, buttonColor]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchWalletData();
      fetchWithdrawalHistory();
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    fetchWalletData();
    fetchWithdrawalHistory();
  }, []);

  const fetchWalletData = async () => {
    try {
      setFetchingWallet(true);
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
      const response = await apiService.createWithdrawalRequest(withdrawalAmount);

      if (response.success) {
        handleSuccess("Withdrawal request submitted successfully! Your request is now pending admin approval.");
        await fetchWalletData();
        await fetchWithdrawalHistory();
        await refreshUserData();
        setAmount("");
        setWarning("");
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
      case 'PENDING': return '#FFA500';
      case 'APPROVED': return '#4CAF50';
      case 'PROCESSED': return '#2196F3';
      case 'REJECTED': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'PENDING': return 'Pending Review';
      case 'APPROVED': return 'Approved';
      case 'PROCESSED': return 'Processed';
      case 'REJECTED': return 'Rejected';
      default: return status;
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

  const isButtonDisabled = isLoading || !amount || parseFloat(amount) <= 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[primaryColor]}
              tintColor={primaryColor}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerContainer}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <ArrowLeft size={20} color={currentTheme.text || "#000"} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Withdrawal Request</Text>
            </View>
            <View style={styles.rightPlaceholder} />
          </View>

          {fetchingWallet ? (
            <View style={styles.loadingContainer}>
              <SafeSpinner size={42} color={primaryColor} />
              <Text style={styles.loadingText}>Loading wallet data...</Text>
            </View>
          ) : (
            <>
              {/* Total Amount in Wallet */}
              <View style={styles.centerSection}>
                <Text style={styles.walletLabel}>Total Amount in Wallet</Text>
                <Text style={styles.walletAmount}>
                  ₹{totalAmountInWallet.toFixed(2)}
                </Text>
              </View>

              {/* Info Note */}
              <View style={styles.infoNote}>
                <Info size={24} color={primaryColor} weight="fill" />
                <Text style={[styles.infoText, { color: primaryColor }]}>
                  Your withdrawal request will be reviewed by admin before processing
                </Text>
              </View>

              {/* Withdrawal Amount Input */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Enter the amount you want to withdraw</Text>
                <View style={styles.inputWrapper}>
                  <CurrencyInr size={20} color={currentTheme.text || "#000"} weight="bold" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter amount"
                    placeholderTextColor={currentTheme.subText || "#9ca3af"}
                    value={amount}
                    onChangeText={handleAmountChange}
                    keyboardType="numeric"
                    autoComplete="off"
                    editable={!isLoading}
                  />
                </View>
                {warning !== "" && <Text style={styles.warning}>{warning}</Text>}
              </View>

              {/* Amount to Withdraw Display */}
              <View style={styles.centerSection}>
                <Text style={styles.walletLabel}>You're withdrawing</Text>
                <Text style={styles.walletAmount}>
                  ₹{amount ? parseFloat(amount).toFixed(2) : "0.00"}
                </Text>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  isButtonDisabled && styles.disabledButton
                ]}
                onPress={handleProcess}
                disabled={isButtonDisabled}
              >
                <Text style={[
                  styles.submitButtonText,
                  isButtonDisabled && styles.disabledButtonText
                ]}>
                  Submit Withdrawal Request
                </Text>
              </TouchableOpacity>

              {/* Withdrawal History Section */}
              <View style={styles.historySection}>
                <TouchableOpacity
                  style={styles.historyToggle}
                  onPress={() => setShowHistory(!showHistory)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.historyToggleText}>
                    Withdrawal History ({withdrawalHistory.length})
                  </Text>
                  {showHistory ? (
                    <CaretUp size={20} color={currentTheme.text || "#000"} />
                  ) : (
                    <CaretDown size={20} color={currentTheme.text || "#000"} />
                  )}
                </TouchableOpacity>

                {showHistory && (
                  <View style={styles.historyContent}>
                    {fetchingHistory ? (
                      <SafeSpinner size={18} color={primaryColor} />
                    ) : withdrawalHistory.length === 0 ? (
                      <View style={styles.emptyHistoryContainer}>
                        <View style={styles.emptyHistoryIconWrapper}>
                          <Archive size={48} color={primaryColor} weight="fill" style={{ opacity: 0.5 }} />
                        </View>
                        <Text style={styles.emptyHistoryTitle}>No withdrawal requests yet</Text>
                        <Text style={styles.emptyHistorySubtitle}>Your withdrawal requests will appear here.</Text>
                      </View>
                    ) : (
                      <FlatList
                        data={withdrawalHistory}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                          <View style={styles.historyItem}>
                            <View style={styles.historyItemHeader}>
                              <Text style={styles.historyAmount}>
                                ₹{parseFloat(item.amount).toFixed(2)}
                              </Text>
                              <View style={[
                                styles.statusBadge,
                                { backgroundColor: getStatusColor(item.status) + '20' } // 20% opacity background
                              ]}>
                                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
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
        </ScrollView>
      </KeyboardAvoidingView>
      <Toast />
    </SafeAreaView>
  );
};

const getStyles = (currentTheme, primaryColor, buttonColor) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: currentTheme.background || "#FFFFFF",
    },
    keyboardView: {
      flex: 1,
    },
    container: {
      flex: 1,
    },
    contentContainer: {
      paddingHorizontal: 24,
      paddingTop: 20,
      paddingBottom: Platform.OS === 'ios' ? 100 : 90,
    },
    headerContainer: {
      flexDirection: "row",
      alignItems: "center",
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
    centerSection: {
      alignItems: "center",
      marginBottom: 20,
    },
    walletLabel: {
      fontSize: 15,
      color: currentTheme.text || "#111827",
      marginBottom: 8,
    },
    walletAmount: {
      fontSize: 36,
      fontWeight: "bold",
      color: primaryColor,
    },
    infoNote: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: currentTheme.theme === "dark" ? "#2e1f4a" : "#F9F5FF",
      padding: 16,
      borderRadius: 12,
      marginBottom: 30,
    },
    infoText: {
      marginLeft: 12,
      fontSize: 14,
      flex: 1,
      lineHeight: 20,
    },
    inputSection: {
      marginBottom: 30,
    },
    inputLabel: {
      fontSize: 15,
      color: currentTheme.text || "#111827",
      marginBottom: 10,
      textAlign: "center",
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      height: 56,
      borderWidth: 1,
      borderColor: currentTheme.border || "#E5E7EB",
      borderRadius: 12,
      paddingHorizontal: 16,
      backgroundColor: currentTheme.background || "#FFFFFF",
    },
    inputIcon: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: currentTheme.text || "#000000",
      height: "100%",
    },
    warning: {
      color: "#F44336",
      fontSize: 13,
      marginTop: 8,
      textAlign: "center",
    },
    submitButton: {
      height: 56,
      backgroundColor: buttonColor,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 10,
      marginBottom: 30,
    },
    disabledButton: {
      backgroundColor: currentTheme.theme === "dark" ? "#374151" : "#E5E7EB",
    },
    submitButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
    disabledButtonText: {
      color: currentTheme.theme === "dark" ? "#9ca3af" : "#6b7280",
    },
    historySection: {
      borderWidth: 1,
      borderColor: currentTheme.border || "#E5E7EB",
      borderRadius: 12,
      backgroundColor: currentTheme.background || "#FFFFFF",
      overflow: "hidden",
    },
    historyToggle: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.border || "#E5E7EB",
    },
    historyToggleText: {
      fontSize: 16,
      fontWeight: "600",
      color: currentTheme.text || "#000",
    },
    historyContent: {
      padding: 16,
    },
    emptyHistoryContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 30,
      backgroundColor: currentTheme.theme === "dark" ? "#1f2937" : "#F9FAFB",
      borderRadius: 12,
    },
    emptyHistoryIconWrapper: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: currentTheme.theme === "dark" ? "#374151" : "#F3E8FF",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    emptyHistoryTitle: {
      fontSize: 16,
      fontWeight: "500",
      color: currentTheme.text || "#111827",
      marginBottom: 8,
    },
    emptyHistorySubtitle: {
      fontSize: 14,
      color: currentTheme.subText || "#6b7280",
    },
    historyItem: {
      backgroundColor: currentTheme.theme === "dark" ? "#1f2937" : "#F9FAFB",
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
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
      fontSize: 12,
      fontWeight: "600",
    },
    historyDate: {
      fontSize: 13,
      color: currentTheme.subText || "#666",
      marginBottom: 4,
    },
    historyNotes: {
      fontSize: 13,
      color: currentTheme.text || "#000",
      fontStyle: "italic",
      marginTop: 8,
    },
  });

export default WithdrawalEarningScreen;
