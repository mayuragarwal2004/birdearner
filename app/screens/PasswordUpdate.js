import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import SafeSpinner from "../components/SafeSpinner";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, LockKey, Eye, EyeSlash, CheckCircle, XCircle } from "phosphor-react-native";
import { useTheme } from "../context/ThemeContext";
import apiService from "../lib/apiService";

const PasswordUpdateScreen = ({ navigation }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];

  // Dynamic colors for dark/light mode balance
  const isDark = theme === "dark";
  const iconColor = isDark ? "#C4B5FD" : (currentTheme.primary || "#4B0082");
  const buttonColor = isDark ? "#762BAD" : (currentTheme.primary || "#350F6A");

  const styles = useMemo(() => getStyles(currentTheme, buttonColor), [currentTheme, buttonColor]);

  // Memoize password validation to prevent unnecessary recalculations
  const validatePassword = useCallback((password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);

    return {
      isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers,
      errors: {
        length: password.length < minLength,
        uppercase: !hasUpperCase,
        lowercase: !hasLowerCase,
        numbers: !hasNumbers,
      }
    };
  }, []);

  const handlePasswordUpdate = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    // Validate new password
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      let errorMessage = "Password must contain:\n";
      if (validation.errors.length) errorMessage += "• At least 8 characters\n";
      if (validation.errors.uppercase) errorMessage += "• At least one uppercase letter\n";
      if (validation.errors.lowercase) errorMessage += "• At least one lowercase letter\n";
      if (validation.errors.numbers) errorMessage += "• At least one number\n";
      
      Alert.alert("Invalid Password", errorMessage.trim());
      return;
    }

    // Check if new password and confirm password match
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New password and confirm password do not match.");
      return;
    }

    // Check if new password is different from current password
    if (currentPassword === newPassword) {
      Alert.alert("Error", "New password must be different from current password.");
      return;
    }

    setLoading(true);

    try {
      const response = await apiService.updatePassword(currentPassword, newPassword);
      
      if (response.success) {
        Alert.alert(
          "Success", 
          "Password updated successfully.",
          [
            {
              text: "OK",
              onPress: () => navigation.goBack()
            }
          ]
        );
        
        // Clear form
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error.message || "Failed to update password. Please check your current password and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const StrengthRule = useCallback(({ met, text, theme, styles }) => (
    <View style={styles.strengthRule}>
      {met ? (
        <CheckCircle size={16} color="#4CAF50" weight="fill" />
      ) : (
        <XCircle size={16} color="#F44336" weight="fill" />
      )}
      <Text style={[styles.strengthText, { color: met ? "#4CAF50" : theme.subText || "#9ca3af" }]}>
        {text}
      </Text>
    </View>
  ), []);

  const PasswordStrengthIndicator = useCallback(({ password }) => {
    const validation = validatePassword(password);
    
    if (!password) return null;

    return (
      <View style={styles.strengthContainer}>
        <Text style={styles.strengthTitle}>Password Strength:</Text>
        <View style={styles.strengthRules}>
          <StrengthRule 
            met={password.length >= 8} 
            text="At least 8 characters" 
            theme={currentTheme}
            styles={styles}
          />
          <StrengthRule 
            met={/[A-Z]/.test(password)} 
            text="One uppercase letter" 
            theme={currentTheme}
            styles={styles}
          />
          <StrengthRule 
            met={/[a-z]/.test(password)} 
            text="One lowercase letter" 
            theme={currentTheme}
            styles={styles}
          />
          <StrengthRule 
            met={/\d/.test(password)} 
            text="One number" 
            theme={currentTheme}
            styles={styles}
          />
        </View>
      </View>
    );
  }, [validatePassword, currentTheme, styles, StrengthRule]);

  const PasswordInput = useCallback(({ 
    label, 
    value, 
    onChangeText, 
    placeholder, 
    showPassword, 
    setShowPassword,
    showStrength = false 
  }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        <LockKey size={24} color={iconColor} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!showPassword}
          placeholderTextColor={currentTheme.subText || "#9ca3af"}
          autoCorrect={false}
          autoCapitalize="none"
          textContentType="password"
        />
        <TouchableOpacity
          style={styles.eyeButton}
          onPress={() => setShowPassword(!showPassword)}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {showPassword ? (
            <EyeSlash size={24} color={currentTheme.subText || "#6b7280"} />
          ) : (
            <Eye size={24} color={currentTheme.subText || "#6b7280"} />
          )}
        </TouchableOpacity>
      </View>
      {showStrength && <PasswordStrengthIndicator password={value} />}
    </View>
  ), [styles, currentTheme, iconColor, PasswordStrengthIndicator]);

  const isFormFilled = currentPassword.length > 0 && newPassword.length > 0 && confirmPassword.length > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
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
              <Text style={styles.headerTitle}>Update Password</Text>
            </View>
            <View style={styles.rightPlaceholder} />
          </View>

          <View style={styles.content}>
            <Text style={styles.subtitle}>
              Keep your account secure with a{"\n"}strong password
            </Text>

            <PasswordInput
              label="Current Password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter your current password"
              showPassword={showCurrentPassword}
              setShowPassword={setShowCurrentPassword}
            />

            <PasswordInput
              label="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter your new password"
              showPassword={showNewPassword}
              setShowPassword={setShowNewPassword}
              showStrength={true}
            />

            <PasswordInput
              label="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm your new password"
              showPassword={showConfirmPassword}
              setShowPassword={setShowConfirmPassword}
            />

            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <View style={styles.errorContainer}>
                <XCircle size={16} color="#F44336" weight="fill" />
                <Text style={styles.errorText}>Passwords do not match</Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.updateButton,
                (!isFormFilled || loading) && styles.updateButtonDisabled
              ]}
              onPress={handlePasswordUpdate}
              disabled={!isFormFilled || loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <SafeSpinner color="#fff" size={18} />
              ) : (
                <Text style={styles.updateButtonText}>Update Password</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const getStyles = (currentTheme, buttonColor) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: currentTheme.background || "#FFFFFF",
    },
    keyboardView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingTop: 20,
      paddingBottom: 40,
    },
    headerContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 20,
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
    content: {
      flex: 1,
      paddingTop: 10,
    },
    subtitle: {
      fontSize: 15,
      color: currentTheme.subText || "#666666",
      textAlign: "center",
      marginBottom: 30,
      lineHeight: 22,
    },
    inputGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 15,
      fontWeight: "500",
      color: currentTheme.text || "#000000",
      marginBottom: 8,
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
      fontSize: 15,
      color: currentTheme.text || "#000000",
      height: "100%",
    },
    eyeButton: {
      paddingLeft: 10,
    },
    strengthContainer: {
      marginTop: 12,
      padding: 12,
      backgroundColor: currentTheme.background2 || "#F9FAFB",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: currentTheme.border || "#E5E7EB",
    },
    strengthTitle: {
      fontSize: 14,
      fontWeight: "500",
      color: currentTheme.text || "#000000",
      marginBottom: 8,
    },
    strengthRules: {
      gap: 6,
    },
    strengthRule: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    strengthText: {
      fontSize: 13,
      flex: 1,
    },
    errorContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: -10,
      marginBottom: 20,
    },
    errorText: {
      fontSize: 14,
      color: "#F44336",
    },
    updateButton: {
      height: 56,
      backgroundColor: buttonColor,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 10,
    },
    updateButtonDisabled: {
      opacity: 0.6,
    },
    updateButtonText: {
      color: "#fff",
      fontWeight: "600",
      fontSize: 16,
    },
  });

export default React.memo(PasswordUpdateScreen);
