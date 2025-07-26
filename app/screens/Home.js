import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from "react-native";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../context/NewAuthContext";
import { useTheme } from "../context/ThemeContext";
import { useNavigation } from "@react-navigation/native";

const HomeScreen = () => {
  // const { appwriteConfig, databases } = useAppwrite();
  const { userData, logout } = useAuth();
  const [profilePercentage, setProfilePercentage] = useState(20);
  const [flagsCount, setFlagsCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [CompletedOrders, setCompletedOrders] = useState(0);
  const [activeOrders, setActiveOrders] = useState(0);
  const [cancelledOrders, setCancelledOrdersOrders] = useState(0);
  const [successScore, setSuccessScore] = useState(0);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [currentSetupStep, setCurrentSetupStep] = useState(null);
  const navigation = useNavigation();

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];

  const styles = getStyles(currentTheme);


  // Handle profile setup navigation
  const handleProfileSetupNavigation = () => {
    if (currentSetupStep) {
      navigation.navigate(currentSetupStep);
    }
  };

  // Handle skip profile setup (go to main tabs)
  const handleSkipProfileSetup = () => {
    navigation.replace('MainTabs');
  };

  const fetchOrderRecords = async () => {
    try {
      // TODO: Implement with new backend
      // For now, set some default values to prevent errors
      setCancelledOrdersOrders(0);
      setActiveOrders(0);
      setCompletedOrders(0);
      setSuccessScore(0);
      
      /* Original Appwrite code - commented out for migration
      const cancelledOrders = userData?.cancelled_jobs.length;
      const assignedJobs = userData?.assigned_jobs;

      setCancelledOrdersOrders(cancelledOrders);

      if (userData?.assigned_jobs.length === 0) {
        setActiveOrders(0);
        setCompletedOrders(0);
      } else {
        const jobPromises = assignedJobs.map((jobId) =>
          databases.getDocument(
            appwriteConfig.databaseId,
            appwriteConfig.jobCollectionID,
            jobId
          )
        );

        const jobs = await Promise.all(jobPromises);

        const completedCount = jobs.filter(
          (job) => job?.completed_status === true
        ).length;
        const activeCount = jobs.filter(
          (job) =>
            job?.completed_status === false || job?.completed_status === null
        ).length;

        setCompletedOrders(completedCount);
        setActiveOrders(activeCount);

        const totalOrders = completedCount + cancelledOrders;
        const calSuccessScore = totalOrders
          ? ((completedCount / totalOrders) * 100).toFixed(0)
          : 0;

        setSuccessScore(calSuccessScore);
      }
      */
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    fetchOrderRecords();
  }, []);

  useEffect(() => {
    let percentage = 20; // Start with basic profile
    
    // Update profile percentage based on available user data
    console.log({ userData });
    
    if (userData?.email) percentage = 40;
    if (userData?.role) percentage = 60;
    if (userData?.id) percentage = 80;
    // TODO: Add more fields as they become available in backend

    setProfilePercentage(percentage);
    setFlagsCount(0); // TODO: Implement flags in new backend
  }, [userData]);

  const handleCompleteProfile = () => {
    // TODO: Update for new backend structure
    const email = userData?.email;
    const userRole = userData?.role;

    // For now, navigate to a simple profile completion flow
    // TODO: Implement proper profile completion with new backend
    console.log("Complete profile clicked - TODO: implement with new backend");
    
    /* Original logic - commented out for migration
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
    */
  };

  // TODO: Implement user data fetching with new backend
  /* Original Appwrite code - commented out for migration
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
  */

  const formatAmount = (xp) => {
    if (xp >= 1000000) {
      return (xp / 1000000).toFixed(1) + "M"; // For millions
    } else if (xp >= 1000) {
      return (xp / 1000).toFixed(1) + "K"; // For thousands
    } else {
      return xp; // For values less than 1000
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    // TODO: Implement refresh with new backend
    // fetchUserData();
    fetchOrderRecords();
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  return (
    <SafeAreaView>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.safeContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#3b006b"]}
            progressBackgroundColor={currentTheme.cardBackground || "#fff"}
          />
        }
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.notificationIcon}
            onPress={() => {
              navigation.navigate("Notification");
            }}
          >
            <MaterialIcons name="notifications" size={24} color="#fff" />
          </TouchableOpacity>
          
          <Text style={styles.welcomeText}>Welcome Back</Text>
          {/* Make sure to wrap dynamic content with Text component */}
          <Text style={styles.usernameText}>
            {userData ? `${userData?.email || "User"}` : "User"}
          </Text>
        </View>

        {/* Your Statistics Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Your Statistics</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statsBox}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{successScore}%</Text>
                <Text style={styles.statLabel}>Success Score</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>1 hr</Text>
                <Text style={styles.statLabel}>Avg. Response time</Text>
              </View>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{flagsCount || "NA"}</Text>
              <Text style={styles.statLabel}>Flags</Text>
            </View>
            <View style={styles.statsBox}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>0</Text> {/* TODO: Implement rating with new backend */}
                <Text style={styles.statLabel}>Rating</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>1</Text> {/* TODO: Implement level with new backend */}
                <Text style={styles.statLabel}>Your Level</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Your Earnings Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Your Earnings</Text>
          <View style={styles.earningsContainer}>
            <View style={styles.earningItem}>
              <Text style={styles.earningValue}>
                Rs. {formatAmount(0)} {/* TODO: Implement totalEarnings with new backend */}
              </Text>
              <Text style={styles.earningLabel}>Total Earnings</Text>
            </View>
            <View style={styles.earningItem}>
              <Text style={styles.earningValue}>
                Rs. {formatAmount(0)} {/* TODO: Implement monthlyEarnings with new backend */}
              </Text>
              <Text style={styles.earningLabel}>Monthly</Text>
            </View>
            <View style={styles.earningItem}>
              <Text style={styles.earningValue}>
                {formatAmount(0)} {/* TODO: Implement outstandingAmount with new backend */}
              </Text>
              <Text style={styles.earningLabel}>Outstanding Amount</Text>
            </View>
            <View style={styles.earningItem}>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("Profile", {
                    screen: "Withdrawal Earning",
                  })
                }
              >
                <Text style={styles.earningValue}>
                  Rs. {formatAmount(0)} {/* TODO: Implement withdrawableAmount with new backend */}
                </Text>
              </TouchableOpacity>
              <Text style={styles.earningLabel}>Withdrawal</Text>
            </View>
          </View>
        </View>

        {/* Your Orders Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Your Orders</Text>
          <View style={styles.ordersContainer}>
            <View style={styles.orderItem}>
              <Text style={styles.orderValue}>{CompletedOrders || 0}</Text>
              <Text style={styles.orderLabel}>Orders Completed</Text>
            </View>
            <View style={styles.orderItem}>
              <Text style={styles.orderValue}>{activeOrders || 0}</Text>
              <Text style={styles.orderLabel}>Active Orders</Text>
            </View>
            <View style={styles.orderItem}>
              <Text style={styles.orderValue}>{cancelledOrders || 0}</Text>
              <Text style={styles.orderLabel}>Cancelled Orders</Text>
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
            {/* You can add new content here */}
            <Text style={styles.whatsNewText}>No updates</Text>
          </View>
        </View>
      </ScrollView>
      <View style={styles.stickyButton}>
        <TouchableOpacity
          style={styles.chatIcon}
          onPress={() => navigation.navigate(userData.role === 'FREELANCER' ? 'FreelancerChatList' : 'ClientChatList')}
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
      // flex: 1,
      backgroundColor: currentTheme.background || "#fff",
      paddingHorizontal: 20,
      paddingTop: 30,
    },
    header: {
      flexDirection: "column",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
      marginTop: 15,
    },
    welcomeText: {
      fontSize: 24,
      fontWeight: "bold",
      color: currentTheme.primary || "#5A4CAE",
    },
    usernameText: {
      fontSize: 18,
      color: currentTheme.primary || "#5A4CAE",
    },
    notificationIcon: {
      backgroundColor: "#3b006b",
      padding: 10,
      borderRadius: 50,
      position: "absolute",
      right: 10,
    },
    logoutButton: {
      backgroundColor: "#dc3545",
      padding: 10,
      borderRadius: 50,
      position: "absolute",
      right: 70, // Position it next to the notification icon
    },
    sectionContainer: {
      marginBottom: 20,
    },
    profileContainers: {
      backgroundColor: currentTheme.cardBackground || "#ffffff",
      padding: 10,
      marginTop: 12,
      // justifyContent: "space-between",
      flexDirection: "column",
      alignItems: "center",
      borderBottomRightRadius: 20,
      // marginHorizontal: 20,
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
      shadowColor: currentTheme.shadow || "#000000",
      shadowOffset: {
        width: 0,
        height: 3,
      },
      shadowOpacity: 0.17,
      shadowRadius: 3.05,
      elevation: 4,
    },
    statsContainer: {
      backgroundColor: currentTheme.cardBackground || "#ffffff",
      padding: 10,
      paddingVertical: 20,
      gap: 12,
      marginTop: 12,
      flexDirection: "row",
      justifyContent: "space-around",
      alignContent: "center",
      alignItems: "center",
      borderBottomRightRadius: 20,
      borderTopLeftRadius: 20,
      shadowColor: currentTheme.shadow || "#000000",
      shadowOffset: {
        width: 0,
        height: 3,
      },
      shadowOpacity: 0.17,
      shadowRadius: 3.05,
      elevation: 4,
    },
    statsBox: {
      flex: 1,
      flexDirection: "column",
      justifyContent: "center",
      alignContent: "center",
      alignItems: "center",
      gap: 15,
    },
    statItem: {
      alignItems: "center",
      // width: "1%",
    },
    statValue: {
      fontSize: 20,
      fontWeight: "bold",
      color: "#5A4CAE",
    },
    statLabel: {
      fontSize: 12,
      color: currentTheme.subText || "#000",
      textAlign: "center",
    },
    earningsContainer: {
      backgroundColor: currentTheme.cardBackground || "#ffffff",
      padding: 10,
      marginTop: 12,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 5,
      justifyContent: "space-between",
      borderBottomRightRadius: 20,
      borderTopLeftRadius: 20,
      shadowColor: currentTheme.shadow || "#000000",
      shadowOffset: {
        width: 0,
        height: 3,
      },
      shadowOpacity: 0.17,
      shadowRadius: 3.05,
      elevation: 4,
    },
    earningItem: {
      alignItems: "center",
      width: "45%",
    },
    earningValue: {
      fontSize: 20,
      fontWeight: "bold",
      color: "#5A4CAE",
    },
    earningLabel: {
      fontSize: 12,
      color: currentTheme.subText || "#000",
    },
    ordersContainer: {
      backgroundColor: currentTheme.cardBackground || "#ffffff",
      padding: 10,
      marginTop: 12,
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-around",
      gap: 20,
      borderBottomRightRadius: 20,
      borderTopLeftRadius: 20,
      shadowColor: currentTheme.shadow || "#000000",
      shadowOffset: {
        width: 0,
        height: 3,
      },
      shadowOpacity: 0.17,
      shadowRadius: 3.05,
      elevation: 4,
    },
    orderItem: {
      alignItems: "center",
      width: "30%",
    },
    orderValue: {
      fontSize: 20,
      fontWeight: "bold",
      color: "#5A4CAE",
    },
    orderLabel: {
      fontSize: 12,
      color: currentTheme.subText || "#000",
      textAlign: "center",
    },
    whatsNewContainer: {
      backgroundColor: currentTheme.cardBackground || "#ffffff",
      padding: 10,
      marginTop: 12,
      marginBottom: 30,
      justifyContent: "space-between",
      flexDirection: "row",
      alignItems: "center",
      borderBottomRightRadius: 20,
      borderTopLeftRadius: 20,
      shadowColor: currentTheme.shadow || "#000000",
      shadowOffset: {
        width: 0,
        height: 3,
      },
      shadowOpacity: 0.17,
      shadowRadius: 3.05,
      elevation: 4,
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
      shadowColor: currentTheme.shadow || "#000000",
      shadowOffset: {
        width: 0,
        height: 3,
      },
      shadowOpacity: 0.17,
      shadowRadius: 3.05,
      elevation: 4,
    },
    chatIcon: {
      flex: 1,
      justifyContent: "center",
      alignContent: "center",
      alignItems: "center",
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

export default HomeScreen;
