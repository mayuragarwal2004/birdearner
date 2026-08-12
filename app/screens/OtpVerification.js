import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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
const KeyRound = getIcon("KeyRound");
const ArrowLeft = getIcon("ArrowLeft");

const validateMobile = (mobile) => {
  const re = /^\+?[0-9]{10,15}$/;
  return re.test(String(mobile));
};

const OtpVerification = ({ navigation, route }) => {
  const { mobile: initialMobile, role } = route.params || {};
  const [mobile, setMobile] = useState(initialMobile || "");
  const [otp, setOtp] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [focusedIndex, setFocusedIndex] = useState(null);
  const inputRefs = useRef([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);

  const showToast = (type, text1, text2) => {
    Toast.show({ type, text1, text2, position: "top" });
  };

  const handleOtpDigitChange = (text, index) => {
    const cleanDigit = text.replace(/[^0-9]/g, "");

    if (cleanDigit.length === 0) {
      const updatedDigits = [...otpDigits];
      updatedDigits[index] = "";
      setOtpDigits(updatedDigits);
      setOtp(updatedDigits.join(""));
      return;
    }

    if (cleanDigit.length > 1) {
      handleOtpPaste(cleanDigit);
      return;
    }

    const lastChar = cleanDigit.slice(-1);
    const updatedDigits = [...otpDigits];
    updatedDigits[index] = lastChar;
    setOtpDigits(updatedDigits);
    setOtp(updatedDigits.join(""));

    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace") {
      if (!otpDigits[index] && index > 0) {
        const updatedDigits = [...otpDigits];
        updatedDigits[index - 1] = "";
        setOtpDigits(updatedDigits);
        setOtp(updatedDigits.join(""));
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleOtpPaste = (text) => {
    const digits = text.replace(/[^0-9]/g, "").slice(0, 6);
    if (digits.length > 0) {
      const newDigits = ["", "", "", "", "", ""];
      for (let i = 0; i < digits.length; i++) {
        newDigits[i] = digits[i];
      }
      setOtpDigits(newDigits);
      setOtp(digits);
      const nextIndex = Math.min(digits.length, 5);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  const handleSendOtp = async () => {
    if (!mobile) {
      showToast("error", "Error", "Mobile number is required.");
      return;
    }
    if (!validateMobile(mobile)) {
      showToast("error", "Error", "Please enter a valid mobile number.");
      return;
    }

    setIsLoading(true);
    try {
      const data = await apiService.sendVerificationOTP(mobile);

      if (data.success) {
        setIsOtpSent(true);
        showToast("success", "Success", "OTP sent to your mobile number");
      } else {
        showToast("error", "Error", data.message || "Failed to send OTP");
      }
    } catch (error) {
      showToast("error", "Error", error.message || "Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      showToast("error", "Error", "Please enter a valid 6-digit OTP.");
      return;
    }

    setIsLoading(true);
    try {
      const data = await apiService.verifyMobile(mobile, otp);

      if (data.success) {
        showToast("success", "Success", "Mobile number verified successfully");

        if (role === "CLIENT") {
          navigation.replace("ClientSignup", { mobile, isVerified: true });
        } else {
          navigation.replace("FreelancerSignup", { mobile, isVerified: true });
        }
      } else {
        showToast("error", "Error", data.message || "Invalid OTP");
      }
    } catch (error) {
      showToast("error", "Error", error.message || "Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.sendVerificationOTP(mobile);

      if (data.success) {
        setOtpDigits(["", "", "", "", "", ""]);
        setOtp("");
        showToast("success", "Success", "OTP resent to your mobile number");
      } else {
        showToast("error", "Error", data.message || "Failed to resend OTP");
      }
    } catch (error) {
      showToast("error", "Error", error.message || "Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#2E0854" }}>
      <LinearGradient
        colors={["#2E0854", "#3E0A70", "#1C0338"]}
        style={{ flex: 1 }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header Back Button */}
            <TouchableOpacity
              style={styles.headerBackButton}
              onPress={() => navigation.goBack()}
            >
              <ArrowLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Circular Header Icon Badge */}
            <View style={styles.headerBadgeContainer}>
              <View style={styles.headerBadge}>
                <ShieldCheck size={36} color="#6D28D9" />
              </View>
            </View>

            <Text style={styles.heading}>Verify Your Mobile Number</Text>
            <Text style={styles.subtitle}>
              {!isOtpSent
                ? "Enter your mobile number to receive a 6-digit OTP code"
                : `We've sent a 6-digit verification code to ${mobile}`}
            </Text>

            <View style={styles.card}>
              {!isOtpSent ? (
                <>
                  <Text style={styles.fieldLabel}>Mobile Number</Text>
                  <View style={styles.inputContainer}>
                    <View style={styles.iconBox}>
                      <Phone size={20} color="#7C3AED" />
                    </View>
                    <View style={styles.countryCodeBox}>
                      <Text style={styles.countryFlag}>🇮🇳</Text>
                      <Text style={styles.countryCodeText}>+91</Text>
                    </View>
                    <TextInput
                      style={styles.textInput}
                      placeholderTextColor="#A098AE"
                      placeholder="Enter your mobile number"
                      value={mobile}
                      onChangeText={setMobile}
                      keyboardType="phone-pad"
                      autoCapitalize="none"
                      editable={!initialMobile}
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
                </>
              ) : (
                <>
                  <Text style={styles.fieldLabel}>Enter Verification Code</Text>
                  <View style={styles.otpBoxesRow}>
                    {otpDigits.map((digit, index) => (
                      <TextInput
                        key={index}
                        ref={(ref) => (inputRefs.current[index] = ref)}
                        style={[
                          styles.otpBox,
                          digit ? styles.otpBoxFilled : null,
                          focusedIndex === index ? styles.otpBoxFocused : null,
                        ]}
                        value={digit}
                        onChangeText={(text) => handleOtpDigitChange(text, index)}
                        onKeyPress={(e) => handleKeyPress(e, index)}
                        onFocus={() => setFocusedIndex(index)}
                        onBlur={() => setFocusedIndex(null)}
                        keyboardType="number-pad"
                        maxLength={index === 0 ? 6 : 1}
                        selectTextOnFocus
                        textContentType={Platform.OS === "ios" ? "oneTimeCode" : undefined}
                        autoComplete={Platform.OS === "android" ? "one-time-code" : undefined}
                      />
                    ))}
                  </View>

                  <TouchableOpacity
                    style={[styles.primaryButton, isLoading && styles.disabledButton]}
                    onPress={handleVerifyOtp}
                    disabled={isLoading}
                    activeOpacity={0.85}
                  >
                    {isLoading ? (
                      <SafeSpinner color="white" size={18} />
                    ) : (
                      <Text style={styles.primaryButtonText}>Verify & Proceed</Text>
                    )}
                  </TouchableOpacity>

                  <View style={styles.resendRow}>
                    <Text style={styles.resendText}>Didn't receive code? </Text>
                    <TouchableOpacity onPress={handleResendOtp} disabled={isLoading}>
                      <Text style={styles.resendLink}>Resend OTP</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>

            <TouchableOpacity
              style={styles.goBackButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Text style={styles.goBackButtonText}>Go Back</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    justifyContent: "center",
  },
  headerBackButton: {
    position: "absolute",
    top: 10,
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  headerBadgeContainer: {
    alignItems: "center",
    marginBottom: 16,
    marginTop: 10,
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
  otpBoxesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 18,
  },
  otpBox: {
    width: 44,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E9E3F4",
    backgroundColor: "#FAFAFC",
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    color: "#1F1D2B",
  },
  otpBoxFocused: {
    borderColor: "#6D28D9",
    backgroundColor: "#F5F0FF",
    shadowColor: "#6D28D9",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  otpBoxFilled: {
    borderColor: "#7C3AED",
    backgroundColor: "#FFFFFF",
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
  resendRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
  },
  resendText: {
    fontSize: 13,
    color: "#6E6B7B",
  },
  resendLink: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6D28D9",
  },
  goBackButton: {
    marginTop: 20,
    alignItems: "center",
  },
  goBackButtonText: {
    fontSize: 14,
    color: "#D4C5ED",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});

export default OtpVerification;

