import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import SafeSpinner from "../components/SafeSpinner";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import ImageViewer from "react-native-image-zoom-viewer";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
const TABS = ["About", "Services", "Reviews", "Portfolio"];

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

const getDisplayName = (profileData) =>
  profileData?.fullName || profileData?.user?.fullName || "Bird Earner";

const getProfileTitle = (profileData, services) => {
  if (profileData?.role === "CLIENT") {
    return (
      profileData?.companyName ||
      profileData?.company_name ||
      profileData?.organizationType ||
      "Client"
    );
  }

  return (
    profileData?.profileHeading ||
    services?.[0]?.name ||
    "Freelancer"
  );
};

const formatMemberSince = (dateValue) => {
  if (!dateValue) return "Not available";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
};

const formatExperience = (months) => {
  const value = Number(months || 0);
  if (!value) return "No experience added";
  if (value < 12) return `${value} Month${value === 1 ? "" : "s"} of Experience`;
  const years = Math.floor(value / 12);
  const remainder = value % 12;
  if (!remainder) return `${years} Year${years === 1 ? "" : "s"} of Experience`;
  return `${years} Year${years === 1 ? "" : "s"} ${remainder} Month${remainder === 1 ? "" : "s"}`;
};

const formatLocation = (profileData) => {
  const parts = [profileData?.city, profileData?.state, profileData?.country].filter(Boolean);
  return parts.length ? parts.join(", ") : "Location not added";
};

const formatRating = (rating) => {
  const value = Number(rating || 0);
  return value ? value.toFixed(1).replace(".0", "") : "0.0";
};

const getBadgeLabel = (level) => {
  const value = Number(level || 1);
  if (value >= 10) return "Expert Badge";
  if (value >= 5) return "Pro Badge";
  return "Beginner Badge";
};

export default function ProfileScreen({ route, navigation }) {
  const { receiverId, userId } = route.params || {};
  const profileUserId = userId || receiverId;
  const { userData } = useAuth();
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const styles = useMemo(() => getStyles(currentTheme), [currentTheme]);
  const uiStyles = useMemo(() => getProfileStyles(currentTheme), [currentTheme]);

  const [activeTab, setActiveTab] = useState("About");
  const [profileData, setProfileData] = useState(null);
  const [services, setServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerImages, setViewerImages] = useState([]);

  const portfolioImages = useMemo(
    () => parseArray(profileData?.portfolioImages || profileData?.portfolio_images),
    [profileData]
  );
  const certifications = useMemo(
    () => parseArray(profileData?.certifications),
    [profileData]
  );
  const selectedServices = useMemo(
    () => parseArray(profileData?.selectedServices),
    [profileData]
  );

  const isFreelancerProfile = profileData?.role === "FREELANCER";
  const displayName = getDisplayName(profileData);
  const profileTitle = getProfileTitle(profileData, services);
  const averageRating =
    reviewStats?.averageRating || profileData?.rating || 0;
  const totalReviews =
    reviewStats?.totalReviews ?? reviews.length ?? 0;

  const fetchRelatedData = useCallback(async (profile) => {
    const nextServices = [];
    const serviceIds = parseArray(profile?.selectedServices);

    if (serviceIds.length) {
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
      nextServices.push(...serviceResults.filter(s => s && !s.isMissing));
    }
    setServices(nextServices);

    const reviewUserId = profile?.userId || profile?.user?.id;
    if (!reviewUserId) {
      setReviews([]);
      setReviewStats(null);
      return;
    }

    try {
      const [reviewsResponse, statsResponse] = await Promise.all([
        apiService.getReviewsByUserId(reviewUserId),
        apiService.getReviewStats(reviewUserId),
      ]);

      setReviews(reviewsResponse?.success ? reviewsResponse.data || [] : []);
      setReviewStats(statsResponse?.success ? statsResponse.data : null);
    } catch (error) {
      console.warn("Failed to load reviews:", error.message);
      setReviews([]);
      setReviewStats(null);
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    if (!profileUserId) {
      Alert.alert("Error", "No user ID provided", [
        { text: "Go Back", onPress: () => navigation.goBack() },
      ]);
      return;
    }

    if (!userData) {
      Alert.alert("Login Required", "Please log in to view user profiles", [
        { text: "Cancel", onPress: () => navigation.goBack() },
        { text: "Login", onPress: () => navigation.navigate("Login") },
      ]);
      return;
    }

    setLoading(true);
    try {
      let response;
      if (userData?.role === "CLIENT") {
        response = await apiService.getFreelancerProfile(profileUserId);
        response.role = "FREELANCER";
      } else {
        response = await apiService.getClientProfile(profileUserId);
        response.role = "CLIENT";
      }

      setProfileData(response);
      await fetchRelatedData(response);
    } catch (error) {
      console.error("Error fetching profile:", error);
      Alert.alert(
        "Error",
        "Failed to load profile data. Please check your connection and try again.",
        [
          { text: "Retry", onPress: () => fetchProfile() },
          { text: "Go Back", onPress: () => navigation.goBack() },
        ]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchRelatedData, navigation, profileUserId, userData]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProfile();
  }, [fetchProfile]);

  const openImageModal = (image, imageSet = portfolioImages) => {
    const currentUri = getImageUri(image);
    if (!currentUri) return;

    const images = imageSet
      .map((item) => ({ url: getImageUri(item) }))
      .filter((item) => item.url);
    const startIndex = Math.max(
      images.findIndex((item) => item.url === currentUri),
      0
    );

    setViewerImages([...images.slice(startIndex), ...images.slice(0, startIndex)]);
    setViewerVisible(true);
  };

  const handleShare = async () => {
    try {
      const idToShare = profileData?.userId || profileData?.user?.id || profileUserId;
      if (!idToShare) {
        Alert.alert("Error", "Unable to share profile - user ID not found");
        return;
      }

      const webLink = `https://birdearner.com/profile/${idToShare}`;
      await Share.share({
        title: `${displayName}'s Bird Earner Profile`,
        message: `Check out this Bird Earner profile:\n\n${displayName}\n${profileTitle}\n\n${webLink}`,
      });
    } catch (error) {
      console.error("Share error:", error);
      Alert.alert("Error", "Failed to share the profile.");
    }
  };

  const handleServicePress = async (service) => {
    if (!service?.id) return;

    if (userData?.role !== "CLIENT") {
      showToast("info", "Service", service.name || "Service details loaded");
      return;
    }

    try {
      await AsyncStorage.setItem(
        "selectedService",
        JSON.stringify({
          serviceId: service.id,
          serviceName: service.name,
          serviceType: service.category === "FREELANCE" ? "freelance" : "household",
        })
      );
      navigation.navigate("MainTabs", { screen: "Job Requirements" });
    } catch (error) {
      console.error("Failed to start job request:", error);
      Alert.alert("Error", "Unable to start a job request for this service.");
    }
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.centered}>
        <SafeSpinner size={42} color={PURPLE} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <Modal
        visible={viewerVisible}
        transparent
        onRequestClose={() => setViewerVisible(false)}
      >
        <ImageViewer
          imageUrls={viewerImages}
          enableSwipeDown
          onSwipeDown={() => setViewerVisible(false)}
          renderIndicator={() => null}
          renderHeader={() => (
            <TouchableOpacity
              onPress={() => setViewerVisible(false)}
              style={styles.modalHeader}
            >
              <FontAwesome name="arrow-left" size={24} color="#fff" />
            </TouchableOpacity>
          )}
        />
      </Modal>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[PURPLE]}
            progressBackgroundColor="#fff"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <ProfileHero
          uiStyles={uiStyles}
          profileData={profileData}
          displayName={displayName}
          profileTitle={profileTitle}
          rating={averageRating}
          totalReviews={totalReviews}
          onBack={() => navigation.goBack()}
          onShare={handleShare}
          onPhotoPress={() => openImageModal(profileData?.profilePhoto, [profileData?.profilePhoto])}
        />

        <ProfileTabs uiStyles={uiStyles} activeTab={activeTab} onTabPress={setActiveTab} />

        <View style={styles.contentPanel}>
          {activeTab === "About" && (
            <AboutTab
              uiStyles={uiStyles}
              profileData={profileData}
              services={services}
              certifications={certifications}
              selectedServices={selectedServices}
            />
          )}

          {activeTab === "Services" && (
            <ServicesTab uiStyles={uiStyles} services={services} onServicePress={handleServicePress} />
          )}

          {activeTab === "Reviews" && (
            <ReviewsTab uiStyles={uiStyles} reviews={reviews} stats={reviewStats} />
          )}

          {activeTab === "Portfolio" && (
            <PortfolioTab
              uiStyles={uiStyles}
              images={portfolioImages}
              onImagePress={openImageModal}
              isFreelancerProfile={isFreelancerProfile}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileHero({
  uiStyles,
  profileData,
  displayName,
  profileTitle,
  rating,
  totalReviews,
  onBack,
  onShare,
  onPhotoPress,
}) {
  const photoUri = getImageUri(profileData?.profilePhoto);
  const available = profileData?.currentlyAvailable !== false;

  return (
    <View style={uiStyles.hero}>
      <View style={uiStyles.topBar}>
        <TouchableOpacity style={uiStyles.iconButton} onPress={onBack}>
          <MaterialIcons name="arrow-back" size={28} color={uiStyles.iconColor.color} />
        </TouchableOpacity>
        <TouchableOpacity style={uiStyles.shareButton} onPress={onShare}>
          <MaterialIcons name="share" size={24} color={PURPLE} />
          <Text style={uiStyles.shareText}>Share profile</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={uiStyles.avatarButton}
        onPress={onPhotoPress}
        disabled={!photoUri}
        activeOpacity={0.85}
      >
        <View style={uiStyles.avatarRing}>
          <Image
            source={photoUri ? { uri: photoUri } : require("../assets/profile.png")}
            style={uiStyles.avatar}
          />
        </View>
        <View style={[uiStyles.statusDot, !available && uiStyles.statusDotMuted]} />
      </TouchableOpacity>

      <Text style={uiStyles.name}>{displayName}</Text>
      <Text style={uiStyles.title}>{profileTitle}</Text>

      <View style={uiStyles.ratingRow}>
        <Text style={uiStyles.ratingText}>{formatRating(rating)}</Text>
        <Text style={uiStyles.reviewCount}>({totalReviews})</Text>
        <View style={uiStyles.badge}>
          <MaterialIcons name="workspace-premium" size={20} color={PURPLE} />
          <Text style={uiStyles.badgeText}>{getBadgeLabel(profileData?.level)}</Text>
        </View>
      </View>
    </View>
  );
}

function ProfileTabs({ uiStyles, activeTab, onTabPress }) {
  return (
    <View style={uiStyles.tabShell}>
      {TABS.map((tab) => {
        const active = activeTab === tab;
        return (
          <TouchableOpacity
            key={tab}
            style={uiStyles.tabButton}
            onPress={() => onTabPress(tab)}
            activeOpacity={0.8}
          >
            <Text style={[uiStyles.tabText, active && uiStyles.tabTextActive]}>
              {tab}
            </Text>
            <View style={[uiStyles.tabIndicator, active && uiStyles.tabIndicatorActive]} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function AboutTab({ uiStyles, profileData, services, certifications, selectedServices }) {
  const primaryService = services?.[0]?.category
    ? services[0].category === "FREELANCE"
      ? "Remote"
      : "On-site"
    : "Remote";

  const skills = services.length
    ? services.map((service) => service.name)
    : selectedServices.map((serviceId) => `Service ${serviceId.slice(0, 6)}`);

  return (
    <View style={uiStyles.section}>
      <Text style={uiStyles.sectionTitle}>About me</Text>
      <Text style={uiStyles.description}>
        {profileData?.profileDescription || "No description available"}
      </Text>

      <View style={uiStyles.infoList}>
        <InfoRow
          uiStyles={uiStyles}
          icon="work-outline"
          label="Experience"
          value={formatExperience(profileData?.experience)}
        />
        <InfoRow
          uiStyles={uiStyles}
          icon="leaderboard"
          label="Level"
          value={`Lev. ${profileData?.level || 1} ${getBadgeLabel(profileData?.level).replace(" Badge", "")}`}
        />
        <InfoRow
          uiStyles={uiStyles}
          icon="public"
          label="Freelancer category"
          value={primaryService}
        />
        <InfoRow
          uiStyles={uiStyles}
          icon="place"
          label="From"
          value={formatLocation(profileData)}
        />
        <InfoRow
          uiStyles={uiStyles}
          icon="calendar-today"
          label="Member Since"
          value={formatMemberSince(profileData?.createdAt)}
        />
      </View>

      <Text style={uiStyles.sectionTitle}>Skills</Text>
      <View style={uiStyles.chips}>
        {skills.length ? (
          skills.map((skill) => (
            <View key={skill} style={uiStyles.skillChip}>
              <Text style={uiStyles.skillText}>{skill}</Text>
            </View>
          ))
        ) : (
          <Text style={uiStyles.emptyText}>No skills added yet</Text>
        )}
      </View>

      <Text style={uiStyles.sectionTitle}>Certification</Text>
      {certifications.length ? (
        certifications.map((cert, index) => (
          <View key={`${cert}-${index}`} style={uiStyles.certCard}>
            <View style={uiStyles.certTextWrap}>
              <Text style={uiStyles.certTitle}>{cert}</Text>
              <Text style={uiStyles.certSubtitle}>
                {profileData?.highestQualification || "Qualification added"}
              </Text>
            </View>
          </View>
        ))
      ) : (
        <View style={uiStyles.certCard}>
          <View style={uiStyles.certTextWrap}>
            <Text style={uiStyles.certTitle}>
              {profileData?.highestQualification || "No certification added"}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

function InfoRow({ uiStyles, icon, label, value }) {
  return (
    <View style={uiStyles.infoRow}>
      <MaterialIcons name={icon} size={28} color={PURPLE} />
      <Text style={uiStyles.infoLabel}>{label}</Text>
      <Text style={uiStyles.infoValue}>{value}</Text>
    </View>
  );
}

function ServicesTab({ uiStyles, services, onServicePress }) {
  return (
    <View style={uiStyles.section}>
      {services.length ? (
        services.map((service) => (
          <TouchableOpacity
            key={service.id}
            style={uiStyles.serviceCard}
            onPress={() => onServicePress(service)}
            activeOpacity={0.85}
          >
            <View style={uiStyles.serviceImageWrap}>
              {service.imageUrl ? (
                <Image
                  source={{ uri: getImageUri(service.imageUrl) }}
                  style={uiStyles.serviceImage}
                />
              ) : (
                <Text style={uiStyles.serviceImageText}>Image here</Text>
              )}
            </View>
            <View style={uiStyles.serviceBody}>
              <Text style={uiStyles.serviceTitle} numberOfLines={2}>
                {service.name}
              </Text>
              <Text style={uiStyles.serviceDescription} numberOfLines={2}>
                {service.description || "Service details available on request"}
              </Text>
            </View>
            <View style={uiStyles.serviceMeta}>
              <Text style={uiStyles.fromText}>
                {service.category === "FREELANCE" ? "Remote" : "On-site"}
              </Text>
              <MaterialIcons name="chevron-right" size={24} color={PURPLE} />
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <EmptyState uiStyles={uiStyles} icon="design-services" title="No services yet" />
      )}
    </View>
  );
}

function ReviewsTab({ uiStyles, reviews, stats }) {
  const average = stats?.averageRating || 0;
  const total = stats?.totalReviews || reviews.length || 0;

  return (
    <View style={uiStyles.section}>
      <View style={uiStyles.reviewSummary}>
        <Text style={uiStyles.summaryRating}>{formatRating(average)}</Text>
        <Text style={uiStyles.summaryLabel}>Average rating</Text>
        <Text style={uiStyles.summaryCount}>{total} review{total === 1 ? "" : "s"}</Text>
      </View>

      {reviews.length ? (
        reviews.map((review) => (
          <View key={review.id} style={uiStyles.reviewCard}>
            <View style={uiStyles.reviewHeader}>
              <Image
                source={
                  review.reviewer?.profilePhoto
                    ? { uri: getImageUri(review.reviewer.profilePhoto) }
                    : require("../assets/profile.png")
                }
                style={uiStyles.reviewAvatar}
              />
              <View style={uiStyles.reviewMeta}>
                <Text style={uiStyles.reviewerName}>
                  {review.reviewer?.user?.fullName || "Bird Earner user"}
                </Text>
                <View style={uiStyles.reviewStars}>
                  {[1, 2, 3, 4, 5].map((item) => (
                    <FontAwesome
                      key={item}
                      name={item <= Number(review.rating || 0) ? "star" : "star-o"}
                      size={15}
                      color={PURPLE}
                    />
                  ))}
                </View>
              </View>
              <Text style={uiStyles.reviewDate}>
                {formatMemberSince(review.createdAt)}
              </Text>
            </View>
            <Text style={uiStyles.reviewText}>
              {review.reviewText || "No review text provided"}
            </Text>
          </View>
        ))
      ) : (
        <EmptyState uiStyles={uiStyles} icon="rate-review" title="No reviews yet" />
      )}
    </View>
  );
}

function PortfolioTab({ uiStyles, images, onImagePress, isFreelancerProfile }) {
  if (!isFreelancerProfile) {
    return (
      <View style={uiStyles.section}>
        <EmptyState uiStyles={uiStyles} icon="collections" title="Portfolio is available for freelancers" />
      </View>
    );
  }

  return (
    <View style={uiStyles.portfolioPanel}>
      {images.length ? (
        <>
          <View style={uiStyles.portfolioGrid}>
            {images.map((image, index) => (
              <TouchableOpacity
                key={`${getImageUri(image)}-${index}`}
                style={[
                  uiStyles.portfolioTile,
                  index === 0 && uiStyles.portfolioTileLarge,
                ]}
                onPress={() => onImagePress(image, images)}
                activeOpacity={0.85}
              >
                <Image
                  source={{ uri: getImageUri(image) }}
                  style={uiStyles.portfolioImage}
                />
              </TouchableOpacity>
            ))}
          </View>
        </>
      ) : (
        <View style={uiStyles.portfolioGrid}>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((item) => (
            <View
              key={item}
              style={[
                uiStyles.portfolioPlaceholder,
                item === 0 && uiStyles.portfolioPlaceholderLarge,
              ]}
            >
              <Text style={uiStyles.plus}>+</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function EmptyState({ uiStyles, icon, title }) {
  return (
    <View style={uiStyles.emptyState}>
      <MaterialIcons name={icon} size={34} color={PURPLE} />
      <Text style={uiStyles.emptyTitle}>{title}</Text>
    </View>
  );
}

const getStyles = (currentTheme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: currentTheme.background || "#FFFFFF",
    },
    container: {
      flex: 1,
      backgroundColor: currentTheme.background || "#FFFFFF",
    },
    scrollContent: {
      paddingBottom: 28,
    },
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: currentTheme.background || "#FFFFFF",
    },
    contentPanel: {
      backgroundColor: currentTheme.background || "#FFFFFF",
    },
    modalHeader: {
      paddingTop: 42,
      paddingLeft: 20,
      zIndex: 10,
    },
  });

const getProfileStyles = (currentTheme) => {
  const surface = currentTheme.background || "#FFFFFF";
  const card = currentTheme.cardBackground || surface;
  const text = currentTheme.text || TEXT;
  const muted = currentTheme.subText || MUTED;
  const border = currentTheme.border || BORDER;
  const softSurface = currentTheme.background3 || "#F6F3FA";
  const badgeSurface = currentTheme.background2 || SOFT_PURPLE;
  const tabSurface = surface === "#000000" ? "#13091F" : DEEP_PURPLE;

  return StyleSheet.create({
  iconColor: {
    color: text,
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
  name: {
    marginTop: 18,
    color: text,
    fontSize: 34,
    fontWeight: "800",
    textAlign: "center",
  },
  title: {
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
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  tabText: {
    color: "#A8A6B0",
    fontSize: 16,
    fontWeight: "700",
  },
  tabTextActive: {
    color: "#C36DFF",
  },
  tabIndicator: {
    height: 4,
    width: "78%",
    borderRadius: 3,
    backgroundColor: "transparent",
    marginTop: 8,
  },
  tabIndicatorActive: {
    backgroundColor: "#B65CFF",
  },
  section: {
    paddingHorizontal: 26,
    paddingTop: 28,
  },
  sectionTitle: {
    color: text,
    fontSize: 23,
    fontWeight: "800",
    marginBottom: 18,
    marginTop: 6,
  },
  description: {
    color: muted,
    fontSize: 17,
    lineHeight: 25,
    marginBottom: 22,
  },
  infoList: {
    borderTopWidth: 1,
    borderTopColor: border,
    marginBottom: 26,
  },
  infoRow: {
    minHeight: 72,
    borderBottomWidth: 1,
    borderBottomColor: border,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  infoLabel: {
    flex: 1.2,
    color: muted,
    fontSize: 16,
  },
  infoValue: {
    flex: 1.45,
    color: text,
    fontSize: 16,
    fontWeight: "600",
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 30,
  },
  skillChip: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#C995FF",
    backgroundColor: card,
  },
  skillText: {
    color: PURPLE,
    fontSize: 16,
    fontWeight: "700",
  },
  certCard: {
    borderWidth: 1,
    borderColor: border,
    borderRadius: 12,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 12,
    backgroundColor: card,
  },
  certTextWrap: {
    flex: 1,
  },
  certTitle: {
    color: text,
    fontSize: 16,
    fontWeight: "800",
  },
  certSubtitle: {
    color: muted,
    fontSize: 15,
    marginTop: 6,
  },
  serviceCard: {
    minHeight: 144,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: border,
    backgroundColor: card,
    padding: 12,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#2C1B3F",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  serviceImageWrap: {
    width: 112,
    height: 112,
    borderRadius: 10,
    backgroundColor: softSurface,
    borderWidth: 1,
    borderColor: border,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  serviceImage: {
    width: "100%",
    height: "100%",
  },
  serviceImageText: {
    color: muted,
    fontSize: 16,
    textAlign: "center",
  },
  serviceBody: {
    flex: 1,
    paddingHorizontal: 16,
  },
  serviceTitle: {
    color: text,
    fontSize: 19,
    fontWeight: "800",
    lineHeight: 25,
  },
  serviceDescription: {
    color: muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  serviceMeta: {
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 8,
  },
  fromText: {
    color: muted,
    fontSize: 13,
    fontWeight: "600",
  },
  reviewSummary: {
    borderRadius: 16,
    backgroundColor: badgeSurface,
    alignItems: "center",
    paddingVertical: 22,
    marginBottom: 18,
  },
  summaryRating: {
    color: PURPLE,
    fontSize: 46,
    fontWeight: "900",
  },
  summaryLabel: {
    color: text,
    fontSize: 16,
    fontWeight: "700",
  },
  summaryCount: {
    color: muted,
    fontSize: 15,
    marginTop: 4,
  },
  reviewCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: border,
    padding: 16,
    marginBottom: 14,
    backgroundColor: card,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  reviewAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
  reviewStars: {
    flexDirection: "row",
    gap: 3,
    marginTop: 4,
  },
  reviewDate: {
    color: muted,
    fontSize: 12,
  },
  reviewText: {
    color: muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 14,
  },
  portfolioPanel: {
    marginTop: -1,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 26,
    backgroundColor: card,
  },
  portfolioGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  portfolioTile: {
    width: "31.6%",
    aspectRatio: 1,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: softSurface,
  },
  portfolioTileLarge: {
    width: "64.8%",
    aspectRatio: 1,
  },
  portfolioImage: {
    width: "100%",
    height: "100%",
  },
  portfolioPlaceholder: {
    width: "31.6%",
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: softSurface,
    alignItems: "center",
    justifyContent: "center",
  },
  portfolioPlaceholderLarge: {
    width: "64.8%",
    aspectRatio: 1,
  },
  plus: {
    color: "#8E73C6",
    fontSize: 36,
    fontWeight: "300",
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
    color: muted,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 10,
    textAlign: "center",
  },
  emptyText: {
    color: muted,
    fontSize: 16,
  },
});
};
