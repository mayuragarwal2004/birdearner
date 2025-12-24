import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

export default function ReviewCard({
  reviewerName,
  reviewerstate,
  reviewerCountry,
  starRating,
  reviewText,
  reviewerPhoto,
}) {
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const styles = getStyles(currentTheme);

  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(starRating); // Number of full stars
    const fractionalPart = starRating % 1; // Fractional part for partial stars
    const emptyStars = 5 - Math.ceil(starRating); // Remaining empty stars

    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <FontAwesome key={`full-${i}`} name="star" size={20} color="#4B0082" />
      );
    }

    // Add a partially filled star if applicable
    if (fractionalPart > 0) {
      stars.push(
        <View key="partial" style={styles.partialStarContainer}>
          <FontAwesome name="star-o" size={20} color="#4B0082" />
          <View
            style={[
              styles.partialFill,
              { width: `${fractionalPart * 100}%` },
            ]}
          >
            <FontAwesome name="star" size={20} color="#4B0082" />
          </View>
        </View>
      );
    }

    // Add empty stars for the remaining slots
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <FontAwesome key={`empty-${i}`} name="star-o" size={20} color="#4B0082" />
      );
    }

    return stars;
  };

  return (
    <View style={styles.reviewCard}>
      <View style={styles.card}>
        <View style={styles.reviewHeader}>
          <Image
            source={
              reviewerPhoto
                ? { uri: reviewerPhoto }
                : require("../assets/profile.png")
            }
            style={styles.reviewerImage}
          />
          <View style={styles.reviewerInfo}>
            <Text style={styles.reviewerName}>{reviewerName}</Text>
            <Text style={styles.reviewerLocation}>
              {reviewerstate}, {reviewerCountry}
            </Text>
            <View style={styles.starRating}>{renderStars()}</View>
          </View>
        </View>
        <FontAwesome
          name="warning"
          size={20}
          color="#FF3B30"
          style={styles.flagIcon}
        />
      </View>
      <Text style={styles.reviewText}>{reviewText}</Text>
    </View>
  );
}

const getStyles = (currentTheme) =>
  StyleSheet.create({
    reviewCard: {
      borderBottomWidth: 1,
      borderBottomColor: "#ddd",
      paddingVertical: 15,
      paddingHorizontal: 10,
    },
    card: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    reviewHeader: {
      flexDirection: "row",
      alignItems: "center",
    },
    reviewerImage: {
      width: 80,
      height: 80,
      borderRadius: 40,
    },
    reviewerInfo: {
      marginLeft: 10,
    },
    reviewerName: {
      fontWeight: "600",
      fontSize: 16,
      color: currentTheme.text,
    },
    reviewerLocation: {
      color: "#888",
      fontSize: 14,
    },
    starRating: {
      flexDirection: "row",
      marginTop: 3,
      gap: 5,
    },
    partialStarContainer: {
      position: "relative",
      width: 20,
      height: 20,
    },
    partialFill: {
      position: "absolute",
      top: 0,
      left: 0,
      overflow: "hidden",
    },
    reviewText: {
      marginTop: 10,
      color: "#555",
      fontSize: 14,
    },
  });
