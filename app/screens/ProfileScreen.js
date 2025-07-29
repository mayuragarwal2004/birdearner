import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  ActivityIndicator,
  Modal,
  RefreshControl,
  Alert,
  SafeAreaView,
  Platform,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useAuth } from "../context/NewAuthContext";
import ImageViewer from "react-native-image-zoom-viewer";
import { useTheme } from "../context/ThemeContext";
import apiService from "../lib/apiService";

export default function ProfileScreen({ route, navigation }) {
  const { receiverId } = route.params;
  const { user, userData } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [images, setImages] = useState([]);
  const [userServices, setUserServices] = useState([]);

  const role = userData?.role === "CLIENT" ? "FREELANCER" : "CLIENT";

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];

  const styles = getStyles(currentTheme);

  const createdAt = profileData?.createdAt;
  const date = new Date(createdAt);
  const formattedDate = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  console.log({ profileData });

  // Fetch profile data on component mount or when receiverId changes
  const fetchProfile = useCallback(async () => {
    setLoadingProfile(true);
    try {
      let response;
      if (userData?.role === "CLIENT") {
        response = await apiService.getFreelancerProfile(receiverId);
        response.role = "FREELANCER";
      } else {
        response = await apiService.getClientProfile(receiverId);
        response.role = "CLIENT";
      }
      setProfileData(response);
    } catch (error) {
      Alert.alert("Error fetching profile data");
    } finally {
      setLoadingProfile(false);
    }
  }, [receiverId, userData]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Load user services and role info
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        if (profileData?.selectedServices) {
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
          // Clear services if user is not a FREELANCER or has no selected services
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
  }, [userData, profileData]);

  const formatXP = (xp) => {
    if (xp >= 1000000) return (xp / 1000000).toFixed(1) + "M";
    if (xp >= 1000) return (xp / 1000).toFixed(1) + "K";
    return xp;
  };

  const openImageModal = (imageUri) => {
    // console.log(imageUri);

    if (imageUri) {
      setImages([{ url: imageUri }]);
      setModalVisible(true);
    } else {
      Alert.alert("No image URI provided");
    }
  };

  if (loadingProfile) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={currentTheme.text || "#fff"} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView>
      {/* Image Modal */}
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
              <FontAwesome name="arrow-left" size={24} color="#fff" />
            </TouchableOpacity>
          )}
        />
      </Modal>

      {/* Profile Information */}
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#3b006b"]}
            progressBackgroundColor={currentTheme.cardBackground || "#fff"}
          />
        }
      >
        <View style={styles.tab}>
          <TouchableOpacity style={styles.tabButtonL}>
            <Text style={styles.tabTextL}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tabButtonR}
            onPress={() => {
              navigation.navigate("ReviewsScreen", { receiverId, profileData });
            }}
          >
            <Text style={styles.tabTextR}>Reviews</Text>
          </TouchableOpacity>
        </View>
        <ImageBackground
          source={
            profileData?.coverPhoto
              ? { uri: apiService.loadImageURI(profileData.coverPhoto) }
              : require("../assets/backGroungBanner.png")
          }
          style={styles.backgroundImg}
        >
          <TouchableOpacity
            onPress={() => openImageModal(profileData?.profilePhoto)}
            style={{ zIndex: 1 }}
          >
            <Image
              source={
                profileData?.profilePhoto
                  ? { uri: apiService.loadImageURI(profileData.profilePhoto) }
                  : require("../assets/profile.png")
              }
              style={styles.profileImage}
            />
          </TouchableOpacity>
        </ImageBackground>

        {/* User Details */}
        <View style={styles.userDetails}>
          <Text style={styles.nameText}>
            {profileData?.user.fullName || "User"}
          </Text>
          {role === "CLIENT" ? (
            <Text style={styles.roleText}>
              {profileData?.organization_type || "Not found"}
            </Text>
          ) : (
            <View style={styles.roleWrap}>
              <Text>
                {userServices?.map((item, idx) => (
                  <Text key={idx} style={styles.roleText}>
                    {item.name}
                    {idx < userServices.length - 1 ? ", " : ""}
                  </Text>
                )) || (
                  <Text style={styles.roleText}>
                    No role designation available
                  </Text>
                )}
              </Text>
            </View>
          )}
          <Text style={styles.statusText}>
            Status: {profileData?.currentlyAvailable ? "Active" : "Inactive"}
            <FontAwesome
              name="circle"
              size={12}
              color={profileData?.currentlyAvailable ? "#6BCD2F" : "#FF3131"}
            />
          </Text>
        </View>

        {/* FREELANCER Level & XP */}
        {profileData?.role === "FREELANCER" && (
          <View style={styles.levelContainer}>
            <View style={styles.xpRan}>
              <View style={styles.xp}>
                <Text style={styles.xpText}>
                  {formatXP(profileData?.XP) || 0} xp
                </Text>
              </View>
              <Text style={styles.randomText}>
                Earn xp and promote to next level
              </Text>
            </View>
            <View style={styles.level}>
              <Text style={styles.levelText}>
                Lev. {profileData?.level || 1}
              </Text>
            </View>
          </View>
        )}

        {/* Profile Heading */}
        <Text style={styles.Profile_heading}>
          {role === "CLIENT"
            ? `Company Name: ${profileData?.company_name}`
            : profileData?.profile_heading}
        </Text>

        {/* About Section */}
        <Text style={styles.about}>About me</Text>
        <Text style={styles.about_des}>
          {profileData?.profileDescription || "No description available"}
        </Text>

        {/* Portfolio Section */}
        {profileData?.role === "FREELANCER" &&
          profileData?.portfolio_images?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Portfolio</Text>
              <View style={styles.portfolioImages}>
                {profileData?.portfolio_images.map((image, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => openImageModal(image)}
                  >
                    <Image
                      source={{ uri: apiService.loadImageURI(image) }}
                      style={styles.portfolioImage}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

        {/* Experience & Certifications */}
        {profileData?.role === "FREELANCER" &&
          (profileData?.experience ||
            profileData?.certifications?.length > 0) && (
            <View style={styles.section}>
              {profileData?.experience && (
                <>
                  <Text style={styles.sectionTitle}>Experience</Text>
                  <Text style={styles.sectionContent}>
                    {profileData?.experience / 12} years of experience
                  </Text>
                </>
              )}

              {profileData?.certifications?.length > 0 && (
                <>
                  <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
                    Certifications
                  </Text>
                  {profileData?.certifications.map((cert, index) => (
                    <Text key={index} style={styles.sectionContent}>
                      {cert}
                    </Text>
                  ))}
                </>
              )}
            </View>
          )}

        {/* Location & Membership */}
        <View style={styles.line}></View>
        <Text style={styles.locTitle}>Location</Text>
        <Text style={styles.locSubTitle}>
          {profileData?.city}, {profileData?.state} ({profileData?.country})
        </Text>

        <Text style={styles.locTitle}>Member Since</Text>
        <Text style={styles.locSubTitle}>{formattedDate}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (currentTheme) =>
  StyleSheet.create({
    container: {
      backgroundColor: currentTheme.background || "#fff",
      paddingTop: Platform.OS === "ios" ? 0 : 35,
      paddingBottom: 80,
    },
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: currentTheme.background,
    },
    tab: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "center",
      gap: 2,
    },
    tabButtonL: {
      backgroundColor: "#4C0183",
      width: "50%",
      height: 40,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      borderTopRightRadius: 80,
    },
    tabButtonR: {
      backgroundColor: currentTheme.background3 || "#DADADA",
      width: "50%",
      height: 40,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      borderTopLeftRadius: 80,
    },
    tabTextL: {
      color: "#fff",
      fontSize: 20,
      fontWeight: "bold",
    },
    tabTextR: {
      color: currentTheme.text || "#000",
      fontSize: 20,
      fontWeight: "bold",
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
      backgroundColor: "#fff",
      width: 40,
      height: 40,
      borderRadius: 20,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    },
    settings: {
      position: "absolute",
      bottom: 5,
      right: 20,
      backgroundColor: "#fff",
      width: 40,
      height: 40,
      borderRadius: 20,
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
      fontSize: 28,
      fontWeight: "600",
      color: currentTheme.text,
    },
    roleWrap: {
      display: "flex",
      flexDirection: "row",
      flexWrap: "wrap",
      paddingHorizontal: 30,
    },
    roleText: {
      fontSize: 14,
      fontWeight: "400",
      color: currentTheme.text,
      textAlign: "center",
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
      fontSize: 18,
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
      backgroundColor: "#4C0183",
      paddingVertical: 12,
      marginHorizontal: 20,
      borderRadius: 12,
      marginBottom: 15,
      marginTop: 40,
    },
    buttonText: {
      color: "#fff",
      textAlign: "center",
      fontSize: 16,
    },
    deactivateLink: {
      textAlign: "center",
      color: "#4C0183",
      marginBottom: 20,
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
      fontSize: 17,
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
      height: 20,
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
      fontSize: 14,
      fontWeight: "400",
      color: "#fff",
    },
    randomText: {
      fontSize: 10,
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
