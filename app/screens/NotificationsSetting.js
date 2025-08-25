import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useTheme } from "../context/ThemeContext";

const NotificationsSettingScreen = ({ navigation }) => {
  const [selectedStatus, setSelectedStatus] = useState("Enable");

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];

  const styles = getStyles(currentTheme);

  // Function to handle the selected option (Online/Offline)
  const handleStatusChange = (status) => {
    setSelectedStatus(status);
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
        <Text style={styles.header}>Notifications</Text>
      </View>

      <View style={styles.radioContainer}>
        <TouchableOpacity
          style={[
            styles.radioButton,
            selectedStatus === "Enable" && styles.radioSelected,
          ]}
          onPress={() => handleStatusChange("Enable")}
        >
          {selectedStatus === "Enable" && <View style={styles.radioInner} />}
        </TouchableOpacity>
        <Text style={styles.radioText}>Enable</Text>
      </View>

      <View style={styles.radioContainer}>
        <TouchableOpacity
          style={[
            styles.radioButton,
            selectedStatus === "Disable" && styles.radioSelected,
          ]}
          onPress={() => handleStatusChange("Disable")}
        >
          {selectedStatus === "Disable" && <View style={styles.radioInner} />}
        </TouchableOpacity>
        <Text style={styles.radioText}>Disable</Text>
      </View>

      {selectedStatus === "Disable" && (
        <View style={styles.warningBox}>
          <Ionicons name="warning" size={24} color="#FF6B6B" style={styles.warningIcon} />
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>Important Notice</Text>
            <Text style={styles.warningText}>
              By disabling notifications, you will miss important alerts about new job opportunities, 
              status updates, and earnings notifications. This may affect your ability to respond 
              quickly to time-sensitive job postings.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const getStyles = (currentTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: currentTheme.background || "#FFF",
    },
    main: {
      marginTop: 45,
      marginBottom: 50,
      display: "flex",
      flexDirection: "row",
      gap: 90,
      alignItems: "center",
    },
    header: {
      fontSize: 24,
      fontWeight: "bold",
      // marginBottom: 20,
      textAlign: "center",
      color: currentTheme.text
    },
    radioContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 10,
      paddingHorizontal: 20,
    },
    radioButton: {
      height: 20,
      width: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: "#4B0082",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
    },
    radioSelected: {
      backgroundColor: "#4B0082",
    },
    radioInner: {
      height: 10,
      width: 10,
      borderRadius: 5,
      backgroundColor: "#FFFFFF",
    },
    radioText: {
      fontSize: 16,
      color: currentTheme.subText || "#333",
      marginRight: 10,
    },
    picker: {
      flex: 1,
      marginLeft: 10,
      marginRight: 40,
    },
    selectedText: {
      fontSize: 16,
      color: "#333",
      marginTop: 20,
      fontStyle: "italic",
      paddingHorizontal: 20,
    },
    warningBox: {
      flexDirection: "row",
      alignItems: "flex-start",
      backgroundColor: "#FFF5F5",
      borderColor: "#FF6B6B",
      borderWidth: 1,
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 20,
      marginTop: 20,
      shadowColor: "#FF6B6B",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      width: "auto",
      maxWidth: "100%",
    },
    warningIcon: {
      marginRight: 12,
      marginTop: 2,
    },
    warningContent: {
      flex: 1,
      flexShrink: 1,
    },
    warningTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: "#E53E3E",
      marginBottom: 6,
    },
    warningText: {
      fontSize: 14,
      color: "#C53030",
      lineHeight: 20,
      fontWeight: "400",
      flexWrap: "wrap",
      textAlign: "left",
    },
  });

export default NotificationsSettingScreen;
