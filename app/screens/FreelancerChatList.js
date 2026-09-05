import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SafeSpinner from "../components/SafeSpinner";
import { useAuth } from "../context/NewAuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import ApiService from "../lib/apiService";

const FreelancerChatList = () => {
  const [chatThreads, setChatThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const { userData } = useAuth();
  const navigation = useNavigation();
  const api = ApiService;

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];

  const styles = getStyles(currentTheme);

  const fetchChatThreads = async (isRefreshing = false) => {
    const freelancerId = userData?.freelancer?.id;
    console.log("=== FreelancerChatList Debug ===");
    console.log("userData:", JSON.stringify(userData?.id, null, 2));
    console.log("userData.freelancer:", JSON.stringify(userData?.freelancer, null, 2));
    console.log("Fetching chat threads for freelancerId:", freelancerId);

    if (!isRefreshing) {
      setLoading(true);
    }
    setError(false);
    try {
      await api.init();
      console.log("Token available:", !!api.token);

      const response = await api.getFreelancerConversations(freelancerId);
      console.log("Raw API response:", JSON.stringify(response));

      if (response && Array.isArray(response)) {
        const formattedThreads = response.map(conv => ({
          ...conv,
          isStarred: conv.isStarred || false
        }));
        console.log("Formatted threads count:", formattedThreads.length);
        setChatThreads(formattedThreads);
      } else {
        console.log("Response was not an array:", typeof response, response);
      }
    } catch (err) {
      console.log("Error fetching chat threads:", err?.message, err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchChatThreads();
    }, [navigation, userData?.id])
  );

  useEffect(() => {
    fetchChatThreads();
  }, []);

  console.log({ chatThreads });

  const renderChatThread = ({ item }) => {
    const jobTitle = item.jobTitle || "Job";
    const jobStatus = item.jobStatus?.toLowerCase() || "pending";
    const clientName = item.otherUser?.user?.fullName || "Unknown";
    const lastMessage = item.lastMessage || "No messages yet";
    const profileImage = item.otherUser?.profilePhoto
      ? { uri: api.loadImageURI(item.otherUser.profilePhoto) }
      : require("../assets/profile.png");

    console.log({ item });


    return (
      <TouchableOpacity
        style={styles.jobContainer}
        onPress={() => navigation.navigate('FreelancerChat', {
          jobId: item.jobId,
          projectId: item.jobId,
          threadId: item.id,
          full_name: clientName,
          profileImage: item.otherUser?.profilePhoto,
          client: item.otherUser
        })}
      >
        <Image source={profileImage} style={styles.avatar} />
        <View style={styles.jobContent}>
          <Text style={styles.jobTitle} numberOfLines={1}>
            {jobTitle}
          </Text>
          <Text style={styles.username}>@{clientName}</Text>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {lastMessage}
          </Text>
        </View>
        <View
          style={[
            styles.statusIndicator,
            {
              backgroundColor:
                jobStatus === 'completed'
                  ? '#4CAF50'
                  : jobStatus === 'in-progress'
                    ? '#2196F3'
                    : '#FFC107',
            },
          ]}
        />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <SafeSpinner size={42} color="#3b006b" />
        <Text style={{ color: currentTheme.subText }}>Loading chats...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorMessage}>Failed to load threads. Please try again later.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (chatThreads.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyMessage}>No job threads.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={{flex: 1}}>
    <View style={styles.container}>
      <View style={styles.main}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={currentTheme.text || 'black'} />
        </TouchableOpacity>
        <Text style={styles.header}>Freelancer Inbox</Text>
      </View>
      <FlatList
        data={chatThreads}
        keyExtractor={(item) => item.id}
        renderItem={renderChatThread}
        contentContainerStyle={styles.chatListContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await fetchChatThreads(true);
              setRefreshing(false);
            }}
            colors={['#3b006b']}
            tintColor={currentTheme.text}
          />
        }
      />
    </View>
    </SafeAreaView>
  );
};

const getStyles = (currentTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background || "#fff",
      paddingHorizontal: 20,
    },
    main: {
      marginTop: 25,
      marginBottom: 20,
      display: "flex",
      flexDirection: "row",
      gap: 100,
      alignItems: "center"
    },
    header: {
      fontSize: 24,
      fontWeight: 'bold',
      textAlign: 'center',
      color: currentTheme.text
    },
    loadingText: {
      textAlign: "center",
      marginTop: 20,
      color: currentTheme.subText || "#888"
    },
    chatListContainer: {
      padding: 10
    },
    jobContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: currentTheme.cardBackground || '#F5F5F5',
      borderTopRightRadius: 10,
      borderBottomRightRadius: 10,
      borderTopLeftRadius: 40,
      borderBottomLeftRadius: 40,
      marginTop: 20,
      shadowColor: currentTheme.shadow || '#000',
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 5,
      elevation: 2,
      height: 70
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      marginRight: 15,
    },
    jobContent: {
      flex: 1,
      paddingRight: 6
    },
    jobTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#5A4CAE',
    },
    username: {
      fontSize: 14,
      color: currentTheme.subText || '#6D6D6D',
    },
    lastMessage: {
      fontSize: 14,
      color: currentTheme.subText || '#6D6D6D',
    },
    statusIndicator: {
      width: 10,
      height: '100%',
      borderTopRightRadius: 10,
      borderBottomRightRadius: 10,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: currentTheme.background
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: currentTheme.background
    },
    errorMessage: {
      fontSize: 16,
      color: '#FF3B30',
      textAlign: 'center',
      marginBottom: 20,
    },
    retryButton: {
      backgroundColor: '#3b006b',
      padding: 10,
      borderRadius: 5,
    },
    retryButtonText: {
      color: '#FFFFFF',
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
      color: '#6D6D6D',
      textAlign: 'center',
      marginBottom: 20,
    },
    backButtonText: {
      color: '#3b006b',
      fontSize: 16,
    },
  });

export default FreelancerChatList;
