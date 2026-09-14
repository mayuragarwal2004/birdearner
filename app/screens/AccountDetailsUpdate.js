import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { useAuth } from "../context/NewAuthContext";
import { useTheme } from "../context/ThemeContext";
import apiService from "../lib/apiService";
import SafeSpinner from "../components/SafeSpinner";

const showToast = (type, title, message = "") => {
  Toast.show({
    type,
    text1: title,
    text2: message,
    position: "top",
  });
};

const AccountDetailsUpdateScreen = ({ navigation, route }) => {
  const { userData, userProfile, refreshUserData } = useAuth();
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const isDark = theme === "dark";

  // Initial tab from route params or default to "email"
  const initialTab = route?.params?.initialTab || "email";
  const [activeTab, setActiveTab] = useState(initialTab);

  // Current User Display Details
  const currentEmail = userData?.email || userProfile?.email || userProfile?.user?.email || "Not set";
  const currentMobile = userData?.mobile || userProfile?.user?.mobile || userProfile?.mobile || userProfile?.phone || userData?.phone || "Not set";
  const role = userData?.role || "USER";

  // Form States - Email
  const [newEmail, setNewEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [emailAuthPassword, setEmailAuthPassword] = useState("");
  const [showEmailAuthPassword, setShowEmailAuthPassword] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  // Form States - Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Form States - Mobile
  const [newMobile, setNewMobile] = useState("");
  const [confirmMobile, setConfirmMobile] = useState("");
  const [mobileAuthPassword, setMobileAuthPassword] = useState("");
  const [showMobileAuthPassword, setShowMobileAuthPassword] = useState(false);
  const [mobileLoading, setMobileLoading] = useState(false);

  const styles = useMemo(() => getStyles(currentTheme, isDark), [currentTheme, isDark]);

  // Email Validation
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Handle Email Update
  const handleUpdateEmail = async () => {
    if (!newEmail || !confirmEmail || !emailAuthPassword) {
      showToast("error", "Missing Fields", "Please fill in all email update fields.");
      return;
    }

    if (!validateEmail(newEmail)) {
      showToast("error", "Invalid Email", "Please enter a valid email address.");
      return;
    }

    if (newEmail !== confirmEmail) {
      showToast("error", "Mismatch", "Email addresses do not match.");
      return;
    }

    if (newEmail.toLowerCase() === currentEmail.toLowerCase()) {
      showToast("error", "Same Email", "New email must be different from current email.");
      return;
    }

    try {
      setEmailLoading(true);
      const res = await apiService.updateEmail(newEmail.trim(), emailAuthPassword);
      if (res.success) {
        showToast("success", "Email Updated Successfully", res.message || "Your email address has been updated successfully.");
        setNewEmail("");
        setConfirmEmail("");
        setEmailAuthPassword("");
        await refreshUserData();
      }
    } catch (err) {
      const isDuplicate = err.message?.includes("already in use") || err.message?.includes("already registered") || err.message?.includes("already exists");
      const isPasswordError = err.message?.toLowerCase().includes("password") || err.message?.toLowerCase().includes("incorrect");

      let title = "Update Failed";
      if (isDuplicate) title = "Email Already Registered";
      if (isPasswordError) title = "Incorrect Password";

      showToast("error", title, err.message || "Failed to update email.");
    } finally {
      setEmailLoading(false);
    }
  };

  // Password Requirements Checker
  const passwordValidation = useMemo(() => {
    const minLength = newPassword.length >= 8;
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    return { minLength, hasUpper, hasLower, hasNumber, isValid: minLength && hasUpper && hasLower && hasNumber };
  }, [newPassword]);

  // Handle Password Update
  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast("error", "Missing Fields", "Please fill in all password fields.");
      return;
    }

    if (!passwordValidation.isValid) {
      showToast("error", "Weak Password", "Please ensure your new password meets all security requirements.");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("error", "Mismatch", "New password and confirm password do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      showToast("error", "Same Password", "New password must be different from current password.");
      return;
    }

    try {
      setPasswordLoading(true);
      const res = await apiService.updatePassword(currentPassword, newPassword);
      if (res.success) {
        showToast("success", "Password Updated Successfully", res.message || "Your password has been changed successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        await refreshUserData();
      }
    } catch (err) {
      const isPasswordError = err.message?.toLowerCase().includes("password") || err.message?.toLowerCase().includes("incorrect");
      showToast("error", isPasswordError ? "Incorrect Password" : "Update Failed", err.message || "Failed to update password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle Mobile Update
  const handleUpdateMobile = async () => {
    if (!newMobile || !confirmMobile || !mobileAuthPassword) {
      showToast("error", "Missing Fields", "Please fill in all mobile update fields.");
      return;
    }

    const cleanMobile = newMobile.replace(/[\s\-\+\(\)]/g, "");
    const cleanConfirm = confirmMobile.replace(/[\s\-\+\(\)]/g, "");

    if (!/^\d{10,15}$/.test(cleanMobile)) {
      showToast("error", "Invalid Mobile", "Please enter a valid 10 to 15 digit mobile number.");
      return;
    }

    if (cleanMobile !== cleanConfirm) {
      showToast("error", "Mismatch", "Mobile numbers do not match.");
      return;
    }

    if (cleanMobile === currentMobile.replace(/[\s\-\+\(\)]/g, "")) {
      showToast("error", "Same Number", "New mobile number must be different from current number.");
      return;
    }

    try {
      setMobileLoading(true);
      const res = await apiService.updateMobile(cleanMobile, mobileAuthPassword);
      if (res.success) {
        showToast("success", "Mobile Number Updated Successfully", res.message || "Your mobile number has been updated successfully.");
        setNewMobile("");
        setConfirmMobile("");
        setMobileAuthPassword("");
        await refreshUserData();
      }
    } catch (err) {
      const isDuplicate = err.message?.includes("already in use") || err.message?.includes("already registered") || err.message?.includes("already exists");
      const isPasswordError = err.message?.toLowerCase().includes("password") || err.message?.toLowerCase().includes("incorrect");

      let title = "Update Failed";
      if (isDuplicate) title = "Mobile Number Already Registered";
      if (isPasswordError) title = "Incorrect Password";

      showToast("error", title, err.message || "Failed to update mobile number.");
    } finally {
      setMobileLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={currentTheme.text || "#1E293B"} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Account Credentials</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* User Profile Info Card */}
          <View style={styles.profileCard}>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{role}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={18} color="#7B2CFF" />
              <Text style={styles.infoText}>{currentEmail}</Text>
            </View>
            <View style={[styles.infoRow, { marginTop: 6 }]}>
              <Ionicons name="call-outline" size={18} color="#7B2CFF" />
              <Text style={styles.infoText}>{currentMobile}</Text>
            </View>
          </View>

          {/* Segmented Control Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === "email" && styles.activeTabButton]}
              onPress={() => setActiveTab("email")}
            >
              <Ionicons
                name="mail-outline"
                size={16}
                color={activeTab === "email" ? "#FFFFFF" : currentTheme.subText || "#64748B"}
              />
              <Text style={[styles.tabText, activeTab === "email" && styles.activeTabText]}>
                Email
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeTab === "password" && styles.activeTabButton]}
              onPress={() => setActiveTab("password")}
            >
              <Ionicons
                name="lock-closed-outline"
                size={16}
                color={activeTab === "password" ? "#FFFFFF" : currentTheme.subText || "#64748B"}
              />
              <Text style={[styles.tabText, activeTab === "password" && styles.activeTabText]}>
                Password
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeTab === "mobile" && styles.activeTabButton]}
              onPress={() => setActiveTab("mobile")}
            >
              <Ionicons
                name="call-outline"
                size={16}
                color={activeTab === "mobile" ? "#FFFFFF" : currentTheme.subText || "#64748B"}
              />
              <Text style={[styles.tabText, activeTab === "mobile" && styles.activeTabText]}>
                Mobile
              </Text>
            </TouchableOpacity>
          </View>

          {/* TAB 1: EMAIL UPDATE */}
          {activeTab === "email" && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Change Email Address</Text>
              <Text style={styles.formSubtitle}>
                Enter your new email address and current password to verify this change.
              </Text>

              <Text style={styles.inputLabel}>New Email Address</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter new email"
                  placeholderTextColor="#94A3B8"
                  value={newEmail}
                  onChangeText={setNewEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <Text style={styles.inputLabel}>Confirm New Email</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Confirm new email"
                  placeholderTextColor="#94A3B8"
                  value={confirmEmail}
                  onChangeText={setConfirmEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <Text style={styles.inputLabel}>Current Password (for Verification)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="key-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter current password"
                  placeholderTextColor="#94A3B8"
                  value={emailAuthPassword}
                  onChangeText={setEmailAuthPassword}
                  secureTextEntry={!showEmailAuthPassword}
                />
                <TouchableOpacity onPress={() => setShowEmailAuthPassword(!showEmailAuthPassword)}>
                  <Ionicons
                    name={showEmailAuthPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#94A3B8"
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, emailLoading && styles.disabledButton]}
                onPress={handleUpdateEmail}
                disabled={emailLoading}
              >
                {emailLoading ? (
                  <SafeSpinner size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Update Email Address</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* TAB 2: PASSWORD UPDATE */}
          {activeTab === "password" && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Change Account Password</Text>
              <Text style={styles.formSubtitle}>
                Create a strong password containing letters, numbers, and uppercase characters.
              </Text>

              <Text style={styles.inputLabel}>Current Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter current password"
                  placeholderTextColor="#94A3B8"
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry={!showCurrentPassword}
                />
                <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                  <Ionicons
                    name={showCurrentPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#94A3B8"
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>New Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="key-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter new password"
                  placeholderTextColor="#94A3B8"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNewPassword}
                />
                <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                  <Ionicons
                    name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#94A3B8"
                  />
                </TouchableOpacity>
              </View>

              {/* Password Requirement Checks */}
              {newPassword.length > 0 && (
                <View style={styles.rulesContainer}>
                  <View style={styles.ruleRow}>
                    <Ionicons
                      name={passwordValidation.minLength ? "checkmark-circle" : "ellipse-outline"}
                      size={14}
                      color={passwordValidation.minLength ? "#10B981" : "#94A3B8"}
                    />
                    <Text style={styles.ruleText}>At least 8 characters</Text>
                  </View>
                  <View style={styles.ruleRow}>
                    <Ionicons
                      name={passwordValidation.hasUpper ? "checkmark-circle" : "ellipse-outline"}
                      size={14}
                      color={passwordValidation.hasUpper ? "#10B981" : "#94A3B8"}
                    />
                    <Text style={styles.ruleText}>At least one uppercase letter (A-Z)</Text>
                  </View>
                  <View style={styles.ruleRow}>
                    <Ionicons
                      name={passwordValidation.hasLower ? "checkmark-circle" : "ellipse-outline"}
                      size={14}
                      color={passwordValidation.hasLower ? "#10B981" : "#94A3B8"}
                    />
                    <Text style={styles.ruleText}>At least one lowercase letter (a-z)</Text>
                  </View>
                  <View style={styles.ruleRow}>
                    <Ionicons
                      name={passwordValidation.hasNumber ? "checkmark-circle" : "ellipse-outline"}
                      size={14}
                      color={passwordValidation.hasNumber ? "#10B981" : "#94A3B8"}
                    />
                    <Text style={styles.ruleText}>At least one number (0-9)</Text>
                  </View>
                </View>
              )}

              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="key-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Confirm new password"
                  placeholderTextColor="#94A3B8"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Ionicons
                    name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#94A3B8"
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, passwordLoading && styles.disabledButton]}
                onPress={handleUpdatePassword}
                disabled={passwordLoading}
              >
                {passwordLoading ? (
                  <SafeSpinner size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Update Password</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* TAB 3: MOBILE UPDATE */}
          {activeTab === "mobile" && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Change Mobile Number</Text>
              <Text style={styles.formSubtitle}>
                Enter your new mobile number and current password to verify this update.
              </Text>

              <Text style={styles.inputLabel}>New Mobile Number</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="call-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter 10-digit mobile number"
                  placeholderTextColor="#94A3B8"
                  value={newMobile}
                  onChangeText={setNewMobile}
                  keyboardType="phone-pad"
                />
              </View>

              <Text style={styles.inputLabel}>Confirm Mobile Number</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="call-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Confirm new mobile number"
                  placeholderTextColor="#94A3B8"
                  value={confirmMobile}
                  onChangeText={setConfirmMobile}
                  keyboardType="phone-pad"
                />
              </View>

              <Text style={styles.inputLabel}>Current Password (for Verification)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="key-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter current password"
                  placeholderTextColor="#94A3B8"
                  value={mobileAuthPassword}
                  onChangeText={setMobileAuthPassword}
                  secureTextEntry={!showMobileAuthPassword}
                />
                <TouchableOpacity onPress={() => setShowMobileAuthPassword(!showMobileAuthPassword)}>
                  <Ionicons
                    name={showMobileAuthPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#94A3B8"
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, mobileLoading && styles.disabledButton]}
                onPress={handleUpdateMobile}
                disabled={mobileLoading}
              >
                {mobileLoading ? (
                  <SafeSpinner size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Update Mobile Number</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
      <Toast />
    </SafeAreaView>
  );
};

const getStyles = (currentTheme, isDark) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background || "#F8FAFC",
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.border || "#E2E8F0",
      backgroundColor: currentTheme.surface || "#FFFFFF",
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justify: "center",
      alignItems: "center",
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: currentTheme.text || "#0F172A",
    },
    scrollView: {
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    profileCard: {
      backgroundColor: currentTheme.surface || "#FFFFFF",
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: currentTheme.border || "#E2E8F0",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
    roleBadge: {
      alignSelf: "flex-start",
      backgroundColor: "#7B2CFF",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      marginBottom: 10,
    },
    roleBadgeText: {
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.5,
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    infoText: {
      fontSize: 14,
      color: currentTheme.text || "#1E293B",
      fontWeight: "600",
      marginLeft: 10,
    },
    tabContainer: {
      flexDirection: "row",
      backgroundColor: currentTheme.surface || "#E2E8F0",
      borderRadius: 12,
      padding: 4,
      marginBottom: 16,
    },
    tabButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
      borderRadius: 10,
    },
    activeTabButton: {
      backgroundColor: "#7B2CFF",
    },
    tabText: {
      fontSize: 13,
      fontWeight: "600",
      color: currentTheme.subText || "#64748B",
      marginLeft: 6,
    },
    activeTabText: {
      color: "#FFFFFF",
    },
    formCard: {
      backgroundColor: currentTheme.surface || "#FFFFFF",
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: currentTheme.border || "#E2E8F0",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
    formTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: currentTheme.text || "#0F172A",
      marginBottom: 4,
    },
    formSubtitle: {
      fontSize: 13,
      color: currentTheme.subText || "#64748B",
      marginBottom: 16,
      lineHeight: 18,
    },
    inputLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: currentTheme.text || "#334155",
      marginBottom: 6,
      marginTop: 10,
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: currentTheme.background || "#F1F5F9",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: currentTheme.border || "#CBD5E1",
      paddingHorizontal: 12,
      paddingVertical: Platform.OS === "ios" ? 12 : 8,
    },
    inputIcon: {
      marginRight: 10,
    },
    textInput: {
      flex: 1,
      fontSize: 14,
      color: currentTheme.text || "#0F172A",
    },
    rulesContainer: {
      marginVertical: 10,
      padding: 10,
      backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
      borderRadius: 10,
    },
    ruleRow: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 3,
    },
    ruleText: {
      fontSize: 12,
      color: currentTheme.subText || "#64748B",
      marginLeft: 8,
    },
    submitButton: {
      backgroundColor: "#7B2CFF",
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
      marginTop: 24,
      shadowColor: "#7B2CFF",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    disabledButton: {
      opacity: 0.6,
    },
    submitButtonText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "700",
    },
  });

export default AccountDetailsUpdateScreen;
