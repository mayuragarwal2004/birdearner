import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

/** Legacy Appwrite screen — removed. Use ClientChat / FreelancerChat instead. */
const Chat = ({ navigation }) => (
  <View style={styles.container}>
    <Text style={styles.title}>Chat unavailable</Text>
    <Text style={styles.message}>
      This legacy chat screen has been removed with Appwrite. Use the in-app chat from your jobs or inbox.
    </Text>
    <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
      <Text style={styles.buttonText}>Go back</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  title: { fontSize: 18, fontWeight: "600", marginBottom: 8, color: "#111" },
  message: { fontSize: 14, color: "#666", textAlign: "center", marginBottom: 20 },
  button: {
    backgroundColor: "#4B0082",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonText: { color: "#fff", fontWeight: "600" },
});

export default Chat;
