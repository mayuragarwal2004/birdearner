import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { account } from "../lib/appwrite";
import { ID } from "react-native-appwrite";
import Toast from "react-native-toast-message";
import Checkbox from "expo-checkbox";

const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

const Signup = ({ navigation, route }) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChecked, setIsChecked] = useState(false);
  const { role } = route.params || {};

  const showToast = (type, text1, text2) => {
    Toast.show({
      type,
      text1,
      text2,
      position: "top",
    });
  };

  const handleSignup = async () => {
    // Validate inputs
    if (!fullName || !email || !password || !confirmPassword) {
      showToast("info", "Warning", "All fields are required.");
      return;
    }
    if (!validateEmail(email)) {
      showToast("error", "Error", "Please enter a valid email address.");
      return;
    }
    if (password !== confirmPassword) {
      showToast("error", "Error", "Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      showToast("error", "Error", "Password must be at least 8 characters.");
      return;
    }
    if (!isChecked) {
      showToast("info", "Warning", "You must accept the Terms and Conditions.");
      return;
    }

    try {
      // Call Appwrite signup API
      await account.create(ID.unique(), email, password, fullName);
      await account.createEmailPasswordSession(email, password);
      showToast("success", "Success", "User registered successfully!");

      // Navigate to the DescribeRole screen
      navigation.navigate("DescribeRole", { fullName, email, role, password });
    } catch (error) {
      // Detailed error handling
      if (error.code === 409) {
        showToast(
          "error",
          "Signup Failed",
          "User with this email already exists."
        );
      } else if (error.code === 400) {
        showToast(
          "error",
          "Signup Failed",
          "Invalid request. Check your inputs."
        );
      } else if (error.message.includes("network error")) {
        showToast("error", "Signup Failed", "Network error. Please try again.");
      } else {
        showToast("error", "Signup Failed", "An unexpected error occurred.");
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Register</Text>

      {/* Full Name Input */}
      <Text style={styles.label}>Full Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your full name"
        value={fullName}
        onChangeText={setFullName}
      />

      {/* Email Input */}
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

      {/* Password Input */}
      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={true}
      />

      {/* Confirm Password Input */}
      <Text style={styles.label}>Confirm Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Confirm your password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry={true}
      />

      {/* Terms and Conditions Checkbox */}
      <View style={styles.checkboxContainer}>
        <Checkbox
          value={isChecked}
          onValueChange={setIsChecked}
          color={isChecked ? "#6A0DAD" : undefined}
        />
        <Text style={styles.checkboxLabel}>I agree to the Terms and Conditions</Text>
      </View>

      {/* Signup Button */}
      <TouchableOpacity
        style={[styles.signupButton, !isChecked && styles.disabledButton]}
        onPress={handleSignup}
        disabled={!isChecked}
      >
        <Text style={styles.signupButtonText}>Sign Up</Text>
      </TouchableOpacity>

      {/* Toast Notification Component */}
      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
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
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  checkboxLabel: {
    color: "white",
    marginLeft: 10,
  },
  signupButton: {
    height: 50,
    backgroundColor: "#fff",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: "gray",
  },
  signupButtonText: {
    color: "#4B0082",
    fontSize: 20,
    fontWeight: "bold",
  },
});

export default Signup;
