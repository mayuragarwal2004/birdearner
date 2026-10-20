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
} from "phosphor-react-native";
import { useAuth } from "../context/NewAuthContext";
import { useTheme } from "../context/ThemeContext";
import apiService from "../lib/apiService";

const WalletFreelancerScreen = ({ navigation }) => {
  const { userData } = useAuth();
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);

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
  };

  const balance = walletData?.withdrawableBalance ?? 0;
  const totalEarnings = walletData?.totalEarnings ?? 0;
  const showEarnings = balance.toFixed(2) !== totalEarnings.toFixed(2);

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
            colors={["#6D28D9", "#4B0082"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceCard}
          >
            <View style={styles.balanceTopRow}>
              <View style={styles.walletIconCircle}>
                <Wallet size={22} color="#FFFFFF" weight="fill" />
              </View>
              <Text style={styles.balanceLabel}>Total Amount in Wallet</Text>
            </View>

            <Text style={styles.balanceAmount}>₹{balance.toFixed(2)}</Text>

            {showEarnings && (
              <Text style={styles.earningsText}>Total Earnings: ₹{totalEarnings.toFixed(2)}</Text>
            )}

            <TouchableOpacity
              style={styles.historyPill}
              onPress={() => navigation.navigate("TransactionHistoryFreelancer")}
              activeOpacity={0.8}
            >
              <ClockCounterClockwise size={16} color="#4B0082" weight="bold" />
              <Text style={styles.historyPillText}>View Transaction History</Text>
              <CaretRight size={14} color="#4B0082" weight="bold" />
            </TouchableOpacity>
          </LinearGradient>

          {/* Outstanding balance */}
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

          {/* Warning */}
          <View style={styles.warningCard}>
            <Warning size={20} color="#B45309" weight="fill" />
            <Text style={styles.warningText}>Withdraw amount greater than ₹99</Text>
          </View>

          {/* Withdraw (no functionality yet) */}
          <TouchableOpacity style={styles.withdrawButton} activeOpacity={0.85}>
            <Text style={styles.withdrawButtonText}>Withdraw Amount</Text>
          </TouchableOpacity>
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
      backgroundColor: currentTheme.background || "#FFFFFF",
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: currentTheme.text || "#000000",
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
    balanceCard: {
      borderRadius: 22,
      padding: 22,
      shadowColor: "#4B0082",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 14,
      elevation: 6,
    },
    balanceTopRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    walletIconCircle: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: "rgba(255,255,255,0.18)",
      justifyContent: "center",
      alignItems: "center",
    },
    balanceLabel: {
      fontSize: 15,
      color: "#EDE9FE",
      fontWeight: "600",
    },
    balanceAmount: {
      fontSize: 40,
      fontWeight: "800",
      color: "#FFFFFF",
      marginTop: 14,
    },
    earningsText: {
      fontSize: 13,
      color: "#DDD6FE",
      marginTop: 4,
    },
    historyPill: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 18,
      backgroundColor: "#FFFFFF",
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 999,
    },
    historyPillText: {
      color: "#4B0082",
      fontWeight: "700",
      fontSize: 13,
    },
    settleButton: {
      marginTop: 16,
      height: 50,
      borderRadius: 14,
      backgroundColor: "#DC2626",
      justifyContent: "center",
      alignItems: "center",
    },
    settleButtonText: {
      color: "#FFFFFF",
      fontWeight: "700",
      fontSize: 15,
    },
    warningCard: {
      marginTop: 18,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: "#FFFBEB",
      borderWidth: 1,
      borderColor: "#FCD34D",
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 14,
    },
    warningText: {
      flex: 1,
      color: "#92400E",
      fontSize: 13,
      fontWeight: "600",
    },
    withdrawButton: {
      marginTop: 22,
      height: 54,
      borderRadius: 16,
      backgroundColor: primaryColor,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: primaryColor,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 4,
    },
    withdrawButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "700",
      letterSpacing: 0.3,
    },
  });

export default WalletFreelancerScreen;
