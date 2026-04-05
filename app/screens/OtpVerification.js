import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Toast from "react-native-toast-message";

const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

const OtpVerification = ({ navigation, route }) => {
  const { email: initialEmail, role } = route.params || {};
  const [email, setEmail] = useState(initialEmail || "");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);

  const showToast = (type, text1, text2) => {
    Toast.show({ type, text1, text2, position: "top" });
  };

  const handleSendOtp = async () => {
    if (!email) {
      showToast("error", "Error", "Email is required.");
      return;
    }
    if (!validateEmail(email)) {
      showToast("error", "Error", "Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    try {
      const apiService = require('../lib/apiService').default;
      const data = await apiService.sendVerificationOTP(email);
      
      if (data.success) {
        setIsOtpSent(true);
        showToast("success", "Success", "OTP sent to your email");
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
    if (!otp) {
      showToast("error", "Error", "OTP is required.");
      return;
    }
    if (otp.length !== 6) {
      showToast("error", "Error", "Please enter a valid 6-digit OTP.");
      return;
    }

    setIsLoading(true);
    try {
      const apiService = require('../lib/apiService').default;
      const data = await apiService.verifyEmail(email, otp);
      
      if (data.success) {
        showToast("success", "Success", "Email verified successfully");
        
        if (role === "CLIENT") {
          navigation.replace("ClientSignup", { email, isVerified: true });
        } else {
          navigation.replace("FreelancerSignup", { email, isVerified: true });
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
      const apiService = require('../lib/apiService').default;
      const data = await apiService.sendVerificationOTP(email);
      
      if (data.success) {
        showToast("success", "Success", "OTP resent to your email");
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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#4B0082" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <View style={styles.container}>
          <Text style={styles.heading}>Verify Your Email</Text>
          
          <View style={styles.card}>
            {!isOtpSent ? (
              <>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholderTextColor="#c4c4c4"
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!initialEmail}
                />

                <TouchableOpacity
                  style={[styles.nextButton, isLoading && styles.disabledButton]}
                  onPress={handleSendOtp}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.nextButtonText}>Send OTP</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.label}>OTP</Text>
                <TextInput
                  style={styles.input}
                  placeholderTextColor="#c4c4c4"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, '').slice(0, 6))}
                  keyboardType="number-pad"
                  maxLength={6}
                />

                <TouchableOpacity
                  style={[styles.nextButton, isLoading && styles.disabledButton]}
                  onPress={handleVerifyOtp}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.nextButtonText}>Verify OTP</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.resendContainer}>
                  <Text style={styles.resendText}>Didn't receive the code? </Text>
                  <TouchableOpacity onPress={handleResendOtp} disabled={isLoading}>
                    <Text style={styles.resendLink}>Resend OTP</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  heading: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
    marginTop: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    height: 44,
    borderColor: "#e0e0e0",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 20,
    backgroundColor: "#f5f5f5",
    color: "#000",
    fontSize: 16,
    marginBottom: 15,
  },
  nextButton: {
    height: 50,
    backgroundColor: "#6A0DAD",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  nextButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  disabledButton: {
    opacity: 0.6,
  },
  resendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  resendText: {
    fontSize: 14,
    color: "#333",
  },
  resendLink: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#6A0DAD",
    marginLeft: 5,
  },
  backButton: {
    marginTop: 30,
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 16,
    color: "#fff",
    textDecorationLine: "underline",
  },
});

export default OtpVerification;