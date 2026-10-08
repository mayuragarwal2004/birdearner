import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import PrivacyPolicyContent from "../components/PrivacyPolicyContent";

const TermsAndConditionsScreen = ({ navigation }) => {
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: currentTheme.background2 || "#fff" },
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate("Login");
            }
          }}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={currentTheme.text || "#000"}
          />
        </TouchableOpacity>
        <Text style={[styles.title, { color: currentTheme.text || "#000" }]}>
          Terms & Conditions
        </Text>
      </View>

      <PrivacyPolicyContent />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
});

export default TermsAndConditionsScreen;
