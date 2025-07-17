import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  ImageBackground,
  ActivityIndicator,
  Share,
  RefreshControl,
  Alert,
  SafeAreaView,
} from "react-native";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";
import ReviewCard from "../components/ReviewCard";
import { useAuth } from "../context/NewAuthContext";
import { useAppwrite } from "../context/AppwriteContext";
import { Query } from "react-native-appwrite";
import { useTheme } from "../context/ThemeContext";

export default function ReviewsScreen({ route, navigation }) {
  const { appwriteConfig, databases } = useAppwrite();
  const { receiverId } = route.params;
  const { user, loading, userData, setUserData } = useAuth();
  const [data, setData] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reviews, setReviews] = useState([]);
  const role = userData?.role === "client" ? "freelancer" : "client";

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];

  const styles = getStyles(currentTheme);

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

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const userCollectionId =
          role === "client"
            ? appwriteConfig.freelancerCollectionId
            : appwriteConfig.clientCollectionId;

        // Fetch reviews for the current user (receiverId)
        const response = await databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.reviewCollectionId,
          [Query.equal("receiverId", receiverId)] // Correct query syntax
        );

        // Sort reviews by createdAt field in descending order
        const sortedDocuments = response.documents.sort(
          (a, b) => new Date(b.$createdAt) - new Date(a.$createdAt)
        );

        const reviewsWithGiverData = await Promise.all(
          sortedDocuments.map(async (review) => {
            try {
              const giverResponse = await databases.getDocument(
                appwriteConfig.databaseId,
                userCollectionId,
                review.giverId
              );

              return {
                ...review,
                giverName: giverResponse.full_name,
                giverPhoto: giverResponse.profile_photo,
                state: giverResponse.state,
                country: giverResponse.country,
              };
            } catch (giverError) {
              Alert.alert("Error fetching giver data");
              return review; // Return review without giver info if fetch fails
            }
          })
        );

        setReviews(reviewsWithGiverData); // Update state with enriched reviews
      } catch (error) {
        Alert.alert("Failed to fetch reviews");
      }
    };

    fetchReviews();
  }, [refreshing]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
    setTimeout(() => setRefreshing(false), 1000);
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
          <TouchableOpacity
            style={styles.tabButtonL}
            onPress={() => {
              navigation.navigate("ProfileScreen", { receiverId });
            }}
          >
            <Text style={styles.tabTextL}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabButtonR}>
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
          <Image
            source={
              profileData?.profile_photo
                ? { uri: profileData.profile_photo }
                : require("../assets/profile.png")
            }
            style={styles.profileImage}
          />
          {/* <TouchableOpacity
            style={styles.settings}
            onPress={() => {
              navigation.navigate("Settings");
            }}
          >
            <MaterialIcons name="settings" size={30} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.share} onPress={onShare}>
            <FontAwesome name="share" size={24} />
          </TouchableOpacity> */}
        </ImageBackground>

        <View style={styles.userDetails}>
          <Text style={styles.nameText}>{profileData?.full_name}</Text>
          {role === "client" ? (
            <Text style={styles.roleText}>
              {profileData?.organization_type}
            </Text>
          ) : (
            <View style={styles.roleWrap}>
              {profileData?.role_designation?.map((item, idx) => (
                <Text key={idx} style={styles.roleText}>
                  {item}
                  {", "}
                </Text>
              ))}
            </View>
          )}
          <Text style={styles.statusText}>
            Status:
            {profileData?.currently_available === true
              ? " Active "
              : " Inactive "}
            {profileData?.currently_available === true ? (
              <FontAwesome name="circle" size={12} color="#6BCD2F" />
            ) : (
              <FontAwesome name="circle" size={12} color="#FF3131" />
            )}
          </Text>
        </View>

        <View style={styles.reviewSection}>
          {reviews?.map((review, index) => (
            <ReviewCard
              key={index}
              reviewerName={review?.giverName}
              reviewerstate={review?.state}
              reviewerCountry={review?.country}
              starRating={review?.rating}
              reviewText={review?.message_text}
              reviewerPhoto={review?.giverPhoto}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (currentTheme) =>
  StyleSheet.create({
    container: {
      backgroundColor: currentTheme.background || "#fff",
      paddingTop: 35,
      paddingBottom: 500,
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
      backgroundColor: currentTheme.background3 || "#DADADA",
      width: "50%",
      height: 40,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      borderTopRightRadius: 80,
    },
    tabButtonR: {
      backgroundColor: "#4C0183",
      width: "50%",
      height: 40,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      borderTopLeftRadius: 80,
    },
    tabTextL: {
      color: currentTheme.text || "#000",
      fontSize: 20,
      fontWeight: "bold",
    },
    tabTextR: {
      color: "#fff",
      fontSize: 20,
      fontWeight: "bold",
    },

    backgroundImg: {
      width: "100%",
      height: 150,
      position: "relative",
    },
    profileImage: {
      width: 100,
      height: 100,
      borderRadius: 50,
      position: "absolute",
      bottom: -20,
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
    reviewSection: {
      padding: 20,
    },
  });
