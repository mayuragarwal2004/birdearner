import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Bank,
  User,
  CreditCard,
  ShieldCheck,
  CheckCircle,
  Eye,
  EyeSlash,
  CaretDown,
  MagnifyingGlass,
  X,
} from "phosphor-react-native";
import Toast from "react-native-toast-message";
import apiService from "../lib/apiService";
import { useTheme } from "../context/ThemeContext";
import { INDIAN_BANKS, IFSC_PATTERN } from "../lib/indianBanks";

const ACCOUNT_NUMBER_PATTERN = /^\d{9,18}$/;

const BankAccountDetailsScreen = ({ navigation }) => {
  const [bankName, setBankName] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [confirmAccountNumber, setConfirmAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [showConfirmAccountNumber, setShowConfirmAccountNumber] = useState(false);
  const [bankModalVisible, setBankModalVisible] = useState(false);
  const [bankSearch, setBankSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const iconColor = theme === "dark" ? "#C4B5FD" : (currentTheme.primary || "#4B0082");
  const buttonColor = theme === "dark" ? "#762BAD" : (currentTheme.primary || "#350F6A");

  const styles = getStyles(currentTheme, buttonColor);

  const filteredBanks = useMemo(() => {
    const q = bankSearch.trim().toLowerCase();
    return q ? INDIAN_BANKS.filter((b) => b.toLowerCase().includes(q)) : INDIAN_BANKS;
  }, [bankSearch]);

  useEffect(() => {
    const fetchBankDetails = async () => {
      try {
        const res = await apiService.getUserBankDetails();
        if (res) {
          setBankName(res.bankName || "");
          setAccountHolderName(res.accountHolderName || "");
          setAccountNumber(res.accountNumber || "");
          setConfirmAccountNumber(res.accountNumber || "");
          setIfscCode(res.ifscCode || "");
        }
      } catch (err) {
        console.error("Failed to fetch bank details", err);
        Toast.show({ type: "error", text1: "Error fetching bank details" });
      }
    };

    fetchBankDetails();
  }, []);

  // Error message for each field; empty string means the field is valid
  const errors = useMemo(() => {
    const name = accountHolderName.trim();
    return {
      bankName: bankName ? "" : "Select your bank",
      accountHolderName: !name
        ? "Enter the account holder name"
        : name.length < 2 || !/^[A-Za-z][A-Za-z .'-]*$/.test(name)
          ? "Use letters only for the account holder name"
          : "",
      accountNumber: ACCOUNT_NUMBER_PATTERN.test(accountNumber)
        ? ""
        : "Account number must be 9 to 18 digits",
      confirmAccountNumber: !confirmAccountNumber
        ? "Re-enter your account number"
        : confirmAccountNumber !== accountNumber
          ? "Account numbers do not match"
          : "",
      ifscCode: IFSC_PATTERN.test(ifscCode)
        ? ""
        : "Enter a valid IFSC code (11 characters, e.g. SBIN0001234)",
    };
  }, [bankName, accountHolderName, accountNumber, confirmAccountNumber, ifscCode]);

  const hasErrors = Object.values(errors).some(Boolean);

  // Errors show after a field is left empty/edited, or after Save is tapped
  const fieldError = (field) =>
    (submitAttempted || touched[field]) ? errors[field] : "";

  const markTouched = (field) => setTouched((prev) => ({ ...prev, [field]: true }));

  const toastError = (text1) => Toast.show({ type: "error", text1 });

  const handleSave = async () => {
    setSubmitAttempted(true);
    if (hasErrors) {
      toastError("Please correct the highlighted fields");
      return;
    }

    setSaving(true);
    try {
      await apiService.updateBankDetails({
        bankName,
        accountHolderName: accountHolderName.trim(),
        accountNumber,
        ifscCode,
      });

      Toast.show({ type: "success", text1: "Bank details saved successfully" });
      // Show the saved details page instead of this form
      navigation.replace("Bank Account View");
    } catch (err) {
      console.error("Error saving bank details:", err);
      toastError("Failed to save bank details");
    } finally {
      setSaving(false);
    }
  };

  const selectBank = (name) => {
    setBankName(name);
    setBankSearch("");
    setBankModalVisible(false);
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
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
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
            <TouchableOpacity
              style={styles.inputWrapper}
              onPress={() => setBankModalVisible(true)}
              activeOpacity={0.8}
            >
              <Bank size={20} color={iconColor} style={styles.inputIcon} />
              <Text style={[styles.bankValue, !bankName && styles.placeholderText]} numberOfLines={1}>
                {bankName || "Select your bank"}
              </Text>
              <CaretDown size={16} color={iconColor} />
            </TouchableOpacity>
            {!!fieldError("bankName") && <Text style={styles.errorText}>{fieldError("bankName")}</Text>}
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
                onBlur={() => markTouched("accountHolderName")}
              />
            </View>
            {!!fieldError("accountHolderName") && (
              <Text style={styles.errorText}>{fieldError("accountHolderName")}</Text>
            )}
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
                value={accountNumber}
                onChangeText={(text) => setAccountNumber(text.replace(/\D/g, ""))}
                keyboardType="number-pad"
                maxLength={18}
                secureTextEntry={!showAccountNumber}
                onBlur={() => markTouched("accountNumber")}
              />
              <TouchableOpacity onPress={() => setShowAccountNumber((v) => !v)} style={styles.eyeButton}>
                {showAccountNumber ? (
                  <EyeSlash size={20} color={iconColor} />
                ) : (
                  <Eye size={20} color={iconColor} />
                )}
              </TouchableOpacity>
            </View>
            {!!fieldError("accountNumber") && <Text style={styles.errorText}>{fieldError("accountNumber")}</Text>}
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
                onChangeText={(text) => setConfirmAccountNumber(text.replace(/\D/g, ""))}
                keyboardType="number-pad"
                maxLength={18}
                secureTextEntry={!showConfirmAccountNumber}
                onBlur={() => markTouched("confirmAccountNumber")}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmAccountNumber((v) => !v)}
                style={styles.eyeButton}
              >
                {showConfirmAccountNumber ? (
                  <EyeSlash size={20} color={iconColor} />
                ) : (
                  <Eye size={20} color={iconColor} />
                )}
              </TouchableOpacity>
            </View>
            {!!fieldError("confirmAccountNumber") && (
              <Text style={styles.errorText}>{fieldError("confirmAccountNumber")}</Text>
            )}
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
                value={ifscCode}
                onChangeText={(text) => setIfscCode(text.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                autoCapitalize="characters"
                maxLength={11}
                onBlur={() => markTouched("ifscCode")}
              />
            </View>
            {!!fieldError("ifscCode") && <Text style={styles.errorText}>{fieldError("ifscCode")}</Text>}
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>{saving ? "Saving..." : "Save"}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bank picker */}
      <Modal
        visible={bankModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBankModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select your bank</Text>
              <TouchableOpacity onPress={() => setBankModalVisible(false)}>
                <X size={22} color={currentTheme.text || "#000"} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchWrapper}>
              <MagnifyingGlass size={18} color={iconColor} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search bank"
                placeholderTextColor="#9ca3af"
                value={bankSearch}
                onChangeText={setBankSearch}
                autoCapitalize="words"
              />
            </View>

            <FlatList
              data={filteredBanks}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.bankRow, item === bankName && styles.bankRowSelected]}
                  onPress={() => selectBank(item)}
                >
                  <Text style={styles.bankRowText}>{item}</Text>
                  {item === bankName && <CheckCircle size={20} color={iconColor} weight="fill" />}
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>No bank found</Text>}
            />
          </View>
        </View>
      </Modal>

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
  bankValue: {
    flex: 1,
    fontSize: 14,
    color: currentTheme.text || "#000000",
    textAlignVertical: "center",
    includeFontPadding: false,
  },
  placeholderText: {
    color: "#9ca3af",
  },
  errorText: {
    fontSize: 12,
    color: "#DC2626",
    marginTop: 4,
    marginLeft: 4,
  },
  eyeButton: {
    padding: 6,
    marginLeft: 6,
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
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    maxHeight: "75%",
    backgroundColor: currentTheme.background || "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: currentTheme.text || "#000000",
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    borderWidth: 1,
    borderColor: currentTheme.border || "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: currentTheme.text || "#000000",
  },
  bankRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: currentTheme.border || "#F1F1F4",
  },
  bankRowSelected: {
    backgroundColor: "#F3E8FF",
    borderRadius: 8,
  },
  bankRowText: {
    fontSize: 15,
    color: currentTheme.text || "#000000",
  },
  emptyText: {
    textAlign: "center",
    color: "#9ca3af",
    paddingVertical: 20,
  },
});

export default BankAccountDetailsScreen;
