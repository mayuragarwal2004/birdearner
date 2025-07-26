import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  ScrollView,
  RefreshControl,
  Alert,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { household_service, freelance_service } from "../lib/roleData";
import { useAuth } from "../context/NewAuthContext";
import { differenceInDays } from "date-fns";
import gifAnimation from "../assets/loading.gif";
import { useTheme } from "../context/ThemeContext";
import { useNavigation } from "@react-navigation/native";
import apiService from "../lib/apiService";
import ClientHomeServiceFinder from "../components/ClientHomeServiceFinder";

const placeholderImageURL = "https://picsum.photos/seed/";

const ClientHomeScreen = () => {
  const [showGif, setShowGif] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(false);

  const servicesRef = useRef(null)

  const [ongoingJobs, setOngoingJobs] = useState([]);
  const [profilePercentage, setProfilePercentage] = useState(20);
  const [refreshing, setRefreshing] = useState(false);
  const [combinedData, setCombinedData] = useState([]);
  const { userData } = useAuth();
  const navigation = useNavigation();

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];

  const styles = getStyles(currentTheme);

  const categorizeJobs = (jobs) => {
    const today = new Date();

    return jobs.map((job) => {
      const deadline = new Date(job.deadline);
      const daysRemaining = differenceInDays(deadline, today);

      let color;

      if (daysRemaining < 0) {
        color = "#000";
      } else if (daysRemaining <= 2) {
        color = "#FF3B30";
      } else if (daysRemaining <= 10) {
        color = "#FFCC00";
      } else {
        color = "#34C759";
      }

      return {
        ...job,
        color,
      };
    });
  };

  useEffect(() => {
    let percentage = 0;

    if (userData.client?.fullName) percentage = 20;
    if (userData.client?.country) percentage = 40;
    if (userData.client?.profilePhoto) percentage = 70;
    if (userData.client?.termsAccepted) percentage = 100;

    setProfilePercentage(percentage);
  }, [userData, refreshing]);

  const sendTitle = (item) => {
    const title = item.title;
    const freelancerType = item.id;

    navigation.navigate("Job Requirements", { title, freelancerType });
  };

  console.log({ ongoingJobs });

  useEffect(() => {
    const fetchOngoingJobs = async () => {
      try {
        if (userData?.role === "CLIENT" && userData?.id) {
          setLoadingJobs(true); // Start loading
          // Fetch ongoing jobs from the new backend API
          const ongoingJobsData = await apiService.getOngoingJobsByClientId(
            userData.client.id
          );

          if (ongoingJobsData && ongoingJobsData.length > 0) {
            setOngoingJobs(ongoingJobsData);
            setCombinedData(ongoingJobsData);
          } else {
            // If no ongoing jobs, show empty placeholders
            const emptySlots = Array(3).fill({
              jobDetails: null,
              full_name: "?",
              profile_photo: placeholderImageURL,
              color: "#D3D3D3", // Placeholder for empty slots
            });
            setOngoingJobs([]);
            setCombinedData(emptySlots);
          }
        } else {
          // For non-client users or when profile is not loaded
          const emptySlots = Array(3).fill({
            jobDetails: null,
            full_name: "?",
            profile_photo: placeholderImageURL,
            color: "#D3D3D3",
          });
          setOngoingJobs([]);
          setCombinedData(emptySlots);
        }
      } catch (error) {
        console.error("Error fetching ongoing jobs:", error);
        Alert.alert("Error", "Failed to fetch ongoing jobs: " + error.message);

        // Fallback to empty placeholders on error
        const emptySlots = Array(3).fill({
          jobDetails: null,
          full_name: "?",
          profile_photo: placeholderImageURL,
          color: "#D3D3D3",
        });
        setOngoingJobs([]);
        setCombinedData(emptySlots);
      } finally {
        setLoadingJobs(false); // Stop loading
      }
    };

    fetchOngoingJobs();
  }, [refreshing, userData]);

  const handleCompleteProfile = () => {
    if (userData) {
      if (userData.role === "FREELANCER") {
        navigation.navigate("FreelancerProfileSetup");
      } else if (userData.role === "CLIENT") {
        navigation.navigate("ClientProfileSetup");
      }
    }
  };

  const openChat = (receiverId, full_name, profileImage, jobId) => {
    console.log("Opening chat with:", {
      receiverId,
      full_name,
      profileImage,
      jobId,
    });

    navigation.navigate("ClientChatList", {
      receiverId,
      full_name,
      profileImage,
      jobId,
    });
  };

  useEffect(() => {
    const refreshUserData = async () => {
      try {
        if (userData?.id) {
          // Fetch updated user data from the new backend API
          const updatedUserData = await apiService.getUserProfile(userData.id);

          if (updatedUserData) {
            // Update the auth context with fresh data
            console.log("Updated user data:", updatedUserData);
            // Note: You might want to update the auth context here if needed
          }
        }
      } catch (error) {
        console.error("Error updating user data:", error);
        // Don't show alert for this as it's background refresh
      }
    };

    refreshUserData();
  }, [refreshing, userData]);

  const onRefresh = () => {
    setRefreshing(true);
    
    // Call child function
    if (servicesRef.current?.refreshCard) {
      servicesRef.current.refreshCard();
    }
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handlePress = () => {
    setShowGif(true);

    setTimeout(() => {
      setShowGif(false);
      navigation.navigate("Offers");
    }, 1000);
  };

  return (
    <SafeAreaView
      style={styles.safeContainer}
      showsVerticalScrollIndicator={true}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.wraptext}>
          <Text style={styles.welcome}>Welcome</Text>
          <Text style={styles.how}>How's the day!</Text>
        </View>
        <View style={styles.headerRight}>
          {showGif ? (
            <Image source={gifAnimation} style={styles.gifStyle} />
          ) : (
            <TouchableOpacity
              style={styles.notificationIcon}
              onPress={handlePress}
            >
              <Image
                source={
                  userData.client?.profilePhoto
                    ? {
                        uri: apiService.loadImageURI(
                          userData.client.profilePhoto
                        ),
                      }
                    : require("../assets/profile.png")
                }
                style={styles.profileImage}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.line}></View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#3b006b"]}
            progressBackgroundColor={currentTheme.cardBackground || "#fff"}
          />
        }
      >
        <View style={styles.ongoingJobsContainer}>
          <Text style={styles.ongoingTitle}>Your Ongoing Jobs</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.StoryContainer}
          >
            <TouchableOpacity
              onPress={() => navigation.navigate("Job Requirements")}
            >
              <View style={styles.addStory}>
                <Text style={styles.addText}>+</Text>
              </View>
            </TouchableOpacity>

            {combinedData.length > 0
              ? combinedData.map((item, index) => {
                  console.log({ item });

                  const { jobDetails, full_name, profile_photo, color } = item;
                  const receiverId = jobDetails?.assigned_freelancer || null;
                  const jobId = jobDetails?.$id || null;

                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() =>
                        openChat(receiverId, full_name, profile_photo, jobId)
                      }
                      disabled={!jobDetails}
                    >
                      <View
                        key={index}
                        style={[
                          styles.onGoItem,
                          {
                            borderWidth: 4,
                            borderColor:
                              jobDetails.jobStatus === "COMPLETED"
                                ? "#4CAF50"
                                : jobDetails.jobStatus === "IN_PROGRESS"
                                ? "#2196F3"
                                : jobDetails.jobStatus === "OPEN"
                                ? "#FFCC00"
                                : "#aba8a6",
                            borderRadius: 50,
                            opacity: jobDetails ? 1 : 0.5,
                          },
                        ]}
                      >
                        {jobDetails ? (
                          <Image
                            source={{
                              uri:
                                apiService.loadImageURI(
                                  jobDetails.attachedFiles[0]
                                ) || `${placeholderImageURL}${index}/100/100`,
                            }}
                            style={styles.ongoingImage}
                            onError={(e) => {
                              console.log(
                                "Image load error:",
                                e.nativeEvent.error
                              );
                            }}
                          />
                        ) : (
                          <Text style={styles.placeholderText}>?</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })
              : [0, 1, 2].map((item, index) => {
                  return (
                    <TouchableOpacity key={index}>
                      <View
                        key={index}
                        style={[
                          styles.onGoItem,
                          {
                            borderWidth: 4,
                            borderColor: "#D3D3D3",
                            borderRadius: 50,
                            opacity: 0.5,
                          },
                        ]}
                      >
                        <Text style={styles.placeholderText}>?</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
          </ScrollView>
        </View>

        <ClientHomeServiceFinder ref={servicesRef} />

        {/* Job Notifications */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Job Notifications</Text>
          <View style={styles.notificationsContainer}>
            <View style={styles.notificationsBox}>
              {["Job 1"].map((job, index) => (
                <View
                  key={index}
                  style={[
                    styles.notiItem,
                    {
                      borderWidth: 4,
                      borderColor: index % 2 === 0 ? "#F81919" : "#1DCE44",
                      borderRadius: 50,
                    },
                  ]}
                >
                  <Image
                    source={{ uri: `${placeholderImageURL}${index}/100/100` }}
                    style={styles.notiImage}
                  />
                </View>
              ))}
              <View style={styles.notiTextLay}>
                <Text
                  style={styles.notiText}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  Jack234 has sent you 2 files.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {!userData?.terms_accepted && profilePercentage !== 100 && (
          <View style={styles.sectionContainer}>
            <View style={styles.profileContainers}>
              <Text style={styles.profileText}>Complete Your Profile</Text>
              <Text style={styles.whatsNewText}>
                Your profile is {profilePercentage}% complete
              </Text>
              <View style={styles.boxColor}>
                <View
                  style={
                    profilePercentage >= 20 ? styles.redBox : styles.pBoxColor
                  }
                ></View>
                <View
                  style={
                    profilePercentage >= 40 ? styles.redBox : styles.pBoxColor
                  }
                ></View>
                <View
                  style={
                    profilePercentage >= 70
                      ? styles.yellowBox
                      : styles.pBoxColor
                  }
                ></View>
                <View
                  style={
                    profilePercentage >= 70
                      ? styles.yellowBox
                      : styles.pBoxColor
                  }
                ></View>
                <View
                  style={
                    profilePercentage === 100
                      ? styles.greenBox
                      : styles.pBoxColor
                  }
                ></View>
                <View
                  style={
                    profilePercentage === 100
                      ? styles.greenBox
                      : styles.pBoxColor
                  }
                ></View>
              </View>
              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleCompleteProfile}
                F
              >
                <Text style={styles.loginButtonText}>Complete Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>What's New</Text>
          <View style={styles.whatsNewContainer}>
            <Text style={styles.whatsNewText}>No new updates</Text>
          </View>
        </View>
      </ScrollView>
      <View style={styles.stickyButton}>
        <TouchableOpacity
          style={styles.chats}
          onPress={() => {
            openChat(
              userData?.id,
              userData?.full_name || "User",
              userData?.profile_photo || placeholderImageURL,
              null // Assuming no projectId for direct chat
            );
          }}
        >
          <FontAwesome name="comments" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const getStyles = (currentTheme) =>
  StyleSheet.create({
    safeContainer: {
      flex: 1,
      backgroundColor: currentTheme.background || "#ffffff",
      // paddingHorizontal: 20,
      paddingTop: 10,
      // position: "relative"
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginHorizontal: 20,
      marginBottom: 10,
      marginTop: 30,
      // backgroundColor: "red",
      padding: 4,
      paddingHorizontal: 20,
      alignItems: "center",
      // gap: 140,
      position: "static",
    },
    headerRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    logoutButton: {
      backgroundColor: "#d32f2f",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      shadowColor: currentTheme.shadow || "#000000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    gifStyle: {
      // width: 10,
      // height: 50,
      resizeMode: "contain",
      marginBottom: -5,
      marginTop: -18,
    },
    welcome: {
      fontFamily: "Poppins-Regular",
      fontSize: 40,
      fontWeight: "600",
      color: currentTheme.text,
    },
    how: {
      fontSize: 25,
      fontWeight: "300",
      color: currentTheme.subText,
    },
    squareBox: {
      backgroundColor: "#5DE895",
      padding: 14,
    },
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 20,
      shadowColor: currentTheme.shadow || "#000000",
      shadowOffset: { width: 2, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 5,
      elevation: 5,
      borderRadius: 12,
      marginBottom: 24,
      backgroundColor: currentTheme.background3 || "#ffffff",
      borderColor: currentTheme.border || "#ddd",
      borderWidth: 1,
      paddingHorizontal: 12,
      height: 45,
    },
    searchInput: {
      flex: 1,
      color: currentTheme.subText,
      fontSize: 16,
      marginLeft: 10, // Ensures spacing between the icon and text
    },
    searchIcon: {
      marginRight: 5, // Adjust to fine-tune icon positioning
    },
    carousel: {
      marginBottom: 20,
      paddingHorizontal: 20,
    },
    serviceCard: {
      alignItems: "center",
      marginHorizontal: 10,
      marginVertical: 2,
      // paddingHorizontal: 15,
      flexDirection: "column",
      borderRadius: 10,
      // backgroundColor: currentTheme.background || "#ffffff",
      width: 100,
      flexWrap: "wrap",
      gap: 5,
    },
    serviceTextlay: {
      flex: 1,
      justifyContent: "center",
    },
    serviceText: {
      fontSize: 13,
      fontWeight: "500",
      textAlign: "center",
      flexWrap: "wrap",
      color: "#555",
    },
    profileImage: {
      width: 60,
      height: 60,
      borderRadius: 45,
      // shadowColor: "#000000", // Shadow color
      // shadowOffset: { width: 2, height: 4 }, // Shadow position
      // shadowOpacity: 0.2, // Shadow transparency (iOS)
      // shadowRadius: 4, // Shadow blur (iOS)
      // elevation: 3,
    },
    serviceImage: {
      width: 90,
      height: 90,
      shadowColor: currentTheme.shadow || "#000000", // Shadow color
      shadowOffset: { width: 2, height: 4 }, // Shadow position
      shadowOpacity: 0.2, // Shadow transparency (iOS)
      shadowRadius: 4, // Shadow blur (iOS)
      elevation: 3,
    },
    notificationsContainer: {
      backgroundColor: currentTheme.cardBackground || "#fff",
      padding: 6,
      // borderRadius: 10,
      marginTop: 12,
      marginHorizontal: 20,
      shadowColor: currentTheme.shadow || "#000000",
      shadowOffset: {
        width: 0,
        height: 3,
      },
      shadowOpacity: 0.17,
      shadowRadius: 3.05,
      elevation: 4,
      borderBottomRightRadius: 20,
      borderTopLeftRadius: 20,
    },
    notificationText: {
      fontSize: 14,
      marginBottom: 12,
      // color: currentTheme.text
    },
    notificationsBox: {
      flex: 1,
      justifyContent: "flex-start",
      alignItems: "center",
      flexDirection: "row",
      gap: 12,
    },
    notiText: {
      fontSize: 15,
      fontWeight: "500",
      color: currentTheme.text || "#000000",
      lineHeight: 25,
    },
    notiTextLay: {
      flex: 1,
    },
    sectionContainer: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#ffffff",
      backgroundColor: currentTheme.primary || "#3b006b",
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderBottomRightRadius: 20,
      borderTopLeftRadius: 20,
      textAlign: "center",
      marginHorizontal: 20,
      shadowColor: currentTheme.shadow || "#000000",
      shadowOffset: {
        width: 0,
        height: 3,
      },
      shadowOpacity: 0.17,
      shadowRadius: 3.05,
      elevation: 4,
    },
    whatsNewContainer: {
      backgroundColor: currentTheme.cardBackground || "#ffffff",
      padding: 10,
      marginTop: 12,
      justifyContent: "space-between",
      flexDirection: "row",
      alignItems: "center",
      borderBottomRightRadius: 20,
      marginHorizontal: 20,
      shadowColor: currentTheme.shadow || "#000000",
      shadowOffset: {
        width: 0,
        height: 3,
      },
      shadowOpacity: 0.17,
      shadowRadius: 3.05,
      elevation: 4,
      borderBottomRightRadius: 20,
      borderTopLeftRadius: 20,
    },
    profileContainers: {
      backgroundColor: currentTheme.cardBackground || "#ffffff",
      padding: 10,
      marginTop: 12,
      // justifyContent: "space-between",
      flexDirection: "column",
      alignItems: "center",
      borderBottomRightRadius: 20,
      marginHorizontal: 20,
      gap: 5,
      shadowColor: currentTheme.shadow || "#000000",
      shadowOffset: {
        width: 0,
        height: 3,
      },
      shadowOpacity: 0.17,
      shadowRadius: 3.05,
      elevation: 4,
      borderBottomRightRadius: 20,
      borderTopLeftRadius: 20,
    },
    whatsNewText: {
      fontSize: 16,
      color: currentTheme.subText || "#000",
    },
    stickyButton: {
      width: 60,
      height: 60,
      borderRadius: 40,
      backgroundColor: "#3b006b",
      position: "absolute",
      bottom: 20,
      right: 20,
      // marginLeft: 310,
      // marginBottom: 12,
      shadowColor: currentTheme.shadow || "#000000",
      shadowOffset: {
        width: 0,
        height: 3,
      },
      shadowOpacity: 0.17,
      shadowRadius: 3.05,
      elevation: 4,
    },
    chats: {
      // backgroundColor: "#3b006b",
      padding: 1,
      flex: 1,
      justifyContent: "center",
      alignContent: "center",
      alignItems: "center",
    },
    line: {
      backgroundColor: currentTheme.line || "#5F5959",
      width: "90%",
      height: 1,
      margin: "auto",
    },

    ongoingJobsContainer: {
      marginVertical: 20,
    },
    ongoingTitle: {
      fontSize: 16,
      fontWeight: "480",
      marginLeft: 44,
      color: currentTheme.text,
    },
    storyItem: {
      marginRight: 10,
      marginVertical: 12,
    },
    StoryContainer: {
      paddingLeft: 35,
      paddingRight: 20,
    },
    storyImage: { width: 74, height: 74, borderRadius: 50 },
    notiImage: { width: 55, height: 55, borderRadius: 50 },
    ongoingImage: { width: 70, height: 70, borderRadius: 50 },
    placeholderText: {
      width: 70,
      height: 70,
      borderRadius: 50,
      textAlign: "center",
      // alignContent: "center",
      fontSize: 36,
      paddingTop: 10,
      color: currentTheme.subText,
    },
    onGoItem: {
      marginRight: 8,
      marginTop: 15,
    },
    addStory: {
      width: 80,
      height: 80,
      borderRadius: 50,
      backgroundColor: currentTheme.background3 || "#D9D9D9",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 10,
      marginVertical: 12,
      shadowColor: currentTheme.shadow || "#000000",
      shadowOffset: {
        width: 0,
        height: 3,
      },
      shadowOpacity: 0.17,
      shadowRadius: 3.05,
      elevation: 4,
      alignContent: "center",
    },
    addText: { fontSize: 60, color: "#A39E9E" },
    profileContainer: {
      padding: 15,
      backgroundColor: "#f9f9f9",
      borderRadius: 10,
    },

    profileText: {
      fontSize: 24,
      fontWeight: "500",
      textAlign: "center",
      color: currentTheme.text,
    },
    boxColor: {
      flex: 1,
      flexDirection: "row",
      gap: 5,
      marginHorizontal: 20,
    },
    pBoxColor: {
      backgroundColor: currentTheme.text2 || "#CCD2CE",
      height: 12,
      width: 48,
      borderRadius: 12,
    },
    redBox: {
      backgroundColor: "#FF3131",
      height: 12,
      width: 48,
      borderRadius: 12,
    },
    yellowBox: {
      backgroundColor: "#CEBF1D",
      height: 12,
      width: 48,
      borderRadius: 12,
    },
    greenBox: {
      backgroundColor: "#00871E",
      height: 12,
      width: 48,
      borderRadius: 12,
    },
    loginButton: {
      width: "100%",
      height: 50,
      backgroundColor: currentTheme.primary || "#4B0082",
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 5,
      marginTop: 12,
    },
    loginButtonText: {
      color: "white",
      fontSize: 18,
      fontWeight: "bold",
    },
    headerRight: {
      flexDirection: "row",
      alignItems: "center",
    },
    logoutButton: {
      marginRight: 10,
      padding: 8,
      borderRadius: 50,
      backgroundColor: currentTheme.primary || "#4B0082",
      justifyContent: "center",
      alignItems: "center",
      shadowColor: currentTheme.shadow || "#000000",
      shadowOffset: {
        width: 0,
        height: 3,
      },
      shadowOpacity: 0.17,
      shadowRadius: 3.05,
      elevation: 4,
    },
    // Profile Setup Overlay Styles
    profileSetupOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      zIndex: 1000,
      justifyContent: "center",
      alignItems: "center",
    },
    profileSetupContainer: {
      backgroundColor: "white",
      borderRadius: 16,
      padding: 24,
      margin: 20,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    profileSetupTitle: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 12,
      color: "#333",
      textAlign: "center",
    },
    profileSetupMessage: {
      fontSize: 16,
      textAlign: "center",
      marginBottom: 24,
      color: "#666",
      lineHeight: 22,
    },
    profileSetupButton: {
      backgroundColor: currentTheme.primary || "#3b006b",
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      marginVertical: 8,
      minWidth: 200,
    },
    profileSetupButtonText: {
      color: "white",
      fontSize: 16,
      fontWeight: "600",
      textAlign: "center",
    },
    profileSetupSkipButton: {
      backgroundColor: "transparent",
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      marginVertical: 8,
      minWidth: 200,
      borderWidth: 1,
      borderColor: currentTheme.primary || "#3b006b",
    },
    profileSetupSkipButtonText: {
      color: currentTheme.primary || "#3b006b",
      fontSize: 16,
      fontWeight: "600",
      textAlign: "center",
    },
  });

export default ClientHomeScreen;
