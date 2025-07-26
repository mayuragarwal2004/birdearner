import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/NewAuthContext";
import apiService from "../lib/apiService";
import Toast from "react-native-toast-message";

const AvailabilityScreen = ({ navigation }) => {
  const [offlineDuration, setOfflineDuration] = useState("1 hour");
  const { userData, refreshUserData } = useAuth();
  const availability =
    userData?.role === "FREELANCER"
      ? userData?.freelancer?.currentlyAvailable
      : userData?.client?.currentlyAvailable;
  const [selectedStatus, setSelectedStatus] = useState(availability);
  const [refreshing, setRefreshing] = useState(false);

  console.log({ selectedStatus, userData });

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];

  const styles = getStyles(currentTheme);

  const handleStatusChange = async (status) => {
    console.log({ status });
    setSelectedStatus(status);
    try {
      if (userData.role === "FREELANCER") {
        await apiService.updateUserAvailability(
          userData.id,
          "FREELANCER",
          status
        );
      } else if (userData.role === "CLIENT") {
        await apiService.updateUserAvailability(userData.id, "CLIENT", status);
      }
    } catch {
      Toast.show({
        type: "error",
        text1: "Error updating availability",
        text2: "Please try again later",
      });
    }
  };
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshUserData(); // Your context method to refresh data
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Failed to refresh",
        text2: "Please try again later",
      });
    } finally {
      setRefreshing(false);
    }
  };
  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.container}>
        <View style={styles.main}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={currentTheme.text || "black"}
            />
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
          <Text style={styles.radioText}>Offline</Text>
          {/* Dropdown for Offline Duration */}
          {/* TODO */}
          {selectedStatus === false && false && (
            <Picker
              selectedValue={offlineDuration}
              onValueChange={(itemValue) => setOfflineDuration(itemValue)}
              style={[styles.picker, { color: currentTheme.text }]}
              dropdownIconColor={currentTheme.text}
              mode="dropdown"
            >
              <Picker.Item
                label="1 hour"
                value="1 hour"
                style={styles.pickerItem}
              />
              <Picker.Item
                label="1 day"
                value="1 day"
                style={styles.pickerItem}
              />
              <Picker.Item
                label="1 week"
                value="1 week"
                style={styles.pickerItem}
              />
              <Picker.Item
                label="Forever"
                value="forever"
                style={styles.pickerItem}
              />
            </Picker>
          )}
        </View>
      </View>
    </ScrollView>
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
      color: currentTheme.text,
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
      color: currentTheme.text || "#333",
      marginRight: 10,
    },
    picker: {
      flex: 1,
      marginLeft: 10,
      marginRight: 40,
      backgroundColor: currentTheme.background,
      borderRadius: 12,
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
      paddingHorizontal: 20,
    },
  });

export default AvailabilityScreen;
