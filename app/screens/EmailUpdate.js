import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import SafeSpinner from "../components/SafeSpinner";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Envelope, LockKey, Eye, EyeSlash } from "phosphor-react-native";
import { useTheme } from "../context/ThemeContext";
import apiService from "../lib/apiService";
import Toast from "react-native-toast-message";

const EmailUpdateScreen = ({ navigation }) => {
  const [newEmail, setNewEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];

  // Dynamic colors for dark/light mode balance
  const isDark = theme === "dark";
  const iconColor = isDark ? "#C4B5FD" : (currentTheme.primary || "#4B0082");
  const buttonColor = isDark ? "#762BAD" : (currentTheme.primary || "#350F6A");

  const styles = useMemo(() => getStyles(currentTheme, buttonColor), [currentTheme, buttonColor]);

  // Email validation function
  const validateEmail = useCallback((email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  // Validate form and return validation errors
  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!newEmail) {
      newErrors.newEmail = "New email is required";
    } else if (!validateEmail(newEmail)) {
      newErrors.newEmail = "Please enter a valid email address";
    }

    if (!confirmEmail) {
      newErrors.confirmEmail = "Please confirm your email";
    } else if (newEmail && confirmEmail && newEmail !== confirmEmail) {
      newErrors.confirmEmail = "Email addresses do not match";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    return newErrors;
  }, [newEmail, confirmEmail, password, validateEmail]);

  // Update errors when showErrors is true
  useEffect(() => {
    if (showErrors) {
      setErrors(validateForm());
    }
  }, [validateForm, showErrors]);

  // Toast helper function
  const showToast = useCallback((type, title, message) => {
    Toast.show({
      type,
      text1: title,
      text2: message,
      position: "top",
    });
  }, []);

  // Enhanced error handler that maps API errors to user-friendly messages
  const handleApiError = useCallback((error) => {
    console.error("Email update error:", error);
    
    // Network/connection errors
    if (!error.message || error.message.includes("Network request failed") || error.message.includes("fetch")) {
      showToast("error", "Connection Error", "Please check your internet connection and try again.");
      return;
    }

    // Server/API specific errors
    if (error.message.includes("Email already in use") || error.message.includes("email_exists")) {
      showToast("error", "Email Unavailable", "This email is already registered. Please try another.");
      return;
    }

    if (error.message.includes("Invalid password") || error.message.includes("incorrect_password")) {
      showToast("error", "Incorrect Password", "Please check your current password and try again.");
      return;
    }

    if (error.message.includes("Invalid email format") || error.message.includes("invalid_email")) {
      showToast("error", "Invalid Email", "Please enter a valid email address.");
      return;
    }

    if (error.message.includes("New email must be different") || error.message.includes("same_email")) {
      showToast("error", "Same Email", "New email must be different from your current email.");
      return;
    }

    if (error.message.includes("401") || error.message.includes("unauthorized")) {
      showToast("error", "Session Expired", "Please log in again and try updating your email.");
      return;
    }

    if (error.message.includes("500") || error.message.includes("server")) {
      showToast("error", "Server Error", "Our servers are experiencing issues. Please try again later.");
      return;
    }

    // Generic fallback for any other errors
    showToast("error", "Update Failed", "Unable to update email. Please try again later.");
  }, [showToast]);

  const handleEmailUpdate = useCallback(async () => {
    const validationErrors = validateForm();
    
    // Show errors and check if form is valid
    setShowErrors(true);
    setErrors(validationErrors);
    
    if (Object.keys(validationErrors).length > 0) {
      showToast("error", "Form Invalid", "Please fix the errors before continuing.");
      return;
    }

    setLoading(true);

    try {
      const response = await apiService.updateEmail(newEmail, password);
      
      if (response && response.success) {
        showToast("success", "Email Updated!", "Your email has been updated successfully.");
        
        // Clear form fields and reset states
        setNewEmail("");
        setConfirmEmail("");
        setPassword("");
        setShowErrors(false);
        setErrors({});
        setShowPassword(false);
        
        // Navigate back after a short delay to let user see the success message
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        // Handle case where response exists but success is false
        handleApiError(new Error(response?.message || "Update failed"));
      }
    } catch (error) {
      // Use enhanced error handler
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  }, [newEmail, password, validateForm, navigation, showToast, handleApiError]);

  // Button is enabled only when all fields have values (regardless of validation)
  const isFormFilled = useMemo(() => {
    return newEmail.length > 0 && confirmEmail.length > 0 && password.length > 0;
  }, [newEmail, confirmEmail, password]);

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
              <Text style={styles.headerTitle}>Change Email</Text>
            </View>
            <View style={styles.rightPlaceholder} />
          </View>

          <View style={styles.formContainer}>
            
            {/* New Email Address */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Email Address</Text>
              <View style={[styles.inputWrapper, errors.newEmail && showErrors && styles.inputError]}>
                <Envelope size={24} color={iconColor} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter new email address"
                  placeholderTextColor={currentTheme.subText || "#9ca3af"}
                  value={newEmail}
                  onChangeText={setNewEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {errors.newEmail && showErrors && <Text style={styles.errorText}>{errors.newEmail}</Text>}
            </View>

            {/* Confirm New Email Address */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm New Email Address</Text>
              <View style={[styles.inputWrapper, errors.confirmEmail && showErrors && styles.inputError]}>
                <Envelope size={24} color={iconColor} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm new email address"
                  placeholderTextColor={currentTheme.subText || "#9ca3af"}
                  value={confirmEmail}
                  onChangeText={setConfirmEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {errors.confirmEmail && showErrors && <Text style={styles.errorText}>{errors.confirmEmail}</Text>}
            </View>

            {/* Current Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Current Password</Text>
              <View style={[styles.inputWrapper, errors.password && showErrors && styles.inputError]}>
                <LockKey size={24} color={iconColor} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your current password"
                  placeholderTextColor={currentTheme.subText || "#9ca3af"}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
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
              {errors.password && showErrors && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            <TouchableOpacity 
              style={[
                styles.updateButton,
                (!isFormFilled || loading) && styles.updateButtonDisabled
              ]} 
              onPress={handleEmailUpdate}
              disabled={!isFormFilled || loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <SafeSpinner size={18} color="white" />
                  <Text style={styles.loadingText}>Updating...</Text>
                </View>
              ) : (
                <Text style={styles.updateButtonText}>
                  Update Email
                </Text>
              )}
            </TouchableOpacity>

          </View>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
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
    fontSize: 18,
    fontWeight: "700",
    color: currentTheme.text || "#000000",
  },
  rightPlaceholder: {
    width: 36,
  },
  formContainer: {
    marginTop: 10,
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
  inputError: {
    borderColor: "#ff4757",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: currentTheme.text || "#000000",
    height: "100%",
  },
  errorText: {
    color: "#ff4757",
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  updateButton: {
    width: "100%",
    height: 48,
    backgroundColor: buttonColor,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  updateButtonDisabled: {
    opacity: 0.6,
  },
  updateButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "white",
    fontSize: 16,
    marginLeft: 10,
    fontWeight: "600",
  },
});

export default React.memo(EmailUpdateScreen);
