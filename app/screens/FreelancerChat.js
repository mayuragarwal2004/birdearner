import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  StyleSheet,
} from "react-native";
import { useAuth } from "../context/NewAuthContext";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { useTheme } from "../context/ThemeContext";
import ApiService from "../lib/apiService";
import DeadlineTimer from '../components/DeadlineTimer';

const FreelancerChat = ({ route, navigation }) => {
  const { full_name, profileImage, jobId, client } = route.params;
  console.log({ client });

  const [messages, setMessages] = useState([]);
  const [thread, setThread] = useState(null);
  const [input, setInput] = useState("");
  const { userData } = useAuth();
  const api = ApiService;
  const flatListRef = useRef();
  const [chatStatus, setChatStatus] = useState("PENDING");
  const [characterLimit, setCharacterLimit] = useState(200);
  const [modalVisible, setModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedReportReason, setSelectedReportReason] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isStar, setIsStar] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [job, setJob] = useState(null);
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const styles = getStyles(currentTheme);

  const reportOptions = [
    "Inappropriate content",
    "Spam",
    "Harassment",
    "Fraud",
    "Other",
  ];

  const dotMapData = ["View Profile", "Block", "Report"];

  useEffect(() => {
    if (job?.jobStatus) setChatStatus(job.jobStatus.toUpperCase());
    if (job?.characterLimit) setCharacterLimit(job.characterLimit || 200);

    if (job?.assignedFreelancerId === userData.freelancer.id) {
      setChatStatus("ACCEPTED");
    }
    if (
      job?.assignedFreelancerId &&
      job?.assignedFreelancerId !== userData.freelancer.id
    ) {
      setChatStatus("REJECTED");
    }
    if (job?.assignedFreelancerId === null) {
      setChatStatus("PENDING");
    }
    return () => {
      setChatStatus("PENDING");
    };
  }, [job?.assignedFreelancerId, job?.jobStatus, userData.freelancer.id]);

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        await api.init();
        const res = await api.makeRequest(`/jobs/${jobId}`);
        if (res.success) {
          setJob(res.data);
        }
      } catch (err) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to fetch job details",
        });
      }
    };

    fetchJobDetails();
  }, [jobId]);

  const handleViewProfile = () => {
    // Navigate to profile view
    navigation.navigate("Profile", { userId: client.user.id });
  };

  const handleBlock = async () => {
    try {
      await api.init();
      const res = await api.makeRequest(`/chat/block`, {
        method: "POST",
        body: JSON.stringify({
          threadId: thread.id,
          userId: userData.id,
          blockedUserId: client.user.id,
        }),
      });

      if (res.success) {
        setIsBlocked(true);
        setShowMenu(false);
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "User blocked successfully",
        });
      }
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to block user",
      });
    }
  };

  const handleReport = async () => {
    if (!selectedReportReason) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please select a reason for reporting",
      });
      return;
    }

    try {
      await api.init();
      const res = await api.makeRequest(`/chat/report`, {
        method: "POST",
        body: JSON.stringify({
          threadId: thread.id,
          userId: userData.id,
          reportedUserId: client.user.id,
          reason: selectedReportReason,
        }),
      });

      if (res.success) {
        setReportModalVisible(false);
        setSelectedReportReason(null);
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Report submitted successfully",
        });
      }
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to submit report",
      });
    }
  };

  const handleMenuAction = (action) => {
    switch (action) {
      case "View Profile":
        handleViewProfile();
        break;
      case "Block":
        handleBlock();
        break;
      case "Report":
        setReportModalVisible(true);
        break;
      default:
        break;
    }
    setShowMenu(false);
  };



  useEffect(() => {
    const getThreadAndMessages = async () => {
      try {
        await api.init();
        const freelancerId = userData.freelancer.id;
        const clientId = client.id;
        console.log("Fetching thread for:", { jobId, freelancerId, clientId });

        const resThread = await api.makeRequest("/chat/thread", {
          method: "POST",
          body: JSON.stringify({ jobId: jobId, freelancerId, clientId }),
        });
        setThread(resThread.data);
        setCharacterLimit(resThread.data.characterLimit || 200);
        const resMessages = await api.makeRequest(
          `/chat/messages/${resThread.data.id}`
        );
        setMessages(resMessages.data);
      } catch (err) {
        Toast.show({ type: "error", text1: "Error", text2: err.message });
      }
    };
    getThreadAndMessages();
  }, [client, userData.freelancer.id, jobId]);

  const sendMessage = async () => {
    if (input.trim() && thread) {
      try {
        await api.init();
        const res = await api.makeRequest("/chat/message", {
          method: "POST",
          body: JSON.stringify({
            chatThreadId: thread.id,
            senderId: userData.id,
            receiverId: client.user.id,
            messageContent: input,
            messageType: "text",
            senderType: "freelancer",
          }),
        });
        setMessages((prev) => [...prev, res.data]);
        setInput("");
      } catch (err) {
        Alert.alert("Error sending message:", err.message);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Modal
        visible={reportModalVisible}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setReportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Report</Text>
            <Text style={styles.modalSubtitle}>
              Why are you reporting this user?
            </Text>
            <Text style={styles.modalDescription}>
              Your report is anonymous. If someone is in immediate danger, call
              the local emergency services - don't wait.
            </Text>
            {reportOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setSelectedReportReason(option)}
                style={styles.optionButton}
              >
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={handleReport}
              style={[styles.modalButton, { marginTop: 20 }]}
              disabled={!selectedReportReason}
            >
              <Text style={styles.modalButtonText}>Submit Report</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setReportModalVisible(false)}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <View style={styles.headerData}>
          <Text style={styles.profile}>Tap for contact details</Text>
          <Text style={styles.username}>@{full_name}</Text>
          <Text style={styles.profile}>Last online 3 hrs ago</Text>
          <View
            style={[
              styles.statusContainer,
              chatStatus === "ACCEPTED"
                ? styles.statusAccepted
                : chatStatus === "REJECTED"
                ? styles.statusRejected
                : chatStatus === "COMPLETED"
                ? styles.statusCompleted
                : styles.statusPending,
            ]}
          >
            <Text style={styles.statusText}>{chatStatus}</Text>
          </View>
          {job?.assignedFreelancerId &&
            job.assignedFreelancerId !== userData.freelancer.id && (
              <View style={styles.assignedBanner}>
                <Text style={styles.assignedText}>
                  Job has been assigned to another freelancer
                </Text>
              </View>
            )}

          <View>
            <Text style={styles.deadline}>
              {job?.deadlineDate && new Date(job.deadlineDate) < new Date()
                ? "Deadline Over"
                : "Deadline Timer"}
            </Text>
            <View style={styles.deadlineTimerContainer}>
              <DeadlineTimer 
                deadline={job?.deadlineDate}
                jobCompleted={job?.jobStatus === 'COMPLETED'}
                style={{
                  timeBox: styles.timeBox,
                  timeText: styles.timeText,
                  unitText: styles.unitText,
                  completedText: styles.conColorc,
                  timeContainer: styles.timeContainer
                }}
              />
            </View>
          </View>
        </View>

        <TouchableOpacity onPress={() => setShowMenu(!showMenu)}>
          <Ionicons
            name="ellipsis-horizontal"
            size={24}
            color={currentTheme.text || "black"}
          />
        </TouchableOpacity>
        {showMenu && (
          <View style={styles.menuContainer}>
            {dotMapData.map((action) => (
              <TouchableOpacity
                key={action}
                style={styles.menuItem}
                onPress={() => handleMenuAction(action)}
              >
                <Text style={styles.menuItemText}>{action}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <FlatList
        data={messages}
        ref={flatListRef}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageContainer,
              item.senderId === userData.id
                ? styles.currentUserMessage
                : styles.otherUserMessage,
            ]}
          >
            <Text
              style={[
                styles.message,
                item.senderId === userData.id ? {} : { color: "#fff" },
              ]}
            >
              {item.messageContent}
            </Text>
          </View>
        )}
        style={styles.chatList}
        contentContainerStyle={styles.chatListContainer}
      />
      <View style={styles.limit}>
        <Text style={styles.limitchar}>Character Limit</Text>
        <Text style={styles.limitvar}>
          {characterLimit} characters remaining
        </Text>
      </View>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type your message..."
          maxLength={characterLimit || undefined}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
      <Toast />
    </View>
  );
};

const getStyles = (currentTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background || "#fff",
      paddingTop: 30,
    },
    header: {
      padding: 15,
      alignItems: "center",
      flex: 0,
      flexDirection: "row",
      justifyContent: "space-around",
    },
    deadlineTimer: { fontSize: 12, color: currentTheme.subText || "#888" },
    deadline: {
      fontSize: 15,
      fontWeight: "500",
      color: currentTheme.text || "#000000",
      paddingTop: 6,
      textAlign: "center",
    },
    timeBoxCon: {
      alignItems: "center",
      flexDirection: "column",
      gap: 12,
    },
    penaltyText: {
      backgroundColor: "#B64928",
      paddingHorizontal: 10,
      borderRadius: 6,
      alignItems: "center",
      paddingVertical: 3,
      shadowColor: currentTheme.shadow || "#000000",
      shadowOffset: {
        width: 0,
        height: 3,
      },
      shadowOpacity: 0.17,
      shadowRadius: 3.05,
      elevation: 4,
    },
    deadlineTimerContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginVertical: 5,
    },
    timeBox: {
      paddingHorizontal: 8,
      paddingVertical: 5,
      backgroundColor: currentTheme.text || "#000000",
      marginHorizontal: 1,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 4,
    },
    timeText: {
      fontSize: 18,
      fontWeight: "bold",
      color: currentTheme.background || "#FFFFFF",
    },
    unitText: {
      fontSize: 18,
      fontWeight: "bold",
      color: currentTheme.background || "#FFFFFF",
    },
    menuButton: { position: "absolute", right: 10, top: 10 },
    menuButtonText: { fontSize: 24, color: currentTheme.text || "black" },
    menuContainer: {
      position: "absolute",
      top: 115,
      right: 20,
      backgroundColor: currentTheme.background3 || "white",
      borderRadius: 5,
      padding: 10,
      shadowColor: currentTheme.shadow || "#000",
      shadowOpacity: 0.2,
      shadowRadius: 5,
      shadowOffset: { width: 0, height: 2 },
      zIndex: 2334,
    },
    menuItem: { paddingVertical: 10 },
    menuItemText: { fontSize: 16, color: currentTheme.text || "black" },
    modalOverlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalContent: {
      width: "100%",
      height: "100%",
      padding: 30,
      backgroundColor: "#121212",
      borderRadius: 10,
      alignItems: "center",
    },
    modalTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: "#fff",
      marginBottom: 10,
    },
    modalSubtitle: {
      fontSize: 16,
      fontWeight: "600",
      color: "#fff",
      marginBottom: 10,
    },
    modalDescription: {
      fontSize: 14,
      color: "#b0b0b0",
      textAlign: "center",
      marginBottom: 20,
    },
    optionButton: {
      width: "100%",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: "#303030",
    },
    optionText: {
      fontSize: 16,
      color: "#fff",
      textAlign: "left",
    },
    modalButton: {
      padding: 10,
      backgroundColor: "#5c2d91",
      borderRadius: 5,
      width: "45%",
      alignItems: "center",
    },
    modalButtonText: {
      color: "#fff",
      fontWeight: "bold",
    },
    headerData: {
      alignItems: "center",
      flex: 0,
      flexDirection: "column",
    },
    profile: {
      fontSize: 12,
      fontWeight: "400",
      color: currentTheme.text || "#000000",
    },
    username: {
      fontSize: 24,
      fontWeight: "600",
      color: "#5c2d91",
      paddingVertical: 4,
    },
    chatList: {
      flex: 1,
      backgroundColor: currentTheme.cardBackground || "#F1F1F1",
      marginHorizontal: 15,
      borderRadius: 10,
    },
    chatListContainer: { padding: 10 },
    messageContainer: {
      marginVertical: 5,
      paddingHorizontal: 15,
      borderRadius: 10,
      paddingVertical: 6,
    },
    currentUserMessage: {
      backgroundColor: "#DADADA",
      alignSelf: "flex-end",
    },
    otherUserMessage: {
      backgroundColor: "#4C0183",
      alignSelf: "flex-start",
      color: "#fff",
    },
    profileImage: {
      width: 50,
      height: 50,
      borderRadius: 25,
      marginRight: 10,
      backgroundColor: "#e0e0e0",
    },
    sender: { fontWeight: "bold", color: "#5c2d91" },
    message: { marginTop: 5, color: "#000" },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      padding: 10,
      borderTopWidth: 1,
      borderColor: currentTheme.border || "#ddd",
    },
    input: {
      flex: 1,
      padding: 10,
      borderWidth: 1,
      borderColor: currentTheme.background3 || "#ddd",
      borderRadius: 5,
      color: currentTheme.subText,
    },
    sendButton: {
      marginLeft: 10,
      padding: 10,
      backgroundColor: "#5c2d91",
      borderRadius: 5,
    },
    sendButtonText: { color: "#fff" },
    limit: {
      flex: 0,
      backgroundColor: currentTheme.cardBackground || "#F1F1F1",
      marginHorizontal: 15,
      borderRadius: 10,
      paddingVertical: 20,
    },
    limitchar: {
      color: currentTheme.text || "#464646",
      textAlign: "center",
      fontSize: 12,
      fontWeight: "600",
    },
    limitvar: {
      color: currentTheme.subText || "#464646",
      textAlign: "center",
      fontSize: 10,
      fontWeight: "400",
    },
    statusContainer: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      marginTop: 8,
    },
    statusText: {
      color: "#FFFFFF",
      fontWeight: "600",
      fontSize: 12,
    },
    statusPending: {
      backgroundColor: "#FFA500",
    },
    statusAccepted: {
      backgroundColor: "#4CAF50",
    },
    statusRejected: {
      backgroundColor: "#F44336",
    },
    statusCompleted: {
      backgroundColor: "#2196F3",
    },
    assignedBanner: {
      backgroundColor: "#FFE0E0",
      padding: 10,
      marginTop: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "#FFB0B0",
    },
    assignedText: {
      color: "#D32F2F",
      textAlign: "center",
      fontSize: 14,
      fontWeight: "500",
    },
  });

export default FreelancerChat;
