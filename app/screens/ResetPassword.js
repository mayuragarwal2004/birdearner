import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SafeSpinner from "../components/SafeSpinner";
import Toast from "react-native-toast-message";
import apiService from "../lib/apiService";

const ResetPasswordScreen = ({ route, navigation }) => {
  // Extract token from either params (if navigated manually) or route.params directly
  const token = route.params?.token;
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const showToast = (type, title, message) => {
    Toast.show({
      type,
      text1: title,
      text2: message,
      position: "top",
    });
  };

  const validateInputs = () => {
    if (!password || !confirmPassword) {
      showToast("info", "Warning", "Please fill in all fields.");
      return false;
    }
    if (password.length < 6) {
      showToast("info", "Warning", "Password must be at least 6 characters.");
      return false;
    }
    if (password !== confirmPassword) {
      showToast("info", "Warning", "Passwords do not match.");
      return false;
    }
    if (!token) {
      showToast("error", "Error", "Invalid or missing reset token.");
      return false;
    }
    return true;
  };

  const handleResetPassword = async () => {
    if (!validateInputs()) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `${apiService.baseURL}/auth/reset-password/${token}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        showToast("success", "Success", "Password reset successfully!");
        // Navigate back to Login after a short delay
        setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }, 1500);
      } else {
        showToast(
          "error",
          "Failed",
          data.message || "Failed to reset password."
        );
      }
    } catch (error) {
      console.error("Reset Password Error:", error);
      showToast("error", "Failed", "An error occurred while processing your request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Reset Password</Text>
      <Text style={styles.subtitle}>Enter your new password below</Text>
      
      <TextInput
        style={styles.input}
        placeholder="New Password"
        placeholderTextColor="#999"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Confirm New Password"
        placeholderTextColor="#999"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      
      <TouchableOpacity
        style={styles.loginButton}
        onPress={handleResetPassword}
        disabled={loading}
      >
        {loading ? (
          <SafeSpinner size={24} color="white" />
        ) : (
          <Text style={styles.loginButtonText}>Reset Password</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.loginButton, { backgroundColor: "transparent", borderWidth: 1, borderColor: "white", marginTop: 10 }]}
        onPress={() => navigation.navigate("Login")}
      >
        <Text style={styles.loginButtonText}>Back to Login</Text>
      </TouchableOpacity>
      
      <Toast />
    </SafeAreaView>
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
    marginTop: 20,
    marginBottom: 40,
    textAlign: "center",
  },
  input: {
    width: "100%",
    height: 44,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 20,
    marginBottom: 20,
    fontSize: 16,
  },
  loginButton: {
    width: "100%",
    height: 50,
    backgroundColor: "#6A0DAD",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  loginButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default ResetPasswordScreen;
