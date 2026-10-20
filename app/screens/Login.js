import { KeyboardAvoidingView as KeyboardControllerAvoidingView } from "react-native-keyboard-controller";
import KeyboardAwareScrollView from "../components/KeyboardAwareScrollView";
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  ImageBackground,
  RefreshControl,
  SafeAreaView,
  Linking,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import SafeSpinner from "../components/SafeSpinner";
import { LinearGradient } from "expo-linear-gradient";
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Rect,
  Circle,
} from "react-native-svg";
import { 
  Envelope, 
  LockKey, 
  Eye, 
  EyeSlash, 
  XLogo,
  Globe
} from "phosphor-react-native";
import { useAuth } from "../context/NewAuthContext";
import Toast from "react-native-toast-message";

const InstagramIcon = ({ size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Defs>
      <SvgLinearGradient id="igGradient" x1="0" y1="1" x2="1" y2="0">
        <Stop offset="0" stopColor="#FEDA75" />
        <Stop offset="0.25" stopColor="#FA7E1E" />
        <Stop offset="0.5" stopColor="#D62976" />
        <Stop offset="0.75" stopColor="#962FBF" />
        <Stop offset="1" stopColor="#4F5BD5" />
      </SvgLinearGradient>
    </Defs>
    <Rect x="2.5" y="2.5" width="19" height="19" rx="5.5" fill="none" stroke="url(#igGradient)" strokeWidth="2" />
    <Circle cx="12" cy="12" r="4.2" fill="none" stroke="url(#igGradient)" strokeWidth="2" />
    <Circle cx="17.5" cy="6.5" r="1.2" fill="url(#igGradient)" />
  </Svg>
);

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
      const result = await login(credentials.email, credentials.password);

      // New device on a two-factor account: ask for the code before signing in
      if (result?.requiresTwoFactor) {
        navigation.navigate("TwoFactorCode", {
          purpose: "login",
          challengeId: result.challengeId,
          maskedMobile: result.maskedMobile,
        });
        return;
      }

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
    <ImageBackground
      source={require("../assets/login-background.png")}
      style={styles.container}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardControllerAvoidingView 
          style={{ flex: 1 }} 
          behavior="padding"
        >
          <KeyboardAwareScrollView
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
                <Image source={require("../../assets/login-logo.png")} style={styles.logo} resizeMode="contain" />
              </View>
            </View>

            {/* App Name */}
            <Text style={styles.title}>BirdEARNER</Text>
            <Text style={styles.subtitle}>Be BirdEARNER, Become Bread Earner!</Text>

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email or Phone Number</Text>
              <View style={styles.inputContainer}>
                <Envelope size={20} color="#FFFFFF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email or phone number"
                  placeholderTextColor="#C4B5FD"
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
                <LockKey size={20} color="#FFFFFF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#C4B5FD"
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
                    <Eye size={20} color="#FFFFFF" />
                  ) : (
                    <EyeSlash size={20} color="#FFFFFF" />
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
                colors={["#8B2BF5", "#A24DFF", "#8B2BF5"]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={[styles.loginButton, isLoading && styles.disabledButton]}
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
                      source={require("../../assets/google-g.png")}
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
                <View style={styles.youtubeLogo}>
                  <View style={styles.youtubePlay} />
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialIconBtn} onPress={() => handleSocialMediaPress("instagram")}>
                <InstagramIcon size={18} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialIconBtn} onPress={() => handleSocialMediaPress("x")}>
                <XLogo size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialIconBtn} onPress={() => handleSocialMediaPress("web")}>
                <Globe size={18} color="#7DD3FC" />
              </TouchableOpacity>
            </View>
          </KeyboardAwareScrollView>
        </KeyboardControllerAvoidingView>
      </SafeAreaView>
      <Toast />
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#4B0082",
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
    marginBottom: 8,
  },
  logoCircle: {
    width: 100,
    height: 100,
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
    lineHeight: 32,
    marginBottom: 0,
  },
  subtitle: {
    fontSize: 14,
    color: "#E9D5FF",
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
    backgroundColor: "#5A189A",
    borderWidth: 1.5,
    borderColor: "#C084FC",
    borderRadius: 12,
    height: 56,
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
    marginTop: 16,
    marginBottom: 24,
    borderRadius: 12,
    backgroundColor: "#8B2BF5",
    shadowColor: "#A855F7",
    shadowOpacity: 0.55,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  loginButton: {
    height: 56,
    borderRadius: 12,
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
    color: "#ffffff",
    fontSize: 14,
    marginBottom: 16,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#C084FC",
  },
  dividerText: {
    color: "#E9D5FF",
    paddingHorizontal: 16,
    fontSize: 14,
  },
  signupContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
  },
  signupText: {
    color: "#E9D5FF",
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
    gap: 12,
  },
  youtubeLogo: {
    width: 18,
    height: 13,
    borderRadius: 4,
    backgroundColor: "#FF0000",
    justifyContent: "center",
    alignItems: "center",
  },
  youtubePlay: {
    width: 0,
    height: 0,
    marginLeft: 1.5,
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderLeftWidth: 6,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderLeftColor: "#FFFFFF",
  },
  socialIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#C084FC",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  googleButton: {
    width: "100%",
    height: 48,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#D8B4FE",
  },
  googleButtonContent: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  googleIcon: {
    width: 28,
    height: 28,
    marginRight: 10,
  },
  googleButtonText: {
    color: "#4B0082",
    fontSize: 15,
    fontWeight: "600",
  },
});

export default Login;
