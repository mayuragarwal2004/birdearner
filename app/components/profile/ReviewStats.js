import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const RatingBar = ({ rating, count, total, styles }) => {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  return (
    <View style={styles.ratingBarContainer}>
      <Text style={styles.ratingNumber}>{rating}★</Text>
      <View style={styles.ratingBarBg}>
        <View style={[styles.ratingBarFg, { width: `${percentage}%` }]} />
      </View>
      <Text style={styles.ratingCount}>{count}</Text>
    </View>
  );
};

const ReviewStats = ({ stats }) => {
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const styles = getStyles(currentTheme);

  if (!stats) return null;

  return (
    <View style={styles.statsContainer}>
      <View style={styles.ratingHeader}>
        <View style={styles.averageRating}>
          <Text style={styles.averageRatingNumber}>{stats.averageRating}</Text>
          <Text style={styles.ratingLabel}>out of 5</Text>
        </View>
        <View style={styles.totalReviews}>
          <Text style={styles.totalNumber}>{stats.totalReviews}</Text>
          <Text style={styles.reviewsLabel}>Total Reviews</Text>
        </View>
      </View>

      <View style={styles.ratingBars}>
        {[5, 4, 3, 2, 1].map((rating) => (
          <RatingBar
            key={rating}
            rating={rating}
            count={stats.ratingDistribution[rating] || 0}
            total={stats.totalReviews}
            styles={styles}
          />
        ))}
      </View>
    </View>
  );
};

const getStyles = (currentTheme) => StyleSheet.create({
  statsContainer: {
    padding: 20,
    backgroundColor: currentTheme.cardBackground || "#fff",
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ratingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: currentTheme.borderColor || "#eee",
  },
  averageRating: {
    alignItems: "center",
  },
  averageRatingNumber: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#4C0183",
  },
  ratingLabel: {
    fontSize: 14,
    color: currentTheme.textSecondary || "#666",
  },
  totalReviews: {
    alignItems: "center",
    justifyContent: "center",
  },
  totalNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: currentTheme.text || "#000",
  },
  reviewsLabel: {
    fontSize: 14,
    color: currentTheme.textSecondary || "#666",
  },
  ratingBars: {
    gap: 10,
  },
  ratingBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  ratingNumber: {
    width: 30,
    fontSize: 14,
    color: currentTheme.text || "#000",
    fontWeight: "600",
  },
  ratingBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: currentTheme.borderColor || "#eee",
    borderRadius: 4,
    overflow: "hidden",
  },
  ratingBarFg: {
    height: "100%",
    backgroundColor: "#FFB000",
    borderRadius: 4,
  },
  ratingCount: {
    width: 30,
    fontSize: 14,
    color: currentTheme.textSecondary || "#666",
    textAlign: "right",
  },
});

export default ReviewStats;
