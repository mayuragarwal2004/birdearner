import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { useAuth } from "../context/NewAuthContext";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import ApiService from "../lib/apiService";

const ChatList = () => {
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
    console.log("Fetching chat threads for user:", userData?.id);

    if (!isRefreshing) {
      setLoading(true);
    }
    setError(false);
    try {
      console.log("Initializing API service...");

      await api.init();

      console.log("Fetching user conversations...");

      // Use the correct endpoint for getting user conversations
      const response = await api.getUserConversations(userData.id);
      console.log("Fetched chat threads:", response);


      if (response) {
        // Format conversations into chat threads
        const formattedThreads = response.map(conv => ({
          id: conv.id || `${conv.jobId}-${conv.senderId}-${conv.receiverId}`,
          jobId: conv.jobId,
          client: conv.otherUser, // mapped as "client" for backwards compatibility inside ChatList
          lastMessage: conv.lastMessage || "No messages yet",
          timestamp: conv.updatedAt || conv.createdAt,
          projectData: {
            title: conv.jobTitle || "Job",
            status: conv.jobStatus?.toLowerCase() || "pending",
            deadline: conv.deadlineDate,
          },
          isStarred: conv.isStarred || false
        }));

        setChatThreads(formattedThreads);
      }
    } catch (err) {
      console.log("Error fetching chat threads:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchChatThreads();
    }, [navigation, userData?.freelancer?.id])
  );




  useEffect(() => {
    fetchChatThreads();
  }, []);

  // renderChatThread removed as it was unused

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b006b" />
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
    <View style={styles.container}>
      <View style={styles.main}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={currentTheme.text || black} />
        </TouchableOpacity>
        <Text style={styles.header}>Inbox</Text>
      </View>
      <FlatList
        data={chatThreads}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const projectData = item.projectData || {};
          const clientName = item.client?.user?.fullName || "Unknown";
          const lastMessage = item.lastMessage || "No messages yet";
          const profileImage = item.client?.profilePhoto
            ? { uri: item.client.profilePhoto }
            : require("../assets/profile.png");

          return (
            <TouchableOpacity
              style={styles.jobContainer}
              onPress={() => navigation.navigate('FreelancerChat', {
                jobId: item.jobId,
                full_name: clientName,
                profileImage: item.client?.profilePhoto,
                client: item.client
              })}
            >
              <Image source={profileImage} style={styles.avatar} />
              <View style={styles.jobContent}>
                <Text style={styles.jobTitle} numberOfLines={1}>
                  {projectData.title}
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
                      projectData.status === 'completed'
                        ? '#4CAF50'
                        : projectData.status === 'in-progress'
                          ? '#2196F3'
                          : '#FFC107',
                  },
                ]}
              />
            </TouchableOpacity>
          );
        }}
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
  );
};

const getStyles = (currentTheme) =>
  StyleSheet.create({
    container: {
      flex: 1, backgroundColor: currentTheme.background || "#fff",
      paddingHorizontal: 20,
      paddingTop: 40
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
      // marginBottom: 20,
      textAlign: 'center',
      color: currentTheme.text
    },
    loadingText: { textAlign: "center", marginTop: 20, color: currentTheme.subText || "#888" },
    chatListContainer: { padding: 10 },
    chatThread: {
      flexDirection: "row",
      alignItems: "center",
      padding: 15,
      borderBottomWidth: 1,
      borderColor: currentTheme.border || "#ddd",
      justifyContent: "space-between",
    },
    profileSection: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    profileImage: {
      width: 50,
      height: 50,
      borderRadius: 25,
      marginRight: 10,
      backgroundColor: "#e0e0e0", // Fallback background for images
    },
    textSection: {
      flex: 1,
      justifyContent: "center",
    },
    receiverName: { fontSize: 16, fontWeight: "bold", color: "#000" },
    lastMessage: { fontSize: 14, color: "#666", marginTop: 1, marginBottom: 5 },
    timestamp: {
      fontSize: 12,
      color: "#aaa",
      alignSelf: "flex-start",
    },

    jobContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: currentTheme.cardBackground || '#F5F5F5',
      // padding: 10,
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
    jobStatus: {
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

export default ChatList;