import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useAppwrite } from "../context/AppwriteContext";

const AppliersScreen = ({ navigation, route }) => {
  const { userData } = useAuth();
  const [freelancers, setFreelancers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { title, freelancersId, color, item, projectId } = route.params;
  const [refreshing, setRefreshing] = useState(false);
  const { appwriteConfig, databases } = useAppwrite();

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];

  const styles = getStyles(currentTheme);

  useEffect(() => {
    if (freelancersId.length === 0) {
      setLoading(false);
      return;
    }

    const fetchFreelancers = async () => {
      try {
        // Fetch freelancer profiles by IDs
        const freelancerProfiles = await Promise.all(
          freelancersId.map(async (id) => {
            try {
              const response = await databases.getDocument(
                appwriteConfig.databaseId,
                appwriteConfig.freelancerCollectionId,
                id
              );
              return response;
            } catch (error) {
              Alert.alert(`Failed to fetch freelancer with ID ${id}:`, error)
              return null;
            }
          })
        );

        // Filter out null profiles in case of errors
        const validProfiles = freelancerProfiles.filter(
          (profile) => profile !== null
        );
        setFreelancers(validProfiles);
      } catch (error) {
        Alert.alert("Failed to fetch freelancers:", error)
      } finally {
        setLoading(false);
      }
    };

    fetchFreelancers();
  }, []);


  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const renderAppliedFreelancer = ({ item }) => {

    const full_name = item.full_name
    const receiverId = item.$id


    return (
      <View>
        <TouchableOpacity
          style={styles.jobContainer}
          onPress={() => {
            navigation.navigate("Chat", { receiverId, full_name, projectId });
          }}
        >
          <Image
            source={
              item?.profile_photo ? { uri: item?.profile_photo } : require("../assets/profile.png")
            }
            style={styles.avatar}
          />
          <View style={styles.jobContent}>
            <Text style={styles.jobTitle} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.freelancerName}>
              Name: {item?.full_name || "N/A"}
            </Text>
          </View>
          <View style={[styles.statusIndicator, { backgroundColor: color }]} />
        </TouchableOpacity>
      </View>
    )
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b006b" />
        <Text style={{color: currentTheme.subText, textAlign: "center"}}>Loading freelancers...</Text>
      </View>
    );
  }

  if (freelancersId.length === 0) {
    return (
      <View style={styles.noAppliersContainer}>
        <Text style={styles.noAppliersText}>
          There are no appliers for this job.
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={currentTheme.text || "black"} />
          <Text style={styles.goBackText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.main}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={currentTheme.text || "black"} />
        </TouchableOpacity>
        <Text style={styles.header}>Appliers</Text>
      </View>
      <FlatList
        data={freelancers}
        renderItem={renderAppliedFreelancer}
        keyExtractor={(item) => item.$id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#3b006b"]}
            progressBackgroundColor={currentTheme.cardBackground || "#fff"}
          />
        }
      />
    </View>
  );
};

const getStyles = (currentTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background || "#FFFFFF",
      paddingHorizontal: 20,
    },
    backButton: { flexDirection: "row", alignItems: "center", marginRight: 16 },
    noAppliersContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: currentTheme.background || "#fff"
    },
    noAppliersText: { fontSize: 18, color: currentTheme.text2 || "#6e6e6e", marginBottom: 20 },
    goBackText: { fontSize: 16, marginLeft: 8, color: currentTheme.text || "black" },
    main: {
      marginTop: 45,
      marginBottom: 20,
      display: "flex",
      flexDirection: "row",
      gap: 100,
      alignItems: "center",
    },
    header: {
      fontSize: 24,
      fontWeight: "bold",
      // marginBottom: 20,
      textAlign: "center",
      color: currentTheme.text || "black"
    },
    listContainer: {
      paddingBottom: 20,
    },
    jobContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: currentTheme.cardBackground || "#F5F5F5",
      // padding: 10,
      borderTopRightRadius: 10,
      borderBottomRightRadius: 10,
      borderTopLeftRadius: 40,
      borderBottomLeftRadius: 40,
      marginTop: 20,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 5,
      elevation: 2,
      height: 70,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      marginRight: 15,
    },
    jobContent: {
      flex: 1,
      paddingRight: 6,
    },
    jobTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: "#5A4CAE",
    },
    jobStatus: {
      fontSize: 14,
      color: currentTheme.subText || "#6D6D6D",
    },
    freelancerName : {
      color: currentTheme.text2 || "#6D6D6D",
    },
    statusIndicator: {
      width: 10,
      height: "100%",
      borderTopRightRadius: 10,
      borderBottomRightRadius: 10,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "column",
      // alignContent: "center",
      // marginTop: 350,
      backgroundColor: currentTheme.background || "#fff"
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: currentTheme.background || "#fff"
    },
    errorMessage: {
      fontSize: 16,
      color: currentTheme.text || '#FF3B30',
      textAlign: 'center',
      marginBottom: 20,
    },
    retryButton: {
      backgroundColor: '#3b006b',
      padding: 10,
      borderRadius: 5,
    },
    retryButtonText: {
      color: currentTheme.text || '#FFFFFF',
      fontSize: 16,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: currentTheme.background || "#fff"
    },
    emptyMessage: {
      fontSize: 16,
      color:  currentTheme.text || '#6D6D6D',
      textAlign: 'center',
      marginBottom: 20,
    },
    backButtonText: {
      color: currentTheme.text || '#3b006b',
      fontSize: 16,
    },
  });

export default AppliersScreen;
