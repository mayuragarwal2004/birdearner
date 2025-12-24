import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";

const ReviewFormModal = ({ visible, onClose, onSubmit, isSubmitting }) => {
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const styles = getStyles(currentTheme);

  const [ratings, setRatings] = useState({
    experience: 0,
    knowledge: 0,
    response: 0,
  });
  const [reviewText, setReviewText] = useState("");
  const [error, setError] = useState("");

  const handleStarPress = (category, index) => {
    setRatings({ ...ratings, [category]: index });
    setError("");
  };

  const handleSubmit = () => {
    if (ratings.experience === 0 || ratings.knowledge === 0 || ratings.response === 0) {
      setError("Please provide a rating for all categories");
      return;
    }

    if (!reviewText.trim()) {
      setError("Please provide a written review");
      return;
    }

    onSubmit({
      ratings,
      reviewText
    });
  };

  const handleClose = () => {
     // Reset form on close
     if (!isSubmitting) {
         setRatings({ experience: 0, knowledge: 0, response: 0 });
         setReviewText("");
         setError("");
         onClose();
     }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
            <View style={styles.header}>
                <Text style={styles.heading}>Rate Freelancer</Text>
                <TouchableOpacity onPress={handleClose} disabled={isSubmitting}>
                <MaterialIcons name="close" size={24} color={currentTheme.text} />
                </TouchableOpacity>
            </View>

            <Text style={styles.description}>
                Share your experience working with this freelancer.
            </Text>

            {/* Overall Working Experience */}
            <View style={styles.ratingSection}>
                <Text style={styles.label}>Working Experience</Text>
                <View style={styles.starContainer}>
                {[1, 2, 3, 4, 5].map((index) => (
                    <TouchableOpacity
                    key={index}
                    onPress={() => handleStarPress("experience", index)}
                    disabled={isSubmitting}
                    >
                    <MaterialIcons
                        name="star"
                        size={32}
                        color={
                        index <= ratings.experience
                            ? "#FFD700"
                            : "#E2E8F0"
                        }
                    />
                    </TouchableOpacity>
                ))}
                </View>
            </View>

            {/* Project Knowledge */}
            <View style={styles.ratingSection}>
                <Text style={styles.label}>Project Knowledge</Text>
                <View style={styles.starContainer}>
                {[1, 2, 3, 4, 5].map((index) => (
                    <TouchableOpacity
                    key={index}
                    onPress={() => handleStarPress("knowledge", index)}
                    disabled={isSubmitting}
                    >
                    <MaterialIcons
                        name="star"
                        size={32}
                        color={
                        index <= ratings.knowledge
                            ? "#FFD700"
                            : "#E2E8F0"
                        }
                    />
                    </TouchableOpacity>
                ))}
                </View>
            </View>

            {/* Response Time */}
            <View style={styles.ratingSection}>
                <Text style={styles.label}>Response Time</Text>
                <View style={styles.starContainer}>
                {[1, 2, 3, 4, 5].map((index) => (
                    <TouchableOpacity
                    key={index}
                    onPress={() => handleStarPress("response", index)}
                    disabled={isSubmitting}
                    >
                    <MaterialIcons
                        name="star"
                        size={32}
                        color={
                        index <= ratings.response
                            ? "#FFD700"
                            : "#E2E8F0"
                        }
                    />
                    </TouchableOpacity>
                ))}
                </View>
            </View>

            {/* Write a Review */}
            <Text style={styles.label}>Write a review</Text>
            <TextInput
                style={styles.textInput}
                multiline
                placeholder="How was your experience? (Required)"
                placeholderTextColor="#94A3B8"
                value={reviewText}
                onChangeText={setReviewText}
                editable={!isSubmitting}
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Submit Button */}
            <TouchableOpacity 
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
                onPress={handleSubmit}
                disabled={isSubmitting}
            >
                {isSubmitting ? (
                    <ActivityIndicator color="#FFF" size="small" />
                ) : (
                    <Text style={styles.submitButtonText}>Submit Review</Text>
                )}
            </TouchableOpacity>
            </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const getStyles = (currentTheme) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    modalContent: {
      backgroundColor: currentTheme.surface || "#FFF",
      borderRadius: 20,
      padding: 24,
      width: "100%",
      maxWidth: 400,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 8,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    heading: {
      fontSize: 22,
      fontWeight: "700",
      color: currentTheme.text || "#1E293B",
    },
    description: {
        fontSize: 14,
        color: currentTheme.subText || "#64748B",
        marginBottom: 20,
    },
    ratingSection: {
        marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: currentTheme.text || "#334155",
      marginBottom: 8,
    },
    starContainer: {
      flexDirection: "row",
      gap: 12,
    },
    textInput: {
      borderWidth: 1,
      borderColor: currentTheme.border || "#E2E8F0",
      borderRadius: 12,
      width: "100%",
      minHeight: 100,
      padding: 12,
      marginBottom: 16,
      textAlignVertical: "top",
      color: currentTheme.text,
      backgroundColor: currentTheme.background || "#F8FAFC",
      fontSize: 14,
    },
    errorText: {
        color: "#EF4444",
        fontSize: 13,
        marginBottom: 12,
        fontWeight: "500",
    },
    submitButton: {
      backgroundColor: "#4C0183",
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
      marginTop: 8,
      shadowColor: "#4C0183",
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
      color: "#FFF",
      fontSize: 16,
      fontWeight: "600",
      letterSpacing: 0.5,
    },
  });

export default ReviewFormModal;
