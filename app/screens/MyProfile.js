import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  ActivityIndicator,
  Share,
  Modal,
  RefreshControl,
  Alert,
  SafeAreaView,
  Animated,
  Easing,
} from "react-native";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../context/NewAuthContext";
import ImageViewer from "react-native-image-zoom-viewer";
import Toast from "react-native-toast-message";
import { useTheme } from "../context/ThemeContext";
import LottieView from "lottie-react-native";
import apiService from "../lib/apiService";

const AnimatedLottieView = Animated.createAnimatedComponent(LottieView);

// Helper function to show toast messages
const showToast = (type, title, message = "") => {
  Toast.show({
    type,
    text1: title,
    text2: message,
    position: "top",
  });
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
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [images, setImages] = useState([]);
  const [modalVisiblet, setModalVisiblet] = useState(false);
  const animationProgress = useRef(new Animated.Value(0));
  const [userServices, setUserServices] = useState([]);

  const role = userData?.role;
  console.log(userData);

  // Add focus listener to refresh data when returning from editing
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      // Refresh profile data when screen comes into focus
      fetchProfileData();
      refreshUserData();
    });

    return unsubscribe;
  }, [navigation]);

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

          // Show warning if some services failed to load
          if (validServices.length < userProfile.selectedServices.length) {
            const failedCount =
              userProfile.selectedServices.length - validServices.length;
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

    if (userData) {
      loadUserInfo();
    }
  }, [userData, userProfile]);

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];

  const styles = getStyles(currentTheme);

  const createdAt = userData?.createdAt;
  const date = new Date(createdAt);

  // Format the date and time
  const formattedDate = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleRoleSwitch = async (newRoleData) => {
    try {
      setModalVisiblet(true);
      Animated.timing(animationProgress.current, {
        toValue: 1,
        duration: 2500,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start(async () => {
        setModalVisiblet(false);
        animationProgress.current.setValue(0);
        
        // Use the more robust switchUserRole function
        const newRole = newRoleData.role;
        await switchUserRole(newRole);
      });
    } catch (error) {
      console.error("Error switching role:", error);
      setModalVisiblet(false);
      animationProgress.current.setValue(0);
      Alert.alert("Error", "Failed to switch role. Please try again.");
    }
  };

  const transitionText =
    userData?.role === "FREELANCER"
      ? "Switching to Client"
      : "Switching to Freelancer";

  // const translateX = animation.interpolate({
  //   inputRange: [0, 1],
  //   outputRange: [0, 300], // Moves horizontally
  // });

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

  // Fetch profile data from backend
  const fetchProfileData = async () => {
    try {
      setLoadingProfile(true);

      if (!userData || !userData.id) {
        console.log("No user data available");
        setData(null);
        return;
      }

      // Use userProfile data if available, otherwise fetch from API
      if (userProfile) {
        setData(userProfile);
      } else {
        // Fetch complete profile data from API
        try {
          const completeProfile = await apiService.getCompleteProfile(
            userData.id
          );
          setData(completeProfile);

          // Update the userProfile in context if we got data
          if (completeProfile.profile) {
            setUserProfile(completeProfile.profile);
          }
        } catch (error) {
          console.log("Error fetching complete profile:", error);
          // Fallback to basic user data
          setData(userData);
        }
      }
    } catch (error) {
      console.error("Error fetching profile data:", error);
      showToast("error", "Error", "Failed to fetch profile data");
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [userData, userProfile]);

  // Remove the old Appwrite flagsData effect
  const onRefresh = async () => {
    console.log("Refreshing...");
    setRefreshing(true);

    try {
      // Refresh user data through auth context
      await refreshUserData();
      // Fetch fresh profile data
      await fetchProfileData();
    } catch (error) {
      console.error("Error refreshing data:", error);
      showToast("error", "Error", "Failed to refresh data");
    } finally {
      setRefreshing(false);
    }
  };

  const openImageModal = (imageUri) => {
    setImages([{ url: apiService.loadImageURI(imageUri) }]);
    setModalVisible(true);
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

  const onShare = async () => {
    try {
      const profileLink = `https://birdearner.com/profile/${userData?.id}`;

      const result = await Share.share({
        message: `Check out my profile on our app! Name: ${
          data?.fullName || userData?.fullName || "User"
        }\n\nProfile Link: ${profileLink}`,
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

  if (loading || loadingProfile) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={currentTheme.text || "#fff"} />
      </SafeAreaView>
    );
  }

  console.log({
    roleOptions,
  });

  return (
    <SafeAreaView>
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
            <Text style={styles.tabTextL}>My Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tabButtonR}
            onPress={() => {
              navigation.navigate("MyReview");
            }}
          >
            <Text style={styles.tabTextR}>My Reviews</Text>
          </TouchableOpacity>
        </View>

        <ImageBackground
          source={
            data?.coverPhoto
              ? { uri: apiService.loadImageURI(data.coverPhoto) }
              : require("../assets/backGroungBanner.png")
          }
          style={styles.backgroundImg}
        >
          <TouchableOpacity
            onPress={() => openImageModal(data?.profilePhoto)}
            disabled={!data?.profilePhoto}
          >
            <Image
              source={
                data?.profilePhoto
                  ? { uri: apiService.loadImageURI(data.profilePhoto) }
                  : require("../assets/profile.png")
              }
              style={styles.profileImage}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settings}
            onPress={() => {
              navigation.navigate("Settings");
            }}
          >
            <MaterialIcons
              name="settings"
              size={30}
              color={currentTheme.text || "black"}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.share} onPress={onShare}>
            {/* <FontAwesome name="share" size={24} /> */}
            <MaterialIcons
              name="share"
              size={30}
              color={currentTheme.text || "black"}
            />
          </TouchableOpacity>
        </ImageBackground>

        <View style={styles.userDetails}>
          <Text style={styles.nameText}>
            {data?.fullName || userData?.fullName || "User"}
          </Text>
          {role === "CLIENT" ? (
            <Text style={styles.roleText}>
              {data?.organizationType || "Organization"}
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
            Status:
            {data?.currentlyAvailable === true ? " Active " : " Inactive "}
            {data?.currentlyAvailable === true ? (
              <FontAwesome name="circle" size={12} color="#6BCD2F" />
            ) : (
              <FontAwesome name="circle" size={12} color="#FF3131" />
            )}
          </Text>
        </View>

        {userData?.role === "FREELANCER" && (
          <View style={styles.levelContainer}>
            <View style={styles.xpRan}>
              <View style={styles.xp}>
                <Text style={styles.xpText}>{formatXP(data?.xp || 0)} xp</Text>
              </View>
              <Text style={styles.randomText}>
                Earn xp and promote to next level
              </Text>
            </View>
            <View style={styles.level}>
              <Text style={styles.levelText}>Lev. {data?.level || 1}</Text>
            </View>
          </View>
        )}

        <Text style={styles.Profile_heading}>
          {role === "CLIENT"
            ? `Company Name: ${data?.companyName || "--"}`
            : data?.profileHeading || "No profile heading"}
        </Text>

        <Text style={styles.about}>About me</Text>
        <Text style={styles.about_des}>
          {data?.profileDescription || "No description available"}
        </Text>

        {/* Portfolio Section */}
        {role === "FREELANCER" && data?.portfolioImages?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Portfolio</Text>
            <View style={styles.portfolioImages}>
              {data?.portfolioImages.map((image, index) => (
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
        {role === "FREELANCER" &&
          (data?.experience || data?.certifications?.length > 0) && (
            <View style={styles.section}>
              {data?.experience && (
                <>
                  <Text style={styles.sectionTitle}>Experience</Text>
                  <Text style={styles.sectionContent}>
                    {data?.experience} months of experience
                  </Text>
                </>
              )}

              {data?.certifications?.length > 0 && (
                <>
                  <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
                    Certifications
                  </Text>
                  {data?.certifications.map((cert, index) => (
                    <Text key={index} style={styles.sectionContent}>
                      {cert}
                    </Text>
                  ))}
                </>
              )}
            </View>
          )}

        <View style={styles.line}></View>

        <Text style={styles.locTitle}>Location</Text>
        <Text style={styles.locSubTitle}>
          {data?.city ? `${data?.city}, ` : ""}{" "}
          {data?.state ? `${data?.state} ` : ""}(
          {data?.country || userData?.country})
        </Text>

        <Text style={styles.locTitle}>Member Since</Text>
        <Text style={styles.locSubTitle}>{formattedDate}</Text>

        {/* TODO */}
        {userData && (
          <>
            {roleOptions?.freelancerData && roleOptions?.clientData ? (
              <TouchableOpacity
                style={styles.editProfileButton}
                onPress={() =>
                  handleRoleSwitch(
                    userData.role === "FREELANCER"
                      ? roleOptions.clientData
                      : roleOptions.freelancerData
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
                {roleOptions?.freelancerData ? (
                  <TouchableOpacity
                    style={styles.editProfileButton}
                    onPress={() => handleSetupRole("client")}
                  >
                    <Text style={styles.buttonText}>Setup Client Profile</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.editProfileButton}
                    onPress={() => handleSetupRole("freelancer")}
                  >
                    <Text style={styles.buttonText}>
                      Setup Freelancer Profile
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </>
        )}

        {/* Modal for Transition Animation */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisiblet}
          onRequestClose={() => setModalVisiblet(false)}
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
      backgroundColor: "#4C0183",
      paddingVertical: 12,
      marginHorizontal: 20,
      borderRadius: 12,
      // marginBottom: 15,
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
      marginBottom: 50,
      borderWidth: 1,
      padding: 10,
      borderRadius: 12,
      borderColor: "#4C0183",
      marginHorizontal: 20,
      marginTop: 20,
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
