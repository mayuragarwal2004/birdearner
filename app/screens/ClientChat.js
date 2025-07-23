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
import Toast from 'react-native-toast-message';
import { useTheme } from "../context/ThemeContext";
import ApiService from "../lib/apiService";
import DeadlineTimer from '../components/DeadlineTimer';

const ClientChat = ({ route, navigation }) => {
  const { full_name, freelancer, jobId } = route.params;
  console.log({jobId, freelancer});
  
  const [messages, setMessages] = useState([]);
  const [thread, setThread] = useState(null);
  const [input, setInput] = useState("");
  const { userData } = useAuth();
  const api = ApiService;
  const flatListRef = useRef();
  const [chatStatus, setChatStatus] = useState('PENDING');
  const [characterLimit, setCharacterLimit] = useState(200);
  const [modalVisible, setModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedReportReason, setSelectedReportReason] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isStar, setIsStar] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [job, setJob] = useState(null);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const styles = getStyles(currentTheme);
  console.log({job});
  
  
  const reportOptions = [
    "Inappropriate content",
    "Spam",
    "Harassment",
    "Fraud",
    "Other"
  ];

  const dotMapData = ["View Profile", "Block", "Report"];

  const handleAccept = () => {
    // Show warning modal first
    setModalVisible(true);
  };

  useEffect(() => {
    if(job?.jobStatus)
    setChatStatus(job.jobStatus.toUpperCase())
    if (job?.characterLimit) {
      setCharacterLimit(job.characterLimit);
    }
    if (job?.assignedFreelancerId === freelancer.id) {
      setChatStatus('ACCEPTED');
    }
    if (job?.assignedFreelancerId && job?.assignedFreelancerId !== freelancer.id) {
      setChatStatus('REJECTED');
    }
    if (job?.assignedFreelancerId === null) {
      setChatStatus('PENDING');
    }
    return () => {
      setChatStatus('PENDING');
    }
  }, [job?.assignedFreelancerId, job?.jobStatus, freelancer.id]);
  
  const handleReject = async () => {
    try {
      await api.init();
      
      // First update the chat thread status
      const threadRes = await api.makeRequest(`/chat/thread/${thread.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'REJECTED'
        })
      });

      // Then update the job status
      const res = await api.makeRequest(`/jobs/${jobId}/reject-freelancer`, {
        method: 'POST',
        body: JSON.stringify({
          freelancerId: freelancer.id,
          threadId: thread.id
        })
      });
      
      if (res.success) {
        Toast.show({ 
          type: 'success', 
          text1: 'Success', 
          text2: 'Freelancer rejected successfully' 
        });
        setThread({ ...thread, status: 'REJECTED' });
        navigation.goBack();
      }
    } catch (err) {
      console.error('Rejection error:', err);
      Toast.show({ 
        type: 'error', 
        text1: 'Error', 
        text2: 'Failed to reject freelancer' 
      });
    }
  };

  const handleConfirm = async () => {
    setModalVisible(false);
    try {
      await api.init();
      const res = await api.makeRequest(`/jobs/${jobId}/assign`, {
        method: 'PATCH',
        body: JSON.stringify({
          freelancerId: freelancer.id,
          jobStatus: 'IN_PROGRESS',
          deadlineDate: new Date(Date.now() + (parseInt(job.projectDuration) * 24 * 60 * 60 * 1000)) // Convert project duration to milliseconds
        })
      });
      
      if (res.success) {
        Toast.show({ type: 'success', text1: 'Success', text2: 'Freelancer assigned successfully' });
        setJob(res.data);
        // Remove character limit after accepting
        setCharacterLimit(undefined);
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: err.message });
    }
  };

  const handleCancelTime = () => {
    setCancelModalVisible(true);
    setCountdown(30);
  };

  useEffect(() => {
    let timer;
    if (cancelModalVisible && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      handleCancelJob();
      setCancelModalVisible(false);
      setCountdown(30);
    }
    return () => clearInterval(timer);
  }, [cancelModalVisible, countdown]);

  const handleCancelJob = async () => {
    try {
      await api.init();
      const res = await api.makeRequest(`/jobs/${jobId}/cancel`, {
        method: 'PATCH',
        body: JSON.stringify({
          userRole: 'client'
        })
      });
      
      if (res.success) {
        Toast.show({ type: 'success', text1: 'Success', text2: 'Job cancelled successfully' });
        navigation.goBack();
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to cancel job' });
    }
  };

  const handleConfirmProjComp = async () => {
    try {
      await api.init();
      const res = await api.makeRequest(`/jobs/${jobId}/complete`, {
        method: 'PATCH'
      });
      
      if (res.success) {
        Toast.show({ type: 'success', text1: 'Success', text2: 'Project marked as complete' });
        setJob(res.data);
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to complete project' });
    }
  };

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        await api.init();
        const res = await api.makeRequest(`/jobs/${jobId}`);
        if (res.success) {
          setJob(res.data);
        }
      } catch (err) {
        Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to fetch job details' });
      }
    };

    fetchJobDetails();
  }, [jobId]);



  const handleViewProfile = () => {
    navigation.navigate('Profile', { userId: freelancer.user.id });
  };

  const handleBlock = async () => {
    try {
      await api.init();
      const res = await api.makeRequest(`/chat/block`, {
        method: 'POST',
        body: JSON.stringify({
          threadId: thread.id,
          userId: userData.id,
          blockedUserId: freelancer.user.id
        })
      });
      
      if (res.success) {
        setIsBlocked(true);
        setShowMenu(false);
        Toast.show({ type: 'success', text1: 'Success', text2: 'User blocked successfully' });
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to block user' });
    }
  };

  const handleReport = async () => {
    if (!selectedReportReason) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Please select a reason for reporting' });
      return;
    }

    try {
      await api.init();
      const res = await api.makeRequest(`/chat/report`, {
        method: 'POST',
        body: JSON.stringify({
          threadId: thread.id,
          userId: userData.id,
          reportedUserId: freelancer.user.id,
          reason: selectedReportReason
        })
      });
      
      if (res.success) {
        setReportModalVisible(false);
        setSelectedReportReason(null);
        Toast.show({ type: 'success', text1: 'Success', text2: 'Report submitted successfully' });
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to submit report' });
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
        const clientId = userData.client.id;
        const freelancerId = freelancer.id;
        const resThread = await api.makeRequest("/chat/thread", {
          method: "POST",
          body: JSON.stringify({ jobId: jobId, freelancerId, clientId }),
        });
        setThread(resThread.data);
        setCharacterLimit(resThread.data.characterLimit || 200);
        const resMessages = await api.makeRequest(`/chat/messages/${resThread.data.id}`);
        setMessages(resMessages.data);
      } catch (err) {
        Toast.show({ type: 'error', text1: 'Error', text2: err.message });
      }
    };
    getThreadAndMessages();
  }, [freelancer, userData.id, jobId]);

  const sendMessage = async () => {
    if (input.trim() && thread) {
      try {
        await api.init();
        const res = await api.makeRequest("/chat/message", {
          method: "POST",
          body: JSON.stringify({
            chatThreadId: thread.id,
            senderId: userData.id,
            receiverId: freelancer.user.id,
            messageContent: input,
            messageType: "text",
            senderType: "client",
          }),
        });
        setMessages((prev) => [...prev, res.data]);
        setInput("");
      } catch (err) {
        Alert.alert("Error sending message:", err.message);
      }
    }
  };

  const WarningModal = ({ visible, onConfirm, onCancel }) => {
    return (
      <Modal
        transparent={true}
        visible={visible}
        animationType="fade"
        onRequestClose={onCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>⚠️ Warning</Text>
            <Text style={styles.modalMessage}>
              Choose a freelancer at your own risk. Ensure you verify their
              credentials and previous work experience. We are not responsible
              for any disputes or project failures.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalButton} onPress={onCancel}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={onConfirm}>
                <Text style={styles.buttonText}>Proceed</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <WarningModal
        visible={modalVisible}
        onConfirm={handleConfirm}
        onCancel={() => setModalVisible(false)}
      />
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
              Your report is anonymous. If someone is in immediate danger, call the local emergency services - don't wait.
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

      <Modal
        visible={cancelModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <View style={styles.modalContainer1}>
          <View style={styles.modalContent1}>
            <Text style={styles.modalText1}>
              Are you sure you want to cancel this job?
            </Text>
            <Text style={styles.timerText1}>{countdown} seconds remaining</Text>
            <View style={styles.modalActions1}>
              <TouchableOpacity
                style={styles.confirmButton1}
                onPress={handleCancelJob}
              >
                <Text style={styles.buttonText1}>Yes, Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton1}
                onPress={() => {
                  setCancelModalVisible(false);
                  setCountdown(30);
                }}
              >
                <Text style={styles.buttonText1}>No, Go Back</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <View style={styles.headerData}>
          <Text style={styles.profile}>Tap for contact details</Text>
          <Text style={styles.username}>@{full_name}</Text>
          <Text style={styles.profile}>Last online 3 hrs ago</Text>
          <View style={[styles.statusContainer, 
            chatStatus === 'ACCEPTED' ? styles.statusAccepted :
            chatStatus === 'REJECTED' ? styles.statusRejected :
            chatStatus === 'COMPLETED' ? styles.statusCompleted :
            styles.statusPending
          ]}>
            <Text style={styles.statusText}>{chatStatus}</Text>
          </View>
          {job?.assignedFreelancerId && job.assignedFreelancerId !== freelancer.id && (
            <View style={styles.assignedBanner}>
              <Text style={styles.assignedText}>You have assigned this job to another freelancer</Text>
            </View>
          )}

          {job?.assignedFreelancerId === null ? (
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.acceptButton} onPress={handleAccept}>
                <Text style={styles.buttonText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rejectButton} onPress={handleReject}>
                <Text style={styles.buttonText}>Reject</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text style={styles.deadline}>
                {job?.deadlineDate && new Date(job.deadlineDate) < new Date()
                  ? "Deadline Over"
                  : "Deadline Timer"}
              </Text>
              <View style={styles.deadlineTimerContainer}>
                {job?.deadlineDate && new Date(job.deadlineDate) < new Date() ? (
                  <View style={styles.timeBoxCon}>
                    <Text style={styles.penaltyText}>
                      Deadline has passed
                    </Text>
                    {!job?.completed_status && (
                      <TouchableOpacity
                        style={styles.conColor}
                        onPress={handleConfirmProjComp}
                      >
                        <Text style={styles.applyButtonText}>
                          Confirm Project Completion
                        </Text>
                      </TouchableOpacity>
                    )}
                    {job?.completed_status && (
                      <Text style={styles.conColorc}>Project Completed</Text>
                    )}
                  </View>
                ) : (
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
                )}
              </View>
            </View>
          )}
        </View>
        
        <TouchableOpacity onPress={() => setShowMenu(!showMenu)}>
          <Ionicons name="ellipsis-horizontal" size={24} color={currentTheme.text || "black"} />
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
          <View style={[
            styles.messageContainer,
            item.senderId === userData.id ? styles.currentUserMessage : styles.otherUserMessage
          ]}>
            <Text style={[
              styles.message,
              item.senderId === userData.id ? {} : { color: '#fff' }
            ]}>{item.messageContent}</Text>
          </View>
        )}
        style={styles.chatList}
        contentContainerStyle={styles.chatListContainer}
      />
      <View style={styles.limit}>
        <Text style={styles.limitchar}>Character Limit</Text>
        <Text style={styles.limitvar}>{characterLimit} characters remaining</Text>
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
    container: { flex: 1, backgroundColor: currentTheme.background || "#fff", paddingTop: 30 },
    header: {
      padding: 15,
      alignItems: "center",
      flex: 0,
      flexDirection: "row",
      justifyContent: "space-around"
    },
    actionButtons: { 
      flexDirection: "row", 
      justifyContent: "space-between", 
      marginBottom: 10, 
      gap: 10, 
      marginTop: 25 
    },
    acceptButton: { 
      backgroundColor: "#4C0183", 
      paddingHorizontal: 22, 
      paddingVertical: 7, 
      borderRadius: 8 
    },
    rejectButton: { 
      backgroundColor: "#A00B0B", 
      paddingHorizontal: 22, 
      paddingVertical: 7, 
      borderRadius: 8 
    },
    buttonText: { 
      color: "#fff", 
      textAlign: "center", 
      fontSize: 16, 
      fontWeight: "600" 
    },
    deadlineTimer: { fontSize: 12, color: currentTheme.subText || "#888" },
    deadline: { fontSize: 15, fontWeight: "500", color: currentTheme.text || "#000000", paddingTop: 6, textAlign: "center" },
    timeBoxCon: {
      alignItems: "center",
      flexDirection: "column",
      gap: 12
    },
    applyButtonText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 16,
    },
    conColor: {
      backgroundColor: '#00871E',
      paddingHorizontal: 15,
      borderRadius: 10,
      alignItems: 'center',
      marginBottom: 0,
      paddingVertical: 10,
      shadowColor: "#000000",
      shadowOffset: {
        width: 0,
        height: 3,
      },
      shadowOpacity: 0.17,
      shadowRadius: 3.05,
      elevation: 4
    },
    conColorc: {
      paddingHorizontal: 15,
      alignItems: 'center',
      marginBottom: 0,
      color: "#00871E"
    },
    penaltyText: {
      backgroundColor: '#B64928',
      paddingHorizontal: 10,
      borderRadius: 6,
      alignItems: 'center',
      paddingVertical: 3,
      shadowColor: currentTheme.shadow || "#000000",
      shadowOffset: {
        width: 0,
        height: 3,
      },
      shadowOpacity: 0.17,
      shadowRadius: 3.05,
      elevation: 4
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
      zIndex: 2334
    },
    menuItem: { paddingVertical: 10 },
    menuItemText: { fontSize: 16, color: currentTheme.text || "black" },
    modalOverlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.5)"
    },
    modalContent: {
      width: "100%",
      height: "100%",
      padding: 30,
      backgroundColor: "#121212",
      borderRadius: 10,
      alignItems: "center"
    },
    modalTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: "#fff",
      marginBottom: 10
    },
    modalSubtitle: {
      fontSize: 16,
      fontWeight: "600",
      color: "#fff",
      marginBottom: 10
    },
    modalDescription: {
      fontSize: 14,
      color: "#b0b0b0",
      textAlign: "center",
      marginBottom: 20
    },
    optionButton: {
      width: "100%",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: "#303030"
    },
    optionText: {
      fontSize: 16,
      color: "#fff",
      textAlign: "left"
    },
    modalContainer1: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalContent1: {
      width: "80%",
      backgroundColor: "white",
      borderRadius: 10,
      padding: 20,
      alignItems: "center",
    },
    modalText1: {
      fontSize: 18,
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 15,
    },
    timerText1: {
      fontSize: 24,
      fontWeight: "bold",
      color: "red",
      marginBottom: 20,
    },
    modalActions1: {
      flexDirection: "row",
      justifyContent: "space-between",
      width: "100%",
    },
    confirmButton1: {
      backgroundColor: "#FF6347",
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 5,
      marginRight: 10,
    },
    cancelButton1: {
      backgroundColor: "#4682B4",
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 5,
    },
    buttonText1: {
      color: "white",
      fontSize: 16,
      fontWeight: "bold",
    },
    modalContainer: {
      width: 300,
      padding: 20,
      backgroundColor: "white",
      borderRadius: 10,
      alignItems: "center",
    },
    modalMessage: {
      fontSize: 16,
      marginBottom: 20,
      textAlign: "center",
    },
    modalActions: {
      flexDirection: "row",
      justifyContent: "space-between",
      width: "100%",
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
    profile: { fontSize: 12, fontWeight: "400", color: currentTheme.text || "#000000" },
    username: { fontSize: 24, fontWeight: "600", color: "#5c2d91", paddingVertical: 4 },
    chatList: {
      flex: 1,
      backgroundColor: currentTheme.cardBackground || "#F1F1F1",
      marginHorizontal: 15,
      borderRadius: 10
    },
    chatListContainer: { padding: 10 },
    messageContainer: {
      marginVertical: 5,
      paddingHorizontal: 15,
      borderRadius: 10,
      paddingVertical: 6
    },
    currentUserMessage: {
      backgroundColor: "#DADADA",
      alignSelf: "flex-end",
    },
    otherUserMessage: {
      backgroundColor: "#4C0183",
      alignSelf: "flex-start",
      color: "#fff"
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
      marginTop: 8
    },
    statusText: {
      color: '#FFFFFF',
      fontWeight: '600',
      fontSize: 12
    },
    statusPending: {
      backgroundColor: '#FFA500'
    },
    statusAccepted: {
      backgroundColor: '#4CAF50'
    },
    statusRejected: {
      backgroundColor: '#F44336'
    },
    statusCompleted: {
      backgroundColor: '#2196F3'
    },
    // Warning Modal Styles
    modalContainer: {
      width: "80%",
      backgroundColor: "#fff",
      borderRadius: 10,
      padding: 20,
      alignItems: "center",
      elevation: 10,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: "#dc3545",
      marginBottom: 10,
    },
    modalMessage: {
      fontSize: 16,
      textAlign: "center",
      color: "#6c757d",
      marginBottom: 20,
    },
    modalActions: {
      flexDirection: "row",
      justifyContent: "space-between",
      width: "100%",
    },
    cancelButton: {
      backgroundColor: "#6c757d",
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 5,
      marginRight: 10,
    },
    confirmButton: {
      backgroundColor: "#4C0183",
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 5,
    },
    assignedBanner: {
      backgroundColor: '#E3F2FD',
      padding: 10,
      marginTop: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#90CAF9'
    },
    assignedText: {
      color: '#1565C0',
      textAlign: 'center',
      fontSize: 14,
      fontWeight: '500'
    }
  });

export default ClientChat;
