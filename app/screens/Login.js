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
  Linking,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import SafeSpinner from "../components/SafeSpinner";
import { LinearGradient } from "expo-linear-gradient";
import { 
  Envelope, 
  LockKey, 
  Eye, 
  EyeSlash, 
  InstagramLogo, 
  XLogo, 
  YoutubeLogo, 
  Globe 
} from "phosphor-react-native";
import { useAuth } from "../context/NewAuthContext";
import Toast from "react-native-toast-message";

const Login = ({ navigation }) => {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  const { login, googleLogin } = useAuth();

  const handleInputChange = (field, value) => {
    setCredentials({ ...credentials, [field]: value });
  };

  const validateInputs = () => {
    const { email, password } = credentials;
    if (!email || !password) {
      showToast("info", "Warning", "All fields are required.");
      return false;
    }
    // Basic check for email or phone length
    if (email.length < 3) {
      showToast("info", "Warning", "Please enter a valid email or phone number.");
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

  const handleSocialMediaPress = async (platform) => {
    let url = "";
    switch (platform) {
      case "instagram":
        url = "https://www.instagram.com/thebirdearner/";
        break;
      case "x":
        url = "https://x.com/birdearner";
        break;
      case "youtube":
        url = "https://www.youtube.com/@thebirdearner";
        break;
      case "web":
        url = "https://birdearner.com";
        break;
      default:
        return;
    }
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Unable to open link", `Cannot open ${platform} at this time.`);
      }
    } catch (error) {
      console.error("Error opening social media link:", error);
      Alert.alert("Error", `Failed to open ${platform}.`);
    }
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

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const result = await googleLogin();
      if (result) {
        showToast("success", "Login Successful!", "Welcome back!");
      }
    } catch (error) {
      console.log("Google Login Error:", error.message);
      showToast("error", "Google Login Failed", error.message || "Something went wrong. Please try again.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setCredentials({ email: "", password: "" });
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#350F6A", "#1D0343"]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#fff"
              />
            }
          >
            {/* Logo */}
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Image source={require("../assets/logo11.png")} style={styles.logo} resizeMode="contain" />
              </View>
            </View>

            {/* App Name */}
            <Text style={styles.title}>BirdEARNER</Text>
            <Text style={styles.subtitle}>Be BirdEARNER, Become Bread Earner!</Text>

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email or Phone Number</Text>
              <View style={styles.inputContainer}>
                <Envelope size={20} color="#C4B5FD" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email or phone number"
                  placeholderTextColor="#9ca3af"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="username"
                  importantForAutofill="yes"
                  value={credentials.email}
                  onChangeText={(value) => handleInputChange("email", value)}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputContainer}>
                <LockKey size={20} color="#C4B5FD" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  textContentType="password"
                  importantForAutofill="yes"
                  value={credentials.password}
                  onChangeText={(value) => handleInputChange("password", value)}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <Eye size={20} color="#C4B5FD" />
                  ) : (
                    <EyeSlash size={20} color="#C4B5FD" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={styles.loginButtonWrapper}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#762BAD", "#4B0082"]}
                style={[styles.loginButton, isLoading && styles.disabledButton]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isLoading ? (
                  <SafeSpinner color="white" size={18} />
                ) : (
                  <Text style={styles.loginButtonText}>Login</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Forgot Password */}
            <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Or Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Login Button */}
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleLogin}
              disabled={isGoogleLoading}
              activeOpacity={0.8}
            >
              <View style={styles.googleButtonContent}>
                {isGoogleLoading ? (
                  <SafeSpinner color="#4B0082" size={18} />
                ) : (
                  <>
                    <Image
                      source={{ uri: "https://developers.google.com/identity/images/glogo.png" }}
                      style={styles.googleIcon}
                    />
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>New here? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Role")}>
                <Text style={styles.signupLinkText}>Create account</Text>
              </TouchableOpacity>
            </View>

            {/* Social Icons */}
            <View style={styles.socialContainer}>
              <TouchableOpacity style={styles.socialIconBtn} onPress={() => handleSocialMediaPress("youtube")}>
                <YoutubeLogo size={22} color="#fff" weight="fill" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialIconBtn} onPress={() => handleSocialMediaPress("instagram")}>
                <InstagramLogo size={22} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialIconBtn} onPress={() => handleSocialMediaPress("x")}>
                <XLogo size={22} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialIconBtn} onPress={() => handleSocialMediaPress("web")}>
                <Globe size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#e5e7eb",
    marginBottom: 32,
  },
  inputGroup: {
    width: "100%",
    marginBottom: 16,
  },
  label: {
    color: "#ffffff",
    fontSize: 14,
    marginBottom: 8,
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#5b21b6",
    borderRadius: 12,
    height: 54,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: "#ffffff",
    fontSize: 15,
    height: "100%",
  },
  eyeIcon: {
    padding: 4,
  },
  loginButtonWrapper: {
    width: "100%",
    marginTop: 8,
    marginBottom: 24,
    borderRadius: 12,
    overflow: "hidden",
  },
  loginButton: {
    height: 54,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  forgotPasswordText: {
    color: "#e5e7eb",
    fontSize: 14,
    marginBottom: 32,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#5b21b6",
  },
  dividerText: {
    color: "#e5e7eb",
    paddingHorizontal: 16,
    fontSize: 14,
  },
  signupContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
  },
  signupText: {
    color: "#e5e7eb",
    fontSize: 14,
  },
  signupLinkText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    gap: 16,
  },
  socialIconBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: "#5b21b6",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  googleButton: {
    width: "100%",
    height: 54,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  googleButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  googleIcon: {
    width: 22,
    height: 22,
    marginRight: 10,
  },
  googleButtonText: {
    color: "#374151",
    fontSize: 15,
    fontWeight: "600",
  },
});

export default Login;
