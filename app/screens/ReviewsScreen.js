import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  ImageBackground,
  ActivityIndicator,
  Share,
  RefreshControl,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";
import ReviewCard from "../components/ReviewCard";
import { useAuth } from "../context/NewAuthContext";
import { useTheme } from "../context/ThemeContext";
import apiService from "../lib/apiService";

export default function MyReview({ navigation, route }) {
  const { profileData } = route.params;
  console.log({ review: profileData });

  const { userData } = useAuth();
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [userServices, setUserServices] = useState([]);

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const styles = getStyles(currentTheme);

  // const fetchData = useCallback(async () => {
  //   if (!userData?.id) return;

  //   setLoadingProfile(true);
  //   try {
  //     // Get complete profile data
  //     const profileResponse = await ApiService.getCompleteProfile(userData.id);
  //     if (profileResponse.success) {
  //       setProfileData(profileResponse.data);
  //     }

  //     // Get reviews
  //     const reviewsResponse = await ApiService.getReviewsByUserId(userData.id);
  //     if (reviewsResponse.success) {
  //       setReviews(reviewsResponse.data);
  //     }

  //     // Get review statistics
  //     const statsResponse = await ApiService.getReviewStats(userData.id);
  //     if (statsResponse.success) {
  //       setReviewStats(statsResponse.data);
  //     }
  //   } catch (error) {
  //     Alert.alert("Error", "Failed to fetch data");
  //   } finally {
  //     setLoadingProfile(false);
  //   }
  // }, [userData?.id]);

  // useEffect(() => {
  //   fetchData();
  // }, [fetchData]);

  // Load user services and role info
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        if (
          userData &&
          userData.role === "CLIENT" &&
          profileData?.selectedServices
        ) {
          console.log("Selected services:", profileData.selectedServices);

          // Load service details for the user's selected services
          const services = await Promise.all(
            profileData.selectedServices.map(async (serviceId) => {
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

          // Show warning if some services failed to load
          if (validServices.length < profileData.selectedServices.length) {
            const failedCount =
              profileData.selectedServices.length - validServices.length;
            console.warn(`${failedCount} service(s) failed to load`);
            showToast(
              "warning",
              "Warning",
              `Some services could not be loaded (${failedCount} failed)`
            );
          }
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

    if (profileData) {
      loadUserInfo();
    }
  }, [userData, profileData]);

  const onRefresh = useCallback(() => {
    // setRefreshing(true);
    // fetchData().finally(() => setRefreshing(false));
  }, []);

  // const onShare = async () => {
  //   try {
  //     const profileLink = `https://birdearner.com/profile/${userData.id}`;
  //     const result = await Share.share({
  //       message: `Check out my profile on Bird Earner! Name: ${profileData?.user?.fullName}\n\nProfile Link: ${profileLink}`,
  //     });

  //     if (result.action === Share.sharedAction) {
  //       console.log(result.activityType ?
  //         `Shared with activity: ${result.activityType}` :
  //         "Profile shared successfully.");
  //     }
  //   } catch (error) {
  //     Alert.alert("Error", "Failed to share the profile.");
  //   }
  // };

  const onShare = async () => {
    try {
      const profileLink = `https://birdearner.com/profile/${profileData.$id}`;

      const result = await Share.share({
        message: `Check out my profile on our app! Name: ${data?.full_name}\n\nProfile Link: ${profileLink}`,
      });
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // shared with specific activity
          console.log("Shared with activity:", result.activityType);
        } else {
          // shared without specific activity
          console.log("Profile shared successfully.");
        }
      } else if (result.action === Share.dismissedAction) {
        console.log("Share dismissed.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to share the profile.");
    }
  };

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

        <ImageBackground
          source={
            profileData?.coverPhoto
              ? { uri: apiService.loadImageURI(profileData.coverPhoto) }
              : require("../assets/backGroungBanner.png")
          }
          style={styles.backgroundImg}
          imageStyle={styles.backgroundImgStyle}
        >
          <Image
            source={
              profileData?.profilePhoto
                ? { uri: apiService.loadImageURI(profileData.profilePhoto) }
                : require("../assets/profile.png")
            }
            style={styles.profileImage}
          />
          <TouchableOpacity style={styles.share} onPress={onShare}>
            <FontAwesome name="share" size={24} color="#4C0183" />
          </TouchableOpacity>
        </ImageBackground>

        <View style={styles.userDetails}>
          <Text style={styles.nameText}>{profileData?.user?.fullName}</Text>
          <Text style={styles.roleText}>
            {profileData?.organizationType ||
              (userServices.length > 0 &&
                userServices.map((item, idx) => (
                  <Text key={idx} style={styles.roleText}>
                    {item.name}
                    {idx < userServices.length - 1 ? ", " : ""}
                  </Text>
                )))}
          </Text>
          <View style={styles.locationContainer}>
            <MaterialIcons name="location-on" size={16} color="#4C0183" />
            <Text style={styles.locationText}>
              {profileData?.city}, {profileData?.state}, {profileData?.country}
            </Text>
          </View>

          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>
              Status: {profileData?.currentlyAvailable ? "Active" : "Inactive"}
            </Text>
            <FontAwesome
              name="circle"
              size={12}
              color={profileData?.currentlyAvailable ? "#6BCD2F" : "#FF3131"}
              style={styles.statusIcon}
            />
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
      backgroundColor: currentTheme.background || "#f2f3f5",
    },
    tabContainer: {
      backgroundColor: currentTheme.background || "#f2f3f5",
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 10,
    },
    container: {
      flex: 1,
      backgroundColor: currentTheme.background,
    },
    scrollContent: {
      paddingBottom: 20,
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
