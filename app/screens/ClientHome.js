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
import { useAuth } from "../context/AuthContext";
import { appwriteConfig, databases } from "../lib/appwrite";
import { Query } from "react-native-appwrite";
import { differenceInDays } from "date-fns";
import gifAnimation from "../assets/loading.gif";
import { useTheme } from "../context/ThemeContext";
import { useNavigation } from "@react-navigation/native";

const placeholderImageURL = "https://picsum.photos/seed/";


const ClientHomeScreen = () => {
  const [search, setSearch] = useState("");
  const [showGif, setShowGif] = useState(false);

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
  const { userData, setUserData } = useAuth();
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

    if (userData?.full_name) percentage = 20;
    if (userData?.country) percentage = 40;
    if (userData?.profile_photo) percentage = 70;
    if (userData?.terms_accepted) percentage = 100;

    setProfilePercentage(percentage);
  }, [userData, refreshing]);

  const sendTitle = (item) => {
    const title = item.title;
    const freelancerType = item.id;

    navigation.navigate("Job Requirements", { title, freelancerType });
  };

  useEffect(() => {
    const fetchOngoingJobs = async () => {
      try {
        const clientId = userData?.$id;
        if (!clientId) throw new Error("Client ID is undefined!");

        const projectDocs = await databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.jobCollectionID,
          [Query.equal("job_created_by", clientId)]
        );

        const onGoingJobs = projectDocs.documents.filter(
          (job) => job?.completed_status === false && job.assigned_freelancer
        );

        const freelancePromises = onGoingJobs.map((freelance) =>
          databases.getDocument(
            appwriteConfig.databaseId,
            appwriteConfig.freelancerCollectionId,
            freelance.assigned_freelancer
          )
        );

        const freelanceProfiles = await Promise.allSettled(freelancePromises);

        const validProfiles = freelanceProfiles
          .filter((result) => result.status === "fulfilled")
          .map((result) => result.value);

        const jobsWithColor = categorizeJobs(onGoingJobs);

        // Mapping combined data with job details and freelancer profiles
        const combinedData = validProfiles.map((profile) => {
          const correspondingJob = jobsWithColor.find(
            (job) => job.assigned_freelancer === profile.$id
          );

          return {
            ...profile,
            jobDetails: correspondingJob || null,
            color: correspondingJob?.color || "#D3D3D3",
          };
        });

        // Limiting to maximum 3 ongoing jobs
        const maxOngoingJobs = jobsWithColor.slice(0, 3);

        let emptySlots = [];

        if (maxOngoingJobs.length < 3) {
          const remainingEmptySlots = 3 - maxOngoingJobs.length;

          // Add empty slots based on how many jobs we have
          emptySlots = Array(remainingEmptySlots).fill({
            jobDetails: null,
            full_name: "?",
            profile_photo: placeholderImageURL,
            color: "#D3D3D3", // Placeholder for empty slots
          });
        }

        // Ensuring combinedData always has exactly 3 entries
        const finalData = [...combinedData, ...emptySlots].slice(0, 3);

        setOngoingJobs(jobsWithColor);
        setCombinedData(finalData);
      } catch (error) {
        Alert.alert("Error fetching ongoing jobs:", error.message)
      }
    };

    fetchOngoingJobs();
  }, [refreshing]);

  const handleCompleteProfile = () => {
    if (userData) {
      // Check if userData is not null
      const fullName = userData.full_name;
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
    navigation.navigate("Chat", {
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
          <Text style={styles.how}>How’s the day!</Text>
        </View>
        {showGif ? (
          <Image source={gifAnimation} style={styles.gifStyle} />
        ) : (
          <TouchableOpacity style={styles.notificationIcon} onPress={handlePress}>
            <Image
              source={
                userData?.profile_photo
                  ? { uri: userData.profile_photo }
                  : require("../assets/profile.png")
              }
              style={styles.proileImage}
            />
          </TouchableOpacity>
        )}
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
                          source={{ uri: profile_photo }}
                          style={styles.ongoingImage}
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
            navigation.navigate("Inbox");
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
  });

export default ClientHomeScreen;
