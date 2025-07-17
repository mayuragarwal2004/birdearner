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
} from "react-native";
import { useAuth } from "../context/NewAuthContext";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
// import { Query } from "react-native-appwrite";
import { useTheme } from "../context/ThemeContext";
// import { useAppwrite } from "../context/AppwriteContext";

const Inbox = () => {
    // const { appwriteConfig, databases } = useAppwrite();
  const [chatThreads, setChatThreads] = useState([]);
  const [unchatThreads, setunChatThreads] = useState([]);
  const [starStatus, setStarStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const isDataFetched = useRef(false);
  const { userData } = useAuth();
  const navigation = useNavigation()

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];

  const styles = getStyles(currentTheme);

  // Load chat threads
  // Load chat threads
  const fetchChatThreads = async () => {
    if (isDataFetched.current) return;
    setLoading(true);
    setError(false);
    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.messageCollectionID,
        [
          `{"method":"or","values":[{"method":"equal","attribute":"sender","values":["${userData.$id}"]},{"method":"equal","attribute":"receiver","values":["${userData.$id}"]}]}`,
        ]
      );

      const uniqueThreads = [
        ...new Set(
          response.documents.map((doc) => {
            const participants = [doc.sender, doc.receiver].sort().join("-");
            return `${doc.projectId}-${participants}`;
          })
        ),
      ];

      const oppositeParticipants = await Promise.all(
        uniqueThreads.map(async (thread) => {
          const [projectId, sender, receiver] = thread.split("-");
          const otherUserId = sender === userData.$id ? receiver : sender;

          try {
            const response = await databases.getDocument(
              appwriteConfig.databaseId,
              userData?.role === "freelancer"
                ? appwriteConfig.clientCollectionId
                : appwriteConfig.freelancerCollectionId,
              otherUserId
            );
            return { projectId, otherUserId, participant: response };
          } catch (error) {
            Alert.alert(`Failed to fetch participant with ID ${otherUserId}:`,
              error)
            return null;
          }
        })
      ).then((results) => results.filter((result) => result !== null));

      const projectTitles = await Promise.all(
        uniqueThreads.map(async (thread) => {
          const [projectId] = thread.split("-");

          try {
            const projectData = await databases.getDocument(
              appwriteConfig.databaseId,
              appwriteConfig.jobCollectionID,
              projectId
            );

            return { projectId, title: projectData.title, projectData };
          } catch (error) {
            return { projectId, title: "Untitled" };
          }
        })
      );

      setunChatThreads(uniqueThreads)

      // Fetch star data
      const starredData = await fetchStarData(uniqueThreads, userData.$id);

      const chatThreads = uniqueThreads.map((thread) => {
        const [projectId, sender, receiver] = thread.split("-");
        const userMessages = response.documents.filter(
          (doc) =>
            doc.projectId === projectId &&
            ((doc.sender === sender && doc.receiver === receiver) ||
              (doc.sender === receiver && doc.receiver === sender))
        );

        const latestMessage = userMessages.reduce(
          (latest, current) =>
            new Date(current.timestamp) > new Date(latest.timestamp)
              ? current
              : latest,
          userMessages[0]
        );

        const oppositeParticipant = oppositeParticipants.find(
          (participant) =>
            participant.projectId === projectId &&
            participant.otherUserId ===
            (sender === userData.$id ? receiver : sender)
        );

        const projectTitle = projectTitles.find(
          (project) => project.projectId === projectId
        );

        const starData = starredData.find((data) => data.thread === thread);

        return {
          projectId,
          ...latestMessage,
          lastMessage: latestMessage ? latestMessage.text : "No messages yet",
          oppositeParticipantId: oppositeParticipant
            ? oppositeParticipant.otherUserId
            : null,
          oppositeParticipantName: oppositeParticipant
            ? oppositeParticipant.participant.full_name
            : "Unknown",
          profileImage: oppositeParticipant
            ? oppositeParticipant.participant.profile_photo
            : null,
          projectData: projectTitle,
          isStar: starData ? starData.isStar : false,
        };
      });

      setChatThreads(chatThreads);
      isDataFetched.current = true;
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch star data for chat threads
  const fetchStarData = async (threads, currentUserId) => {
    try {
      const starData = await Promise.all(
        threads.map(async (thread) => {
          const [projectId, sender, receiver] = thread.split("-");
          const oppositeUserId = sender === currentUserId ? receiver : sender;

          const documents = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.blockedAndStarDataCollectionId,
            [
              Query.equal("currentUserId", currentUserId),
              Query.equal("oppositeUserId", oppositeUserId),
              Query.equal("projectId", projectId),
              Query.equal("statusValue", "star"),
            ]
          );

          return { thread, isStar: documents.total > 0 };
        })
      );

      return starData;
    } catch (error) {
      return threads.map((thread) => ({ thread, isStar: false }));
    }
  };

  const fetchAndUpdateStarData = async () => {
    const starData = await fetchStarData(unchatThreads, userData.$id);

    const updatedStarStatus = starData.reduce((acc, { thread, isStar }) => {
      acc[thread] = isStar;
      return acc;
    }, {});


    setStarStatus((prevState) => {
      const newState = { ...prevState, ...updatedStarStatus };
      if (JSON.stringify(newState) !== JSON.stringify(prevState)) {
        return newState;
      }
      return prevState;
    });
  };


  useFocusEffect(
    React.useCallback(() => {
      fetchAndUpdateStarData();
    }, [navigation, userData?.$id])
  )




  useEffect(() => {
    fetchChatThreads();
  }, []);

  const renderChatThread = ({ item }) => {
    const projectData = item.projectData || {};
    const oppositeParticipantName = item.oppositeParticipantName || "Unknown";
    const lastMessage = item.lastMessage || "No messages yet";
    const profileImage =
      item?.profileImage && typeof item.profileImage === "string"
        ? { uri: item.profileImage }
        : require("../assets/profile.png");

    const threadKey = `${item.projectId}-${item.sender}-${item.receiver}`;

    const isStar = starStatus[threadKey] || false;

    return (
      <View>
        <TouchableOpacity
          style={styles.jobContainer}
          onPress={() =>
            navigation.navigate("Chat", {
              receiverId: item.oppositeParticipantId,
              full_name: oppositeParticipantName,
              profileImage,
              projectId: item.projectId,
            })
          }
        >
          <Image source={profileImage} style={styles.avatar} />
          <View style={styles.jobContent}>
            <Text style={styles.jobTitle} numberOfLines={1}>
              {projectData.title || "Untitled"}
            </Text>
            <Text style={styles.jobStatus}>
              @{oppositeParticipantName}: {lastMessage}
            </Text>
          </View>
          {item?.isStar && (
            <MaterialIcons name="star" size={22} color={"#441752"} />
          )}
          <View style={[styles.statusIndicator, { backgroundColor: "red" }]} />
        </TouchableOpacity>
      </View>
    );
  };


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b006b" />
        <Text style={{color: currentTheme.subText}}>Loading chats...</Text>
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
        keyExtractor={(item) =>
          `${item.projectId}-${item.oppositeParticipantId}`
        }
        renderItem={renderChatThread}
        contentContainerStyle={styles.chatListContainer}
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
    lastMessage: { fontSize: 14, color: currentTheme.subText || "#666", marginTop: 1, marginBottom: 5 },
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
      color: currentTheme.subText || '#6D6D6D',
      textAlign: 'center',
      marginBottom: 20,
    },
    backButtonText: {
      color: '#3b006b',
      fontSize: 16,
    },
  });

export default Inbox;
