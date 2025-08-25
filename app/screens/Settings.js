import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from "react-native";
import { useAuth } from "../context/NewAuthContext";
import { useTheme } from "../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

const SettingsScreen = ({ navigation }) => {
  const { userData, userProfile, roleOptions } = useAuth();
  const role = userData?.role;
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];

  const styles = getStyles(currentTheme);

  // Create dynamic profile editing options based on user's profiles
  const getProfileEditingOptions = () => {
    const options = [];
    
    // Add current profile editing option
    if (role === "CLIENT") {
      options.push({ 
        name: "Edit Client Profile", 
        stack_name: "EditClientProfile",
        params: {
          mode: "update",
          profileData: userProfile,
          title: "Edit Client Profile"
        }
      });
    } else if (role === "FREELANCER") {
      options.push({ 
        name: "Edit Freelancer Profile", 
        stack_name: "EditFreelancerProfile",
        params: {
          mode: "update", 
          profileData: userProfile,
          title: "Edit Freelancer Profile"
        }
      });
    }

    return options;
  };

  const handleNavigation = (option) => {
    if (option.stack_name === "EditClientProfile") {
      // Navigate to ClientSignup with update mode and profile data
      navigation.navigate("ClientSignup", option.params);
    } else if (option.stack_name === "EditFreelancerProfile") {
      // Navigate to FreelancerSignup with update mode and profile data
      navigation.navigate("FreelancerSignup", option.params);
    } else {
      // Regular navigation for other options
      navigation.navigate(option.stack_name);
    }
  };

  const settingsData = [
    {
      title: "Account Settings",
      options: [
        { name: "Availability", stack_name: "Availability" },
        ...getProfileEditingOptions(),
        { name: "Password update", stack_name: "Password update" },
        { name: "Change your email", stack_name: "Email update" },
      ],
    },
    {
      title: "Payment Settings",
      options:
        role === "FREELANCER"
          ? [
              { name: "Withdrawal Earning", stack_name: "Withdrawal Earning" },
              {
                name: "Link your wallet/Bank account",
                stack_name: "Bank Account details",
              },
              { name: "Your Wallet & History", stack_name: "WalletFreelancer" },
            ]
          : [
              {
                name: "Link your wallet/Bank account",
                stack_name: "Bank Account details",
              },
              { name: "Your Wallet & History", stack_name: "WalletClient" },
            ],
    },
    {
      title: "Preferences",
      options: [
        { name: "Notifications", stack_name: "Notifications Setting" },
        { name: "Appearance", stack_name: "Appearance" },
        { name: "Security", stack_name: "Security" },
      ],
    },
    {
      title: "About",
      options: [
        { name: "Terms & Conditions", stack_name: "TermsAndConditions" },
        { name: "Feedback", stack_name: "Feedback" },
        { name: "Privacy Policy", stack_name: "PrivacyPolicy" },
        // { name: "Blogs & Forum", stack_name: "BlogsAndForum" },
      ],
    },
    {
      title: "More",
      options: [{ name: "Delete Account", stack_name: "DeleteAccount" }],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.main}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={currentTheme.text || black}
          />
        </TouchableOpacity>
        <Text style={styles.header}>Settings</Text>
      </View>

      {/* Settings List */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {settingsData.map((section, index) => (
          <View key={index} style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.options.map((option, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.optionContainer}
                onPress={() => handleNavigation(option)}
              >
                <Text style={styles.optionText}>{option.name}</Text>
                <Text style={styles.arrowIcon}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (currentTheme) =>
  StyleSheet.create({
    main: {
      marginTop: 15,
      marginBottom: 15,
      display: "flex",
      flexDirection: "row",
      gap: 120,
      alignItems: "center",
      marginHorizontal: Platform.OS === "ios" ? 20 : 0,
    },
    header: {
      fontSize: 24,
      fontWeight: "bold",
      // marginBottom: 20,
      textAlign: "center",
      color: currentTheme.text,
    },
    container: {
      flex: 1,
      backgroundColor: currentTheme.background || "#fff",
      padding: 16,
      paddingTop: 50,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 16,
      color: currentTheme.text || "white",
    },
    scrollView: {
      flex: 1,
      marginHorizontal: Platform.OS==="ios"? 20:0,
    },
    sectionContainer: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: currentTheme.text || "#555",
      marginBottom: 10,
    },
    optionContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 12,
      paddingHorizontal: 10,
      backgroundColor: currentTheme.background3 || "#f0f0f0",
      borderRadius: 8,
      marginBottom: 10,
    },
    optionText: {
      fontSize: 14,
      color: currentTheme.text || "#333",
    },
    arrowIcon: {
      fontSize: 18,
      color: currentTheme.text || "#888",
    },
  });

export default SettingsScreen;
