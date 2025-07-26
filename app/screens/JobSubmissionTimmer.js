import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Svg, Circle } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/NewAuthContext";
import apiService from "../lib/apiService";
import { useTheme } from "../context/ThemeContext";

const TOTAL_TIME = 30;

const JobSubmissionTimmerScreen = ({ route, navigation }) => {
  const [seconds, setSeconds] = useState(TOTAL_TIME);
  const [progress, setProgress] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Add loading state
  const { formData } = route.params;
  const { userData, userProfile } = useAuth();

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];

  const styles = getStyles(currentTheme);

  const submitJob = async () => {
    // Prevent multiple submissions
    if (isSubmitting || submitted) {
      console.log("Job submission already in progress or completed");
      return;
    }

    try {
      setIsSubmitting(true); // Set loading state
      await apiService.init(); // Initialize the API service

      // Validate that we have the required profile data
      if (!userProfile || !userProfile.id) {
        console.log("Debug - userData:", userData);
        console.log("Debug - userProfile:", userProfile);
        throw new Error(
          "Client profile not found. Please complete your profile setup."
        );
      }

      let uploadedUrls = [];

      for (let i = 0; i < formData.portfolioImages.length; i++) {
        const response = await apiService.uploadImage(
          formData.portfolioImages[i],
          "job_portfolios"
        );
        console.log({response});
        
        if (response.success) {
          uploadedUrls.push(response.url);
        } else {
          console.log("Error uploading image:", response);
        }
      }

      // Create job data object
      const jobData = {
        jobTitle: formData.jobTitle,
        jobDescription: formData.jobDes,
        jobCategory: formData.freelancerType,
        jobSubCategory: formData.freelancerType, // Using the same value for now
        skillsRequired: formData.skills,
        experienceLevel: "Intermediate", // Default value
        projectType: formData.jobType,
        projectDuration: "1-3 months", // Default value
        budgetType: "Fixed", // Default value
        budgetAmount: parseFloat(formData.budget),
        deadlineDate: new Date(formData.deadline),
        attachedFiles: uploadedUrls, // Send image URIs as is - backend will handle file upload
        location: formData.jobLocation,
      };

      console.log("Debug - Using clientId:", userProfile.id);
      console.log("Debug - Job data being sent:", jobData);

      // Create the job using apiService
      const response = await apiService.createJob(jobData);

      Alert.alert("Success", "Job has been created successfully.");
      navigation.reset({
        index: 0,
        routes: [{ name: "Job Posted" }],
      });
      setSubmitted(true);
    } catch (error) {
      console.error("Error creating job:", error);
      Alert.alert("Error", `Failed to create job: ${error.message}`);
    } finally {
      setIsSubmitting(false); // Reset loading state
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
  }, [seconds, submitted, isSubmitting]); // Add isSubmitting to dependencies

  const handleManualSubmit = () => {
    if (!submitted && !isSubmitting) {
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
        style={[
          styles.submitButton,
          (submitted || isSubmitting) && styles.disabledButton,
        ]}
        onPress={handleManualSubmit}
        disabled={submitted || isSubmitting}
      >
        <Text style={styles.submitButtonText}>
          {isSubmitting ? "Submitting..." : submitted ? "Submitted" : "Submit"}
        </Text>
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
    disabledButton: {
      backgroundColor: "#CCCCCC",
      shadowOpacity: 0,
      elevation: 0,
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
