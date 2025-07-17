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
// import { useAppwrite } from "../context/AppwriteContext";

const ForgetPasswordScreen = ({ navigation }) => {
  // const { account } = useAppwrite();
  const [email, setEmail] = useState("");

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

    // TODO: Implement password reset with new backend
    // const account = new Account(client);

    try {
      // await account.createRecovery(
      //   email,
      //   "https://app.birdearner.com/reset-password"
      // );
      showToast(
        "info",
        "Feature Coming Soon",
        "Password reset functionality will be available soon."
      );
      navigation.goBack();
    } catch (error) {
      showToast("error", "Failed", error.message);
    }
  };

  return (
    <View style={styles.container}>
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
