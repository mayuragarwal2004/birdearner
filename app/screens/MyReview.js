import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import ReviewCard from "../components/ReviewCard";
import ProfileHeader from "../components/profile/ProfileHeader";
import ReviewStats from "../components/profile/ReviewStats";
import { useAuth } from "../context/NewAuthContext";
import { useTheme } from "../context/ThemeContext";
import apiService from "../lib/apiService";

// Helper function to show toast messages
const showToast = (type, title, message = "") => {
  Toast.show({
    type,
    text1: title,
    text2: message,
    position: "top",
  });
};

export default function MyReview({ navigation }) {
  const { userData, userProfile } = useAuth();
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [userServices, setUserServices] = useState([]);

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const styles = getStyles(currentTheme);

  const fetchData = useCallback(async () => {
    if (!userData) return;

    setLoadingProfile(true);
    try {
      // Get reviews
      // const reviewType = userData.role === 'FREELANCER' ? 'FREELANCER' : 'CLIENT';
      // Actually MyReview shows reviews ABOUT the user.
      // If I am a Freelancer, I want to see reviews I received from Clients (so type FREELANCER?)
      // Wait, getReviewsByUserId typically gets reviews *about* the user.
      
      const reviewsResponse = await apiService.getReviewsByUserId(userData.id);
      if (reviewsResponse.success) {
        setReviews(reviewsResponse.data);
      }

      // Get review statistics
      const statsResponse = await apiService.getReviewStats(userData.id);
      if (statsResponse.success) {
        setReviewStats(statsResponse.data);
      }
    } catch (error) {
      console.error(error);
      showToast("error", "Error", "Failed to fetch data");
    } finally {
      setLoadingProfile(false);
    }
  }, [userData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData().finally(() => setRefreshing(false));
  }, [fetchData]);

  // Load user services and role info
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        if (
          userData &&
          userData.role === "FREELANCER" &&
          userProfile?.selectedServices
        ) {
          console.log("Loading services for user:", userData.id);
          console.log("Selected services:", userProfile.selectedServices);

          // Load service details for the user's selected services
          const services = await Promise.all(
            userProfile.selectedServices.map(async (serviceId) => {
              try {
                console.log(`Loading service: ${serviceId}`);
                const service = await apiService.getServiceById(serviceId);
                console.log(`Service ${serviceId} loaded:`, service);
                return service;
              } catch (error) {
                console.error(
                  `Error loading service ${serviceId}:`,
                  error.message
                );
                // Return null for invalid services instead of breaking
                return null;
              }
            })
          );

          // Filter out null services (failed to load)
          const validServices = services.filter((s) => s !== null);
          console.log("Valid services loaded:", validServices.length);
          setUserServices(validServices);
        } else {
          // Clear services if user is not a freelancer or has no selected services
          setUserServices([]);
        }
      } catch (error) {
        console.error("Error loading user info:", error);
        setUserServices([]);
        showToast("error", "Error", "Failed to load user services");
      }
    };

    if (userData) {
      loadUserInfo();
    }
  }, [userData, userProfile]);

  if (loadingProfile) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#4C0183" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.tabContainer}>
        <View style={styles.tab}>
          <TouchableOpacity
            style={styles.tabButtonL}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.tabTextL}>My Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabButtonR}>
            <Text style={styles.tabTextR}>My Reviews</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#4C0183"]}
            progressBackgroundColor={currentTheme.cardBackground}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <ProfileHeader 
            profileData={userProfile} 
            userData={userData}
            userServices={userServices}
            isOwnProfile={true}
        />

        {reviewStats && (
            <ReviewStats stats={reviewStats} />
        )}

        <View style={styles.reviewSection}>
          <Text style={styles.reviewSectionTitle}>Recent Reviews</Text>
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <ReviewCard
                key={review.id}
                reviewerName={review.reviewer?.fullName}
                reviewerLocation={review.reviewer?.location}
                starRating={review.rating}
                reviewText={review.reviewText}
                reviewerPhoto={review.reviewer?.profilePhoto}
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
    tabContainer: {
      backgroundColor: currentTheme.background,
      paddingVertical: 10,
      paddingTop: 20,
      paddingHorizontal: 20,
    },
    container: {
      flex: 1,
      backgroundColor: currentTheme.background,
    },
    scrollContent: {
      paddingBottom: 100, // Extra padding for bottom content
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
      backgroundColor: currentTheme.background2 || "#F8F9FA",
      marginHorizontal: 20,
      borderRadius: 12,
      padding: 4,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    tabButtonL: {
      backgroundColor: "transparent",
      width: "48%",
      height: 36,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 8,
    },
    tabButtonR: {
      backgroundColor: "#4C0183",
      width: "48%",
      height: 36,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 8,
      shadowColor: "#4C0183",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.15,
      shadowRadius: 3,
      elevation: 2,
    },
    tabTextL: {
      color: currentTheme.text || "#64748B",
      fontSize: 16,
      fontWeight: "500",
    },
    tabTextR: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
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
    share: {
      position: "absolute",
      bottom: 10,
      right: 20,
      backgroundColor: "#fff",
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      elevation: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
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
      textAlign: "center",
    },
    locationContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 15,
    },
    locationText: {
      fontSize: 14,
      color: currentTheme.subText,
      marginLeft: 5,
    },
    statusContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 20,
    },
    statusText: {
      fontSize: 14,
      fontWeight: "600",
      color: currentTheme.text,
      marginRight: 5,
    },
    statusIcon: {
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
