import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useAppwrite } from "../context/AppwriteContext";
import { useTheme } from "../context/ThemeContext";

const ReviewGive = ({ navigation, route }) => {
  const { appwriteConfig, databases } = useAppwrite();
  const [ratings, setRatings] = useState({
    experience: 0,
    knowledge: 0,
    response: 0,
  });

  const { receiverId } = route.params;
  const { userData } = useAuth();
  const [reviewText, setReviewText] = useState("");

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];

  const styles = getStyles(currentTheme);

  const handleStarPress = (category, index) => {
    setRatings({ ...ratings, [category]: index });
  };

  const calculateLevel = (totalXP) => {
    const baseXP = 100;
    const incrementXP = 100;

    let level = 1;
    let xpForNextLevel = baseXP;

    while (totalXP >= xpForNextLevel) {
      level += 1;
      totalXP -= xpForNextLevel;
      xpForNextLevel += incrementXP;
    }

    return level;
  };

  const updateFreelancerXP = async (freelancerId, baseXP, starRating) => {
    try {
      const collectionId =
        userData?.role === "client"
          ? appwriteConfig.freelancerCollectionId
          : appwriteConfig.clientCollectionId;

      const freelancer = await databases.getDocument(
        appwriteConfig.databaseId,
        collectionId,
        freelancerId
      );

      const earnedXP = Math.round(baseXP + starRating * 9);
      const updatedXP = freelancer.xp + earnedXP;

      const currentRating = freelancer.rating || 0;
      const completedJobs = freelancer.completedJobs || 0;
      const updatedCompletedJobs = completedJobs + 1;

      const updatedRating =
        (currentRating * completedJobs + starRating) / updatedCompletedJobs;

      const level = calculateLevel(updatedXP);

      await databases.updateDocument(
        appwriteConfig.databaseId,
        collectionId,
        freelancerId,
        {
          XP: updatedXP,
          level,
          rating: parseFloat(updatedRating.toFixed(1)),
        }
      );
    } catch (error) {
      Alert.alert("Error updating freelancer XP and level");
    }
  };

  const submitReview = async () => {
    try {
      const { experience, knowledge, response } = ratings;

      if (!reviewText.trim()) {
        Alert.alert("Error", "Please provide a review before submitting.");
        return;
      }

      const averageRating = parseFloat(
        ((experience + knowledge + response) / 3).toFixed(1)
      );

      // Save the review in the database
      await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.reviewCollectionId,
        "unique()",
        {
          giverId: userData?.$id,
          receiverId,
          rating: averageRating,
          message_text: reviewText,
        }
      );

      // Update the receiver's XP and rating
      const baseXP = 30;
      await updateFreelancerXP(receiverId, baseXP, averageRating);

      Alert.alert("Success", "Review submitted successfully!");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "Failed to submit review. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Review this job</Text>

      {/* Overall Working Experience */}
      <Text style={styles.label}>Overall Working Experience</Text>
      <View style={styles.starContainer}>
        {[1, 2, 3, 4, 5].map((index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handleStarPress("experience", index)}
          >
            <MaterialIcons
              name="star"
              size={36}
              color={
                index <= ratings.experience
                  ? "#4B0082"
                  : currentTheme.subText || "#D9D9D9"
              }
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Project Knowledge */}
      <Text style={styles.label}>Project Knowledge</Text>
      <View style={styles.starContainer}>
        {[1, 2, 3, 4, 5].map((index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handleStarPress("knowledge", index)}
          >
            <MaterialIcons
              name="star"
              size={36}
              color={
                index <= ratings.knowledge
                  ? "#4B0082"
                  : currentTheme.subText || "#D9D9D9"
              }
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Response Time */}
      <Text style={styles.label}>Response Time</Text>
      <View style={styles.starContainer}>
        {[1, 2, 3, 4, 5].map((index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handleStarPress("response", index)}
          >
            <MaterialIcons
              name="star"
              size={36}
              color={
                index <= ratings.response
                  ? "#4B0082"
                  : currentTheme.subText || "#D9D9D9"
              }
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Write a Review */}
      <Text style={styles.subHeading}>Write a review</Text>
      <TextInput
        style={styles.textInput}
        multiline
        placeholder="How was the experience..."
        placeholderTextColor="#aaa"
        value={reviewText}
        onChangeText={setReviewText}
      />

      {/* Submit Button */}
      <TouchableOpacity style={styles.submitButton} onPress={submitReview}>
        <Text style={styles.submitButtonText}>Submit</Text>
      </TouchableOpacity>
    </View>
  );
};

const getStyles = (currentTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background || "#FFF",
      padding: 20,
      alignItems: "center",
      paddingTop: 30,
    },
    heading: {
      fontSize: 26,
      fontWeight: "bold",
      color: currentTheme.primary || "#4B0082",
      marginBottom: 10,
      marginTop: 25,
    },
    label: {
      fontSize: 15,
      fontWeight: "500",
      color: currentTheme.text || "#555",
      marginTop: 24,
    },
    starContainer: {
      flexDirection: "row",
      marginVertical: 5,
      gap: 18,
    },
    subHeading: {
      fontSize: 26,
      fontWeight: "bold",
      color: currentTheme.primary || "#4B0082",
      marginTop: 40,
    },
    textInput: {
      borderWidth: 1,
      borderColor: currentTheme.border || "#ddd",
      borderRadius: 10,
      width: "100%",
      minHeight: 140,
      padding: 10,
      marginVertical: 10,
      textAlignVertical: "top",
      color: currentTheme.subText,
      backgroundColor: currentTheme.background3,
    },
    submitButton: {
      backgroundColor: "#4B0082",
      paddingVertical: 10,
      paddingHorizontal: 40,
      borderRadius: 8,
      marginTop: 10,
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
      color: "#FFF",
      fontSize: 16,
      fontWeight: "600",
    },
  });

export default ReviewGive;
