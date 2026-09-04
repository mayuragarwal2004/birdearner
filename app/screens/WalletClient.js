import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import SafeSpinner from "../components/SafeSpinner";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "phosphor-react-native";
import { useAuth } from "../context/NewAuthContext";
import { useTheme } from "../context/ThemeContext";
import apiService from "../lib/apiService";

const WalletClientScreen = ({ navigation }) => {
  const { userData } = useAuth();
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  
  const isDark = theme === "dark";
  const primaryColor = isDark ? "#C4B5FD" : (currentTheme.primary || "#4B0082");
  
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
          <View style={styles.content}>
            {/* Wallet Balance Section */}
            <View style={styles.balanceSection}>
              <Text style={styles.balanceLabel}>Total Amount in Wallet</Text>
              <Text style={styles.balanceAmount}>
                ₹{walletData?.totalBalance?.toFixed(2) || "0.00"}
              </Text>

              {walletData?.reservedAmount > 0 && (
                <Text style={styles.secondaryBalance}>
                  Reserved: ₹{walletData?.reservedAmount?.toFixed(2)}
                </Text>
              )}
              {walletData?.availableBalance > 0 && (
                <Text style={[styles.secondaryBalance, { color: "#4CAF50" }]}>
                  Available: ₹{walletData?.availableBalance?.toFixed(2)}
                </Text>
              )}

              <TouchableOpacity
                style={styles.addAmountButton}
                onPress={() => navigation.navigate("Payment")}
              >
                <Text style={styles.addAmountButtonText}>Add Amount to Wallet</Text>
              </TouchableOpacity>
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
    addAmountButton: {
      marginTop: 20,
      backgroundColor: primaryColor,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 12,
    },
    addAmountButtonText: {
      color: "#FFF",
      fontWeight: "bold",
      fontSize: 16,
    },
  });

export default WalletClientScreen;
