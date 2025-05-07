import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Query } from "react-native-appwrite";
import { useAppwrite } from "../context/AppwriteContext";

const DeleteAccountScreen = ({ navigation }) => {
  const { userData } = useAuth();
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const { appwriteConfig, databases } = useAppwrite();

  const styles = getStyles(currentTheme);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingRequest, setExistingRequest] = useState(null);
  console.log(appwriteConfig.deleteRequestsCollectionId);
  

  const handleDeleteRequest = async () => {
    try {
      setIsSubmitting(true);
      await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.deleteRequestsCollectionId, // make sure you have this in config
        "unique()",
        {
          userId: userData?.$id,
          email: userData?.email,
          full_name: userData?.full_name,
          requestedAt: new Date().toISOString(),
        }
      );
      Alert.alert(
        "Request Submitted",
        "Your account deletion request has been submitted. We may contact you before proceeding."
      );
      navigation.goBack();
    } catch (err) {
      console.error("Delete request error:", err);
      Alert.alert("Error", "Failed to submit delete request. Try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const checkExistingRequest = async () => {
      try {
        const response = await databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.deleteRequestsCollectionId,
          [
            Query.equal("userId", userData?.$id),
            Query.notEqual("status", "closed"), // pending or reviewing
          ]
        );
        if (response.total > 0) {
          setExistingRequest(response.documents[0]);
        }
      } catch (err) {
        console.error("Failed to check existing delete request:", err);
      }
    };

    if (userData?.$id) checkExistingRequest();
  }, [userData]);

  const confirmDelete = () => {
    Alert.alert(
      "Are you sure?",
      "Deleting your account is irreversible.\n\n• It may take 5–10 business days or more.\n• We might contact you before deleting.\n• Your data will be permanently lost.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Submit Request", onPress: handleDeleteRequest },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Ionicons
          name="arrow-back"
          size={24}
          color={currentTheme.text || "#000"}
        />
      </TouchableOpacity>

      <Text style={styles.header}>Delete Account</Text>
      <Text style={styles.infoText}>
        We're sad to see you go. Before you proceed:
      </Text>
      <Text style={styles.bullet}>
        • It may take up to 5–10 business days or more.
      </Text>
      <Text style={styles.bullet}>• We might contact you before deletion.</Text>
      <Text style={styles.bullet}>• This action is permanent.</Text>

      {existingRequest && (
        <Text
          style={{ color: "#FFA500", textAlign: "center", marginVertical: 15 }}
        >
          You already have a pending deletion request submitted on{" "}
          {new Date(existingRequest.requestedAt).toLocaleDateString()}. We'll
          contact you soon.
        </Text>
      )}

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={confirmDelete}
        disabled={isSubmitting}
      >
        <Text style={styles.deleteButtonText}>
          {isSubmitting ? "Submitting..." : "Request Account Deletion"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const getStyles = (currentTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      paddingHorizontal: 40,
      backgroundColor: currentTheme.background,
      alignItems: "center",
    },
    backButton: {
      alignSelf: "flex-start",
      marginTop: 45,
      marginBottom: 30,
    },
    header: {
      fontSize: 24,
      fontWeight: "bold",
      color: currentTheme.text,
      marginBottom: 20,
    },
    infoText: {
      fontSize: 16,
      color: currentTheme.subText,
      textAlign: "center",
      marginBottom: 20,
    },
    bullet: {
      fontSize: 15,
      color: currentTheme.text,
      marginBottom: 10,
      alignSelf: "flex-start",
    },
    deleteButton: {
      marginTop: 40,
      backgroundColor: "#D00000",
      paddingVertical: 15,
      paddingHorizontal: 25,
      borderRadius: 12,
      width: "80%",
      alignItems: "center",
    },
    deleteButtonText: {
      color: "#fff",
      fontSize: 18,
      fontWeight: "600",
    },
  });

export default DeleteAccountScreen;
