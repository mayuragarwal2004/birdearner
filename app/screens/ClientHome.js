import React, { useCallback, useEffect, useState } from "react";
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
import { getProfileStatus, isProfileSetupNeeded, isPhaseCompleteOrSkipped } from "../lib/profileStatusStorage";
// import { useAppwrite } from "../context/AppwriteContext";

const placeholderImageURL = "https://picsum.photos/seed/";


const ClientHomeScreen = () => {
  const [search, setSearch] = useState("");
  const [showGif, setShowGif] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [currentSetupStep, setCurrentSetupStep] = useState(null);
  // const { appwriteConfig, databases } = useAppwrite();

  const [filteredFreelanceServices, setFilteredFreelanceServices] = useState(
    []
  );
  const [filteredHouseholdServices, setFilteredHouseholdServices] = useState(
    []
  );
  const [ongoingJobs, setOngoingJobs] = useState([]);
  const [freelanceProfile, setFreelanceProfile] = useState([]);
  const [profilePercentage, setProfilePercentage] = useState(20);
  const [refreshing, setRefreshing] = useState(false);
  const [combinedData, setCombinedData] = useState([]);
  const { userData, setUserData, logout, userProfile, user } = useAuth();
  const navigation = useNavigation();

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];

  const styles = getStyles(currentTheme);

  // Check profile setup status and determine if setup is needed
  const checkProfileSetupStatus = async () => {
    try {
      if (!user || !userData || userData.role !== 'CLIENT') {
        setShowProfileSetup(false);
        return;
      }

      // Check if profile setup is needed using the new status storage
      const setupNeeded = await isProfileSetupNeeded('CLIENT');
      
      if (!setupNeeded) {
        setShowProfileSetup(false);
        navigation.replace('MainTabs');
        return;
      }

      // Check phase completion flags from database
      const hasPhase1Complete = userProfile && userProfile.phase1Completed;
      const hasPhase2Complete = userProfile && userProfile.phase2Completed;

      // Check if phases were skipped using the new status storage
      const phase1SkippedOrComplete = await isPhaseCompleteOrSkipped('CLIENT', 1);
      const phase2SkippedOrComplete = await isPhaseCompleteOrSkipped('CLIENT', 2);

      console.log("Client profile setup status check:");
      console.log("Phase 1 completed:", hasPhase1Complete, "skipped or complete:", phase1SkippedOrComplete);
      console.log("Phase 2 completed:", hasPhase2Complete, "skipped or complete:", phase2SkippedOrComplete);

      // Determine which phase needs to be completed
      if (!hasPhase1Complete && !phase1SkippedOrComplete) {
        setCurrentSetupStep('DescribeRole');
        setShowProfileSetup(true);
      } else if (!hasPhase2Complete && !phase2SkippedOrComplete) {
        setCurrentSetupStep('TellUsAboutYou');
        setShowProfileSetup(true);
      } else {
        setShowProfileSetup(false);
        // If all phases are complete or skipped, navigate to main tabs
        navigation.replace('MainTabs');
      }
    } catch (error) {
      console.error("Error checking profile setup status:", error);
      setShowProfileSetup(false);
    }
  };

  useEffect(() => {
    checkProfileSetupStatus();
  }, [user, userData, userProfile]);

  // Handle profile setup navigation
  const handleProfileSetupNavigation = () => {
    if (currentSetupStep) {
      console.log("Navigating to profile setup step:", currentSetupStep);
      
      navigation.navigate(currentSetupStep);
    }
  };

  // Handle skip profile setup (go to main tabs)
  const handleSkipProfileSetup = () => {
    navigation.replace('MainTabs');
  };

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

  const RenderServiceItem = React.memo(({ item, onPress, borderRadius }) => (
    <TouchableOpacity onPress={() => onPress(item)}>
      <View style={styles.serviceCard}>
        <View style={styles.imageShadow}>
          <Image
            source={{ uri: item.image }}
            style={[styles.serviceImage, { borderRadius }]}
          />
        </View>
        <View style={styles.serviceTextlay}>
          <Text style={styles.serviceText} numberOfLines={2} ellipsizeMode="tail">
            {item.title}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  ));

  useEffect(() => {
    let percentage = 0;

    if (userProfile?.fullName) percentage = 20;
    if (userProfile?.country) percentage = 40;
    if (userProfile?.profilePhoto) percentage = 70;
    if (userProfile?.termsAccepted) percentage = 100;

    setProfilePercentage(percentage);
  }, [userProfile, refreshing]);

  const sendTitle = (item) => {
    const title = item.title;
    const freelancerType = item.id;

    navigation.navigate("Job Requirements", { title, freelancerType });
  };

  useEffect(() => {
    const fetchOngoingJobs = async () => {
      try {
        if (userData?.role === "CLIENT" && userProfile?.id) {
          setLoadingJobs(true); // Start loading
          // Fetch ongoing jobs from the new backend API
          const ongoingJobsData = await apiService.getOngoingJobsByClientId(userProfile.id);
          
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
  }, [refreshing, userData, userProfile]);

  const handleCompleteProfile = () => {
    if (userData && userProfile) {
      // Check if userData and userProfile are not null
      const fullName = userProfile.fullName;
      const email = userData.email;
      const password = userData.password;
      const role = userData.role;

      if (profilePercentage < 20) {
        navigation.navigate("DescribeRoleCom", {
          fullName,
          email,
          password,
          role,
        });
      } else if (profilePercentage >= 20 && profilePercentage < 40) {
        navigation.navigate("DescribeRoleCom", {
          fullName,
          email,
          password,
          role,
        });
      } else if (profilePercentage >= 40 && profilePercentage < 70) {
        navigation.navigate("TellUsAboutYouCom", { role });
      } else if (profilePercentage >= 70 && profilePercentage < 100) {
        navigation.navigate("PortfolioCom", { role });
      }
    }
  };

  const openChat = (receiverId, full_name, profileImage, projectId) => {
    console.log("Opening chat with:", { receiverId, full_name, profileImage, projectId });
    
    navigation.navigate("ClientChatList", {
      receiverId,
      full_name,
      profileImage,
      projectId,
    });
  };

  useEffect(() => {
    const freelanceData = freelance_service.map((service) => ({
      title: service,
      image: `${placeholderImageURL}${encodeURIComponent(service)}/160/160`,
      id: service,
    }));
    setFilteredFreelanceServices(freelanceData);

    const householdData = household_service.map((service) => ({
      title: service,
      image: `${placeholderImageURL}${encodeURIComponent(service)}/160/160`,
      id: service,
    }));
    setFilteredHouseholdServices(householdData);
  }, [refreshing]);

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

  const handleSearch = (text) => {
    setSearch(text);
    if (text === "") {
      // Reset the services if search text is empty
      setFilteredFreelanceServices(
        freelance_service.map((service) => ({
          title: service,
          image: `${placeholderImageURL}${encodeURIComponent(service)}/160/160`,
          id: service,
        }))
      );
      setFilteredHouseholdServices(
        household_service.map((service) => ({
          title: service,
          image: `${placeholderImageURL}${encodeURIComponent(service)}/160/160`,
          id: service,
        }))
      );
    } else {
      // Filter services based on search text
      const filteredFreelance = freelance_service
        .filter((service) => service.toLowerCase().includes(text.toLowerCase()))
        .map((service) => ({
          title: service,
          image: `${placeholderImageURL}${encodeURIComponent(service)}/160/160`,
          id: service,
        }));

      const filteredHousehold = household_service
        .filter((service) => service.toLowerCase().includes(text.toLowerCase()))
        .map((service) => ({
          title: service,
          image: `${placeholderImageURL}${encodeURIComponent(service)}/160/160`,
          id: service,
        }));

      setFilteredFreelanceServices(filteredFreelance);
      setFilteredHouseholdServices(filteredHousehold);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
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

  const handleLogout = async () => {
    try {
      await logout();
      Alert.alert("Success", "Logged out successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to logout: " + error.message);
    }
  };

  const renderFreelanceService = useCallback(
    ({ item }) => <RenderServiceItem item={item} onPress={sendTitle} borderRadius={45} />,
    []
  );

  const renderHouseholdService = useCallback(
    ({ item }) => <RenderServiceItem item={item} onPress={sendTitle} borderRadius={7} />,
    []
  );


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
          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <FontAwesome name="sign-out" size={20} color="#fff" />
          </TouchableOpacity>
          {showGif ? (
            <Image source={gifAnimation} style={styles.gifStyle} />
          ) : (
            <TouchableOpacity style={styles.notificationIcon} onPress={handlePress}>
              <Image
                source={
                  userProfile?.profilePhoto
                    ? { uri: userProfile.profilePhoto }
                    : require("../assets/profile.png")
                }
                style={styles.proileImage}
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
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.StoryContainer}>
            <TouchableOpacity onPress={() => navigation.navigate("Job Requirements")}>
              <View style={styles.addStory}>
                <Text style={styles.addText}>+</Text>
              </View>
            </TouchableOpacity>

            {combinedData.length > 0 ? (
              combinedData.map((item, index) => {
                const { jobDetails, full_name, profile_photo, color } = item;
                const receiverId = jobDetails?.assigned_freelancer || null;
                const projectId = jobDetails?.$id || null;

                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() =>
                      openChat(receiverId, full_name, profile_photo, projectId)
                    }
                    disabled={!jobDetails}
                  >
                    <View
                      key={index}
                      style={[
                        styles.onGoItem,
                        {
                          borderWidth: 4,
                          borderColor: color,
                          borderRadius: 50,
                          opacity: jobDetails ? 1 : 0.5,
                        },
                      ]}
                    >
                      {jobDetails ? (
                        <Image
                          source={{ 
                            uri: profile_photo || `${placeholderImageURL}${index}/100/100`
                          }}
                          style={styles.ongoingImage}
                          onError={(e) => {
                            console.log('Image load error:', e.nativeEvent.error);
                          }}
                        />
                      ) : (
                        <Text style={styles.placeholderText}>?</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              [0, 1, 2].map((item, index) => {

                return (
                  <TouchableOpacity
                    key={index}
                  >
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
                )
                })
              )}
              </ScrollView>
            </View>

            <View style={styles.searchContainer}>
              <TextInput
              style={styles.searchInput}
              placeholder="Search"
              value={search}
              onChangeText={handleSearch}
              autoFocus={false}
              />
              <FontAwesome name="search" size={20} color={currentTheme.subText} style={styles.searchIcon} />
            </View>

            <View>
              {/* Freelance Services */}
          <FlatList
            data={filteredFreelanceServices}
            renderItem={renderFreelanceService}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.carousel}
            initialNumToRender={10}
            getItemLayout={(data, index) => ({
              length: 200,
              offset: 200 * index,
              index,
            })}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No Freelance Services Found
                </Text>
              </View>
            )}
          />

          {/* Household Services */}
          <FlatList
            data={filteredHouseholdServices}
            renderItem={renderHouseholdService}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.carousel}
            initialNumToRender={10}
            getItemLayout={(data, index) => ({
              length: 200,
              offset: 200 * index,
              index,
            })}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No Household Services Found
                </Text>
              </View>
            )}
          />
        </View>


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
      position: "static"
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
      color: currentTheme.text
    },
    how: {
      fontSize: 25,
      fontWeight: "300",
      color: currentTheme.subText
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
      color: "#555"
    },
    proileImage: {
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
      color: currentTheme.text
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
      color: currentTheme.subText
    },
    onGoItem: {
      marginRight: 8,
      marginTop: 15
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
      color: currentTheme.text
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
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      zIndex: 1000,
      justifyContent: 'center',
      alignItems: 'center',
    },
    profileSetupContainer: {
      backgroundColor: 'white',
      borderRadius: 16,
      padding: 24,
      margin: 20,
      alignItems: 'center',
      shadowColor: '#000',
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
      fontWeight: 'bold',
      marginBottom: 12,
      color: '#333',
      textAlign: 'center',
    },
    profileSetupMessage: {
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 24,
      color: '#666',
      lineHeight: 22,
    },
    profileSetupButton: {
      backgroundColor: currentTheme.primary || '#3b006b',
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      marginVertical: 8,
      minWidth: 200,
    },
    profileSetupButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },
    profileSetupSkipButton: {
      backgroundColor: 'transparent',
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      marginVertical: 8,
      minWidth: 200,
      borderWidth: 1,
      borderColor: currentTheme.primary || '#3b006b',
    },
    profileSetupSkipButtonText: {
      color: currentTheme.primary || '#3b006b',
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },
  });

export default ClientHomeScreen;
