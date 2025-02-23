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
// import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import ImageViewer from "react-native-image-zoom-viewer";
import { appwriteConfig, databases } from "../lib/appwrite";
import Toast from "react-native-toast-message";
import { useTheme } from "../context/ThemeContext";
import LottieView from "lottie-react-native";

const AnimatedLottieView = Animated.createAnimatedComponent(LottieView);

export default function ProfileScreen({ navigation }) {
  const {
    user,
    loading,
    userData,
    logout,
    setUserData,
    roleOptions,
    handleRoleSelection,
    fetchUserData,
  } = useAuth();
  const [data, setData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [images, setImages] = useState([]);
  const [modalVisiblet, setModalVisiblet] = useState(false);
  const animationProgress = useRef(new Animated.Value(0));
  const role = userData?.role;

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];

  const styles = getStyles(currentTheme);

  const createdAt = userData?.$createdAt;
  const date = new Date(createdAt);

  // Format the date and time
  const formattedDate = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleRoleSwitch = (newRoleData) => {
    setModalVisiblet(true);
    Animated.timing(animationProgress.current, {
      toValue: 1,
      duration: 2500,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start(() => {
      setModalVisiblet(false);
      // animation.setValue(0); // Reset animation
      animationProgress.current.setValue(0);
      handleRoleSelection(newRoleData); // Perform the role switch
    });
  };

  const transitionText =
    userData?.role === "freelancer"
      ? "Switching to Client"
      : "Switching to Freelancer";

  // const translateX = animation.interpolate({
  //   inputRange: [0, 1],
  //   outputRange: [0, 300], // Moves horizontally
  // });

  const handleSetupRole = async (roleType) => {
    try {
      const fullName = userData?.full_name;
      const email = userData?.email;
      const role = roleType;

      navigation.navigate("DescribeRoleCom", { fullName, email, role });
    } catch (error) {
      Alert.alert("Error setting up role:", error.message);
    }
  };

  useEffect(() => {
    try {
      setData(userData);
    } catch (error) {
      Alert.alert("Failed to fetch freelancer data:", error);
    } finally {
      setLoadingProfile(false);
    }
  }, [user]);

  useEffect(() => {
    const flagsData = async () => {
      if (userData) {
        try {
          const freelancerId = userData?.$id;

          const collectionId =
            userData?.role === "client"
              ? appwriteConfig.clientCollectionId
              : appwriteConfig.freelancerCollectionId;

          const freelancerDoc = await databases.getDocument(
            appwriteConfig.databaseId,
            collectionId,
            freelancerId
          );
          setUserData(freelancerDoc);
        } catch (error) {
          Alert.alert("Error updating flags:", error);
        }
      }
    };

    flagsData();
  }, [refreshing]);

  const onRefresh = () => {
    console.log("Refreshing...");
    fetchUserData();

    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const openImageModal = (imageUri) => {
    setImages([{ url: imageUri }]);
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
      const profileLink = `https://birdearner.com/profile/${userData.$id}`;

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

  if (loading || loadingProfile) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={currentTheme.text || "#fff"} />
      </SafeAreaView>
    );
  }

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
            data?.cover_photo
              ? { uri: data.cover_photo }
              : require("../assets/backGroungBanner.png")
          }
          style={styles.backgroundImg}
        >
          <TouchableOpacity onPress={() => openImageModal(data?.profile_photo)}>
            <Image
              source={
                data?.profile_photo
                  ? { uri: data.profile_photo }
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
          <Text style={styles.nameText}>{data?.full_name || "User"}</Text>
          {role === "client" ? (
            <Text style={styles.roleText}>
              {data?.organization_type || "Not found"}
            </Text>
          ) : (
            <View style={styles.roleWrap}>
              <Text>
                {data?.role_designation?.map((item, idx) => (
                  <Text key={idx} style={styles.roleText}>
                    {item}
                    {", "}
                  </Text>
                )) || "No role designation available"}
              </Text>
            </View>
          )}
          <Text style={styles.statusText}>
            Status:
            {userData?.currently_available === true ? " Active " : " Inactive "}
            {userData?.currently_available === true ? (
              <FontAwesome name="circle" size={12} color="#6BCD2F" />
            ) : (
              <FontAwesome name="circle" size={12} color="#FF3131" />
            )}
          </Text>
        </View>

        {userData?.role === "freelancer" && (
          <View style={styles.levelContainer}>
            <View style={styles.xpRan}>
              <View style={styles.xp}>
                <Text style={styles.xpText}>
                  {formatXP(userData?.XP) || 0} xp
                </Text>
              </View>
              <Text style={styles.randomText}>
                Earn xp and promote to next level
              </Text>
            </View>
            <View style={styles.level}>
              <Text style={styles.levelText}>Lev. {userData?.level || 1}</Text>
            </View>
          </View>
        )}

        <Text style={styles.Profile_heading}>
          {role === "client"
            ? `Company Name: ${data?.company_name || "--"}`
            : data?.profile_heading}
        </Text>

        <Text style={styles.about}>About me</Text>
        <Text style={styles.about_des}>
          {data?.profile_description || "No description available"}
        </Text>

        {/* Portfolio Section */}
        {role === "freelancer" && data?.portfolio_images?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Portfolio</Text>
            <View style={styles.portfolioImages}>
              {data?.portfolio_images.map((image, index) => (
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
        {role === "freelancer" &&
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
          {" "}
          {userData?.city}, {userData?.state} ({userData?.country}){" "}
        </Text>

        <Text style={styles.locTitle}>Member Since</Text>
        <Text style={styles.locSubTitle}>{formattedDate}</Text>

        {userData ? (
          <>
            {roleOptions?.freelancerData && roleOptions?.clientData ? (
              <TouchableOpacity
                style={styles.editProfileButton}
                onPress={() =>
                  handleRoleSwitch(
                    userData.role === "freelancer"
                      ? roleOptions.clientData
                      : roleOptions.freelancerData
                  )
                }
              >
                <Text style={styles.buttonText}>
                  Switch to{" "}
                  {userData.role === "freelancer" ? "Client" : "Freelancer"}
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
        ) : (
          <Text style={styles.infoText}>No user data available</Text>
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
      marginBottom: 50,
      borderWidth: 1,
      padding: 10,
      borderRadius: 12,
      borderColor: "#4C0183",
      marginHorizontal: 20,
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
