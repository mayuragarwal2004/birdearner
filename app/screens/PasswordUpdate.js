import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
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

  // Memoize styles to prevent recreation on every render
  const styles = useMemo(() => getStyles(currentTheme), [currentTheme]);

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

  // Memoized components to prevent unnecessary rerenders
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
  }, [validatePassword, currentTheme, styles]);

  const StrengthRule = useCallback(({ met, text, theme, styles }) => (
    <View style={styles.strengthRule}>
      <Ionicons 
        name={met ? "checkmark-circle" : "close-circle"} 
        size={16} 
        color={met ? "#4CAF50" : "#F44336"} 
      />
      <Text style={[styles.strengthText, { color: met ? "#4CAF50" : theme.subText }]}>
        {text}
      </Text>
    </View>
  ), []);

  const PasswordInput = useCallback(({ 
    label, 
    value, 
    onChangeText, 
    placeholder, 
    showPassword, 
    setShowPassword,
    showStrength = false 
  }) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.passwordInputContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!showPassword}
          placeholderTextColor={currentTheme.subText}
          autoCorrect={false}
          autoCapitalize="none"
          textContentType="password"
        />
        <TouchableOpacity
          style={styles.eyeButton}
          onPress={() => setShowPassword(!showPassword)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={showPassword ? "eye-off" : "eye"}
            size={20}
            color={currentTheme.subText}
          />
        </TouchableOpacity>
      </View>
      {showStrength && <PasswordStrengthIndicator password={value} />}
    </View>
  ), [styles, currentTheme, PasswordStrengthIndicator]);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={currentTheme.text}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Update Password</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          <Text style={styles.subtitle}>
            Keep your account secure with a strong password
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

          {confirmPassword && newPassword !== confirmPassword && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color="#F44336" />
              <Text style={styles.errorText}>Passwords do not match</Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.updateButton,
              loading && styles.updateButtonDisabled
            ]}
            onPress={handlePasswordUpdate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.updateButtonText}>Update Password</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// Move styles outside component to prevent recreation on every render
const getStyles = (currentTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background || "#FFF",
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 40,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingTop: Platform.OS === "ios" ? 60 : 40,
      paddingBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.border || "#E0E0E0",
    },
    backButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: currentTheme.background2 || "#F5F5F5",
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: currentTheme.text,
    },
    placeholder: {
      width: 40, // To center the title
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 30,
    },
    subtitle: {
      fontSize: 16,
      color: currentTheme.subText || "#666",
      textAlign: "center",
      marginBottom: 30,
      lineHeight: 22,
    },
    inputContainer: {
      marginBottom: 25,
    },
    label: {
      fontSize: 16,
      color: currentTheme.text || "#000000",
      marginBottom: 8,
      fontWeight: "500",
    },
    passwordInputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: currentTheme.background3 || "#f4f0f0",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: currentTheme.border || "#E0E0E0",
    },
    passwordInput: {
      flex: 1,
      height: 50,
      paddingHorizontal: 16,
      fontSize: 16,
      color: currentTheme.text || "#000000",
    },
    eyeButton: {
      padding: 15,
    },
    strengthContainer: {
      marginTop: 12,
      padding: 12,
      backgroundColor: currentTheme.background2 || "#F8F8F8",
      borderRadius: 8,
    },
    strengthTitle: {
      fontSize: 14,
      fontWeight: "500",
      color: currentTheme.text,
      marginBottom: 8,
    },
    strengthRules: {
      gap: 4,
    },
    strengthRule: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    strengthText: {
      fontSize: 12,
      flex: 1,
    },
    errorContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: -15,
      marginBottom: 15,
    },
    errorText: {
      fontSize: 14,
      color: "#F44336",
    },
    updateButton: {
      height: 52,
      backgroundColor: currentTheme.primary || "#6A0DAD",
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 30,
      shadowColor: currentTheme.primary || "#6A0DAD",
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    updateButtonDisabled: {
      backgroundColor: currentTheme.disabled || "#CCC",
      shadowOpacity: 0,
      elevation: 0,
    },
    updateButtonText: {
      color: "#fff",
      fontWeight: "600",
      fontSize: 18,
    },
  });

export default React.memo(PasswordUpdateScreen);
