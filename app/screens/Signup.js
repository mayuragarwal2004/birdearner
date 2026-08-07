import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
} from "react-native";
import Toast from "react-native-toast-message";
import { useTheme } from "../context/ThemeContext";

const validateMobile = (mobile) => {
  const re = /^\+?[0-9]{10,15}$/;
  return re.test(String(mobile));
};

const Signup = ({ navigation, route }) => {
  const [mobile, setMobile] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
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
      const apiService = require('../lib/apiService').default;
      const data = await apiService.sendVerificationOTP(mobile);
      
      if (!data.success) {
        showToast("error", "Error", data.message || "Failed to send OTP.");
      } else {
        navigation.navigate("OtpVerification", { mobile, role });
      }
    } catch (error) {
      showToast("error", "Error", error.message || "Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.background || "#4B0082" }]}> 
      <ScrollView contentContainerStyle={styles.scrollContainer}> 
        <View style={[styles.container, { backgroundColor: currentTheme.background || "#4B0082" }]}> 
          <Text style={[styles.heading, { color: currentTheme.text || "white" }]}>Verify Your Mobile Number</Text>

          <Text style={[styles.label, { color: currentTheme.text || "white" }]}>Mobile Number</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: currentTheme.cardBackground || "#fff",
              color: currentTheme.text || "#000",
              borderColor: currentTheme.border || "transparent"
            }]}
            placeholder="Enter your mobile number"
            placeholderTextColor={currentTheme.placeholderText || "#999"}
            value={mobile}
            onChangeText={setMobile}
            keyboardType="phone-pad"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity
            style={[
              styles.signupButton,
              isLoading && styles.disabledButton
            ]}
            onPress={handleSendOtp}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.signupButtonText}>Send OTP</Text>
            )}
          </TouchableOpacity>

          <Toast />

          <View style={styles.linksWrapper}> 
            <TouchableOpacity onPress={() => navigation.navigate("Login")}> 
              <Text style={[styles.linkText, { color: currentTheme.text || "white" }]}> 
                Already have an account?
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#4B0082",
    paddingHorizontal: 40,
    justifyContent: "center",
  },
  heading: {
    fontSize: 28,
    color: "white",
    marginBottom: 32,
    textAlign: "center",
  },
  label: {
    fontSize: 18,
    color: "white",
    marginBottom: 8,
    marginLeft: 8,
    fontWeight: "bold",
  },
  input: {
    width: "100%",
    height: 44,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 20,
    marginBottom: 20,
    fontSize: 16,
  },
  signupButton: {
    height: 50,
    backgroundColor: "#6A0DAD",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: "#9E9E9E",
    opacity: 0.6,
  },
  linkText: {
    color: "white",
    marginVertical: 10,
    fontSize: 14,
    textDecorationLine: "underline",
  },
  signupButtonText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  linksWrapper: {
    alignItems: "center",
    marginTop: 20,
  },
});

export default Signup;
