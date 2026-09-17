import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  RefreshControl,
  Modal,
  ScrollView,
} from "react-native";
import SafeSpinner from "../components/SafeSpinner";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Wallet, ClockCounterClockwise } from "phosphor-react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/NewAuthContext";
import { useTheme } from "../context/ThemeContext";
import apiService from "../lib/apiService";

const TransactionHistoryClientScreen = ({ navigation }) => {
  const { userData } = useAuth();
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [walletSnapshot, setWalletSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Selected Transaction Pop-up Modal state
  const [selectedTx, setSelectedTx] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

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
      const historyResponse = await apiService.getClientTransactionHistory();
      if (historyResponse.success) {
        setPaymentHistory(historyResponse.data.transactions || []);
        if (historyResponse.data.walletInfo) {
          setWalletSnapshot(historyResponse.data.walletInfo);
        }
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

  const openTxDetail = (tx) => {
    setSelectedTx(tx);
    setShowDetailModal(true);
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

  const getTxBadgeInfo = (item) => {
    const type = item?.transactionType;
    const absAmount = Math.abs(Number(item?.amount || 0)).toFixed(2);
    
    if (["DEPOSIT", "JOB_REFUND", "JOB_RELEASE", "BONUS"].includes(type)) {
      return {
        formattedAmount: `+₹${absAmount}`,
        color: "#4CAF50",
        isCredit: true
      };
    }
    if (type === "JOB_RESERVE") {
      return {
        formattedAmount: `-₹${absAmount}`,
        color: "#F59E0B",
        isCredit: false
      };
    }
    return {
      formattedAmount: `-₹${absAmount}`,
      color: "#FF3B30",
      isCredit: false
    };
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

    const badgeInfo = getTxBadgeInfo(item);
    const displayJobName = item?.jobTitle ? `Job: ${item.jobTitle}` : null;

    return (
      <TouchableOpacity
        style={styles.paymentItem}
        onPress={() => openTxDetail(item)}
        activeOpacity={0.7}
      >
        <View style={styles.paymentItemHeader}>
          <View style={styles.paymentItemLeft}>
            <View style={[styles.transactionDot, { backgroundColor: badgeInfo.color }]} />
            <View style={{ flex: 1 }}>
              {displayJobName && (
                <Text style={styles.jobTitleText} numberOfLines={1}>
                  {displayJobName}
                </Text>
              )}
              <Text style={styles.transactionName}>{formatTransactionType(item?.transactionType)}</Text>
              {item?.description && (
                <Text style={styles.transactionDescription} numberOfLines={1}>{item.description}</Text>
              )}
            </View>
          </View>

          <View style={{ alignItems: "flex-end", justifyContent: "center" }}>
            <Text style={[styles.transactionAmount, { color: badgeInfo.color }]}>
              {badgeInfo.formattedAmount}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={currentTheme.subText || "#94A3B8"} style={{ marginTop: 2 }} />
          </View>
        </View>

        <View style={styles.paymentItemFooter}>
          <Text style={styles.transactionDate}>{formattedDate} | {formattedTime}</Text>
          <Text style={styles.transactionBalance}>Bal: ₹{parseFloat(item?.balanceAfter || 0).toFixed(2)}</Text>
        </View>
      </TouchableOpacity>
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
            {/* Top Current Wallet Status Overview Banner */}
            {walletSnapshot && (
              <View style={styles.topOverviewCard}>
                <View style={styles.topOverviewRow}>
                  <View>
                    <Text style={styles.topOverviewLabel}>Total Wallet Balance</Text>
                    <Text style={styles.topOverviewValue}>
                      ₹{Number(walletSnapshot.wallet || 0).toFixed(2)}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.topOverviewLabel}>Total Reserved Amount</Text>
                    <Text style={[styles.topOverviewValue, { color: "#F59E0B" }]}>
                      ₹{Number(walletSnapshot.reservedAmount || 0).toFixed(2)}
                    </Text>
                  </View>
                </View>
                <View style={styles.topOverviewDivider} />
                <View style={styles.topOverviewRow}>
                  <Text style={styles.topOverviewSubLabel}>Total Available Balance:</Text>
                  <Text style={[styles.topOverviewSubValue, { color: "#4CAF50" }]}>
                    ₹{Number(walletSnapshot.availableBalance || 0).toFixed(2)}
                  </Text>
                </View>
              </View>
            )}

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

        {/* Transaction Detail Pop-up Modal */}
        <Modal
          visible={showDetailModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDetailModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Transaction Details</Text>
                <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                  <Ionicons name="close-circle" size={26} color={currentTheme.subText || "#94A3B8"} />
                </TouchableOpacity>
              </View>

              {selectedTx && (
                <ScrollView style={{ maxHeight: 400 }}>
                  <View style={styles.modalAmountBox}>
                    <Text style={[styles.modalAmount, { color: getTxBadgeInfo(selectedTx).color }]}>
                      {getTxBadgeInfo(selectedTx).formattedAmount}
                    </Text>
                    <Text style={styles.modalTxType}>{formatTransactionType(selectedTx.transactionType)}</Text>
                  </View>

                  <View style={styles.detailDivider} />

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Job Name:</Text>
                    <Text style={styles.detailValueBold}>
                      {selectedTx.jobTitle || "N/A (General Wallet Transaction)"}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Description:</Text>
                    <Text style={styles.detailValue}>{selectedTx.description || "N/A"}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Date & Time:</Text>
                    <Text style={styles.detailValue}>{new Date(selectedTx.createdAt).toLocaleString()}</Text>
                  </View>

                  {selectedTx.referenceId && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Reference ID:</Text>
                      <Text style={styles.detailValue}>{selectedTx.referenceId}</Text>
                    </View>
                  )}

                  <View style={styles.snapshotBox}>
                    <Text style={styles.snapshotTitle}>Wallet Balance Snapshot</Text>
                    
                    <View style={styles.snapshotRow}>
                      <Text style={styles.snapshotLabel}>Previous Wallet Balance:</Text>
                      <Text style={styles.snapshotValue}>
                        ₹{Number(selectedTx.balanceBefore !== null && selectedTx.balanceBefore !== undefined ? selectedTx.balanceBefore : walletSnapshot?.wallet || 0).toFixed(2)}
                      </Text>
                    </View>

                    <View style={styles.snapshotRow}>
                      <Text style={styles.snapshotLabel}>Current Wallet Balance:</Text>
                      <Text style={[styles.snapshotValue, { color: primaryColor }]}>
                        ₹{Number(selectedTx.balanceAfter !== null && selectedTx.balanceAfter !== undefined ? selectedTx.balanceAfter : walletSnapshot?.wallet || 0).toFixed(2)}
                      </Text>
                    </View>

                    <View style={styles.snapshotRow}>
                      <Text style={styles.snapshotLabel}>Current Reserved Value:</Text>
                      <Text style={[styles.snapshotValue, { color: "#F59E0B" }]}>
                        ₹{Number(selectedTx.amount || 0).toFixed(2)}
                      </Text>
                    </View>

                    <View style={styles.snapshotRow}>
                      <Text style={styles.snapshotLabel}>Total Reserved Value:</Text>
                      <Text style={[styles.snapshotValue, { color: "#F59E0B" }]}>
                        ₹{Number(walletSnapshot?.reservedAmount || 0).toFixed(2)}
                      </Text>
                    </View>

                    <View style={styles.snapshotRow}>
                      <Text style={styles.snapshotLabel}>Current Available Balance:</Text>
                      <Text style={[styles.snapshotValue, { color: "#4CAF50" }]}>
                        ₹{Number(walletSnapshot?.availableBalance || 0).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </ScrollView>
              )}

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setShowDetailModal(false)}
              >
                <Text style={styles.closeBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
      marginBottom: 20,
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
      color: currentTheme.text || "#000000",
    },
    rightPlaceholder: {
      width: 36,
    },
    content: {
      flex: 1,
      paddingHorizontal: 16,
    },
    topOverviewCard: {
      backgroundColor: currentTheme.cardBackground || "#F8FAFC",
      borderRadius: 16,
      padding: 16,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: currentTheme.border || "#E2E8F0",
    },
    topOverviewRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    topOverviewLabel: {
      fontSize: 12,
      color: currentTheme.subText || "#64748B",
      fontWeight: "600",
      marginBottom: 2,
    },
    topOverviewValue: {
      fontSize: 18,
      fontWeight: "800",
      color: currentTheme.text || "#0F172A",
    },
    topOverviewDivider: {
      height: 1,
      backgroundColor: currentTheme.border || "#E2E8F0",
      marginVertical: 10,
    },
    topOverviewSubLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: currentTheme.text || "#334155",
    },
    topOverviewSubValue: {
      fontSize: 15,
      fontWeight: "700",
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
    historyList: {
      paddingBottom: 20,
    },
    paymentItem: {
      backgroundColor: currentTheme.cardBackground || "#F8FAFC",
      borderRadius: 14,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: currentTheme.border || "#E2E8F0",
    },
    paymentItemHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    paymentItemLeft: {
      flexDirection: "row",
      alignItems: "flex-start",
      flex: 1,
      marginRight: 8,
    },
    transactionDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: 10,
      marginTop: 4,
    },
    jobTitleText: {
      fontSize: 13,
      fontWeight: "700",
      color: primaryColor,
      marginBottom: 2,
    },
    transactionName: {
      fontSize: 14,
      fontWeight: "600",
      color: currentTheme.text || "#000000",
    },
    transactionDescription: {
      fontSize: 12,
      color: currentTheme.subText || "#666666",
      marginTop: 2,
    },
    transactionAmount: {
      fontSize: 15,
      fontWeight: "700",
    },
    paymentItemFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 10,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: currentTheme.border || "#F1F5F9",
    },
    transactionDate: {
      fontSize: 11,
      color: currentTheme.subText || "#999999",
    },
    transactionBalance: {
      fontSize: 12,
      fontWeight: "600",
      color: currentTheme.text || "#333333",
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 60,
    },
    emptyIconContainer: {
      marginBottom: 16,
    },
    emptyIconBackground: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: primaryColor + "15",
      justifyContent: "center",
      alignItems: "center",
    },
    clockBadge: {
      position: "absolute",
      bottom: 0,
      right: 0,
      backgroundColor: primaryColor,
      borderRadius: 10,
      width: 24,
      height: 24,
      justifyContent: "center",
      alignItems: "center",
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: currentTheme.text || "#000",
      marginBottom: 6,
    },
    emptySubtitle: {
      fontSize: 14,
      color: currentTheme.subText || "#666",
      textAlign: "center",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.65)",
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    modalCard: {
      width: "100%",
      backgroundColor: currentTheme.cardBackground || "#FFFFFF",
      borderRadius: 20,
      padding: 20,
      elevation: 5,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: currentTheme.text || "#000",
    },
    modalAmountBox: {
      alignItems: "center",
      marginVertical: 10,
    },
    modalAmount: {
      fontSize: 32,
      fontWeight: "bold",
    },
    modalTxType: {
      fontSize: 13,
      fontWeight: "600",
      color: currentTheme.subText || "#64748B",
      marginTop: 4,
      textTransform: "uppercase",
    },
    detailDivider: {
      height: 1,
      backgroundColor: currentTheme.border || "#E2E8F0",
      marginVertical: 14,
    },
    detailRow: {
      marginBottom: 12,
    },
    detailLabel: {
      fontSize: 12,
      color: currentTheme.subText || "#64748B",
      marginBottom: 2,
    },
    detailValueBold: {
      fontSize: 15,
      fontWeight: "700",
      color: primaryColor,
    },
    detailValue: {
      fontSize: 14,
      fontWeight: "500",
      color: currentTheme.text || "#0F172A",
    },
    snapshotBox: {
      backgroundColor: currentTheme.background || "#F1F5F9",
      padding: 14,
      borderRadius: 12,
      marginTop: 10,
      borderWidth: 1,
      borderColor: currentTheme.border || "#CBD5E1",
    },
    snapshotTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: currentTheme.text || "#0F172A",
      marginBottom: 10,
    },
    snapshotRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 6,
    },
    snapshotLabel: {
      fontSize: 13,
      color: currentTheme.subText || "#475569",
    },
    snapshotValue: {
      fontSize: 13,
      fontWeight: "700",
      color: currentTheme.text || "#0F172A",
    },
    closeBtn: {
      marginTop: 18,
      backgroundColor: primaryColor,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: "center",
    },
    closeBtnText: {
      color: "#FFFFFF",
      fontWeight: "700",
      fontSize: 15,
    },
  });

export default TransactionHistoryClientScreen;
