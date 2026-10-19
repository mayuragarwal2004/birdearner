import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { ArrowLeft, Bank, User, CreditCard, ShieldCheck, PencilSimple } from "phosphor-react-native";
import apiService from "../lib/apiService";
import SafeSpinner from "../components/SafeSpinner";
import { useTheme } from "../context/ThemeContext";

// Shows only the last 4 digits of the account number
const maskAccountNumber = (value) => {
  if (!value) return "";
  const last4 = value.slice(-4);
  return "•".repeat(Math.max(value.length - 4, 0)) + last4;
};

const BankAccountViewScreen = ({ navigation }) => {
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const iconColor = theme === "dark" ? "#C4B5FD" : (currentTheme.primary || "#4B0082");
  const styles = getStyles(currentTheme);

  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);

  // Reload every time the page is shown, so changes made on the edit page appear here
  useFocusEffect(
    useCallback(() => {
      let active = true;
      const load = async () => {
        try {
          const res = await apiService.getUserBankDetails();
          if (active) setAccount(res || null);
        } catch (err) {
          console.error("Failed to load bank details", err);
          if (active) setAccount(null);
        } finally {
          if (active) setLoading(false);
        }
      };
      load();
      return () => {
        active = false;
      };
    }, [])
  );

  const openEdit = () => navigation.navigate("Bank Account details");

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={20} color={currentTheme.text || "#000"} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Details</Text>
        <View style={styles.rightPlaceholder} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <SafeSpinner size="large" color={iconColor} />
        </View>
      ) : !account ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No bank account saved yet.</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={openEdit}>
            <Text style={styles.primaryButtonText}>Add bank account</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Bank account</Text>
            <TouchableOpacity style={styles.editButton} onPress={openEdit}>
              <PencilSimple size={14} color="#762BAD" weight="bold" />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <Row icon={<User size={20} color={iconColor} />} label="Account holder name" value={account.accountHolderName} styles={styles} />
          <Row icon={<Bank size={20} color={iconColor} />} label="Bank" value={account.bankName} styles={styles} />
          <Row
            icon={<CreditCard size={20} color={iconColor} />}
            label="Account number"
            value={maskAccountNumber(account.accountNumber)}
            styles={styles}
          />
          <Row icon={<ShieldCheck size={20} color={iconColor} />} label="IFSC code" value={account.ifscCode} styles={styles} last />
        </View>
      )}
    </SafeAreaView>
  );
};

const Row = ({ icon, label, value, styles, last }) => (
  <View style={[styles.row, last && styles.rowLast]}>
    <View style={styles.rowIcon}>{icon}</View>
    <View style={styles.rowText}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value || "-"}</Text>
    </View>
  </View>
);

const getStyles = (currentTheme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: currentTheme.background || "#FFFFFF",
    },
    headerContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: 16,
      marginBottom: 20,
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
    headerTitle: {
      flex: 1,
      textAlign: "center",
      fontSize: 18,
      fontWeight: "700",
      color: currentTheme.text || "#000000",
    },
    rightPlaceholder: {
      width: 36,
    },
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
      gap: 16,
    },
    emptyText: {
      fontSize: 14,
      color: currentTheme.subText || "#6B7280",
      textAlign: "center",
    },
    primaryButton: {
      backgroundColor: "#762BAD",
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
    },
    primaryButtonText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "600",
    },
    card: {
      marginHorizontal: 16,
      backgroundColor: currentTheme.cardBackground || currentTheme.background || "#FFFFFF",
      borderRadius: 16,
      borderWidth: 1,
      borderColor: currentTheme.border || "#E5E7EB",
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: currentTheme.text || "#000000",
    },
    editButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderWidth: 1,
      borderColor: "#E5D5FF",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    editButtonText: {
      color: "#762BAD",
      fontSize: 12,
      fontWeight: "700",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.border || "#F1F1F4",
    },
    rowLast: {
      borderBottomWidth: 0,
    },
    rowIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: "#F3E8FF",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    rowText: {
      flex: 1,
    },
    rowLabel: {
      fontSize: 12,
      color: currentTheme.subText || "#6B7280",
    },
    rowValue: {
      fontSize: 15,
      fontWeight: "600",
      color: currentTheme.text || "#000000",
      marginTop: 2,
    },
  });

export default BankAccountViewScreen;
