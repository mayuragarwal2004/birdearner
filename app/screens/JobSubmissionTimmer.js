import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Svg, Circle } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useAppwrite } from "../context/AppwriteContext";
import { ID } from "react-native-appwrite";
import { useTheme } from "../context/ThemeContext";

const TOTAL_TIME = 30;

const JobSubmissionTimmerScreen = ({ route, navigation }) => {
  const { appwriteConfig, databases, uploadFile } = useAppwrite();
  const [seconds, setSeconds] = useState(TOTAL_TIME);
  const [progress, setProgress] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const { formData } = route.params;
  const { userData } = useAuth();

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];

  const styles = getStyles(currentTheme);

  const submitJob = async () => {
    try {
      const userDocumentId = userData.$id;

      // Upload each image and get URLs
      const uploadedImageURLs = await Promise.all(
        formData.portfolioImages.map(async (imageUri) => {
          const fileResponse = await uploadFile({ uri: imageUri }, "image");
          return fileResponse;
        })
      );

      // Create job document
      await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.jobCollectionID,
        ID.unique(),
        {
          title: formData.jobTitle,
          description: formData.jobDes,
          budget: parseInt(formData.budget, 10),
          location: formData.jobLocation,
          skills: formData.skills,
          deadline: formData.deadline,
          attached_files: uploadedImageURLs,
          freelancer_type: formData.freelancerType,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          job_created_by: userDocumentId,
          latitude: formData.latitude,
          longitude: formData.longitude,
          jobType: formData.jobType,
        }
      );

      Alert.alert("Success", "Job has been created successfully.");
      navigation.reset({
        index: 0,
        routes: [{ name: "Job Posted" }],
      });
      setSubmitted(true);
    } catch (error) {
      Alert.alert("Error", `Failed to update details: ${error.message}`);
    }
  };

  useEffect(() => {
    // Countdown timer effect
    if (seconds > 0) {
      const interval = setInterval(() => {
        setSeconds((prev) => prev - 1);
        setProgress((prev) => prev - 1 / TOTAL_TIME);
      }, 1000);

      return () => clearInterval(interval);
    }

    if (!submitted) {
      submitJob();
    }
  }, [seconds, submitted]);

  const handleManualSubmit = () => {
    if (!submitted) {
      submitJob();
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const strokeDashoffset = 251.2 * (1 - progress);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={navigation.goBack} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="black" />
      </TouchableOpacity>
      <Text style={styles.header}>Job Submission</Text>

      <View style={styles.timerWrapper}>
        <Svg width="150" height="150" viewBox="0 0 100 100">
          <Circle
            cx="50"
            cy="50"
            r="40"
            stroke="#ddd"
            strokeWidth="10"
            fill="none"
          />
          <Circle
            cx="50"
            cy="50"
            r="40"
            stroke="#4B0082"
            strokeWidth="10"
            strokeDasharray="251.2"
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
            rotation="-90"
            origin="50, 50"
          />
        </Svg>
        <Text style={styles.timerText}>{seconds}</Text>
      </View>

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleManualSubmit}
        disabled={submitted}
      >
        <Text style={styles.submitButtonText}>Submit</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleCancel}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
};

const getStyles = (currentTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background || "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 20,
    },
    backButton: {
      position: "absolute",
      top: 40,
      left: 20,
    },
    header: {
      fontSize: 24,
      fontWeight: "bold",
      color: "#5A4CAE",
      marginBottom: 40,
    },
    timerWrapper: {
      width: 150,
      height: 150,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 30,
    },
    timerText: {
      position: "absolute",
      fontSize: 32,
      fontWeight: "bold",
      color: "#5A4CAE",
    },
    submitButton: {
      backgroundColor: "#4B0082",
      paddingVertical: 10,
      paddingHorizontal: 40,
      borderRadius: 20,
      marginBottom: 15,
      shadowColor: "#000000",
      shadowOffset: {
        width: 0,
        height: 3,
      },
      shadowOpacity: 0.17,
      shadowRadius: 3.05,
      elevation: 4,
    },
    submitButtonText: {
      color: "#FFFFFF",
      fontSize: 18,
      fontWeight: "bold",
    },
    cancelText: {
      color: "#6D6D6D",
      fontSize: 16,
    },
  });

export default JobSubmissionTimmerScreen;
