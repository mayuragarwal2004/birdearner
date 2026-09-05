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
const FREELANCER_TABS = ["About", "Services", "Reviews", "Portfolio"];
const CLIENT_TABS = ["About", "Reviews"];

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

const getProfileTitle = (profileData) => {
  const role = typeof profileData === "string" ? profileData : (profileData?.role || profileData?.user?.role);
  if (role === "CLIENT") {
    return "Client";
  }
  return "Freelancer";
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
  const { receiverId, userId, role: paramRole, isFreelancer } = route.params || {};
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
  const isClientProfile = profileData?.role === "CLIENT";
  const displayName = getDisplayName(profileData);
  const profileTitle = getProfileTitle(profileData, services);
  const averageRating =
    reviewStats?.averageRating || profileData?.rating || 0;
  const totalReviews =
    reviewStats?.totalReviews ?? reviews.length ?? 0;
  const profileTabs = isClientProfile ? CLIENT_TABS : FREELANCER_TABS;

  const fetchRelatedData = useCallback(async (profile) => {
    try {
      const nextServices = await apiService.loadServicesFromSelected(profile);
      setServices(nextServices);
    } catch (error) {
      console.warn("Failed to load services for profile:", error.message);
      setServices([]);
    }

    const reviewUserId = profile?.userId || profile?.user?.id;
    if (!reviewUserId) {
      setReviews([]);
      setReviewStats(null);
      return;
    }

    const isClient = profile?.role === "CLIENT";

    try {
      if (isClient) {
        const [reviewList, statsObj] = await Promise.all([
          apiService.getReviewsGivenByUserId(reviewUserId),
          apiService.getReviewStatsGiven(reviewUserId),
        ]);
        setReviews(Array.isArray(reviewList) ? reviewList : []);
        setReviewStats(statsObj);
      } else {
        const [reviewList, statsObj] = await Promise.all([
          apiService.getReviewsByUserId(reviewUserId),
          apiService.getReviewStats(reviewUserId),
        ]);
        setReviews(Array.isArray(reviewList) ? reviewList : []);
        setReviewStats(statsObj);
      }
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
      const targetRole = paramRole || (isFreelancer ? "FREELANCER" : null);

      if (targetRole === "FREELANCER") {
        response = await apiService.getFreelancerProfile(profileUserId);
        response.role = "FREELANCER";
      } else if (targetRole === "CLIENT") {
        response = await apiService.getClientProfile(profileUserId);
        response.role = "CLIENT";
      } else {
        // Attempt freelancer profile lookup first
        try {
          response = await apiService.getFreelancerProfile(profileUserId);
          if (response && (response.id || response.userId || response.selectedServices || response.experience !== undefined)) {
            response.role = "FREELANCER";
          } else {
            throw new Error("Not a freelancer profile");
          }
        } catch {
          response = await apiService.getClientProfile(profileUserId);
          response.role = "CLIENT";
        }
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
  }, [fetchRelatedData, isFreelancer, navigation, paramRole, profileUserId, userData]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Reset active tab when profile data changes
  useEffect(() => {
    if (profileData) {
      setActiveTab("About");
    }
  }, [profileData?.role]);

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

        <ProfileTabs uiStyles={uiStyles} activeTab={activeTab} onTabPress={setActiveTab} tabs={profileTabs} />

        <View style={styles.contentPanel}>
          {activeTab === "About" && (
            isClientProfile ? (
              <ClientAboutTab
                uiStyles={uiStyles}
                profileData={profileData}
              />
            ) : (
              <AboutTab
                uiStyles={uiStyles}
                profileData={profileData}
                services={services}
                certifications={certifications}
                selectedServices={selectedServices}
              />
            )
          )}

          {activeTab === "Services" && !isClientProfile && (
            <ServicesTab uiStyles={uiStyles} services={services} onServicePress={handleServicePress} />
          )}

          {activeTab === "Reviews" && (
            <ReviewsTab uiStyles={uiStyles} reviews={reviews} isClientProfile={isClientProfile} />
          )}

          {activeTab === "Portfolio" && !isClientProfile && (
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
          <MaterialIcons name="arrow-back" size={24} color="#101114" />
        </TouchableOpacity>
        <TouchableOpacity style={uiStyles.shareButton} onPress={onShare}>
          <MaterialIcons name="share" size={20} color={PURPLE} />
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
          <MaterialIcons name="workspace-premium" size={16} color={PURPLE} />
          <Text style={uiStyles.badgeText}>{getBadgeLabel(profileData?.level)}</Text>
        </View>
      </View>
    </View>
  );
}

function ProfileTabs({ uiStyles, activeTab, onTabPress, tabs }) {
  return (
    <View style={uiStyles.tabShell}>
      {tabs.map((tab) => {
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
            {active && <View style={uiStyles.tabIndicatorActive} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function ClientAboutTab({ uiStyles, profileData }) {
  const languages = parseArray(profileData?.languages);

  return (
    <View style={uiStyles.section}>
      <Text style={uiStyles.sectionTitle}>About me</Text>
      <Text style={uiStyles.description}>
        {profileData?.profileDescription || "No description available"}
      </Text>

      <View style={uiStyles.infoList}>
        <InfoRow
          uiStyles={uiStyles}
          icon="person"
          label="Role"
          value="Client"
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

      {languages.length > 0 && (
        <>
          <Text style={uiStyles.sectionTitle}>Languages</Text>
          <View style={uiStyles.languageList}>
            {languages.map((lang, idx) => (
              <View key={idx} style={uiStyles.infoRow}>
                <MaterialIcons name="g-translate" size={22} color={PURPLE} />
                <Text style={uiStyles.infoLabel}>
                  {typeof lang === 'string' ? lang : lang.name || lang.language || 'English'}
                </Text>
                <Text style={uiStyles.infoValue}>
                  {typeof lang === 'object' && lang.proficiency ? lang.proficiency : 'Fluent'}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

function AboutTab({ uiStyles, profileData, services, certifications, selectedServices }) {
  const primaryService = services?.[0]?.category
    ? services[0].category === "FREELANCE"
      ? "Remote"
      : "On-site"
    : profileData?.category || "Remote";

  const skills = (
    services.length
      ? services.map((service) => service.name)
      : parseArray(profileData?.skills)
  ).filter((s) => s && typeof s === "string" && !isUUIDString(s));

  const languages = parseArray(profileData?.languages);

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

      {languages.length > 0 && (
        <>
          <Text style={uiStyles.sectionTitle}>Languages</Text>
          <View style={uiStyles.languageList}>
            {languages.map((lang, idx) => (
              <View key={idx} style={uiStyles.infoRow}>
                <MaterialIcons name="g-translate" size={22} color={PURPLE} />
                <Text style={uiStyles.infoLabel}>
                  {typeof lang === 'string' ? lang : lang.name || lang.language || 'English'}
                </Text>
                <Text style={uiStyles.infoValue}>
                  {typeof lang === 'object' && lang.proficiency ? lang.proficiency : 'Fluent'}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      <Text style={uiStyles.sectionTitle}>Skills</Text>
      <View style={uiStyles.chips}>
        {skills.length ? (
          skills.map((skill, idx) => (
            <View key={`${skill}-${idx}`} style={uiStyles.skillChip}>
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
            <MaterialIcons name="workspace-premium" size={30} color={PURPLE} />
            <View style={uiStyles.certTextWrap}>
              <Text style={uiStyles.certTitle}>{typeof cert === 'string' ? cert : cert.name || 'Certification'}</Text>
              <Text style={uiStyles.certSubtitle}>
                {profileData?.highestQualification || "Qualification added"}
              </Text>
            </View>
          </View>
        ))
      ) : profileData?.highestQualification ? (
        <View style={uiStyles.certCard}>
          <MaterialIcons name="workspace-premium" size={30} color={PURPLE} />
          <View style={uiStyles.certTextWrap}>
            <Text style={uiStyles.certTitle}>{profileData.highestQualification}</Text>
          </View>
        </View>
      ) : (
        <Text style={uiStyles.emptyText}>No certifications added yet</Text>
      )}
    </View>
  );
}

function InfoRow({ uiStyles, icon, label, value }) {
  return (
    <View style={uiStyles.infoRow}>
      <MaterialIcons name={icon} size={22} color={PURPLE} />
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
            key={service.id || service.name}
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
              <View style={uiStyles.servicePriceRow}>
                <Text style={uiStyles.fromPrefix}>From </Text>
                <Text style={uiStyles.priceText}>
                  ₹{service.price || service.pricing?.price || service.startingPrice || service.budget || 0}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <EmptyState uiStyles={uiStyles} icon="design-services" title="No services added yet" />
      )}
    </View>
  );
}

function ReviewsTab({ uiStyles, reviews = [], isClientProfile }) {

  return (
    <View style={uiStyles.section}>
      {/* Section Header */}
      <View style={uiStyles.recentReviewsHeader}>
        <Text style={uiStyles.recentReviewsTitle}>
          {isClientProfile ? "Reviews Given" : "Recent Reviews"}
        </Text>
        <Text style={uiStyles.recentReviewsMeta}>{reviews.length} total</Text>
      </View>

      {/* 3. Review items or Empty Card */}
      {reviews.length > 0 ? (
        reviews.map((review) => {
          const displayProfile = isClientProfile
            ? (review.reviewee || review.freelancer || review.user)
            : review.reviewer;
          const displayNameReview = isClientProfile
            ? (displayProfile?.user?.fullName || displayProfile?.fullName || "Bird Earner user")
            : (review.reviewer?.user?.fullName || "Bird Earner user");
          const displayPhoto = isClientProfile
            ? (displayProfile?.profilePhoto || displayProfile?.user?.profilePhoto)
            : review.reviewer?.profilePhoto;

          return (
            <View key={review.id} style={uiStyles.reviewCard}>
              <View style={uiStyles.reviewHeader}>
                <Image
                  source={
                    displayPhoto
                      ? { uri: getImageUri(displayPhoto) }
                      : require("../assets/profile.png")
                  }
                  style={uiStyles.reviewAvatar}
                />
                <View style={uiStyles.reviewMeta}>
                  <Text style={uiStyles.reviewerName}>
                    {displayNameReview}
                  </Text>
                  <View style={uiStyles.reviewStars}>
                    {[1, 2, 3, 4, 5].map((item) => (
                      <FontAwesome
                        key={item}
                        name={item <= Number(review.rating || 0) ? "star" : "star-o"}
                        size={15}
                        color="#A855F7"
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
          );
        })
      ) : (
        <View style={uiStyles.reviewEmptyCard}>
          <View style={uiStyles.purpleIconBox}>
            <MaterialIcons name="rate-review" size={26} color="#FFFFFF" />
          </View>
          <Text style={uiStyles.reviewEmptyTitle}>No reviews yet</Text>
          <Text style={uiStyles.reviewEmptySubtitle}>
            {isClientProfile
              ? "Reviews you've written for freelancers will appear here."
              : "Reviews from completed work will appear here."}
          </Text>
        </View>
      )}
    </View>
  );
}

function PortfolioTab({ uiStyles, images, onImagePress, isFreelancerProfile }) {
  return (
    <View style={uiStyles.portfolioPanel}>
      <View style={uiStyles.portfolioContainer}>
        {/* Top Section: Tall box on left, 2 stacked boxes on right */}
        <View style={uiStyles.portfolioTopRow}>
          <TouchableOpacity
            style={uiStyles.portfolioTallBox}
            onPress={() => images[0] && onImagePress(images[0], images)}
            activeOpacity={images[0] ? 0.85 : 1}
          >
            {images[0] ? (
              <Image source={{ uri: getImageUri(images[0]) }} style={uiStyles.portfolioImage} />
            ) : (
              <Text style={uiStyles.plusIcon}>+</Text>
            )}
          </TouchableOpacity>

          <View style={uiStyles.portfolioRightCol}>
            <TouchableOpacity
              style={uiStyles.portfolioSmallBox}
              onPress={() => images[1] && onImagePress(images[1], images)}
              activeOpacity={images[1] ? 0.85 : 1}
            >
              {images[1] ? (
                <Image source={{ uri: getImageUri(images[1]) }} style={uiStyles.portfolioImage} />
              ) : (
                <Text style={uiStyles.plusIcon}>+</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={uiStyles.portfolioSmallBox}
              onPress={() => images[2] && onImagePress(images[2], images)}
              activeOpacity={images[2] ? 0.85 : 1}
            >
              {images[2] ? (
                <Image source={{ uri: getImageUri(images[2]) }} style={uiStyles.portfolioImage} />
              ) : (
                <Text style={uiStyles.plusIcon}>+</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Row 3: 3 equal square boxes */}
        <View style={uiStyles.portfolioThreeRow}>
          {[3, 4, 5].map((idx) => (
            <TouchableOpacity
              key={idx}
              style={uiStyles.portfolioSquareBox}
              onPress={() => images[idx] && onImagePress(images[idx], images)}
              activeOpacity={images[idx] ? 0.85 : 1}
            >
              {images[idx] ? (
                <Image source={{ uri: getImageUri(images[idx]) }} style={uiStyles.portfolioImage} />
              ) : (
                <Text style={uiStyles.plusIcon}>+</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Row 4: 3 equal square boxes */}
        <View style={uiStyles.portfolioThreeRow}>
          {[6, 7, 8].map((idx) => (
            <TouchableOpacity
              key={idx}
              style={uiStyles.portfolioSquareBox}
              onPress={() => images[idx] && onImagePress(images[idx], images)}
              activeOpacity={images[idx] ? 0.85 : 1}
            >
              {images[idx] ? (
                <Image source={{ uri: getImageUri(images[idx]) }} style={uiStyles.portfolioImage} />
              ) : (
                <Text style={uiStyles.plusIcon}>+</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Row 5: 1 full-width horizontal bar box */}
        <TouchableOpacity
          style={uiStyles.portfolioFullBar}
          onPress={() => images[9] && onImagePress(images[9], images)}
          activeOpacity={images[9] ? 0.85 : 1}
        >
          {images[9] ? (
            <Image source={{ uri: getImageUri(images[9]) }} style={uiStyles.portfolioImage} />
          ) : (
            <Text style={uiStyles.plusIcon}>+</Text>
          )}
        </TouchableOpacity>
      </View>
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
      paddingBottom: 32,
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
  const border = currentTheme.border || "#E5E7EB";

  return StyleSheet.create({
    iconColor: {
      color: text,
    },
    hero: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 16,
      alignItems: "center",
      backgroundColor: surface,
    },
    topBar: {
      width: "100%",
      height: 44,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    iconButton: {
      width: 40,
      height: 40,
      alignItems: "flex-start",
      justifyContent: "center",
    },
    shareButton: {
      height: 40,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    shareText: {
      color: PURPLE,
      fontSize: 15,
      fontWeight: "600",
    },
    avatarButton: {
      alignItems: "center",
      justifyContent: "center",
    },
    avatarRing: {
      width: 124,
      height: 124,
      borderRadius: 62,
      borderWidth: 2.5,
      borderColor: "#B05CFF",
      padding: 3,
      backgroundColor: surface,
    },
    avatar: {
      width: "100%",
      height: "100%",
      borderRadius: 58,
      backgroundColor: "#F3EAFF",
    },
    statusDot: {
      position: "absolute",
      right: 4,
      bottom: 4,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: "#A857F4",
      borderWidth: 3,
      borderColor: surface,
    },
    statusDotMuted: {
      backgroundColor: "#B9B1C6",
    },
    name: {
      marginTop: 14,
      color: text,
      fontSize: 24,
      fontWeight: "700",
      textAlign: "center",
    },
    title: {
      marginTop: 4,
      color: muted,
      fontSize: 15,
      textAlign: "center",
      textTransform: "lowercase",
    },
    ratingRow: {
      marginTop: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    ratingText: {
      color: text,
      fontSize: 15,
      fontWeight: "700",
    },
    reviewCount: {
      color: muted,
      fontSize: 14,
    },
    badge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 16,
      backgroundColor: "#F3EAFF",
      borderWidth: 1,
      borderColor: "#E4CAFF",
    },
    badgeText: {
      color: PURPLE,
      fontSize: 13,
      fontWeight: "600",
    },
    tabShell: {
      marginHorizontal: 16,
      marginVertical: 14,
      borderRadius: 16,
      backgroundColor: "#181528",
      flexDirection: "row",
      alignItems: "center",
      height: 50,
      paddingHorizontal: 4,
    },
    tabButton: {
      flex: 1,
      height: "100%",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    },
    tabText: {
      color: "#94A3B8",
      fontSize: 14,
      fontWeight: "500",
    },
    tabTextActive: {
      color: "#C36DFF",
      fontWeight: "600",
    },
    tabIndicatorActive: {
      position: "absolute",
      bottom: 4,
      width: "70%",
      height: 2.5,
      borderRadius: 2,
      backgroundColor: "#B65CFF",
    },
    section: {
      paddingHorizontal: 20,
      paddingTop: 12,
    },
    sectionTitle: {
      color: text,
      fontSize: 18,
      fontWeight: "700",
      marginBottom: 8,
      marginTop: 18,
    },
    description: {
      color: muted,
      fontSize: 14,
      lineHeight: 21,
      marginBottom: 16,
    },
    infoList: {
      borderTopWidth: 1,
      borderTopColor: border,
    },
    infoRow: {
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: border,
      flexDirection: "row",
      alignItems: "center",
    },
    infoLabel: {
      flex: 1.2,
      color: muted,
      fontSize: 14,
      marginLeft: 14,
    },
    infoValue: {
      flex: 1.5,
      color: text,
      fontSize: 14,
      fontWeight: "500",
    },
    languageList: {
      borderTopWidth: 1,
      borderTopColor: border,
      marginBottom: 8,
    },
    chips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginBottom: 12,
    },
    skillChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: "#E9D5FF",
      backgroundColor: card,
    },
    skillText: {
      color: PURPLE,
      fontSize: 13,
      fontWeight: "500",
    },
    certCard: {
      borderWidth: 1,
      borderColor: border,
      borderRadius: 12,
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      marginBottom: 12,
      backgroundColor: card,
    },
    certTextWrap: {
      flex: 1,
    },
    certTitle: {
      color: text,
      fontSize: 14,
      fontWeight: "700",
    },
    certSubtitle: {
      color: muted,
      fontSize: 13,
      marginTop: 4,
    },
    serviceCard: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: border,
      backgroundColor: card,
      padding: 12,
      marginBottom: 12,
      flexDirection: "row",
      alignItems: "center",
    },
    serviceImageWrap: {
      width: 90,
      height: 90,
      borderRadius: 10,
      backgroundColor: "#F4F5F7",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    serviceImage: {
      width: "100%",
      height: "100%",
    },
    serviceImageText: {
      color: "#9CA3AF",
      fontSize: 13,
      textAlign: "center",
    },
    serviceBody: {
      flex: 1,
      marginLeft: 14,
      justifyContent: "space-between",
      height: 85,
    },
    serviceTitle: {
      color: text,
      fontSize: 14,
      fontWeight: "600",
      lineHeight: 19,
    },
    servicePriceRow: {
      alignSelf: "flex-end",
      flexDirection: "row",
      alignItems: "baseline",
    },
    fromPrefix: {
      color: muted,
      fontSize: 13,
      fontWeight: "400",
    },
    priceText: {
      color: PURPLE,
      fontSize: 16,
      fontWeight: "700",
    },
    summaryCard: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: border,
      backgroundColor: card,
      padding: 18,
      marginBottom: 20,
    },
    summaryTop: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      borderBottomWidth: 1,
      borderBottomColor: border,
      paddingBottom: 16,
      marginBottom: 16,
    },
    summaryRating: {
      color: "#8B5CF6",
      fontSize: 46,
      fontWeight: "900",
      lineHeight: 52,
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
      fontSize: 32,
      fontWeight: "800",
    },
    summaryLabel: {
      color: muted,
      fontSize: 14,
      fontWeight: "600",
      marginTop: 2,
    },
    ratingBars: {
      gap: 10,
    },
    ratingBarRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    ratingBarLabel: {
      width: 14,
      color: text,
      fontSize: 14,
      fontWeight: "700",
    },
    ratingBarTrack: {
      flex: 1,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#F3F4F6",
      overflow: "hidden",
    },
    ratingBarFill: {
      height: "100%",
      borderRadius: 4,
      backgroundColor: "#8B5CF6",
    },
    ratingBarCount: {
      width: 20,
      color: muted,
      fontSize: 14,
      textAlign: "right",
      fontWeight: "600",
    },
    recentReviewsHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 6,
      marginBottom: 14,
    },
    recentReviewsTitle: {
      color: text,
      fontSize: 22,
      fontWeight: "800",
    },
    recentReviewsMeta: {
      color: muted,
      fontSize: 15,
      fontWeight: "600",
    },
    reviewEmptyCard: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: border,
      backgroundColor: card,
      paddingVertical: 36,
      paddingHorizontal: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    purpleIconBox: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: "#8B5CF6",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 14,
    },
    reviewEmptyTitle: {
      color: text,
      fontSize: 18,
      fontWeight: "800",
      marginBottom: 6,
    },
    reviewEmptySubtitle: {
      color: muted,
      fontSize: 14,
      textAlign: "center",
      lineHeight: 20,
    },
    reviewCard: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: border,
      padding: 16,
      marginBottom: 12,
      backgroundColor: card,
    },
    reviewHeader: {
      flexDirection: "row",
      alignItems: "center",
    },
    reviewAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: "#F3EAFF",
    },
    reviewMeta: {
      flex: 1,
      marginLeft: 12,
    },
    reviewerName: {
      color: text,
      fontSize: 15,
      fontWeight: "700",
    },
    reviewStars: {
      flexDirection: "row",
      gap: 3,
      marginTop: 3,
    },
    reviewDate: {
      color: muted,
      fontSize: 12,
    },
    reviewText: {
      color: muted,
      fontSize: 14,
      lineHeight: 20,
      marginTop: 12,
    },
    portfolioPanel: {
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    portfolioContainer: {
      backgroundColor: card,
      borderRadius: 16,
      padding: 14,
    },
    portfolioTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    portfolioTallBox: {
      width: "48.5%",
      height: 200,
      borderRadius: 12,
      backgroundColor: "#F5F3FA",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    portfolioRightCol: {
      width: "48.5%",
      height: 200,
      justifyContent: "space-between",
    },
    portfolioSmallBox: {
      width: "100%",
      height: 95,
      borderRadius: 12,
      backgroundColor: "#F5F3FA",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    portfolioThreeRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    portfolioSquareBox: {
      width: "31.5%",
      aspectRatio: 1,
      borderRadius: 12,
      backgroundColor: "#F5F3FA",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    portfolioFullBar: {
      width: "100%",
      height: 56,
      borderRadius: 12,
      backgroundColor: "#F5F3FA",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    plusIcon: {
      color: "#A855F7",
      fontSize: 28,
      fontWeight: "300",
    },
    portfolioImage: {
      width: "100%",
      height: "100%",
    },
    emptyState: {
      minHeight: 180,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 16,
      borderWidth: 1,
      borderColor: border,
      backgroundColor: card,
      padding: 16,
    },
    emptyTitle: {
      color: muted,
      fontSize: 15,
      fontWeight: "600",
      marginTop: 10,
      textAlign: "center",
    },
    emptyText: {
      color: muted,
      fontSize: 14,
    },
  });
};

