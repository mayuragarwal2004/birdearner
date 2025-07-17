import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useAuth } from "../context/NewAuthContext";
import Toast from "react-native-toast-message";
import Checkbox from "expo-checkbox";
import { useTheme } from "../context/ThemeContext";

const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

const Signup = ({ navigation, route }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isChecked, setIsChecked] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const { role } = route.params || { role: 'FREELANCER' };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const showToast = (type, text1, text2) => {
    Toast.show({
      type,
      text1,
      text2,
      position: "top",
    });
  };

  const validateInputs = () => {
    const { fullName, email, password, confirmPassword } = formData;

    if (!fullName || !email || !password || !confirmPassword) {
      showToast("info", "Warning", "All fields are required.");
      return false;
    }

    if (fullName.length < 2) {
      showToast("error", "Error", "Full name must be at least 2 characters long.");
      return false;
    }

    if (!validateEmail(email)) {
      showToast("error", "Error", "Please enter a valid email address.");
      return false;
    }

    if (password.length < 8) {
      showToast("error", "Error", "Password must be at least 8 characters long.");
      return false;
    }

    if (password !== confirmPassword) {
      showToast("error", "Error", "Passwords do not match.");
      return false;
    }

    // Password strength check
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      showToast(
        "info", 
        "Weak Password", 
        "Password should contain uppercase, lowercase, and numbers."
      );
    }

    if (!isChecked) {
      showToast("info", "Warning", "You must accept the Terms and Conditions.");
      return false;
    }

    return true;
  };

  const handleSignup = async () => {
    if (!validateInputs()) return;

    setIsLoading(true);
    try {
      const userData = {
        email: formData.email,
        password: formData.password,
        role: role.toUpperCase(),
      };

      const user = await register(userData);
      
      if (user) {
        showToast("success", "Success", "Account created successfully!");

        // Navigate to profile creation based on role
        if (role.toUpperCase() === 'FREELANCER') {
          navigation.navigate("DescribeRole", { 
            fullName: formData.fullName, 
            email: formData.email, 
            role,
            user 
          });
        } else if (role.toUpperCase() === 'CLIENT') {
          navigation.navigate("DescribeRoleCom", { 
            fullName: formData.fullName, 
            email: formData.email, 
            role,
            user 
          });
        } else {
          // Default navigation
          navigation.reset({
            index: 0,
            routes: [{ name: "Tabs" }],
          });
        }
      }
    } catch (error) {
      console.error("Signup Error:", error);
      
      let errorMessage = "An unexpected error occurred.";
      
      if (error.message.includes("Email already exists")) {
        errorMessage = "An account with this email already exists. Please login or use a different email.";
      } else if (error.message.includes("Network")) {
        errorMessage = "Network error. Please check your internet connection.";
      } else if (error.message.includes("validation")) {
        errorMessage = "Please check your input data and try again.";
      } else {
        errorMessage = error.message;
      }

      showToast("error", "Signup Failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    navigation.navigate("Login");
  };

  const handleTermsPress = () => {
    // Navigate to terms and conditions screen
    navigation.navigate("TermsAndConditionsScreen");
  };

  const getPasswordStrength = () => {
    const { password } = formData;
    if (password.length === 0) return { strength: 0, text: "" };
    
    let strength = 0;
    let text = "Weak";
    let color = "#FF6B6B";
    
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    if (strength >= 4) {
      text = "Strong";
      color = "#51CF66";
    } else if (strength >= 3) {
      text = "Good";
      color = "#FFD93D";
    } else if (strength >= 2) {
      text = "Fair";
      color = "#FF922B";
    }
    
    return { strength: strength * 20, text, color };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: currentTheme.text }]}>
            Create Account
          </Text>
          <Text style={[styles.subtitle, { color: currentTheme.textSecondary }]}>
            Join Bird Earner as a {role.toLowerCase()}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Full Name Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: currentTheme.text }]}>
              Full Name
            </Text>
            <View style={[styles.inputWrapper, { borderColor: currentTheme.border }]}>
              <FontAwesome name="user" size={20} color={currentTheme.textSecondary} />
              <TextInput
                style={[styles.input, { color: currentTheme.text }]}
                placeholder="Enter your full name"
                placeholderTextColor={currentTheme.textSecondary}
                value={formData.fullName}
                onChangeText={(value) => handleInputChange("fullName", value)}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
          </View>

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
                value={formData.email}
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
                value={formData.password}
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
            
            {/* Password Strength Indicator */}
            {formData.password.length > 0 && (
              <View style={styles.passwordStrength}>
                <View style={styles.strengthBar}>
                  <View 
                    style={[
                      styles.strengthFill, 
                      { 
                        width: `${passwordStrength.strength}%`,
                        backgroundColor: passwordStrength.color 
                      }
                    ]} 
                  />
                </View>
                <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                  {passwordStrength.text}
                </Text>
              </View>
            )}
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: currentTheme.text }]}>
              Confirm Password
            </Text>
            <View style={[styles.inputWrapper, { borderColor: currentTheme.border }]}>
              <FontAwesome name="lock" size={20} color={currentTheme.textSecondary} />
              <TextInput
                style={[styles.input, { color: currentTheme.text }]}
                placeholder="Confirm your password"
                placeholderTextColor={currentTheme.textSecondary}
                value={formData.confirmPassword}
                onChangeText={(value) => handleInputChange("confirmPassword", value)}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <FontAwesome
                  name={showConfirmPassword ? "eye" : "eye-slash"}
                  size={20}
                  color={currentTheme.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Terms and Conditions */}
          <View style={styles.checkboxContainer}>
            <View style={styles.checkboxRow}>
              <Checkbox
                value={isChecked}
                onValueChange={setIsChecked}
                color={isChecked ? "#0066CC" : undefined}
                style={styles.checkbox}
              />
              <View style={styles.termsTextContainer}>
                <Text style={[styles.checkboxText, { color: currentTheme.text }]}>
                  I agree to the{" "}
                </Text>
                <TouchableOpacity onPress={handleTermsPress}>
                  <Text style={styles.termsLink}>Terms and Conditions</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Signup Button */}
          <TouchableOpacity
            style={[
              styles.signupButton,
              isLoading && styles.signupButtonDisabled
            ]}
            onPress={handleSignup}
            disabled={isLoading}
          >
            <Text style={styles.signupButtonText}>
              {isLoading ? "Creating Account..." : "Create Account"}
            </Text>
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={[styles.loginText, { color: currentTheme.textSecondary }]}>
              Already have an account?{" "}
            </Text>
            <TouchableOpacity onPress={handleLogin}>
              <Text style={styles.loginLink}>Sign In</Text>
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
    marginBottom: 30,
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
  passwordStrength: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  strengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginRight: 10,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
  },
  checkboxContainer: {
    marginBottom: 24,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    marginRight: 8,
    marginTop: 2,
  },
  termsTextContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  checkboxText: {
    fontSize: 14,
  },
  termsLink: {
    fontSize: 14,
    color: '#0066CC',
    fontWeight: '600',
  },
  signupButton: {
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
  signupButtonDisabled: {
    opacity: 0.7,
  },
  signupButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 16,
  },
  loginLink: {
    fontSize: 16,
    color: '#0066CC',
    fontWeight: 'bold',
  },
});

export default Signup;
