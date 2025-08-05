import React, { useState, useMemo, useCallback, useEffect } from "react";
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from "react-native-toast-message";

// Move getStyles outside component to prevent recreation
const getStyles = (currentTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background || "#FFF",
    },
    scrollContent: {
      flexGrow: 1,
      padding: 20,
      paddingHorizontal: 30,
    },
    main: {
      marginTop: 45,
      marginBottom: 30,
      flexDirection: "row",
      alignItems: "center",
    },
    backButton: {
      marginRight: 20,
      padding: 8,
      borderRadius: 20,
      backgroundColor: currentTheme.background2 || "#f5f5f5",
    },
    header: {
      flex: 1,
      fontSize: 24,
      fontWeight: "bold",
      color: currentTheme.text,
      textAlign: "center",
      marginRight: 48, // Compensate for back button width
    },
    formContainer: {
      marginTop: 20,
    },
    inputGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      color: currentTheme.text || "#000000",
      marginBottom: 8,
      fontWeight: "500",
    },
    inputContainer: {
      position: "relative",
    },
    input: {
      width: "100%",
      height: 50,
      backgroundColor: currentTheme.background3 || "#f4f0f0",
      borderRadius: 12,
      paddingHorizontal: 20,
      paddingRight: 50,
      fontSize: 16,
      color: currentTheme.subText || "#000000",
      borderWidth: 1,
      borderColor: "transparent",
    },
    inputFocused: {
      borderColor: currentTheme.primary || "#6A0DAD",
      backgroundColor: currentTheme.background || "#FFF",
      shadowColor: currentTheme.primary || "#6A0DAD",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    inputError: {
      borderColor: "#ff4757",
      backgroundColor: "#fff5f5",
    },
    inputIcon: {
      position: "absolute",
      right: 15,
      top: 13,
    },
    errorText: {
      color: "#ff4757",
      fontSize: 12,
      marginTop: 5,
      marginLeft: 5,
    },
    updateButton: {
      width: "100%",
      height: 50,
      backgroundColor: currentTheme.primary || "#6A0DAD",
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 30,
      shadowColor: currentTheme.primary || "#6A0DAD",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    updateButtonDisabled: {
      backgroundColor: currentTheme.background3 || "#cccccc",
      shadowOpacity: 0,
      elevation: 0,
    },
    updateButtonText: {
      color: "white",
      fontSize: 18,
      fontWeight: "700",
    },
    updateButtonTextDisabled: {
      color: currentTheme.subText || "#666666",
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
    infoContainer: {
      backgroundColor: currentTheme.background2 || "#f5f5f5",
      padding: 15,
      borderRadius: 12,
      marginBottom: 20,
      flexDirection: "row",
      alignItems: "center",
    },
    infoText: {
      flex: 1,
      color: currentTheme.subText || "#666666",
      fontSize: 14,
      marginLeft: 10,
      lineHeight: 18,
    },
  });

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

  // Memoize styles to prevent recreation on every render
  const styles = useMemo(() => getStyles(currentTheme), [currentTheme]);

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

  // Input components with error handling
  const EmailInput = useCallback(({ 
    label, 
    value, 
    onChangeText, 
    placeholder, 
    error, 
    fieldName,
    secureTextEntry = false 
  }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            error && showErrors && styles.inputError,
          ]}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          keyboardType={secureTextEntry ? "default" : "email-address"}
          secureTextEntry={secureTextEntry && fieldName === "password" ? !showPassword : secureTextEntry}
          autoCorrect={false}
          autoCapitalize={secureTextEntry ? "none" : "none"}
          placeholderTextColor={currentTheme.subText || "#999"}
        />
        <View style={styles.inputIcon}>
          {secureTextEntry && fieldName === "password" ? (
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color={error && showErrors ? "#ff4757" : currentTheme.subText || "#999"}
              />
            </TouchableOpacity>
          ) : (
            <Ionicons
              name={secureTextEntry ? "lock-closed" : "mail"}
              size={20}
              color={error && showErrors ? "#ff4757" : currentTheme.subText || "#999"}
            />
          )}
        </View>
      </View>
      {error && showErrors && <Text style={styles.errorText}>{error}</Text>}
    </View>
  ), [styles, currentTheme, showPassword, showErrors]);

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
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.main}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={currentTheme.text || "#000"}
            />
          </TouchableOpacity>
          <Text style={styles.header}>Change Email</Text>
        </View>

        <View style={styles.formContainer}>
          <EmailInput
            label="New Email Address"
            value={newEmail}
            onChangeText={setNewEmail}
            placeholder="Enter new email address"
            error={errors.newEmail}
            fieldName="newEmail"
          />

          <EmailInput
            label="Confirm New Email Address"
            value={confirmEmail}
            onChangeText={setConfirmEmail}
            placeholder="Confirm new email address"
            error={errors.confirmEmail}
            fieldName="confirmEmail"
          />

          <EmailInput
            label="Current Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your current password"
            error={errors.password}
            fieldName="password"
            secureTextEntry={true}
          />

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
                <ActivityIndicator size="small" color="white" />
                <Text style={styles.loadingText}>Updating...</Text>
              </View>
            ) : (
              <Text style={[
                styles.updateButtonText,
                (!isFormFilled || loading) && styles.updateButtonTextDisabled
              ]}>
                Update Email
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      <Toast />
    </KeyboardAvoidingView>
  );
};

export default React.memo(EmailUpdateScreen);
