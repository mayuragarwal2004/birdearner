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
import { useAuth } from "../context/AuthContext";
import { account, appwriteConfig, databases } from "../lib/appwrite";

const EmailUpdateScreen = ({ navigation }) => {
  const [newEmail, setNewEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [password, setPassword] = useState("");

  const { userData, setUser } = useAuth();

  const handleEmailUpdate = async () => {
    if (!newEmail || !confirmEmail || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (newEmail !== confirmEmail) {
      Alert.alert("Error", "New email and confirm email do not match");
      return;
    }

    try {

      // Update the email in Appwrite
      await account.updateEmail(newEmail, password);

      // Update the email in the relevant Appwrite database collection
      if (userData?.role === "client") {
        await databases.updateDocument(
          appwriteConfig.databaseId,
          appwriteConfig.clientCollectionId,
          userData.$id,
          {
            email: confirmEmail,
          }
        );
      } else {
        await databases.updateDocument(
          appwriteConfig.databaseId,
          appwriteConfig.freelancerCollectionId,
          userData.$id,
          {
            email: confirmEmail,
          }
        );
      }

      // Update the user session data
      const session = await account.get();
      setUser(session);

      Alert.alert("Success", "Email updated successfully");
      navigation.goBack();
    } catch (error) {
      console.error("Error updating email:", error);
      Alert.alert("Error", "Failed to update email. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.main}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.header}>Change your email</Text>
      </View>


      {/* Password Input */}
      <Text style={styles.label}>Enter your new email address</Text>
      <TextInput
        style={styles.input}
        placeholder=""
        value={newEmail}
        onChangeText={setNewEmail}
        keyboardType="email-address"
      />

      {/* Confirm Password Input */}
      <Text style={styles.label}>Confirm your new email address</Text>
      <TextInput
        style={styles.input}
        placeholder=""
        value={confirmEmail}
        onChangeText={setConfirmEmail}
        keyboardType="email-address"
      />

      <Text style={styles.label}>Enter your password</Text>
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.signupButton} onPress={handleEmailUpdate}>
        <Text style={styles.signupButtonText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#FFF",
    paddingHorizontal: 30,
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
  },
  label: {
    fontSize: 18,
    color: "#000000",
    marginBottom: 8,
    // marginLeft: 8,
    fontWeight: "400",
    textAlign: "center",
  },
  input: {
    width: "100%",
    height: 44,
    backgroundColor: "#f4f0f0",
    borderRadius: 12,
    paddingHorizontal: 20,
    marginBottom: 20,
    fontSize: 16,
  },
  signupButton: {
    width: "40%",
    height: 50,
    backgroundColor: "#6A0DAD",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    margin: "auto",
  },
  signupButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },
});

export default EmailUpdateScreen;
