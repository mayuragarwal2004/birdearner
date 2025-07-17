import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useAuth } from "../context/NewAuthContext";
import Toast from "react-native-toast-message";
import { useTheme } from "../context/ThemeContext";

const Login = ({ navigation }) => {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];

  const handleInputChange = (field, value) => {
    setCredentials({ ...credentials, [field]: value });
  };

  const validateInputs = () => {
    const { email, password } = credentials;

    if (!email || !password) {
      showToast("info", "Warning", "All fields are required.");
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

  const handleLogin = async () => {
    if (!validateInputs()) return;

    setIsLoading(true);
    try {
      await login(credentials.email, credentials.password);
      showToast("success", "Login Successful!", "Welcome back!");
    } catch (error) {
      console.log("Login Error:", error.message);

      let errorMessage = "An unexpected error occurred.";

      if (error.message.includes("Invalid email or password")) {
        errorMessage = "Incorrect email or password. Please try again.";
      } else if (error.message.includes("Network error")) {
        errorMessage = "Network error. Please check your connection.";
      } else if (error.message.includes("JSON Parse error")) {
        errorMessage = "Server error. Please try again later.";
      }

      showToast("error", "Login Failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    // Reset form
    setCredentials({ email: "", password: "" });
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: "#4B0082" }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#3b006b"]}
            progressBackgroundColor="#fff"
          />
        }
      >
        <View style={[styles.container, { backgroundColor: "#4B0082" }]}>
          {/* Logo */}
          <Image source={require("../assets/logo11.png")} style={styles.logo} />

          {/* App Name */}
          <Text style={[styles.title, { color: "white" }]}>BirdEARNER</Text>
          <Text style={[styles.subtitle, { color: "white" }]}>
            Be BirdEARNER, Become Bread Earner!
          </Text>

          {/* Email Input */}
          <TextInput
            style={[styles.input, { 
              backgroundColor: "#fff",
              color: "#000",
              borderColor: "transparent"
            }]}
            placeholder="yourname@gmail.com"
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={credentials.email}
            onChangeText={(value) => handleInputChange("email", value)}
          />

          {/* Password Input */}
          <View style={[styles.passwordContainer, { 
            backgroundColor: "#fff",
            borderColor: "transparent"
          }]}>
            <TextInput
              style={[styles.passwordInput, { color: "#000" }]}
              placeholder="********"
              placeholderTextColor="#999"
              secureTextEntry={!showPassword}
              value={credentials.password}
              onChangeText={(value) => handleInputChange("password", value)}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <FontAwesome
                name={showPassword ? "eye" : "eye-slash"}
                size={20}
                color="#999"
              />
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[
              styles.loginButton,
              isLoading && styles.disabledButton
            ]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.loginButtonText}>Log In</Text>
            )}
          </TouchableOpacity>

          {/* Links */}
          {[
            { text: "Forget Password", screen: "ForgotPassword" },
            { text: "New Here? Create Your Account Here!", screen: "Role" },
          ].map((link, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => navigation.navigate(link.screen)}
            >
              <Text style={[styles.linkText, { color: "white" }]}>
                {link.text}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Social Icons */}
          <View style={styles.socialContainer}>
            {["instagram", "facebook"].map((icon, index) => (
              <FontAwesome
                key={index}
                name={icon}
                size={24}
                color="white"
                style={styles.socialIcon}
              />
            ))}
          </View>

          {/* Toast container */}
          <Toast />
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
    minHeight: "100%",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 40,
  },
  input: {
    width: "100%",
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 20,
    marginBottom: 20,
    fontSize: 16,
    borderWidth: 1,
  },
  passwordContainer: {
    width: "100%",
    height: 44,
    borderRadius: 12,
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
    paddingHorizontal: 5,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  link: {
    color: '#aa42f5',
    textDecorationLine: 'underline',
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
  disabledButton: {
    backgroundColor: "gray",
  },
  loginButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  linkText: {
    marginVertical: 10,
    fontSize: 14,
    textDecorationLine: "underline",
  },
  socialContainer: {
    flexDirection: "row",
    marginTop: 40,
  },
  socialIcon: {
    marginHorizontal: 10,
  },
});

export default Login;
