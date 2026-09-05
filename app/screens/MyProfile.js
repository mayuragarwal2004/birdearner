import { useAuth } from "../context/NewAuthContext";
import { useTheme } from "../context/ThemeContext";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Share,
  Modal,
  RefreshControl,
  Alert,
} from "react-native";
import SafeSpinner from "../components/SafeSpinner";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import ImageViewer from "react-native-image-zoom-viewer";
import Toast from "react-native-toast-message";
import apiService from "../lib/apiService";

const PURPLE = "#7B2CFF";
const DEEP_PURPLE = "#1B1028";
const TEXT = "#101114";
const MUTED = "#656B7A";
const BORDER = "#E7E1EF";
const SOFT_PURPLE = "#F3EAFF";

// Helper function to show toast messages
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

const getDisplayName = (data, userData) =>
  data?.fullName || data?.user?.fullName || userData?.fullName || "Bird Earner";

const getProfileTitle = (role, data) => {
  const currentRole = role || data?.role;
  if (currentRole === "CLIENT") {
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

const formatLocation = (data, userData) => {
  const parts = [data?.city, data?.state, data?.country || userData?.country].filter(Boolean);
  return parts.length ? parts.join(", ") : "Location not added";
};

const getBadgeLabel = (level) => {
  const value = Number(level || 1);
  if (value >= 10) return "Expert Badge";
  if (value >= 5) return "Pro Badge";
  return "Beginner Badge";
};

const formatRating = (rating) => {
  const value = Number(rating || 0);
  return value ? value.toFixed(1).replace(".0", "") : "0.0";
};

export default function ProfileScreen({ navigation }) {
  const {
    user,
    loading,
    userData,
    refreshUserData,
    userProfile,
    setUserProfile,
  } = useAuth();
  const [data, setData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [images, setImages] = useState([]);
  const [activeTab, setActiveTab] = useState("About");
  const [userServices, setUserServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);

  const role = userData?.role;

  // Update local data when userProfile changes in context
  useEffect(() => {
    if (userProfile) {
      setData(userProfile);
    }
  }, [userProfile]);

  // Load user data when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      refreshUserData();
    });
    return unsubscribe;
  }, [navigation]);

  // Initial load
  useEffect(() => {
    refreshUserData();
  }, []);

  useEffect(() => {
    const loadReviews = async () => {
      const targetUserId = userProfile?.userId || userData?.id;
      if (!targetUserId) return;
      try {
        const isClient = role === "CLIENT";

        if (isClient) {
          const [reviewList, statsObj] = await Promise.all([
            apiService.getReviewsGivenByUserId(targetUserId),
            apiService.getReviewStatsGiven(targetUserId),
          ]);
          setReviews(Array.isArray(reviewList) ? reviewList : []);
          setReviewStats(statsObj);
        } else {
          const [reviewList, statsObj] = await Promise.all([
            apiService.getReviewsByUserId(targetUserId),
            apiService.getReviewStats(targetUserId),
          ]);
          setReviews(Array.isArray(reviewList) ? reviewList : []);
          setReviewStats(statsObj);
        }
      } catch (err) {
        console.warn("Failed to load user reviews:", err.message);
        setReviews([]);
        setReviewStats(null);
      }
    };
    loadReviews();
  }, [userProfile?.userId, userData?.id, role]);

  useEffect(() => {
    const loadServices = async () => {
      try {
        const services = await apiService.loadServicesFromSelected(userProfile || userData);
        setUserServices(services);
      } catch (error) {
        console.error("Error loading services:", error);
        setUserServices([]);
      }
    };

    loadServices();
  }, [userProfile, userData]);

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const styles = getStyles(currentTheme);

  const formattedDate = formatMemberSince(data?.createdAt || userData?.createdAt);

  const onRefresh = async () => {
    console.log("Refreshing...");
    setRefreshing(true);

    try {
      // Refresh user data through auth context
      await refreshUserData();
    } catch (error) {
      console.error("Error refreshing data:", error);
      showToast("error", "Error", "Failed to refresh data");
    } finally {
      setRefreshing(false);
    }
  };

  const formatXP = (xp) => {
    if (xp >= 1000000) {
      return (xp / 1000000).toFixed(1) + "M"; // For millions
    } else if (xp >= 1000) {
      return (xp / 1000).toFixed(1) + "K"; // For thousands
    } else {
      return xp; // For values less than 1000
    }
  };

  const openImageModal = (imageUri, imageSet = [imageUri]) => {
    const currentUri = getImageUri(imageUri);
    if (!currentUri) return;

    const normalizedImages = imageSet
      .map((item) => ({ url: getImageUri(item) }))
      .filter((item) => item.url);
    const startIndex = Math.max(
      normalizedImages.findIndex((item) => item.url === currentUri),
      0
    );

    setImages([
      ...normalizedImages.slice(startIndex),
      ...normalizedImages.slice(0, startIndex),
    ]);
    setModalVisible(true);
  };

  const handleShare = async () => {
    try {
      const idToShare = data?.userId || data?.user?.id || userData?.id;
      if (!idToShare) {
        Alert.alert("Error", "Unable to share profile - user ID not found");
        return;
      }

      const name = getDisplayName(data, userData);
      const title = getProfileTitle(role, data, userServices);
      const webLink = `https://birdearner.com/profile/${idToShare}`;
      await Share.share({
        title: `${name}'s Bird Earner Profile`,
        message: `Check out ${role === "CLIENT" ? "my client" : "my freelancer"} profile on Bird Earner:\n\n${name}\n${title}\n\n${webLink}`,
      });
    } catch (error) {
      console.error("Share error:", error);
      Alert.alert("Error", "Failed to share the profile.");
    }
  };

  if (loading || loadingProfile) {
    return (
      <SafeAreaView style={styles.centered}>
        <SafeSpinner size={42} color={currentTheme.text || "#fff"} />
      </SafeAreaView>
    );
  }

  const displayName = getDisplayName(data, userData);
  const profileTitle = getProfileTitle(role, data, userServices);
  const profilePhotoUri = getImageUri(data?.profilePhoto);
  const portfolioImages = parseArray(data?.portfolioImages);
  const certifications = parseArray(data?.certifications);
  const isAvailable = data?.currentlyAvailable !== false;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <Modal
        visible={modalVisible}
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <ImageViewer
          imageUrls={images}
          enableSwipeDown={true}
          onSwipeDown={() => setModalVisible(false)}
          renderIndicator={() => null}
          renderHeader={() => (
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.modalHeader}
            >
              <FontAwesome
                name="arrow-left"
                size={24}
                color={currentTheme.text || "#fff"}
              />
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
            colors={["#3b006b"]}
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

          <TouchableOpacity
            style={styles.avatarButton}
            onPress={() => openImageModal(data?.profilePhoto)}
            disabled={!profilePhotoUri}
            activeOpacity={0.85}
          >
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
            <View
              style={[
                styles.statusDot,
                !isAvailable && styles.statusDotMuted,
              ]}
            />
          </TouchableOpacity>

          <Text style={styles.nameText}>{displayName}</Text>
          <Text style={styles.roleText}>{profileTitle}</Text>

          <View style={styles.ratingRow}>
            {role === "FREELANCER" ? (
              <>
                <Text style={styles.ratingText}>{formatRating(data?.rating || 0)}</Text>
                <Text style={styles.reviewCount}>({data?.totalReviews || 0})</Text>
                <View style={styles.badge}>
                  <MaterialIcons name="workspace-premium" size={20} color={PURPLE} />
                  <Text style={styles.badgeText}>{getBadgeLabel(data?.level)}</Text>
                </View>
              </>
            ) : (
              <View style={styles.badge}>
                <MaterialIcons name="business-center" size={20} color={PURPLE} />
                <Text style={styles.badgeText}>Client Profile</Text>
              </View>
            )}
          </View>
        </View>

        {role === "FREELANCER" ? (
          <View style={styles.freelancerTabShell}>
            {["About", "Services", "Reviews", "Portfolio"].map((tab) => {
              const active = activeTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={styles.freelancerTabButton}
                  onPress={() => setActiveTab(tab)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.freelancerTabText, active && styles.freelancerTabTextActive]}>
                    {tab}
                  </Text>
                  {active && <View style={styles.freelancerTabIndicatorActive} />}
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.freelancerTabShell}>
            {[
              { key: "About", label: "About Me" },
              { key: "Reviews", label: "Reviews" },
            ].map(({ key, label }) => {
              const active = activeTab === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={styles.freelancerTabButton}
                  onPress={() => setActiveTab(key)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.freelancerTabText, active && styles.freelancerTabTextActive]}>
                    {label}
                  </Text>
                  {active && <View style={styles.freelancerTabIndicatorActive} />}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={styles.profileContent}>
          {role === "FREELANCER" ? (
            <>
              {activeTab === "About" && (
                <View>
                  <Text style={styles.sectionTitleLeft}>About me</Text>
                  <Text style={styles.aboutDescription}>
                    {data?.profileDescription || "No description available"}
                  </Text>

                  <View style={styles.infoList}>
                    <InfoRow
                      styles={styles}
                      icon="work-outline"
                      label="Experience"
                      value={formatExperience(data?.experience)}
                    />
                    <InfoRow
                      styles={styles}
                      icon="leaderboard"
                      label="Level"
                      value={`Lev. ${data?.level || 1} ${getBadgeLabel(data?.level).replace(" Badge", "")}`}
                    />
                    <InfoRow
                      styles={styles}
                      icon="public"
                      label="Freelancer category"
                      value={
                        userServices?.[0]?.category === "HOUSEHOLD"
                          ? "On-site"
                          : "Remote"
                      }
                    />
                    <InfoRow
                      styles={styles}
                      icon="place"
                      label="From"
                      value={formatLocation(data, userData)}
                    />
                    <InfoRow
                      styles={styles}
                      icon="calendar-today"
                      label="Member Since"
                      value={formattedDate}
                    />
                  </View>

                  {parseArray(data?.languages).length > 0 && (
                    <>
                      <Text style={styles.sectionTitleLeft}>Languages</Text>
                      <View style={styles.languageList}>
                        {parseArray(data?.languages).map((lang, idx) => (
                          <View key={idx} style={styles.infoRow}>
                            <MaterialIcons name="g-translate" size={22} color={PURPLE} />
                            <Text style={styles.infoLabel}>
                              {typeof lang === 'string' ? lang : lang.name || lang.language || 'English'}
                            </Text>
                            <Text style={styles.infoValue}>
                              {typeof lang === 'object' && lang.proficiency ? lang.proficiency : 'Fluent'}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </>
                  )}

                  <Text style={styles.sectionTitleLeft}>Skills</Text>
                  <View style={styles.chips}>
                    {userServices.length ? (
                      userServices.map((service) => (
                        <View key={service.id || service.name} style={styles.skillChip}>
                          <Text style={styles.skillText}>{service.name}</Text>
                        </View>
                      ))
                    ) : parseArray(data?.skills).length ? (
                      parseArray(data?.skills).map((skill, idx) => (
                        <View key={idx} style={styles.skillChip}>
                          <Text style={styles.skillText}>{typeof skill === 'string' ? skill : skill.name}</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.emptyText}>No skills added yet</Text>
                    )}
                  </View>

                  <Text style={styles.sectionTitleLeft}>Certification</Text>
                  {certifications.length ? (
                    certifications.map((cert, index) => (
                      <View key={`${cert}-${index}`} style={styles.certCard}>
                        <MaterialIcons name="workspace-premium" size={30} color={PURPLE} />
                        <View style={styles.certTextWrap}>
                          <Text style={styles.certTitle}>{typeof cert === 'string' ? cert : cert.name || 'Certification'}</Text>
                          <Text style={styles.certSubtitle}>
                            {data?.highestQualification || "Qualification added"}
                          </Text>
                        </View>
                      </View>
                    ))
                  ) : data?.highestQualification ? (
                    <View style={styles.certCard}>
                      <MaterialIcons name="workspace-premium" size={30} color={PURPLE} />
                      <View style={styles.certTextWrap}>
                        <Text style={styles.certTitle}>{data.highestQualification}</Text>
                      </View>
                    </View>
                  ) : (
                    <Text style={styles.emptyText}>No certifications added yet</Text>
                  )}
                </View>
              )}

              {activeTab === "Services" && (
                <View>
                  {userServices.length ? (
                    userServices.map((service) => (
                      <View key={service.id || service.name} style={styles.serviceCard}>
                        <View style={styles.serviceImageWrap}>
                          {service.imageUrl ? (
                            <Image
                              source={{ uri: getImageUri(service.imageUrl) }}
                              style={styles.serviceImage}
                            />
                          ) : (
                            <Text style={styles.serviceImageText}>Image here</Text>
                          )}
                        </View>
                        <View style={styles.serviceBody}>
                          <Text style={styles.serviceTitle} numberOfLines={2}>{service.name}</Text>
                          <View style={styles.servicePriceRow}>
                            <Text style={styles.fromPrefix}>From </Text>
                            <Text style={styles.priceText}>
                              ₹{service.price || service.pricing?.price || service.startingPrice || service.budget || 0}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.emptyText}>No services added yet</Text>
                  )}
                </View>
              )}

              {activeTab === "Reviews" && (
                <View>
                  {/* Summary Card */}
                  <View style={styles.summaryCard}>
                    <View style={styles.summaryTop}>
                      <View>
                        <Text style={styles.summaryRating}>
                          {formatRating(reviewStats?.averageRating || data?.rating || 0)}
                        </Text>
                        <View style={styles.summaryStars}>
                          {[1, 2, 3, 4, 5].map((item) => (
                            <FontAwesome
                              key={item}
                              name={
                                item <= Math.round(Number(reviewStats?.averageRating || data?.rating || 0))
                                  ? "star"
                                  : "star-o"
                              }
                              size={18}
                              color="#A855F7"
                            />
                          ))}
                        </View>
                      </View>

                      <View style={styles.summaryCountBox}>
                        <Text style={styles.summaryCount}>
                          {reviewStats?.totalReviews || data?.totalReviews || reviews.length || 0}
                        </Text>
                        <Text style={styles.summaryLabel}>Total Reviews</Text>
                      </View>
                    </View>

                    {/* Rating Breakdown Bars */}
                    <View style={styles.ratingBars}>
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count =
                          reviewStats?.ratingDistribution?.[star] !== undefined
                            ? Number(reviewStats.ratingDistribution[star])
                            : reviews.filter((r) => Math.round(Number(r.rating || 0)) === star).length;
                        const total = reviewStats?.totalReviews || data?.totalReviews || reviews.length || 0;
                        const percentage = total ? `${(count / total) * 100}%` : "0%";
                        return (
                          <View key={star} style={styles.ratingBarRow}>
                            <Text style={styles.ratingBarLabel}>{star}</Text>
                            <View style={styles.ratingBarTrack}>
                              <View style={[styles.ratingBarFill, { width: percentage }]} />
                            </View>
                            <Text style={styles.ratingBarCount}>{count}</Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>

                  {/* Section Header */}
                  <View style={styles.recentReviewsHeader}>
                    <Text style={styles.recentReviewsTitle}>Recent Reviews</Text>
                    <Text style={styles.recentReviewsMeta}>
                      {reviewStats?.totalReviews || data?.totalReviews || reviews.length || 0} total
                    </Text>
                  </View>

                  {/* Review items or Empty Card */}
                  {reviews.length > 0 ? (
                    reviews.map((review) => (
                      <View key={review.id} style={styles.reviewCard}>
                        <View style={styles.reviewHeader}>
                          <Image
                            source={
                              review.reviewer?.profilePhoto
                                ? { uri: getImageUri(review.reviewer.profilePhoto) }
                                : require("../assets/profile.png")
                            }
                            style={styles.reviewAvatar}
                          />
                          <View style={styles.reviewMeta}>
                            <Text style={styles.reviewerName}>
                              {review.reviewer?.user?.fullName || "Bird Earner user"}
                            </Text>
                            <View style={styles.reviewStars}>
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
                          <Text style={styles.reviewDate}>
                            {formatMemberSince(review.createdAt)}
                          </Text>
                        </View>
                        <Text style={styles.reviewText}>
                          {review.reviewText || "No review text provided"}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <View style={styles.reviewEmptyCard}>
                      <View style={styles.purpleIconBox}>
                        <MaterialIcons name="rate-review" size={26} color="#FFFFFF" />
                      </View>
                      <Text style={styles.reviewEmptyTitle}>No reviews yet</Text>
                      <Text style={styles.reviewEmptySubtitle}>
                        Reviews from completed work will appear here.
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {activeTab === "Portfolio" && (
                <View style={styles.portfolioContainer}>
                  <View style={styles.portfolioTopRow}>
                    <TouchableOpacity
                      style={styles.portfolioTallBox}
                      onPress={() => portfolioImages[0] && openImageModal(portfolioImages[0], portfolioImages)}
                    >
                      {portfolioImages[0] ? (
                        <Image source={{ uri: getImageUri(portfolioImages[0]) }} style={styles.portfolioImage} />
                      ) : (
                        <Text style={styles.plusIcon}>+</Text>
                      )}
                    </TouchableOpacity>

                    <View style={styles.portfolioRightCol}>
                      <TouchableOpacity
                        style={styles.portfolioSmallBox}
                        onPress={() => portfolioImages[1] && openImageModal(portfolioImages[1], portfolioImages)}
                      >
                        {portfolioImages[1] ? (
                          <Image source={{ uri: getImageUri(portfolioImages[1]) }} style={styles.portfolioImage} />
                        ) : (
                          <Text style={styles.plusIcon}>+</Text>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.portfolioSmallBox}
                        onPress={() => portfolioImages[2] && openImageModal(portfolioImages[2], portfolioImages)}
                      >
                        {portfolioImages[2] ? (
                          <Image source={{ uri: getImageUri(portfolioImages[2]) }} style={styles.portfolioImage} />
                        ) : (
                          <Text style={styles.plusIcon}>+</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.portfolioThreeRow}>
                    {[3, 4, 5].map((idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.portfolioSquareBox}
                        onPress={() => portfolioImages[idx] && openImageModal(portfolioImages[idx], portfolioImages)}
                      >
                        {portfolioImages[idx] ? (
                          <Image source={{ uri: getImageUri(portfolioImages[idx]) }} style={styles.portfolioImage} />
                        ) : (
                          <Text style={styles.plusIcon}>+</Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.portfolioThreeRow}>
                    {[6, 7, 8].map((idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.portfolioSquareBox}
                        onPress={() => portfolioImages[idx] && openImageModal(portfolioImages[idx], portfolioImages)}
                      >
                        {portfolioImages[idx] ? (
                          <Image source={{ uri: getImageUri(portfolioImages[idx]) }} style={styles.portfolioImage} />
                        ) : (
                          <Text style={styles.plusIcon}>+</Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={styles.portfolioFullBar}
                    onPress={() => portfolioImages[9] && openImageModal(portfolioImages[9], portfolioImages)}
                  >
                    {portfolioImages[9] ? (
                      <Image source={{ uri: getImageUri(portfolioImages[9]) }} style={styles.portfolioImage} />
                    ) : (
                      <Text style={styles.plusIcon}>+</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : (
            <>
              {activeTab === "About" && (
                <View>
                  <Text style={styles.sectionTitleLeft}>About me</Text>
                  <Text style={styles.aboutDescription}>
                    {data?.profileDescription || "No description available"}
                  </Text>

                  <View style={styles.infoList}>
                    <InfoRow
                      styles={styles}
                      icon="person"
                      label="Role"
                      value="Client"
                    />
                    <InfoRow
                      styles={styles}
                      icon="calendar-today"
                      label="Member Since"
                      value={formattedDate}
                    />
                  </View>

                  {parseArray(data?.languages).length > 0 && (
                    <>
                      <Text style={styles.sectionTitleLeft}>Languages</Text>
                      <View style={styles.languageList}>
                        {parseArray(data?.languages).map((lang, idx) => (
                          <View key={idx} style={styles.infoRow}>
                            <MaterialIcons name="g-translate" size={22} color={PURPLE} />
                            <Text style={styles.infoLabel}>
                              {typeof lang === 'string' ? lang : lang.name || lang.language || 'English'}
                            </Text>
                            <Text style={styles.infoValue}>
                              {typeof lang === 'object' && lang.proficiency ? lang.proficiency : 'Fluent'}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </>
                  )}
                </View>
              )}

              {activeTab === "Reviews" && (
                <View>
                  {/* Section Header */}
                  <View style={styles.recentReviewsHeader}>
                    <Text style={styles.recentReviewsTitle}>Reviews Given</Text>
                    <Text style={styles.recentReviewsMeta}>
                      {reviews.length || 0} total
                    </Text>
                  </View>

                  {/* Review items or Empty Card */}
                  {reviews.length > 0 ? (
                    reviews.map((review) => {
                      const displayProfile = review.reviewee || review.freelancer || review.user;
                      const displayNameReview = displayProfile?.user?.fullName || displayProfile?.fullName || "Bird Earner user";
                      const displayPhoto = displayProfile?.profilePhoto || displayProfile?.user?.profilePhoto;

                      return (
                        <View key={review.id} style={styles.reviewCard}>
                          <View style={styles.reviewHeader}>
                            <Image
                              source={
                                displayPhoto
                                  ? { uri: getImageUri(displayPhoto) }
                                  : require("../assets/profile.png")
                              }
                              style={styles.reviewerAvatar}
                            />
                            <View style={styles.reviewMeta}>
                              <Text style={styles.reviewerName}>
                                {displayNameReview}
                              </Text>
                              <View style={styles.reviewStars}>
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
                            <Text style={styles.reviewDate}>
                              {formatMemberSince(review.createdAt)}
                            </Text>
                          </View>
                          <Text style={styles.reviewText}>
                            {review.reviewText || "No review text provided"}
                          </Text>
                        </View>
                      );
                    })
                  ) : (
                    <View style={styles.reviewEmptyCard}>
                      <View style={styles.purpleIconBox}>
                        <MaterialIcons name="rate-review" size={26} color="#FFFFFF" />
                      </View>
                      <Text style={styles.reviewEmptyTitle}>No reviews yet</Text>
                      <Text style={styles.reviewEmptySubtitle}>
                        Reviews you've written for freelancers will appear here.
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </>
          )}
        </View>

        <Toast />
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ styles, icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <MaterialIcons name={icon} size={28} color={PURPLE} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
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
      paddingBottom: 100, // Extra padding for bottom content
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
      height: 40,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    shareText: {
      color: PURPLE,
      fontSize: 14,
      fontWeight: "500",
    },
    avatarButton: {
      alignItems: "center",
      justifyContent: "center",
    },
    avatarRing: {
      width: 104,
      height: 104,
      borderRadius: 52,
      borderWidth: 2,
      borderColor: "#C084FC",
      padding: 3,
      backgroundColor: surface,
    },
    avatar: {
      width: "100%",
      height: "100%",
      borderRadius: 48,
      backgroundColor: "#F3EAFF",
    },
    statusDot: {
      position: "absolute",
      right: 2,
      bottom: 2,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: "#A857F4",
      borderWidth: 2.5,
      borderColor: surface,
    },
    statusDotMuted: {
      backgroundColor: "#B9B1C6",
    },
    ratingRow: {
      marginTop: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      flexWrap: "wrap",
    },
    ratingText: {
      color: text,
      fontSize: 14,
      fontWeight: "700",
    },
    reviewCount: {
      color: "#6B7280",
      fontSize: 14,
      fontWeight: "400",
    },
    badge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: "#F3E8FF",
      borderWidth: 0,
    },
    badgeText: {
      color: "#7E22CE",
      fontSize: 13,
      fontWeight: "600",
    },
    freelancerTabShell: {
      marginHorizontal: 16,
      marginVertical: 14,
      borderRadius: 16,
      backgroundColor: "#181528",
      flexDirection: "row",
      alignItems: "center",
      height: 50,
      paddingHorizontal: 4,
    },
    freelancerTabButton: {
      flex: 1,
      height: "100%",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    },
    freelancerTabText: {
      color: "#94A3B8",
      fontSize: 14,
      fontWeight: "500",
    },
    freelancerTabTextActive: {
      color: "#C36DFF",
      fontWeight: "600",
    },
    freelancerTabIndicatorActive: {
      position: "absolute",
      bottom: 4,
      width: "70%",
      height: 2.5,
      borderRadius: 2,
      backgroundColor: "#B65CFF",
    },
    languageList: {
      borderTopWidth: 1,
      borderTopColor: border,
      marginBottom: 8,
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
    reviewerAvatar: {
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
      marginTop: 10,
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
    profileContent: {
      paddingHorizontal: 16,
      paddingTop: 8,
      backgroundColor: surface,
    },
    sectionTitleLeft: {
      color: text,
      fontSize: 18,
      fontWeight: "700",
      marginBottom: 10,
      marginTop: 18,
    },
    aboutDescription: {
      color: "#6B7280",
      fontSize: 14,
      lineHeight: 21,
      marginBottom: 16,
    },
    infoList: {
      borderTopWidth: 1,
      borderTopColor: "#F3F4F6",
      marginBottom: 16,
    },
    infoRow: {
      minHeight: 48,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: "#F3F4F6",
      flexDirection: "row",
      alignItems: "center",
    },
    infoLabel: {
      flex: 1.2,
      color: "#4B5563",
      fontSize: 14,
      fontWeight: "400",
      marginLeft: 12,
    },
    infoValue: {
      flex: 1.8,
      color: "#111827",
      fontSize: 14,
      fontWeight: "400",
      textAlign: "right",
    },
    chips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 16,
    },
    skillChip: {
      paddingHorizontal: 16,
      paddingVertical: 7,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: "#E9D5FF",
      backgroundColor: "#FBF8FF",
    },
    skillText: {
      color: "#8B5CF6",
      fontSize: 13,
      fontWeight: "500",
    },
    portfolioGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginBottom: 26,
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
    portfolioTileImage: {
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
    emptyText: {
      color: muted,
      fontSize: 16,
    },
    tabContainer: {
      backgroundColor: currentTheme.background || "#fff",
      paddingVertical: 10,
      paddingTop: 20,
      paddingHorizontal: 20,
    },
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: currentTheme.background,
    },

    modalContainer: {
      width: "100%",
      height: "100%",
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#fff",
    },
    modalContent: {
      width: 300,
      height: 250,
      backgroundColor: "#fff",
      // borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
      // elevation: 5,
    },
    logo: {
      width: 100,
      height: 100,
      marginBottom: 20,
    },
    modalText: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#4B0082",
    },

    tab: {
      display: "flex",
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
      backgroundColor: "#4C0183",
      width: "48%",
      height: 36,
      display: "flex",
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
    tabButtonR: {
      backgroundColor: "transparent",
      width: "48%",
      height: 36,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 8,
    },
    tabTextL: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
    tabTextR: {
      color: currentTheme.text || "#64748B",
      fontSize: 16,
      fontWeight: "500",
    },
    modalHeader: {
      paddingTop: 10,
      paddingLeft: 20,
    },
    backgroundImg: {
      width: "100%",
      height: 150,
      // justifyContent: "center",
      // alignItems: "center",
      // paddingTop: 20,
      position: "relative",
    },
    profileImage: {
      width: 100,
      height: 100,
      borderRadius: 50,
      position: "absolute",
      top: 82,
      left: "38%",
    },
    share: {
      position: "absolute",
      bottom: 5,
      right: 80,
      backgroundColor: currentTheme.background || "#fff",
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: currentTheme.text || "black",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    },
    settings: {
      position: "absolute",
      bottom: 5,
      right: 20,
      backgroundColor: currentTheme.background || "#fff",
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: currentTheme.text || "black",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    },
    userDetails: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      paddingTop: 30,
    },
    nameText: {
      marginTop: 10,
      color: text,
      fontSize: 22,
      fontWeight: "700",
      textAlign: "center",
      letterSpacing: -0.3,
    },
    roleWrap: {
      display: "flex",
      flexDirection: "row",
      flexWrap: "wrap",
      paddingHorizontal: 30,
    },
    roleText: {
      marginTop: 3,
      color: "#6B7280",
      fontSize: 14,
      fontWeight: "400",
      textAlign: "center",
      textTransform: "lowercase",
    },
    statusText: {
      fontSize: 14,
      fontWeight: "600",
      color: currentTheme.text,
    },
    section: {
      padding: 20,
    },
    sectionTitle: {
      fontSize: 25,
      fontWeight: "600",
      textAlign: "center",
      color: currentTheme.text,
    },
    sectionContent: {
      color: currentTheme.text || "#333",
      marginTop: 5,
    },
    portfolioImages: {
      marginTop: 10,
      display: "flex",
      flexWrap: "wrap",
      flexDirection: "row",
      justifyContent: "space-around",
      gap: 10,
    },
    portfolioImage: {
      width: 100,
      height: 100,
      marginRight: 10,
      borderRadius: 6,
    },
    editProfileButton: {
      backgroundColor: PURPLE,
      paddingVertical: 14,
      marginHorizontal: 26,
      borderRadius: 12,
      marginTop: 28,
      shadowColor: PURPLE,
      shadowOpacity: 0.2,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 3,
    },
    buttonDisabled: {
      opacity: 0.65,
    },
    buttonText: {
      color: "#fff",
      textAlign: "center",
      fontSize: 16,
    },
    deactivateLink: {
      textAlign: "center",
      color: PURPLE,
      marginBottom: 50,
      borderWidth: 1,
      padding: 12,
      borderRadius: 12,
      borderColor: "#D6B7FF",
      marginHorizontal: 26,
      marginTop: 20,
      fontWeight: "700",
    },
    Profile_heading: {
      textAlign: "center",
      marginTop: 10,
      fontWeight: "500",
      fontStyle: "italic",
      fontSize: 13,
      color: currentTheme.text,
    },
    about: {
      textAlign: "center",
      marginTop: 10,
      fontWeight: "600",
      fontSize: 25,
      color: currentTheme.text,
    },
    about_des: {
      textAlign: "justify",
      marginTop: 10,
      fontWeight: "400",
      fontSize: 13,
      paddingHorizontal: 25,
      color: currentTheme.text,
    },
    levelContainer: {
      flex: 1,
      flexDirection: "row",
      marginHorizontal: 40,
      marginVertical: 12,
      position: "relative",
    },
    xpRan: {
      backgroundColor: currentTheme.background3 || "#D9D9D9",
      flex: 1,
      flexDirection: "row",
      borderRadius: 20,
      gap: 8,
      height: 30,
      position: "relative",
      justifyContent: "center",
      alignItems: "center",
    },
    xp: {
      backgroundColor: "#56118F",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 20,
      position: "absolute",
      left: 0,
    },
    xpText: {
      fontSize: 15,
      fontWeight: "400",
      color: "#fff",
    },
    randomText: {
      fontSize: 13,
      fontWeight: "400",
      color: "#A1A1A1",
      paddingHorizontal: 5,
      // paddingVertical: 4,
    },
    level: {
      backgroundColor: "#56118F",
      paddingHorizontal: 4,
      paddingVertical: 12,
      borderRadius: 50,
      position: "absolute",
      right: 0,
      top: "-10",
    },
    levelText: {
      fontSize: 13,
      fontWeight: "600",
      color: "#fff",
    },

    line: {
      backgroundColor: "#E2E2E2",
      width: "90%",
      height: 1,
      margin: "auto",
      marginTop: 10,
    },
    locTitle: {
      color: "#8F8F8F",
      fontSize: 18,
      fontWeight: "600",
      marginLeft: 25,
      marginTop: 15,
    },
    locSubTitle: {
      color: currentTheme.text || "#000",
      fontSize: 15,
      marginLeft: 25,
    },
  });
};
