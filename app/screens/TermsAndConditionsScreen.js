import React, { useEffect, useState } from "react";
import {
  View,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  Text,
  StyleSheet,
} from "react-native";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import apiService from "../lib/apiService";

const TermsAndConditionsScreen = ({ navigation }) => {
  const [termsUrl, setTermsUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];

  useEffect(() => {
    const fetchTermsLink = async () => {
      try {
        const response = await fetch(`${apiService.baseURL}/terms`);
        const data = await response.json();
        console.log({ data });

        setTermsUrl(data?.terms);
      } catch (err) {
        console.error("Failed to fetch terms link:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTermsLink();
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
              navigation.navigate("Login"); // or whatever your home route is named
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

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#6A0DAD"
          style={{ marginTop: 40 }}
        />
      ) : termsUrl ? (
        <WebView
          source={{ uri: termsUrl }}
          startInLoadingState
          renderLoading={() => (
            <ActivityIndicator
              size="large"
              color="#6A0DAD"
              style={{ marginTop: 20 }}
            />
          )}
        />
      ) : (
        <Text style={{ padding: 20, color: "red" }}>
          Unable to load Terms and Conditions.
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
    paddingTop: 45,
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
