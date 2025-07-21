import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { PanResponder, Animated } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/NewAuthContext";
import apiService from "../lib/apiService";
import Toast from "react-native-toast-message";

const colors = {
  Immediate: ["#E22323", "#7C1313"],
  High: ["#896D08", "#EFBE0E"],
  Standard: ["#34660C", "#77CB35"],
};

const priorities = ["Immediate", "High", "Standard"];

const JobPriority = ({ navigation, route }) => {
  const { userData } = useAuth();

  const [rotation] = useState(new Animated.Value(0)); // Handle rotation animation

  const { priority, jobs } = route.params;
  console.log({ priority, jobs });

  const [priorityJob, setPriorityJob] = useState([]);
  const [clientProfiles, setClientProfiles] = useState({});
  const [clientName, setClientName] = useState({});
  const [loading, setLoading] = useState(false);

  // Use the priority value from route.params
  const currentPriority = priority;
  const currentColors = colors[currentPriority] || ["#000", "#333"];

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];

  const styles = getStyles(currentTheme);

  // Toast helper
  const showToast = (type, text1, text2) => {
    Toast.show({ type, text1, text2, position: "top" });
  };

  useEffect(() => {
    if (currentPriority === "Immediate") {
      const selectedJobs = jobs.Immediate || [];
      setPriorityJob(selectedJobs);
    } else if (currentPriority === "High") {
      const selectedJobs = jobs.High || [];
      setPriorityJob(selectedJobs);
    } else if (currentPriority === "Standard") {
      const selectedJobs = jobs.Standard || [];
      setPriorityJob(selectedJobs);
    }
  }, [currentPriority]);

  const formatDeadline = (deadline) => {
    try {
      if (!deadline) return "No deadline";

      const currentDate = new Date();
      let deadlineDate;

      // Handle different date formats that might come from the backend
      if (deadline instanceof Date) {
        deadlineDate = deadline;
      } else if (typeof deadline === "string") {
        // Try parsing the date string
        deadlineDate = new Date(deadline);

        // Check if the date is valid
        if (isNaN(deadlineDate.getTime())) {
          console.log("Invalid date format:", deadline);
          return "Invalid date";
        }
      } else {
        console.log("Unknown deadline format:", deadline);
        return "Unknown format";
      }

      const timeDiff = Math.ceil(
        (deadlineDate - currentDate) / (1000 * 60 * 60 * 24)
      );
      return timeDiff > 0 ? `${timeDiff} days` : "Deadline passed";
    } catch (error) {
      console.error("Error formatting deadline:", error);
      return "Date error";
    }
  };

  const formatBudget = (budget) => {
    return budget >= 1000
      ? `${(budget / 1000).toFixed(budget % 1000 === 0 ? 0 : 1)}k`
      : `${budget}`;
  };

  const renderJobItem = ({ item: job }) => {
    // Use job.client object directly for client info
    const client = job.client || {};
    const clientProfileImage =
      client.profilePhoto ||
      "https://via.placeholder.com/95x95/CCCCCC/666666?text=User";
    const full_name =
      client.user?.fullName || client.companyName || "Unknown User";

    // Handle different possible field names for job data
    const jobTitle = job.jobTitle || job.title || job.name || "Untitled Job";
    const jobBudget = job.budgetAmount || job.budget || job.price || 0;
    const jobDeadline = job.deadlineDate || job.deadline || job.due_date;
    const jobDescription =
      job.jobDescription ||
      job.description ||
      job.details ||
      "No description available";
    const jobId = job.id || job.job_id || job._id;

    console.log({ clientProfileImage });

    return (
      <TouchableOpacity
        style={styles.jobCard}
        onPress={() => {
          navigation.navigate("JobDescription", {
            job: {
              ...job,
              // Ensure consistent field names for JobDescription screen
              id: jobId,
              title: jobTitle,
              budget: jobBudget,
              deadline: jobDeadline,
              description: jobDescription,
              clientId: client.companyName,
              client: client,
            },
            clientProfileImage,
            full_name,
          });
        }}
      >
        {/* Displaying the client's profile image */}
        <Image
          source={
            clientProfileImage
              ? { uri: clientProfileImage }
              : require("../assets/profile.png")
          }
          style={styles.profileImage}
          onError={() => {
            console.log("Failed to load profile image for:", full_name);
          }}
        />
        <View style={{ flex: 1, paddingVertical: 2 }}>
          <Text style={styles.jobTitle} numberOfLines={2}>
            {jobTitle}
          </Text>
          <Text style={styles.jobDetails}>
            Budget: ₹{formatBudget(jobBudget)} • Deadline:{" "}
            {formatDeadline(jobDeadline)}
          </Text>
          <Text style={styles.jobDescription} numberOfLines={2}>
            {jobDescription}
          </Text>
          {/* Show client info */}
          {/* <Text style={styles.jobDetails}>
            {client.companyName} • {client.organizationType}
          </Text>
          <Text style={styles.jobDetails}>
            {client.user?.fullName}
          </Text> */}
        </View>
      </TouchableOpacity>
    );
  };

  const handleRotation = (direction) => {
    const newIndex =
      direction === "left"
        ? (currentIndex + 1) % priorities.length
        : (currentIndex - 1 + priorities.length) % priorities.length;

    setCurrentIndex(newIndex);

    Animated.timing(rotation, {
      toValue: direction === "left" ? -180 : 180,
      duration: 300,
      useNativeDriver: true,
    }).start(() => rotation.setValue(0));
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx > 50) {
        handleRotation("right"); // Swipe right
      } else if (gestureState.dx < -50) {
        handleRotation("left"); // Swipe left
      }
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>JOBS</Text>

      <View style={styles.priorityContainer}>
        <TouchableOpacity>
          <LinearGradient
            colors={currentColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.priorityButton}
          >
            <Text style={styles.priorityText}>
              {currentPriority}{" "}
              {currentPriority === "Immediate" ? "Attention" : "Priority"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <FlatList
        data={priorityJob}
        renderItem={renderJobItem}
        keyExtractor={(item, index) => {
          // Handle different possible ID field names
          const jobId = item.id || item.job_id || item._id;
          return jobId ? `${jobId}_${index}` : `job_${index}`;
        }}
        contentContainerStyle={{ paddingBottom: 20 }}
        style={{ flex: 1, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No {currentPriority.toLowerCase()} priority jobs available
            </Text>
          </View>
        )}
      />

      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.allJobsContainer,
          {
            transform: [
              {
                rotate: rotation.interpolate({
                  inputRange: [-180, 180],
                  outputRange: ["-180deg", "180deg"],
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={currentColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.allJobsCircle}
        >
          <TouchableOpacity
            style={styles.allJobsContent}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.allJobsText}>{currentPriority}</Text>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>

      <Toast />
    </SafeAreaView>
  );
};

const getStyles = (currentTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background || "#fff",
      paddingTop: 45,
      paddingBottom: 70,
    },
    scrollContent: {
      padding: 20,
      height: 743,
    },
    title: {
      fontSize: 22,
      fontWeight: "normal",
      textAlign: "center",
      marginBottom: 15,
      color: "#988C8C",
    },
    priorityContainer: {
      alignItems: "center",
      // marginBottom: 20,
    },
    priorityButton: {
      width: 355,
      padding: 8,
      alignItems: "center",
      display: "flex",
      justifyContent: "center",
      flexDirection: "row",
      gap: 7,
      borderBottomRightRadius: 30,
      borderTopLeftRadius: 30,
    },
    priorityText: {
      fontSize: 22,
      fontWeight: "500",
      color: "#fff",
    },
    prioritySubText: {
      color: "#fff",
      fontSize: 14,
    },
    jobsAround: {
      fontSize: 20,
      fontWeight: "bold",
      textAlign: "center",
      marginVertical: 10,
    },
    jobCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: currentTheme.cardBackground || "#f5f5f5",
      // padding: 15,
      borderTopLeftRadius: 100,
      borderBottomLeftRadius: 100,
      borderBottomRightRadius: 10,
      borderTopRightRadius: 10,
      marginVertical: 10,
      shadowColor: currentTheme.shadow || "#000",
      shadowOpacity: 0.1,
      shadowRadius: 5,
      shadowOffset: { width: 0, height: 2 },
      elevation: 3,
    },
    profileImage: {
      width: 95,
      height: 95,
      borderRadius: 100,
      marginRight: 10,
    },
    jobTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: currentTheme.text,
    },
    jobDetails: {
      fontSize: 14,
      color: currentTheme.subText || "#666",
    },
    jobDescription: {
      fontSize: 12,
      color: currentTheme.subText || "#999",
      flexShrink: 1,
    },
    allJobsContainer: {
      width: 450,
      height: 450,
      borderRadius: 300,
      position: "absolute",
      bottom: -380,
      right: -30,
      overflow: "hidden",
    },
    allJobsCircle: {
      flex: 1,
      justifyContent: "flex-start",
      alignItems: "center",
    },
    allJobsContent: {
      justifyContent: "flex-start",
      alignItems: "center",
      width: "80%",
      height: "80%",
    },
    allJobsText: {
      color: "#fff",
      fontSize: 20,
      fontWeight: "500",
      textAlign: "center",
      marginTop: 20,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingTop: 50,
    },
    emptyText: {
      fontSize: 16,
      color: currentTheme.subText || "#666",
      textAlign: "center",
      fontStyle: "italic",
    },
  });

export default JobPriority;
