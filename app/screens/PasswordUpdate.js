import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { account, appwriteConfig, databases } from "../lib/appwrite";
import { useTheme } from "../context/ThemeContext";

const PasswordUpdateScreen = ({ navigation }) => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];

  const styles = getStyles(currentTheme);

  const handlePasswordUpdate = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    // Check if new password and confirm password match
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New password and confirm password do not match.");
      return;
    }

    try {
      // Update password in Appwrite
      await account.updatePassword(newPassword, oldPassword);

      Alert.alert("Success", "Password updated successfully.");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "Failed to update password. Please check your current password and try again.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.main}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={currentTheme.text || black} />
        </TouchableOpacity>
        <Text style={styles.header}>Password update</Text>
      </View>

      <Text style={styles.label}>Enter your current password</Text>
      <TextInput
        style={styles.input}
        placeholder="Current Password"
        value={oldPassword}
        onChangeText={setOldPassword}
        secureTextEntry={true}
      />

      <Text style={styles.label}>Enter your new password</Text>
      <TextInput
        style={styles.input}
        placeholder="New Password"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry={true}
      />

      {/* Confirm Password Input */}
      <Text style={styles.label}>Confirm your new password</Text>
      <TextInput
        style={styles.input}
        placeholder="Confirm New Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry={true}
      />

      <TouchableOpacity style={styles.signupButton} onPress={handlePasswordUpdate} >
        <Text style={styles.signupButtonText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
};

const getStyles = (currentTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: currentTheme.background || "#FFF",
      paddingHorizontal: 30
    },
    main: {
      marginTop: 45,
      marginBottom: 50,
      display: "flex",
      flexDirection: "row",
      gap: 60,
      alignItems: "center",
    },
    header: {
      fontSize: 24,
      fontWeight: "bold",
      // marginBottom: 20,
      textAlign: "center",
      color: currentTheme.text
    },
    label: {
      fontSize: 18,
      color: currentTheme.text || "#000000",
      marginBottom: 8,
      // marginLeft: 8,
      fontWeight: "400",
      textAlign: "center",
    },
    input: {
      width: "100%",
      height: 44,
      backgroundColor: currentTheme.background3 || "#f4f0f0",
      borderRadius: 12,
      paddingHorizontal: 20,
      marginBottom: 20,
      fontSize: 16,
      color: currentTheme.subText || "#000000",
    },
    signupButton: {
      width: "40%",
      height: 50,
      backgroundColor: currentTheme.primary || "#6A0DAD",
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 20,
      margin: "auto"
    },
    signupButtonText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 20,
    },
  });

export default PasswordUpdateScreen;
