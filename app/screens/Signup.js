import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
} from "react-native";
import SafeSpinner from "../components/SafeSpinner";
import { LinearGradient } from "expo-linear-gradient";
import * as LucideIcons from "lucide-react-native";
import Toast from "react-native-toast-message";
import apiService from "../lib/apiService";

const getIcon = (name) => LucideIcons[name]?.default || LucideIcons[name];
const Phone = getIcon("Phone");
const ShieldCheck = getIcon("ShieldCheck");
const ChevronDown = getIcon("ChevronDown");

const validateMobile = (mobile) => {
  const re = /^\+?[0-9]{10,15}$/;
  return re.test(String(mobile));
};

const Signup = ({ navigation, route }) => {
  const [mobile, setMobile] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { role } = route.params || {};

  const showToast = (type, text1, text2) => {
    Toast.show({ type, text1, text2, position: "top" });
  };

  const handleSendOtp = async () => {
    if (!mobile) {
      showToast("info", "Warning", "Mobile number is required.");
      return;
    }
    if (!validateMobile(mobile)) {
      showToast("error", "Error", "Please enter a valid mobile number.");
      return;
    }

    setIsLoading(true);
    try {
      const data = await apiService.sendVerificationOTP(mobile);

      if (!data.success) {
        showToast("error", "Error", data.message || "Failed to send OTP.");
      } else {
        navigation.navigate("OtpVerification", { mobile, role });
      }
    } catch (error) {
      showToast(
        "error",
        "Error",
        error.message || "Network error. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#2E0854" }}>
      <LinearGradient
        colors={["#2B0855", "#3B0A75", "#160233"]}
        style={{ flex: 1 }}
      >
        {/* Background Dot Matrix Decorative Elements */}
        <View style={styles.dotMatrixLeft} pointerEvents="none">
          {[...Array(15)].map((_, i) => (
            <View key={i} style={styles.dotItem} />
          ))}
        </View>
        <View style={styles.dotMatrixRight} pointerEvents="none">
          {[...Array(15)].map((_, i) => (
            <View key={i} style={styles.dotItem} />
          ))}
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Badge */}
          <View style={styles.headerBadgeContainer}>
            <View style={styles.headerBadge}>
              <ShieldCheck size={36} color="#6D28D9" />
            </View>
          </View>

          <Text style={styles.heading}>Verify Your Mobile Number</Text>
          <Text style={styles.subtitle}>
            Enter your mobile number to receive a 6-digit verification code
          </Text>

          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Mobile Number</Text>
            <View style={styles.inputContainer}>
              <View style={styles.iconBox}>
                <Phone size={20} color="#7C3AED" />
              </View>
              <View style={styles.countryCodeBox}>
                <Text style={styles.countryFlag}>🇮🇳</Text>
                <Text style={styles.countryCodeText}>+91</Text>
                <ChevronDown size={14} color="#7C3AED" style={{ marginLeft: 2 }} />
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="Enter your mobile number"
                placeholderTextColor="#A098AE"
                value={mobile}
                onChangeText={setMobile}
                keyboardType="phone-pad"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.disabledButton]}
              onPress={handleSendOtp}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <SafeSpinner color="white" size={18} />
              ) : (
                <Text style={styles.primaryButtonText}>Send OTP</Text>
              )}
            </TouchableOpacity>

            <View style={styles.linksWrapper}>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.linkText}>
                  Already have an account? <Text style={styles.boldLink}>Log in</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 40,
    justifyContent: "center",
  },
  dotMatrixLeft: {
    position: "absolute",
    left: 8,
    top: 80,
    width: 36,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    opacity: 0.18,
    zIndex: 0,
  },
  dotMatrixRight: {
    position: "absolute",
    right: 8,
    top: 260,
    width: 36,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    opacity: 0.18,
    zIndex: 0,
  },
  dotItem: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#FFFFFF",
  },
  headerBadgeContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  headerBadge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  heading: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#D4C5ED",
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 16,
    lineHeight: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1F1D2B",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAFAFC",
    borderWidth: 1,
    borderColor: "#E9E3F4",
    borderRadius: 14,
    paddingHorizontal: 8,
    minHeight: 52,
    marginBottom: 20,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#F3E8FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  countryCodeBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 8,
    marginRight: 8,
    borderRightWidth: 1,
    borderRightColor: "#E9E3F4",
  },
  countryFlag: {
    fontSize: 16,
    marginRight: 4,
  },
  countryCodeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F1D2B",
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: "#1F1D2B",
    paddingVertical: 10,
  },
  primaryButton: {
    height: 52,
    backgroundColor: "#6D28D9",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
    shadowColor: "#6D28D9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.6,
  },
  linksWrapper: {
    alignItems: "center",
    marginTop: 20,
  },
  linkText: {
    color: "#6E6B7B",
    fontSize: 14,
  },
  boldLink: {
    color: "#6D28D9",
    fontWeight: "700",
  },
});

export default Signup;

