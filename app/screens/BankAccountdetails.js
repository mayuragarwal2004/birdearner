import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Bank, User, CreditCard, ShieldCheck, CheckCircle } from "phosphor-react-native";
import Toast from "react-native-toast-message";
import apiService from "../lib/apiService";
import { useTheme } from "../context/ThemeContext";

const BankAccountDetailsScreen = ({ navigation }) => {
  const [bankName, setBankName] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [confirmAccountNumber, setConfirmAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [isEditingAccountNumber, setIsEditingAccountNumber] = useState(false);
  const [isEditingIfscCode, setIsEditingIfscCode] = useState(false);

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const iconColor = theme === "dark" ? "#C4B5FD" : (currentTheme.primary || "#4B0082");
  const buttonColor = theme === "dark" ? "#762BAD" : (currentTheme.primary || "#350F6A");

  const styles = getStyles(currentTheme, buttonColor);

  useEffect(() => {
    const fetchBankDetails = async () => {
      try {
        const res = await apiService.getUserBankDetails();
        console.log({res});
        
        if (res) {
          const { bankName, accountHolderName, accountNumber, ifscCode } = res;
          setBankName(bankName || "");
          setAccountHolderName(accountHolderName || "");
          setAccountNumber(accountNumber || "");
          setIfscCode(ifscCode || "");
        }
      } catch (err) {
        console.error("Failed to fetch bank details", err);
        Toast.show({
          type: "error",
          text1: "Error fetching bank details",
        });
      }
    };

    fetchBankDetails();
  }, []);

  const handleSave = async () => {
    if (accountNumber !== confirmAccountNumber) {
      Toast.show({
        type: "error",
        text1: "Account numbers do not match",
      });
      return;
    }

    try {
      await apiService.updateBankDetails({
        bankName,
        accountHolderName,
        accountNumber,
        ifscCode,
      });

      Toast.show({
        type: "success",
        text1: "Bank details saved successfully",
      });

      // Optionally clear input or navigate back
    } catch (err) {
      console.error("Error saving bank details:", err);
      Toast.show({
        type: "error",
        text1: "Failed to save bank details",
      });
    }
  };

  const maskValue = (val) => {
    if (!val) return "";
    if (val.length <= 2) return val;
    return "*".repeat(val.length - 2) + val.slice(-2);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView 
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
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
              <Text style={styles.headerTitle}>Bank Account Details</Text>
            </View>
            <View style={styles.rightPlaceholder} />
          </View>

          {/* Select your bank */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Select your bank</Text>
            <View style={styles.inputWrapper}>
              <Bank size={20} color={iconColor} style={styles.inputIcon} />
              <TextInput
                placeholderTextColor="#9ca3af"
                style={styles.input}
                placeholder="Enter bank name"
                value={bankName}
                onChangeText={setBankName}
              />
            </View>
          </View>

          {/* Account holder name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Account holder name</Text>
            <View style={styles.inputWrapper}>
              <User size={20} color={iconColor} style={styles.inputIcon} />
              <TextInput
                placeholderTextColor="#9ca3af"
                style={styles.input}
                placeholder="Enter account holder's name"
                value={accountHolderName}
                onChangeText={setAccountHolderName}
              />
            </View>
          </View>

          {/* Enter your account number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Enter your account number</Text>
            <View style={styles.inputWrapper}>
              <CreditCard size={20} color={iconColor} style={styles.inputIcon} />
              <TextInput
                placeholderTextColor="#9ca3af"
                style={styles.input}
                placeholder="Enter account number"
                value={isEditingAccountNumber ? accountNumber : maskValue(accountNumber)}
                onFocus={() => {
                  setIsEditingAccountNumber(true);
                  setAccountNumber("");
                }}
                onChangeText={(text) => setAccountNumber(text)}
                keyboardType="numeric"
                secureTextEntry={!isEditingAccountNumber && accountNumber.length > 0}
              />
            </View>
          </View>

          {/* Confirm your account number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm your account number</Text>
            <View style={styles.inputWrapper}>
              <View style={styles.iconWithBadge}>
                <CreditCard size={20} color={iconColor} style={styles.inputIcon} />
                <View style={styles.badgeContainer}>
                   <CheckCircle size={12} color={iconColor} weight="fill" />
                </View>
              </View>
              <TextInput
                placeholderTextColor="#9ca3af"
                style={styles.input}
                placeholder="Re-enter account number"
                value={confirmAccountNumber}
                onChangeText={setConfirmAccountNumber}
                keyboardType="numeric"
                secureTextEntry
              />
            </View>
          </View>

          {/* Enter your bank IFSC code */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Enter your bank IFSC code</Text>
            <View style={styles.inputWrapper}>
              <ShieldCheck size={20} color={iconColor} style={styles.inputIcon} />
              <TextInput
                placeholderTextColor="#9ca3af"
                style={styles.input}
                placeholder="Enter IFSC code"
                value={isEditingIfscCode ? ifscCode : maskValue(ifscCode)}
                onFocus={() => {
                  setIsEditingIfscCode(true);
                  setIfscCode("");
                }}
                onChangeText={(text) => setIfscCode(text)}
                secureTextEntry={!isEditingIfscCode && ifscCode.length > 0}
              />
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      <Toast />
    </SafeAreaView>
  );
};

const getStyles = (currentTheme, buttonColor) => StyleSheet.create({
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
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
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: currentTheme.text || "#000000",
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderWidth: 1,
    borderColor: currentTheme.border || "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: currentTheme.background || "#FFFFFF",
  },
  inputIcon: {
    marginRight: 10,
  },
  iconWithBadge: {
    position: "relative",
    marginRight: 10,
  },
  badgeContainer: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: currentTheme.background || "#FFF",
    borderRadius: 10,
    padding: 1,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: currentTheme.text || "#000000",
    height: "100%",
  },
  saveButton: {
    width: "100%",
    height: 48,
    backgroundColor: buttonColor,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  saveButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
});

export default BankAccountDetailsScreen;
