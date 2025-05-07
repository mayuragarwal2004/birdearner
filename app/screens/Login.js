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
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import Toast from "react-native-toast-message";
import { useAppwrite } from "../context/AppwriteContext";
import { useTheme } from "../context/ThemeContext";

const Login = ({ navigation }) => {
  const { initAppwrite } = useAppwrite();
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const { login } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

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

    try {
      await login(credentials.email, credentials.password);
      showToast("success", "Login Successful!", "Redirecting to Home...");
      navigation.reset({
        index: 0,
        routes: [{ name: "Tabs" }],
      });
    } catch (error) {
      console.log("Login Error:", error.message);

      let errorMessage = "An unexpected error occurred.";

      if (error.message.includes("Invalid email or password")) {
        errorMessage = "Incorrect email or password. Please try again.";
      } else if (error.message.includes("Invalid `password` param")) {
        errorMessage = "Password must be between 8 and 256 characters long.";
      }

      showToast("error", "Login Failed", errorMessage);
    }
  };

  const onRefresh = () => {
    console.log("Refreshing...");
    initAppwrite();

    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#4B0082" }}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#3b006b"]}
            progressBackgroundColor={currentTheme.cardBackground || "#fff"}
          />
        }
      >
        <View style={styles.container}>
          {/* Logo */}
          <Image source={require("../assets/logo11.png")} style={styles.logo} />

          {/* App Name */}
          <Text style={styles.title}>BirdEARNER</Text>
          <Text style={styles.subtitle}>
            Be BirdEARNER, Become Bread Earner!
          </Text>

          {/* Inputs */}
          {["email", "password"].map((field, index) => (
            <TextInput
              key={index}
              style={styles.input}
              placeholder={
                field === "email" ? "yourname@gmail.com" : "********"
              }
              placeholderTextColor="#999"
              keyboardType={field === "email" ? "email-address" : "default"}
              secureTextEntry={field === "password"}
              value={credentials[field]}
              onChangeText={(value) => handleInputChange(field, value)}
            />
          ))}

          {/* Login Button */}
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Log In</Text>
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
              <Text style={styles.linkText}>{link.text}</Text>
            </TouchableOpacity>
          ))}

          {/* Google Login */}
          {/* <TouchableOpacity style={styles.googleButton}>
        <FontAwesome name="google" size={24} color="black" />
        <Text style={styles.googleButtonText}>Log in with Google</Text>
      </TouchableOpacity> */}

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
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    minHeight: '100%', // this is key!
    backgroundColor: "#4B0082",
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
    color: "white",
  },
  subtitle: {
    fontSize: 16,
    color: "white",
    marginBottom: 40,
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
    marginBottom: 20,
  },
  loginButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  linkText: {
    color: "white",
    marginVertical: 10,
    fontSize: 14,
    textDecorationLine: "underline",
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    width: "100%",
    height: 50,
    borderRadius: 12,
    marginTop: 20,
  },
  googleButtonText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#000",
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
