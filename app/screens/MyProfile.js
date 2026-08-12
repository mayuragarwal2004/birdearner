import { useAuth } from "../context/NewAuthContext";
import { useTheme } from "../context/ThemeContext";
import React, { useEffect, useRef, useState } from "react";
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
  Animated,
  Easing,
} from "react-native";
import SafeSpinner from "../components/SafeSpinner";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import ImageViewer from "react-native-image-zoom-viewer";
import Toast from "react-native-toast-message";
import LottieView from "lottie-react-native";
import apiService from "../lib/apiService";

const AnimatedLottieView = Animated.createAnimatedComponent(LottieView);
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

const getProfileTitle = (role, data, services) => {
  if (role === "CLIENT") {
    return data?.companyName || data?.company_name || data?.organizationType || "Client";
  }

  return data?.profileHeading || services?.[0]?.name || "Freelancer";
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

export default function ProfileScreen({ navigation }) {
  const {
    user,
    loading,
    userData,
    logout,
    roleOptions,
    handleRoleSelection,
    switchUserRole,
    refreshUserData,
    userProfile,
    setUserProfile,
  } = useAuth();
  const [data, setData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [images, setImages] = useState([]);
  const [modalVisiblet, setModalVisiblet] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);
  const animationProgress = useRef(new Animated.Value(0));
  const [userServices, setUserServices] = useState([]);

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
    const loadServices = async () => {
      const serviceIds = parseArray(userProfile?.selectedServices);
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
        setUserServices(serviceResults.filter(s => s && !s.isMissing));
      } catch (error) {
        console.error("Error loading services:", error);
        setUserServices([]);
      }
    };

    loadServices();
  }, [userProfile?.selectedServices]);

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const styles = getStyles(currentTheme);

  const formattedDate = formatMemberSince(data?.createdAt || userData?.createdAt);
  // ... (other hooks and functions)

  const transitionText =
    userData?.role === "FREELANCER"
      ? "Switching to Client"
      : "Switching to Freelancer";

  const runRoleSwitchAnimation = () =>
    new Promise((resolve) => {
      animationProgress.current.setValue(0);
      Animated.timing(animationProgress.current, {
        toValue: 1,
        duration: 2500,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start(resolve);
    });

  const handleRoleSwitch = async (newRoleData) => {
    if (switchingRole) return;

    const newRole = newRoleData?.role;
    if (!newRole || newRole === userData?.role) return;

    try {
      setSwitchingRole(true);
      setModalVisiblet(true);

      await Promise.all([
        runRoleSwitchAnimation(),
        switchUserRole(newRole),
      ]);
    } catch (error) {
      console.error("Error switching role:", error);
      Alert.alert("Error", "Failed to switch role. Please try again.");
    } finally {
      setModalVisiblet(false);
      setSwitchingRole(false);
      animationProgress.current.setValue(0);
    }
  };

  const handleSetupRole = async (roleType) => {
    try {
      if (roleType === "client") {
        // Navigate to ClientSignup in create mode for existing users
        navigation.navigate("ClientSignup", {
          mode: "create",
          title: "Create Client Profile",
        });
      } else if (roleType === "freelancer") {
        // Navigate to FreelancerSignup in create mode for existing users
        navigation.navigate("FreelancerSignup", {
          mode: "create",
          title: "Create Freelancer Profile",
        });
      }
    } catch (error) {
      Alert.alert("Error setting up role:", error.message);
    }
  };

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
                <Text style={styles.ratingText}>{formatXP(data?.xp || 0)} xp</Text>
                <Text style={styles.reviewCount}>Lev. {data?.level || 1}</Text>
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

        <View style={styles.tabShell}>
          <TouchableOpacity style={styles.profileTabButton} activeOpacity={0.85}>
            <Text style={styles.profileTabTextActive}>My Profile</Text>
            <View style={styles.profileTabIndicatorActive} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.profileTabButton}
            activeOpacity={0.85}
            onPress={() => navigation.navigate("MyReview", { profileData: data })}
          >
            <Text style={styles.profileTabText}>My Reviews</Text>
            <View style={styles.profileTabIndicator} />
          </TouchableOpacity>
        </View>

        <View style={styles.profileContent}>
          <Text style={styles.sectionTitleLeft}>About me</Text>
          <Text style={styles.aboutDescription}>
            {data?.profileDescription || "No description available"}
          </Text>

          <View style={styles.infoList}>
            {role === "FREELANCER" ? (
              <>
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
              </>
            ) : (
              <InfoRow
                styles={styles}
                icon="business"
                label="Company"
                value={data?.companyName || data?.company_name || "Not added"}
              />
            )}
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

          {role === "FREELANCER" && (
            <>
              <Text style={styles.sectionTitleLeft}>Skills</Text>
              <View style={styles.chips}>
                {userServices.length ? (
                  userServices.map((service) => (
                    <View key={service.id || service.name} style={styles.skillChip}>
                      <Text style={styles.skillText}>{service.name}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>No skills added yet</Text>
                )}
              </View>

              <Text style={styles.sectionTitleLeft}>Portfolio</Text>
              <View style={styles.portfolioGrid}>
                {portfolioImages.length ? (
                  portfolioImages.map((image, index) => (
                    <TouchableOpacity
                      key={`${getImageUri(image)}-${index}`}
                      style={[
                        styles.portfolioTile,
                        index === 0 && styles.portfolioTileLarge,
                      ]}
                      onPress={() => openImageModal(image, portfolioImages)}
                      activeOpacity={0.85}
                    >
                      <Image
                        source={{ uri: getImageUri(image) }}
                        style={styles.portfolioTileImage}
                      />
                    </TouchableOpacity>
                  ))
                ) : (
                  [0, 1, 2, 3].map((item) => (
                    <View
                      key={item}
                      style={[
                        styles.portfolioPlaceholder,
                        item === 0 && styles.portfolioPlaceholderLarge,
                      ]}
                    >
                      <Text style={styles.plus}>+</Text>
                    </View>
                  ))
                )}
              </View>

              <Text style={styles.sectionTitleLeft}>Certification</Text>
              {certifications.length ? (
                certifications.map((cert, index) => (
                  <View key={`${cert}-${index}`} style={styles.certCard}>
                    <View style={styles.certTextWrap}>
                      <Text style={styles.certTitle}>{cert}</Text>
                      <Text style={styles.certSubtitle}>
                        {data?.highestQualification || "Qualification added"}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.certCard}>
                  <View style={styles.certTextWrap}>
                    <Text style={styles.certTitle}>
                      {data?.highestQualification || "No certification added"}
                    </Text>
                  </View>
                </View>
              )}
            </>
          )}
        </View>

        {/* TODO */}
        {userData && (
          <>
            {userData.freelancer && userData.client ? (
              <TouchableOpacity
                style={[
                  styles.editProfileButton,
                  switchingRole && styles.buttonDisabled,
                ]}
                disabled={switchingRole}
                onPress={() =>
                  handleRoleSwitch(
                    userData.role === "FREELANCER"
                      ? { role: "CLIENT" }
                      : { role: "FREELANCER" }
                  )
                }
              >
                <Text style={styles.buttonText}>
                  Switch to{" "}
                  {userData.role === "FREELANCER" ? "Client" : "Freelancer"}
                </Text>
              </TouchableOpacity>
            ) : (
              <>
                {!userData.client && userData.role === "FREELANCER" ? (
                  <TouchableOpacity
                    style={styles.editProfileButton}
                    onPress={() => handleSetupRole("client")}
                  >
                    <Text style={styles.buttonText}>Setup Client Profile</Text>
                  </TouchableOpacity>
                ) : !userData.freelancer && userData.role === "CLIENT" ? (
                  <TouchableOpacity
                    style={styles.editProfileButton}
                    onPress={() => handleSetupRole("freelancer")}
                  >
                    <Text style={styles.buttonText}>
                      Setup Freelancer Profile
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </>
            )}
          </>
        )}

        {/* Modal for Transition Animation */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisiblet}
          onRequestClose={() => {
            if (!switchingRole) setModalVisiblet(false);
          }}
        >
          <View style={[styles.modalContainer, {}]}>
            {/* <LottieView
              autoPlay
              ref={animation}
              style={{
                width: 200,
                height: 200,
                backgroundColor: "#eee",
              }}
              // Find more Lottie files at https://lottiefiles.com/featured
              source={require("../../assets/birdy.json")}
            /> */}
            <AnimatedLottieView
              source={require("../../assets/loader-bird.json")}
              progress={animationProgress.current}
              style={[styles.modalContent]}
            />
            {/* <AnimatedLottieView
              style={[styles.modalContent, { transform: [{ translateX }] }]}
            >
              <Image
                source={require("../../assets/birdy.json")} // Replace with the path to your logo
                style={styles.logo}
              />
              <Text style={styles.modalText}>{transitionText}</Text>
            </AnimatedLottieView> */}
          </View>
        </Modal>

        {/* <TouchableOpacity
          style={styles.editProfileButton}
          onPress={() => {
            navigation.navigate("Settings");
          }}
        >
          <Text style={styles.buttonText}>Edit Your Profile</Text>
        </TouchableOpacity> */}

        {/* Deactivate Account Link */}
        <TouchableOpacity
          onPress={async () => {
            try {
              await logout();
              showToast("success", "Logged out successfully!");
              // navigation.reset({
              //   index: 0,
              //   routes: [{ name: "Login" }],
              // });
            } catch (error) {
              showToast("error", "Logout Failed", error.message);
            }
          }}
        >
          <Text style={styles.deactivateLink}>Log out</Text>
        </TouchableOpacity>
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
    profileContent: {
      paddingHorizontal: 26,
      paddingTop: 28,
      backgroundColor: surface,
    },
    sectionTitleLeft: {
      color: text,
      fontSize: 23,
      fontWeight: "800",
      marginBottom: 18,
      marginTop: 6,
    },
    aboutDescription: {
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
      marginTop: 18,
      color: text,
      fontSize: 34,
      fontWeight: "800",
      textAlign: "center",
    },
    roleWrap: {
      display: "flex",
      flexDirection: "row",
      flexWrap: "wrap",
      paddingHorizontal: 30,
    },
    roleText: {
      marginTop: 8,
      color: muted,
      fontSize: 19,
      textAlign: "center",
      textTransform: "capitalize",
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
