import React, { useEffect, useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SafeSpinner from "../components/SafeSpinner";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import apiService from "../lib/apiService";

const PrivacyPolicyScreen = ({ navigation }) => {
  const [privacyUrl, setPrivacyUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];

  useEffect(() => {
    const fetchPrivacyLink = async () => {
      try {
        const response = await fetch(`${apiService.baseURL}/terms`);
        const data = await response.json();
        setPrivacyUrl(data?.privacy);
      } catch (err) {
        console.error("Failed to fetch privacy link:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPrivacyLink();
  }, []);

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
              navigation.navigate("Login"); // or your fallback screen
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
          Privacy Policy
        </Text>
      </View>

      {loading ? (
        <SafeSpinner
          size={42}
          color="#6A0DAD"
          style={{ marginTop: 40 }}
        />
      ) : privacyUrl ? (
        <WebView
          source={{ uri: privacyUrl }}
          startInLoadingState
          renderLoading={() => (
            <SafeSpinner
              size={42}
              color="#6A0DAD"
              style={{ marginTop: 20 }}
            />
          )}
        />
      ) : (
        <Text style={{ padding: 20, color: "red" }}>
          Unable to load Privacy Policy.
        </Text>
      )}
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

export default PrivacyPolicyScreen;
