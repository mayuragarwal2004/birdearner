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
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useAppwrite } from "../context/AppwriteContext";
import { useAuth } from "../context/NewAuthContext";
import ImageViewer from "react-native-image-zoom-viewer";
import { useTheme } from "../context/ThemeContext";

export default function ProfileScreen({ route, navigation }) {
  const { appwriteConfig, databases } = useAppwrite();
  const { receiverId } = route.params;
  const { user, userData } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [images, setImages] = useState([]);
  const role = userData?.role === "client" ? "freelancer" : "client";

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];

  const styles = getStyles(currentTheme);

  const createdAt = profileData?.$createdAt;
  const date = new Date(createdAt);
  const formattedDate = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Fetch profile data on component mount or when receiverId changes
  const fetchProfile = useCallback(async () => {
    setLoadingProfile(true);
    try {
      const collectionId =
        userData?.role === "client"
          ? appwriteConfig.freelancerCollectionId
          : appwriteConfig.clientCollectionId;

      const profileDoc = await databases.getDocument(
        appwriteConfig.databaseId,
        collectionId,
        receiverId
      );
      setProfileData(profileDoc);
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
              navigation.navigate("ReviewsScreen", { receiverId });
            }}
          >
            <Text style={styles.tabTextR}>Reviews</Text>
          </TouchableOpacity>
        </View>
        <ImageBackground
          source={
            profileData?.cover_photo
              ? { uri: profileData.cover_photo }
              : require("../assets/backGroungBanner.png")
          }
          style={styles.backgroundImg}
        >
          <TouchableOpacity
            onPress={() => openImageModal(profileData?.profile_photo)}
            style={{ zIndex: 1 }}
          >
            <Image
              source={
                profileData?.profile_photo
                  ? { uri: profileData.profile_photo }
                  : require("../assets/profile.png")
              }
              style={styles.profileImage}
            />
          </TouchableOpacity>
        </ImageBackground>

        {/* User Details */}
        <View style={styles.userDetails}>
          <Text style={styles.nameText}>
            {profileData?.full_name || "User"}
          </Text>
          {role === "client" ? (
            <Text style={styles.roleText}>
              {profileData?.organization_type || "Not found"}
            </Text>
          ) : (
            <View style={styles.roleWrap}>
              <Text>
                {profileData?.role_designation?.map((item, idx) => (
                  <Text key={idx} style={styles.roleText}>
                    {item}
                    {", "}
                  </Text>
                )) || "No role designation available"}
              </Text>
            </View>
          )}
          <Text style={styles.statusText}>
            Status: {profileData?.currently_available ? "Active" : "Inactive"}
            <FontAwesome
              name="circle"
              size={12}
              color={profileData?.currently_available ? "#6BCD2F" : "#FF3131"}
            />
          </Text>
        </View>

        {/* Freelancer Level & XP */}
        {profileData?.role === "freelancer" && (
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
          {role === "client"
            ? `Company Name: ${profileData?.company_name}`
            : profileData?.profile_heading}
        </Text>

        {/* About Section */}
        <Text style={styles.about}>About me</Text>
        <Text style={styles.about_des}>
          {profileData?.profile_description || "No description available"}
        </Text>

        {/* Portfolio Section */}
        {profileData?.role === "freelancer" &&
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
                      source={{ uri: image }}
                      style={styles.portfolioImage}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

        {/* Experience & Certifications */}
        {profileData?.role === "freelancer" &&
          (profileData?.experience ||
            profileData?.certifications?.length > 0) && (
            <View style={styles.section}>
              {profileData?.experience && (
                <>
                  <Text style={styles.sectionTitle}>Experience</Text>
                  <Text style={styles.sectionContent}>
                    {profileData?.experience} months of experience
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
      paddingTop: 35,
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
    },
    roleText: {
      fontSize: 14,
      fontWeight: "400",
      color: currentTheme.text,
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
