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
import Checkbox from "expo-checkbox";
import { useTheme } from "../context/ThemeContext";

const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

const Signup = ({ navigation, route }) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const { role } = route.params || {};

  const showToast = (type, text1, text2) => {
    Toast.show({ type, text1, text2, position: "top" });
  };

  const handleCheckEmail = async () => {
    // Validate email
    if (!email) {
      showToast("info", "Warning", "Email is required.");
      return;
    }
    if (!validateEmail(email)) {
      showToast("error", "Error", "Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    try {
      const apiService = require('../lib/apiService').default;
      const data = await apiService.checkEmail(email);
      console.log({data});
      
      if (!data.success) {
        showToast("error", "Signup Failed", data.message || "Email check failed.");
      } else if (data.exists) {
        showToast("error", "Signup Failed", "User with this email already exists.");
      } else {
        // Redirect to role-specific signup with email
        if (role === "CLIENT") {
          navigation.replace("ClientSignup", { email });
        } else {
          navigation.replace("FreelancerSignup", { email });
        }
      }
    } catch (error) {
      showToast("error", "Signup Failed", error.message || "Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.background || "#4B0082" }]}> 
      <ScrollView contentContainerStyle={styles.scrollContainer}> 
        <View style={[styles.container, { backgroundColor: currentTheme.background || "#4B0082" }]}> 
          <Text style={[styles.heading, { color: currentTheme.text || "white" }]}>Check Email Availability</Text>

          {/* Email Input */}
          <Text style={[styles.label, { color: currentTheme.text || "white" }]}>Email</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: currentTheme.cardBackground || "#fff",
              color: currentTheme.text || "#000",
              borderColor: currentTheme.border || "transparent"
            }]}
            placeholder="Enter your email"
            placeholderTextColor={currentTheme.placeholderText || "#999"}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* Check Email Button */}
          <TouchableOpacity
            style={[
              styles.signupButton,
              isLoading && styles.disabledButton
            ]}
            onPress={handleCheckEmail}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.signupButtonText}>Check Email & Continue</Text>
            )}
          </TouchableOpacity>

          {/* Toast Notification Component */}
          <Toast />

          {/* Links */}
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
  link: {
    color: "#aa42f5",
    textDecorationLine: "underline",
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
  passwordContainer: {
    width: "100%",
    height: 44,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 5,
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
    alignItems: "center", // centers horizontally
    marginTop: 20,
  },
});

export default Signup;
