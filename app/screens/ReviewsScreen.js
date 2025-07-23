import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  ImageBackground,
  ActivityIndicator,
  RefreshControl,
  Alert,
  SafeAreaView,
} from "react-native";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";
import ReviewCard from "../components/ReviewCard";
import { useAuth } from "../context/NewAuthContext";
import { useTheme } from "../context/ThemeContext";
import ApiService from "../lib/apiService";

export default function ReviewsScreen({ route, navigation }) {
  const { receiverId } = route.params;
  const { userData } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const role = userData?.role === "CLIENT" ? "FREELANCER" : "CLIENT";

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];

  const styles = getStyles(currentTheme);

  // Fetch profile and review data
  const fetchData = useCallback(async () => {
    setLoadingProfile(true);
    try {
      // Get complete profile data
      const profileResponse = await ApiService.getCompleteProfile(receiverId);
      if (profileResponse.success) {
        setProfileData(profileResponse.data);
      }

      // Get reviews
      const reviewsResponse = await ApiService.getReviewsByUserId(receiverId);
      if (reviewsResponse.success) {
        setReviews(reviewsResponse.data);
      }

      // Get review statistics
      const statsResponse = await ApiService.getReviewStats(receiverId);
      if (statsResponse.success) {
        setReviewStats(statsResponse.data);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to fetch data");
    } finally {
      setLoadingProfile(false);
    }
  }, [receiverId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData().finally(() => setRefreshing(false));
  }, [fetchData]);

  if (loadingProfile) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#4C0183" />
      </SafeAreaView>
    );
  }

  const RatingBar = ({ rating, count, total }) => {
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#4C0183"]}
            progressBackgroundColor={currentTheme.cardBackground}
          />
        }
      >
        <View style={styles.tab}>
          <TouchableOpacity
            style={styles.tabButtonL}
            onPress={() => navigation.navigate("ProfileScreen", { receiverId })}
          >
            <Text style={styles.tabTextL}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabButtonR}>
            <Text style={styles.tabTextR}>Reviews</Text>
          </TouchableOpacity>
        </View>

        <ImageBackground
          source={
            profileData?.coverPhoto
              ? { uri: profileData.coverPhoto }
              : require("../assets/backGroungBanner.png")
          }
          style={styles.backgroundImg}
          imageStyle={styles.backgroundImgStyle}
        >
          <Image
            source={
              profileData?.profilePhoto
                ? { uri: profileData.profilePhoto }
                : require("../assets/profile.png")
            }
            style={styles.profileImage}
          />
        </ImageBackground>

        <View style={styles.userDetails}>
          <Text style={styles.nameText}>{profileData?.user?.fullName}</Text>
          {role === "CLIENT" ? (
            <Text style={styles.roleText}>
              {profileData?.organizationType}
            </Text>
          ) : (
            <Text style={styles.roleText}>{profileData?.profileHeading}</Text>
          )}
          <View style={styles.locationContainer}>
            <MaterialIcons name="location-on" size={16} color="#4C0183" />
            <Text style={styles.locationText}>
              {profileData?.city}, {profileData?.state}, {profileData?.country}
            </Text>
          </View>
          
          {reviewStats && (
            <View style={styles.statsContainer}>
              <View style={styles.ratingHeader}>
                <View style={styles.averageRating}>
                  <Text style={styles.averageRatingNumber}>
                    {reviewStats.averageRating}
                  </Text>
                  <Text style={styles.ratingLabel}>out of 5</Text>
                </View>
                <View style={styles.totalReviews}>
                  <Text style={styles.totalNumber}>
                    {reviewStats.totalReviews}
                  </Text>
                  <Text style={styles.reviewsLabel}>Total Reviews</Text>
                </View>
              </View>

              <View style={styles.ratingBars}>
                {[5, 4, 3, 2, 1].map((rating) => (
                  <RatingBar
                    key={rating}
                    rating={rating}
                    count={reviewStats.ratingDistribution[rating]}
                    total={reviewStats.totalReviews}
                  />
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={styles.reviewSection}>
          <Text style={styles.reviewSectionTitle}>Recent Reviews</Text>
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <ReviewCard
                key={review.id}
                reviewerName={review.clientReviewer?.user?.fullName}
                reviewerLocation={`${review.clientReviewer?.city}, ${review.clientReviewer?.country}`}
                starRating={review.rating}
                reviewText={review.reviewText}
                reviewerPhoto={review.clientReviewer?.profilePhoto}
                jobTitle={review.job?.jobTitle}
                date={new Date(review.createdAt).toLocaleDateString()}
              />
            ))
          ) : (
            <Text style={styles.noReviewsText}>No reviews yet</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (currentTheme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: currentTheme.background,
    },
    container: {
      backgroundColor: currentTheme.background,
      paddingTop: 35,
    },
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: currentTheme.background,
    },
    tab: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 2,
    },
    tabButtonL: {
      backgroundColor: currentTheme.background3,
      width: "50%",
      height: 40,
      justifyContent: "center",
      alignItems: "center",
      borderTopRightRadius: 80,
    },
    tabButtonR: {
      backgroundColor: "#4C0183",
      width: "50%",
      height: 40,
      justifyContent: "center",
      alignItems: "center",
      borderTopLeftRadius: 80,
    },
    tabTextL: {
      color: currentTheme.text,
      fontSize: 20,
      fontWeight: "bold",
    },
    tabTextR: {
      color: "#fff",
      fontSize: 20,
      fontWeight: "bold",
    },
    backgroundImg: {
      width: "100%",
      height: 150,
      position: "relative",
    },
    backgroundImgStyle: {
      opacity: 0.7,
    },
    profileImage: {
      width: 100,
      height: 100,
      borderRadius: 50,
      position: "absolute",
      bottom: -20,
      left: "38%",
      borderWidth: 3,
      borderColor: "#fff",
    },
    userDetails: {
      alignItems: "center",
      paddingTop: 30,
      paddingHorizontal: 20,
    },
    nameText: {
      fontSize: 28,
      fontWeight: "600",
      color: currentTheme.text,
      marginBottom: 5,
    },
    roleText: {
      fontSize: 16,
      color: currentTheme.text,
      marginBottom: 10,
    },
    locationContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 20,
    },
    locationText: {
      fontSize: 14,
      color: currentTheme.subText,
      marginLeft: 5,
    },
    statsContainer: {
      width: "100%",
      backgroundColor: currentTheme.cardBackground,
      borderRadius: 15,
      padding: 20,
      marginBottom: 20,
    },
    ratingHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 20,
      paddingHorizontal: 10,
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
      color: currentTheme.subText,
      fontSize: 14,
    },
    totalReviews: {
      alignItems: "center",
    },
    totalNumber: {
      fontSize: 24,
      fontWeight: "bold",
      color: currentTheme.text,
    },
    reviewsLabel: {
      color: currentTheme.subText,
      fontSize: 14,
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
      color: currentTheme.text,
    },
    ratingBarBg: {
      flex: 1,
      height: 8,
      backgroundColor: currentTheme.border,
      borderRadius: 4,
    },
    ratingBarFg: {
      height: "100%",
      backgroundColor: "#4C0183",
      borderRadius: 4,
    },
    ratingCount: {
      width: 30,
      fontSize: 14,
      color: currentTheme.subText,
      textAlign: "right",
    },
    reviewSection: {
      padding: 20,
    },
    reviewSectionTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: currentTheme.text,
      marginBottom: 15,
    },
    noReviewsText: {
      textAlign: "center",
      color: currentTheme.subText,
      fontSize: 16,
      marginTop: 20,
    },
  });
