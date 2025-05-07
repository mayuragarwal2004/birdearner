import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useAppwrite } from "../context/AppwriteContext";

const AvailabilityScreen = ({ navigation }) => {
  const [offlineDuration, setOfflineDuration] = useState("1 hour");
  const { userData } = useAuth();
  const availability = userData?.currently_available
  const [selectedStatus, setSelectedStatus] = useState(availability);
  const freelancerId = userData.$id
  const { appwriteConfig, databases } = useAppwrite();

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];

  const styles = getStyles(currentTheme);

  const handleStatusChange = async (status) => {
    setSelectedStatus(status);

    try {
      if (userData.role === "client") {
        await databases.updateDocument(
          appwriteConfig.databaseId,
          appwriteConfig.clientCollectionId,
          freelancerId,
          {
            currently_available: status,
          }
        );
      } else {
        await databases.updateDocument(
          appwriteConfig.databaseId,
          appwriteConfig.freelancerCollectionId,
          freelancerId,
          {
            currently_available: status,
          }
        );
      }

    } catch (error) {
      Alert.alert("Error updating availability:", error)
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.main}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={currentTheme.text || "black"} />
        </TouchableOpacity>
        <Text style={styles.header}>Availability</Text>
      </View>

      {/* Radio Button: Online */}
      <View style={styles.radioContainer}>
        <TouchableOpacity
          style={[
            styles.radioButton,
            selectedStatus === true && styles.radioSelected,
          ]}
          onPress={() => handleStatusChange(true)}
        >
          {selectedStatus === true && <View style={styles.radioInner} />}
        </TouchableOpacity>
        <Text style={styles.radioText}>Online</Text>
      </View>

      {/* Radio Button: Offline */}
      <View style={styles.radioContainer}>
        <TouchableOpacity
          style={[
            styles.radioButton,
            selectedStatus === false && styles.radioSelected,
          ]}
          onPress={() => handleStatusChange(false)}
        >
          {selectedStatus === false && <View style={styles.radioInner} />}
        </TouchableOpacity>
        <Text style={styles.radioText}>Offline for</Text>
        {/* Dropdown for Offline Duration */}
        {selectedStatus === false && (
          <Picker
            selectedValue={offlineDuration}
            onValueChange={(itemValue) => setOfflineDuration(itemValue)}
            style={[styles.picker, { color: currentTheme.text }]}
            dropdownIconColor={currentTheme.text}
            mode="dropdown"
          >
            <Picker.Item label="1 hour" value="1 hour" style={styles.pickerItem} />
            <Picker.Item label="1 day" value="1 day" style={styles.pickerItem} />
            <Picker.Item label="1 week" value="1 week" style={styles.pickerItem} />
            <Picker.Item label="Forever" value="forever" style={styles.pickerItem} />
          </Picker>
        )}
      </View>

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
      gap: 100,
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
      paddingHorizontal: 20
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
      color: currentTheme.text || "#333",
      marginRight: 10,
    },
    picker: {
      flex: 1,
      marginLeft: 10,
      marginRight: 40,
      backgroundColor: currentTheme.background,
      borderRadius: 12
    },
    pickerItem: {
      color: currentTheme.text,
      backgroundColor: currentTheme.background,
    },
    selectedText: {
      fontSize: 16,
      color: "#333",
      marginTop: 20,
      fontStyle: "italic",
      paddingHorizontal: 20
    },
  });

export default AvailabilityScreen;
