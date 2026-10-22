import KeyboardAwareScrollView from "../components/KeyboardAwareScrollView";
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import apiService from "../lib/apiService";

const PURPLE = "#6A0DAD";
const DEEP_PURPLE = "#2A0B5C";
const MID_PURPLE = "#4B0082";

const ForgetPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [emailFocused, setEmailFocused] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const handleInputChange = (value) => {
    setEmail(value);
  };

  const validateInputs = () => {
    if (!email) {
      showToast("info", "Warning", "Email is required.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast("info", "Warning", "Please enter a valid email address.");
      return false;
    }
    return true;
  };

  const showToast = (type, title, message) => {
    Toast.show({
      type,
      text1: title,
      text2: message,
      position: "top",
    });
  };

  const handleForgotPassword = async () => {
    if (!validateInputs()) return;
    try {
      const response = await fetch(
        `${apiService.baseURL}/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );
      const data = await response.json();
      if (data.success) {
        setShowInstructions(true);
      } else {
        showToast(
          "error",
          "Failed",
          data.message || "Failed to send reset link."
        );
      }
    } catch (error) {
      console.error("Forgot Password Error:", error);
      showToast("error", "Failed", "An error occurred while processing your request.");
    }
  };

  return (
    <LinearGradient
      colors={[DEEP_PURPLE, MID_PURPLE, "#6D28D9"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <KeyboardAwareScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            {!showInstructions ? (
              <>
                <View style={styles.iconBadge}>
                  <Ionicons name="lock-open-outline" size={28} color={PURPLE} />
                </View>
                <Text style={styles.title}>Forgot Password?</Text>
                <Text style={styles.subtitle}>
                  No worries. Enter the email linked to your account and we'll send you a reset link.
                </Text>

                <Text style={styles.label}>Email address</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    emailFocused && styles.inputWrapperFocused,
                  ]}
                >
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={emailFocused ? PURPLE : "#9CA3AF"}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="yourname@gmail.com"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={handleInputChange}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                  />
                </View>

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleForgotPassword}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={["#7C3AED", PURPLE]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.primaryButtonGradient}
                  >
                    <Text style={styles.primaryButtonText}>Send Reset Link</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  style={styles.linkRow}
                  activeOpacity={0.7}
                >
                  <Text style={styles.linkText}>Back to Login</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={[styles.iconBadge, styles.successBadge]}>
                  <Ionicons name="checkmark-circle" size={34} color="#16A34A" />
                </View>
                <Text style={styles.title}>Check Your Email</Text>
                <Text style={styles.subtitle}>
                  We've sent a password reset link to {email}.
                </Text>

                <View style={styles.stepsBox}>
                  <Text style={styles.stepText}>1. Open your email inbox.</Text>
                  <Text style={styles.stepText}>2. Click the password reset link we sent you.</Text>
                  <Text style={styles.stepText}>3. Follow the instructions to set a new password.</Text>
                </View>

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => navigation.goBack()}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={["#7C3AED", PURPLE]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.primaryButtonGradient}
                  >
                    <Text style={styles.primaryButtonText}>Back to Login</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
      <Toast />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 20,
    marginTop: Platform.OS === "android" ? 8 : 0,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    // Extra bottom space lifts the card so it sits centred on the screen
    paddingBottom: 56,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  iconBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 18,
  },
  successBadge: {
    backgroundColor: "#DCFCE7",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1F1235",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 14,
    marginBottom: 24,
  },
  inputWrapperFocused: {
    borderColor: PURPLE,
    backgroundColor: "#FFFFFF",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1F1235",
    height: "100%",
  },
  primaryButton: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: PURPLE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryButtonGradient: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  linkRow: {
    alignItems: "center",
    marginTop: 18,
  },
  linkText: {
    color: PURPLE,
    fontSize: 14,
    fontWeight: "600",
  },
  stepsBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    padding: 16,
    gap: 10,
    marginBottom: 24,
  },
  stepText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
});

export default ForgetPasswordScreen;
