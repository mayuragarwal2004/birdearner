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
import { useAppwrite } from "../context/AppwriteContext";
import { useTheme } from "../context/ThemeContext";

const colors = {
  Immediate: ["#E22323", "#7C1313"],
  High: ["#896D08", "#EFBE0E"],
  Standard: ["#34660C", "#77CB35"],
};

const priorities = ["Immediate", "High", "Standard"];

const JobPriority = ({ navigation, route }) => {
  const { appwriteConfig, databases } = useAppwrite();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [rotation] = useState(new Animated.Value(0)); // Handle rotation animation

  const { priority, jobs } = route.params;

  const [priorityJob, setPriorityJob] = useState([]);
  const [clientProfiles, setClientProfiles] = useState({});
  const [clientName, setClientName] = useState({});

  // const currentColors = colors[priority] || ["#000", "#333"];

  const currentColors = colors[priorities[currentIndex]] || ["#000", "#333"];
  const currentPriority = priorities[currentIndex];

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];

  const styles = getStyles(currentTheme);

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

  useEffect(() => {
    priorityJob.forEach((job) => {
      getProfile(job.job_created_by);
    });
  }, [priorityJob]);

  const getProfile = async (id) => {
    try {
      const response = await databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.clientCollectionId,
        id
      );
      const profile = response;
      setClientProfiles((prevProfiles) => ({
        ...prevProfiles,
        [id]: profile.profile_photo,
      }));

      setClientName((prevProfiles) => ({
        ...prevProfiles,
        [id]: profile.full_name,
      }));
    } catch (error) {
      Alert.alert("Error fetching client profile:", error);
    }
  };

  const formatDeadline = (deadline) => {
    const currentDate = new Date();
    const deadlineDate = new Date(deadline);
    const timeDiff = Math.ceil(
      (deadlineDate - currentDate) / (1000 * 60 * 60 * 24)
    );
    return timeDiff > 0 ? `${timeDiff} days` : "Deadline passed";
  };

  const formatBudget = (budget) => {
    return budget >= 1000
      ? `${(budget / 1000).toFixed(budget % 1000 === 0 ? 0 : 1)}k`
      : `${budget}`;
  };

  const renderJobItem = ({ item: job }) => {
    const clientProfileImage = clientProfiles[job.job_created_by];
    const full_name = clientName[job.job_created_by];

    return (
      <TouchableOpacity
        style={styles.jobCard}
        onPress={() => {
          navigation.navigate("JobDescription", {
            job,
            clientProfileImage,
            full_name,
          });
        }}
      >
        {/* Displaying the client's profile image */}
        <Image
          source={{ uri: clientProfileImage || "../assets/profile.png" }}
          style={styles.profileImage}
        />
        <View style={{ flex: 1, paddingVertical: 2 }}>
          <Text style={styles.jobTitle}>{job.title}</Text>
          <Text style={styles.jobDetails}>
            Budget: ₹{formatBudget(job.budget)} Deadline:{" "}
            {formatDeadline(job.deadline)}
          </Text>
          <Text style={styles.jobDescription} numberOfLines={2}>
            {job.description}
          </Text>
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
        keyExtractor={(item, index) => `${item.job_id}_${index}`}
        contentContainerStyle={{ paddingBottom: 20 }}
        style={{ flex: 1, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
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
  });

export default JobPriority;
