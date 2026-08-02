import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useAuth } from "../context/NewAuthContext";
import Toast from "react-native-toast-message";
import apiService from "../lib/apiService";

const ForgetPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
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
    <View style={styles.container}>
      {!showInstructions ? (
        <>
          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>Enter Your Email</Text>
          <TextInput
            style={styles.input}
            placeholder="yourname@gmail.com"
            placeholderTextColor="#999"
            keyboardType="email-address"
            value={email}
            onChangeText={handleInputChange}
          />
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleForgotPassword}
          >
            <Text style={styles.loginButtonText}>Send Reset Link</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={{ alignItems: "center", width: "100%" }}>
          <Text style={styles.title}>Check Your Email</Text>
          <Text style={{ color: "white", fontSize: 16, marginVertical: 20, textAlign: "center" }}>
            1. Open your email inbox.
            {"\n"}
            2. Click the password reset link we sent you.
            {"\n"}
            3. Follow the instructions to set a new password.
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.loginButtonText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      )}
      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#4B0082",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: "bold",
    color: "white",
  },
  subtitle: {
    fontSize: 18,
    color: "white",
    marginTop: 80,
    marginBottom: 15,
  },
  input: {
    width: "100%",
    height: 44,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 20,
    marginBottom: 50,
    fontSize: 16,
  },
  loginButton: {
    width: "100%",
    height: 50,
    backgroundColor: "#6A0DAD",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  loginButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default ForgetPasswordScreen;
