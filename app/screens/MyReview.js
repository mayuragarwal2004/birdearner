import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { useAuth } from "../context/NewAuthContext";
import { useTheme } from "../context/ThemeContext";
import apiService from "../lib/apiService";

const PURPLE = "#7B2CFF";
const DEEP_PURPLE = "#1B1028";
const TEXT = "#101114";
const MUTED = "#656B7A";
const BORDER = "#E7E1EF";
const SOFT_PURPLE = "#F3EAFF";

const showToast = (type, title, message = "") => {
  Toast.show({
    type,
    text1: title,
    text2: message,
    position: "top",
  });
};

const parseArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return value ? [value] : [];
    }
  }
  return [];
};

const getImageUri = (image) => {
  const raw = image?.uri || image?.url || image?.secure_url || image;
  return typeof raw === "string" && raw ? apiService.loadImageURI(raw) : null;
};

const formatRating = (rating) => {
  const value = Number(rating || 0);
  return value ? value.toFixed(1).replace(".0", "") : "0.0";
};

const formatDate = (dateValue) => {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getDisplayName = (profileData, userData) =>
  profileData?.fullName ||
  profileData?.user?.fullName ||
  userData?.fullName ||
  "Bird Earner";

const getProfileTitle = (role, profileData, services) => {
  if (role === "CLIENT") {
    return (
      profileData?.companyName ||
      profileData?.company_name ||
      profileData?.organizationType ||
      "Client"
    );
  }

  return profileData?.profileHeading || services?.[0]?.name || "Freelancer";
};

const getBadgeLabel = (level) => {
  const value = Number(level || 1);
  if (value >= 10) return "Expert Badge";
  if (value >= 5) return "Pro Badge";
  return "Beginner Badge";
};

const getReviewerName = (review) =>
  review?.reviewer?.fullName ||
  review?.reviewer?.user?.fullName ||
  review?.reviewerName ||
  "Bird Earner user";

const getReviewerLocation = (review) => {
  const reviewer = review?.reviewer || {};
  const parts = [
    reviewer.city,
    reviewer.state || review?.reviewerstate,
    reviewer.country || review?.reviewerCountry,
  ].filter(Boolean);
  return parts.join(", ");
};

export default function MyReview({ navigation, route }) {
  const { userData, userProfile } = useAuth();
  const profileData = route?.params?.profileData || userProfile || {};
  const role = userData?.role || profileData?.role;
  const profileUserId = profileData?.userId || profileData?.user?.id || userData?.id;

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const styles = useMemo(() => getStyles(currentTheme), [currentTheme]);

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [userServices, setUserServices] = useState([]);

  const displayName = getDisplayName(profileData, userData);
  const profileTitle = getProfileTitle(role, profileData, userServices);
  const profilePhotoUri = getImageUri(profileData?.profilePhoto);
  const isAvailable = profileData?.currentlyAvailable !== false;

  const fetchReviews = useCallback(async () => {
    if (!profileUserId) return;

    setLoadingProfile(true);
    try {
      const [reviewsResponse, statsResponse] = await Promise.all([
        apiService.getReviewsByUserId(profileUserId),
        apiService.getReviewStats(profileUserId),
      ]);

      setReviews(reviewsResponse?.success ? reviewsResponse.data || [] : []);
      setReviewStats(statsResponse?.success ? statsResponse.data : null);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
      showToast("error", "Error", "Failed to fetch reviews");
    } finally {
      setLoadingProfile(false);
    }
  }, [profileUserId]);

  const loadUserServices = useCallback(async () => {
    if (role !== "FREELANCER") {
      setUserServices([]);
      return;
    }

    const serviceIds = parseArray(profileData?.selectedServices);
    if (!serviceIds.length) {
      setUserServices([]);
      return;
    }

    try {
      const serviceResults = await Promise.all(
        serviceIds.map(async (serviceId) => {
          try {
            return await apiService.getServiceById(serviceId);
          } catch (error) {
            console.warn(`Failed to load service ${serviceId}:`, error.message);
            return null;
          }
        })
      );
      setUserServices(serviceResults.filter(Boolean));
    } catch (error) {
      console.error("Failed to load services:", error);
      setUserServices([]);
    }
  }, [profileData?.selectedServices, role]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    loadUserServices();
  }, [loadUserServices]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([fetchReviews(), loadUserServices()]).finally(() => {
      setRefreshing(false);
    });
  }, [fetchReviews, loadUserServices]);

  const handleShare = async () => {
    try {
      if (!profileUserId) {
        Alert.alert("Error", "Unable to share profile - user ID not found");
        return;
      }

      const webLink = `https://birdearner.com/profile/${profileUserId}`;
      await Share.share({
        title: `${displayName}'s Bird Earner Profile`,
        message: `Check out my ${role === "CLIENT" ? "client" : "freelancer"} profile on Bird Earner:\n\n${displayName}\n${profileTitle}\n\n${webLink}`,
      });
    } catch (error) {
      console.error("Share error:", error);
      Alert.alert("Error", "Failed to share the profile.");
    }
  };

  const goToProfile = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate("MyProfile");
  };

  if (loadingProfile && !reviews.length && !reviewStats) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={PURPLE} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[PURPLE]}
            progressBackgroundColor={currentTheme.cardBackground || "#fff"}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.navigate("Settings")}
            >
              <MaterialIcons name="settings" size={26} color={PURPLE} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <MaterialIcons name="share" size={23} color={PURPLE} />
              <Text style={styles.shareText}>Share profile</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.avatarButton}>
            <View style={styles.avatarRing}>
              <Image
                source={
                  profilePhotoUri
                    ? { uri: profilePhotoUri }
                    : require("../assets/profile.png")
                }
                style={styles.avatar}
              />
            </View>
            <View style={[styles.statusDot, !isAvailable && styles.statusDotMuted]} />
          </View>

          <Text style={styles.nameText}>{displayName}</Text>
          <Text style={styles.roleText}>{profileTitle}</Text>

          <View style={styles.ratingRow}>
            <Text style={styles.ratingText}>{formatRating(reviewStats?.averageRating)}</Text>
            <Text style={styles.reviewCount}>
              ({reviewStats?.totalReviews || reviews.length || 0})
            </Text>
            <View style={styles.badge}>
              <MaterialIcons
                name={role === "CLIENT" ? "business-center" : "workspace-premium"}
                size={20}
                color={PURPLE}
              />
              <Text style={styles.badgeText}>
                {role === "CLIENT" ? "Client Profile" : getBadgeLabel(profileData?.level)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.tabShell}>
          <TouchableOpacity
            style={styles.profileTabButton}
            activeOpacity={0.85}
            onPress={goToProfile}
          >
            <Text style={styles.profileTabText}>My Profile</Text>
            <View style={styles.profileTabIndicator} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileTabButton} activeOpacity={0.85}>
            <Text style={styles.profileTabTextActive}>My Reviews</Text>
            <View style={styles.profileTabIndicatorActive} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <ReviewSummary styles={styles} stats={reviewStats} reviewCount={reviews.length} />

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Reviews</Text>
            <Text style={styles.sectionMeta}>
              {reviewStats?.totalReviews || reviews.length || 0} total
            </Text>
          </View>

          {reviews.length ? (
            reviews.map((review) => (
              <ReviewItem key={review.id} styles={styles} review={review} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="rate-review" size={38} color={PURPLE} />
              <Text style={styles.emptyTitle}>No reviews yet</Text>
              <Text style={styles.emptyText}>
                Reviews from completed work will appear here.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      <Toast />
    </SafeAreaView>
  );
}

function ReviewSummary({ styles, stats, reviewCount }) {
  const total = stats?.totalReviews || reviewCount || 0;
  const average = Number(stats?.averageRating || 0);
  const distribution = stats?.ratingDistribution || {};

  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryTop}>
        <View>
          <Text style={styles.summaryRating}>{formatRating(average)}</Text>
          <View style={styles.summaryStars}>
            {[1, 2, 3, 4, 5].map((item) => (
              <FontAwesome
                key={item}
                name={item <= Math.round(average) ? "star" : "star-o"}
                size={16}
                color={PURPLE}
              />
            ))}
          </View>
        </View>
        <View style={styles.summaryCountBox}>
          <Text style={styles.summaryCount}>{total}</Text>
          <Text style={styles.summaryLabel}>Total Reviews</Text>
        </View>
      </View>

      <View style={styles.ratingBars}>
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = Number(distribution[rating] || 0);
          const percentage = total ? `${(count / total) * 100}%` : "0%";
          return (
            <View key={rating} style={styles.ratingBarRow}>
              <Text style={styles.ratingBarLabel}>{rating}</Text>
              <View style={styles.ratingBarTrack}>
                <View style={[styles.ratingBarFill, { width: percentage }]} />
              </View>
              <Text style={styles.ratingBarCount}>{count}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function ReviewItem({ styles, review }) {
  const reviewerPhotoUri = getImageUri(review?.reviewer?.profilePhoto || review?.reviewerPhoto);
  const reviewerLocation = getReviewerLocation(review);
  const rating = Number(review?.rating || 0);

  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Image
          source={
            reviewerPhotoUri
              ? { uri: reviewerPhotoUri }
              : require("../assets/profile.png")
          }
          style={styles.reviewerAvatar}
        />
        <View style={styles.reviewMeta}>
          <Text style={styles.reviewerName}>{getReviewerName(review)}</Text>
          {!!reviewerLocation && (
            <Text style={styles.reviewerLocation}>{reviewerLocation}</Text>
          )}
          <View style={styles.reviewStars}>
            {[1, 2, 3, 4, 5].map((item) => (
              <FontAwesome
                key={item}
                name={item <= rating ? "star" : "star-o"}
                size={15}
                color={PURPLE}
              />
            ))}
          </View>
        </View>
        <Text style={styles.reviewDate}>{formatDate(review?.createdAt)}</Text>
      </View>

      {!!(review?.job?.jobTitle || review?.jobTitle) && (
        <Text style={styles.jobTitle} numberOfLines={1}>
          {review?.job?.jobTitle || review?.jobTitle}
        </Text>
      )}
      <Text style={styles.reviewText}>
        {review?.reviewText || "No review text provided"}
      </Text>
    </View>
  );
}

const getStyles = (currentTheme) => {
  const surface = currentTheme.background || "#FFFFFF";
  const card = currentTheme.cardBackground || surface;
  const text = currentTheme.text || TEXT;
  const muted = currentTheme.subText || MUTED;
  const border = currentTheme.border || BORDER;
  const softSurface = currentTheme.background3 || "#F6F3FA";
  const badgeSurface = currentTheme.background2 || SOFT_PURPLE;
  const tabSurface = surface === "#000000" ? "#13091F" : DEEP_PURPLE;

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: surface,
    },
    container: {
      flex: 1,
      backgroundColor: surface,
    },
    scrollContent: {
      paddingBottom: 100,
    },
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: surface,
    },
    hero: {
      paddingHorizontal: 22,
      paddingTop: 8,
      paddingBottom: 24,
      alignItems: "center",
      backgroundColor: surface,
    },
    topBar: {
      width: "100%",
      minHeight: 44,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    iconButton: {
      width: 44,
      height: 44,
      justifyContent: "center",
      alignItems: "flex-start",
    },
    shareButton: {
      minHeight: 44,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    shareText: {
      color: PURPLE,
      fontSize: 18,
      fontWeight: "700",
    },
    avatarButton: {
      alignItems: "center",
      justifyContent: "center",
    },
    avatarRing: {
      width: 146,
      height: 146,
      borderRadius: 73,
      borderWidth: 3,
      borderColor: "#B05CFF",
      padding: 5,
      backgroundColor: surface,
      shadowColor: PURPLE,
      shadowOpacity: 0.22,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 5,
    },
    avatar: {
      width: "100%",
      height: "100%",
      borderRadius: 68,
      backgroundColor: softSurface,
    },
    statusDot: {
      position: "absolute",
      right: 13,
      bottom: 12,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: "#A857F4",
      borderWidth: 5,
      borderColor: surface,
    },
    statusDotMuted: {
      backgroundColor: "#B9B1C6",
    },
    nameText: {
      marginTop: 18,
      color: text,
      fontSize: 34,
      fontWeight: "800",
      textAlign: "center",
    },
    roleText: {
      marginTop: 8,
      color: muted,
      fontSize: 19,
      textAlign: "center",
      textTransform: "capitalize",
    },
    ratingRow: {
      marginTop: 18,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      flexWrap: "wrap",
    },
    ratingText: {
      color: text,
      fontSize: 19,
      fontWeight: "800",
    },
    reviewCount: {
      color: muted,
      fontSize: 18,
    },
    badge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 18,
      backgroundColor: badgeSurface,
      borderWidth: 1,
      borderColor: "#E4CAFF",
    },
    badgeText: {
      color: PURPLE,
      fontSize: 16,
      fontWeight: "700",
    },
    tabShell: {
      marginHorizontal: 20,
      marginTop: 2,
      borderRadius: 18,
      backgroundColor: tabSurface,
      flexDirection: "row",
      paddingHorizontal: 10,
      paddingTop: 10,
      height: 60,
      shadowColor: "#000",
      shadowOpacity: 0.2,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 8 },
      elevation: 5,
    },
    profileTabButton: {
      flex: 1,
      alignItems: "center",
      justifyContent: "flex-start",
    },
    profileTabText: {
      color: "#A8A6B0",
      fontSize: 16,
      fontWeight: "700",
    },
    profileTabTextActive: {
      color: "#C36DFF",
      fontSize: 16,
      fontWeight: "700",
    },
    profileTabIndicator: {
      height: 4,
      width: "68%",
      borderRadius: 3,
      backgroundColor: "transparent",
      marginTop: 8,
    },
    profileTabIndicatorActive: {
      height: 4,
      width: "68%",
      borderRadius: 3,
      backgroundColor: "#B65CFF",
      marginTop: 8,
    },
    content: {
      paddingHorizontal: 24,
      paddingTop: 28,
    },
    summaryCard: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: border,
      backgroundColor: card,
      padding: 18,
      marginBottom: 24,
    },
    summaryTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottomWidth: 1,
      borderBottomColor: border,
      paddingBottom: 18,
      marginBottom: 18,
    },
    summaryRating: {
      color: PURPLE,
      fontSize: 48,
      fontWeight: "900",
    },
    summaryStars: {
      flexDirection: "row",
      gap: 4,
      marginTop: 4,
    },
    summaryCountBox: {
      alignItems: "flex-end",
    },
    summaryCount: {
      color: text,
      fontSize: 28,
      fontWeight: "900",
    },
    summaryLabel: {
      color: muted,
      fontSize: 14,
      fontWeight: "700",
      marginTop: 4,
    },
    ratingBars: {
      gap: 10,
    },
    ratingBarRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    ratingBarLabel: {
      width: 22,
      color: text,
      fontSize: 14,
      fontWeight: "800",
    },
    ratingBarTrack: {
      flex: 1,
      height: 8,
      borderRadius: 4,
      overflow: "hidden",
      backgroundColor: softSurface,
    },
    ratingBarFill: {
      height: "100%",
      borderRadius: 4,
      backgroundColor: PURPLE,
    },
    ratingBarCount: {
      width: 28,
      color: muted,
      fontSize: 13,
      textAlign: "right",
      fontWeight: "700",
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 14,
    },
    sectionTitle: {
      color: text,
      fontSize: 22,
      fontWeight: "800",
    },
    sectionMeta: {
      color: muted,
      fontSize: 14,
      fontWeight: "700",
    },
    reviewCard: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: border,
      backgroundColor: card,
      padding: 16,
      marginBottom: 14,
    },
    reviewHeader: {
      flexDirection: "row",
      alignItems: "center",
    },
    reviewerAvatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: softSurface,
    },
    reviewMeta: {
      flex: 1,
      marginLeft: 12,
    },
    reviewerName: {
      color: text,
      fontSize: 16,
      fontWeight: "800",
    },
    reviewerLocation: {
      color: muted,
      fontSize: 13,
      marginTop: 2,
    },
    reviewStars: {
      flexDirection: "row",
      gap: 3,
      marginTop: 5,
    },
    reviewDate: {
      color: muted,
      fontSize: 12,
      fontWeight: "600",
    },
    jobTitle: {
      color: PURPLE,
      fontSize: 14,
      fontWeight: "800",
      marginTop: 14,
    },
    reviewText: {
      color: muted,
      fontSize: 15,
      lineHeight: 22,
      marginTop: 10,
    },
    emptyState: {
      minHeight: 220,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 16,
      borderWidth: 1,
      borderColor: border,
      backgroundColor: card,
      padding: 18,
    },
    emptyTitle: {
      color: text,
      fontSize: 18,
      fontWeight: "800",
      marginTop: 10,
    },
    emptyText: {
      color: muted,
      fontSize: 15,
      textAlign: "center",
      marginTop: 6,
    },
  });
};
