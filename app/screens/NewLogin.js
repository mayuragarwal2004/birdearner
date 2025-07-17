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
  Alert,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useAuth } from "../context/NewAuthContext";
import Toast from "react-native-toast-message";
import Checkbox from "expo-checkbox";
import { useTheme } from "../context/ThemeContext";

const Login = ({ navigation }) => {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [isChecked, setIsChecked] = useState(false);
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

    if (password.length < 8) {
      showToast("info", "Warning", "Password must be at least 8 characters long.");
      return false;
    }

    if (!isChecked) {
      showToast("info", "Warning", "You must accept the Terms and Conditions.");
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
      const user = await login(credentials.email, credentials.password);
      
      if (user) {
        showToast("success", "Login Successful!", "Welcome back!");
        
        // Navigate based on user role and profile completion
        if (user.role === 'FREELANCER') {
          // Check if freelancer profile is complete
          navigation.reset({
            index: 0,
            routes: [{ name: "Tabs" }],
          });
        } else if (user.role === 'CLIENT') {
          // Check if client profile is complete
          navigation.reset({
            index: 0,
            routes: [{ name: "Tabs" }],
          });
        } else {
          // Admin or unknown role
          navigation.reset({
            index: 0,
            routes: [{ name: "Tabs" }],
          });
        }
      }
    } catch (error) {
      console.error("Login Error:", error);

      let errorMessage = "An unexpected error occurred.";

      if (error.message.includes("Invalid email or password")) {
        errorMessage = "Incorrect email or password. Please try again.";
      } else if (error.message.includes("Network")) {
        errorMessage = "Network error. Please check your internet connection.";
      } else if (error.message.includes("User not found")) {
        errorMessage = "No account found with this email. Please sign up first.";
      } else {
        errorMessage = error.message;
      }

      showToast("error", "Login Failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate("ForgotPassword");
  };

  const handleSignUp = () => {
    navigation.navigate("Role");
  };

  const onRefresh = () => {
    setRefreshing(true);
    setCredentials({ email: "", password: "" });
    setIsChecked(false);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require("../assets/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.title, { color: currentTheme.text }]}>
            Welcome Back!
          </Text>
          <Text style={[styles.subtitle, { color: currentTheme.textSecondary }]}>
            Sign in to continue your journey
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: currentTheme.text }]}>
              Email Address
            </Text>
            <View style={[styles.inputWrapper, { borderColor: currentTheme.border }]}>
              <FontAwesome name="envelope" size={20} color={currentTheme.textSecondary} />
              <TextInput
                style={[styles.input, { color: currentTheme.text }]}
                placeholder="Enter your email"
                placeholderTextColor={currentTheme.textSecondary}
                value={credentials.email}
                onChangeText={(value) => handleInputChange("email", value)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: currentTheme.text }]}>
              Password
            </Text>
            <View style={[styles.inputWrapper, { borderColor: currentTheme.border }]}>
              <FontAwesome name="lock" size={20} color={currentTheme.textSecondary} />
              <TextInput
                style={[styles.input, { color: currentTheme.text }]}
                placeholder="Enter your password"
                placeholderTextColor={currentTheme.textSecondary}
                value={credentials.password}
                onChangeText={(value) => handleInputChange("password", value)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <FontAwesome
                  name={showPassword ? "eye" : "eye-slash"}
                  size={20}
                  color={currentTheme.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Remember Me & Forgot Password */}
          <View style={styles.checkboxContainer}>
            <View style={styles.checkboxRow}>
              <Checkbox
                value={isChecked}
                onValueChange={setIsChecked}
                color={isChecked ? "#0066CC" : undefined}
                style={styles.checkbox}
              />
              <Text style={[styles.checkboxText, { color: currentTheme.text }]}>
                I agree to the Terms and Conditions
              </Text>
            </View>
            
            <TouchableOpacity onPress={handleForgotPassword}>
              <Text style={styles.forgotPassword}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[
              styles.loginButton,
              isLoading && styles.loginButtonDisabled
            ]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? "Signing In..." : "Sign In"}
            </Text>
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View style={styles.signupContainer}>
            <Text style={[styles.signupText, { color: currentTheme.textSecondary }]}>
              Don't have an account?{" "}
            </Text>
            <TouchableOpacity onPress={handleSignUp}>
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 102, 204, 0.05)',
  },
  input: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  checkboxContainer: {
    marginBottom: 24,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    marginRight: 8,
  },
  checkboxText: {
    fontSize: 14,
    flex: 1,
  },
  forgotPassword: {
    fontSize: 14,
    color: '#0066CC',
    fontWeight: '600',
    textAlign: 'right',
  },
  loginButton: {
    backgroundColor: '#0066CC',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#0066CC',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    fontSize: 16,
  },
  signupLink: {
    fontSize: 16,
    color: '#0066CC',
    fontWeight: 'bold',
  },
});

export default Login;
