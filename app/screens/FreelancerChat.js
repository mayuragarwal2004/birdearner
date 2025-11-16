import React, { useState } from "react";
import { View, StyleSheet, FlatList, Text, TouchableOpacity, Modal, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useTheme } from "../context/ThemeContext";
import DeadlineTimer from "../components/DeadlineTimer";
import MessageItem from "../components/MessageItem";
import ChatHeader from "../components/chat/ChatHeader";
import ChatInput from "../components/chat/ChatInput";
import AssignmentBanner from "../components/chat/freelancer/AssignmentBanner";
import ReportModal from "../components/chat/ReportModal";
import { useChatLogic } from "../hooks/useChatLogic";
import { useAuth } from "../context/NewAuthContext";
import ApiService from "../lib/apiService";

const getStyles = (currentTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background || "#fff",
    },
    deadlineContainer: {
      alignItems: "center",
      marginVertical: 10,
    },
    deadline: {
      fontSize: 15,
      fontWeight: "500",
      color: currentTheme.text || "#000000",
      paddingTop: 6,
      textAlign: "center",
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
    conColorc: {
      paddingHorizontal: 15,
      alignItems: "center",
      marginBottom: 0,
      color: "#00871E",
    },
    chatList: {
      flex: 1,
      backgroundColor: currentTheme.cardBackground || "#F1F1F1",
      marginHorizontal: 15,
      borderRadius: 10,
    },
    chatListContainer: {
      padding: 10,
    },
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
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: currentTheme.background || '#fff',
      margin: 20,
      borderRadius: 15,
      padding: 25,
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
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: currentTheme.text || '#000',
      marginBottom: 15,
      textAlign: 'center',
    },
    modalMessage: {
      fontSize: 16,
      color: currentTheme.text || '#000',
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 25,
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
    },
    modalButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      marginHorizontal: 5,
    },
    cancelButton: {
      backgroundColor: currentTheme.border || '#E0E0E0',
    },
    confirmButton: {
      backgroundColor: currentTheme.primary || '#007AFF',
    },
    cancelButtonText: {
      color: currentTheme.text || '#000',
      fontWeight: '600',
      textAlign: 'center',
    },
    confirmButtonText: {
      color: '#fff',
      fontWeight: '600',
      textAlign: 'center',
    },
  });

const FreelancerChat = ({ route, navigation }) => {
  const { userData } = useAuth();
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const styles = getStyles(currentTheme);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  const {
    messages,
    thread,
    chatStatus,
    characterLimit,
    showMenu,
    setShowMenu,
    reportModalVisible,
    setReportModalVisible,
    selectedReportReason,
    setSelectedReportReason,
    job,
    fileInfo,
    isUploading,
    uploadProgress,
    sending,
    handleFilePick,
    handleSendMessage,
    handleReport,
  } = useChatLogic("freelancer", route.params);

  const handleViewProfile = () => {
    navigation.navigate("Profile", { userId: route.params.client.user.id });
  };

  const handleRequestCompletion = () => {
    setShowConfirmationModal(true);
  };

  const confirmRequestCompletion = async () => {
    setShowConfirmationModal(false);
    try {
      const api = ApiService;
      await api.init();
      
      const res = await api.makeRequest(`/chat/message/completion-request/freelancer`, {
        method: 'POST',
        body: JSON.stringify({
          threadId: thread?.id,
          jobId: job?.id
        }),
      });

      if (res.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Completion request sent to client',
        });
        // Refresh messages to show the new completion request
        setTimeout(() => {
          handleSendMessage("", null);
        }, 1000);
      }
    } catch (error) {
      console.error('Error sending completion request:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to send completion request',
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
      case "Request Project Completion":
        handleRequestCompletion();
        break;
      default:
        break;
    }
    setShowMenu(false);
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: currentTheme.background || "#fff",
      }}
    >
      <View style={styles.container}>
        <ChatHeader
          user={route.params.client}
          chatStatus={chatStatus}
          onBack={() => navigation.goBack()}
          onViewProfile={handleViewProfile}
          showMenu={showMenu}
          setShowMenu={setShowMenu}
          onMenuAction={handleMenuAction}
          menuOptions={
            (job?.assignedFreelancer?.user?.id === userData.id || job?.assignedFreelancerId === userData.id || job?.assignedFreelancerId === userData.freelancer?.id) && 
            chatStatus === 'IN_PROGRESS' && !job?.completedStatus
              ? ["View Profile", "Block", "Report", "Request Project Completion"]
              : ["View Profile", "Block", "Report"]
          }
        />

        <AssignmentBanner
          assignedFreelancerId={job?.assignedFreelancerId}
          currentFreelancerId={userData.freelancer.id}
        />

        {(chatStatus === "ACCEPTED" || chatStatus === "IN_PROGRESS") && (
          <View style={styles.deadlineContainer}>
            {chatStatus !== "COMPLETED" && chatStatus !== "IN_PROGRESS" && (
              <Text style={styles.deadline}>
                {job?.deadlineDate && new Date(job.deadlineDate) < new Date()
                  ? "Deadline Over"
                  : null}
              </Text>
            )}
            <View style={styles.deadlineTimerContainer}>
              <DeadlineTimer
                deadline={job?.deadlineDate}
                jobCompleted={job?.jobStatus === "COMPLETED"}
                style={{
                  timeBox: styles.timeBox,
                  timeText: styles.timeText,
                  unitText: styles.unitText,
                  completedText: styles.conColorc, //completedText
                  timeContainer: styles.timeContainer,
                }}
              />
            </View>
          </View>
        )}

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageItem
              messageItem={item}
              message={item.messageContent}
              isCurrentUser={item.senderId === userData.id}
              media={item.userMedia}
              isUploading={item.isUploading}
              currentUserId={userData.id}
              userRole="freelancer"
              onMessageUpdate={() => {
                // Refresh messages when cash payment status updates
                setTimeout(() => {
                  handleSendMessage("", null);
                }, 1000);
              }}
            />
          )}
          style={styles.chatList}
          contentContainerStyle={styles.chatListContainer}
        />

        {chatStatus === "PENDING" && (
          <View style={styles.limit}>
            <Text style={styles.limitchar}>Character Limit</Text>
            <Text style={styles.limitvar}>
              {characterLimit} characters remaining
            </Text>
          </View>
        )}

        <ChatInput
          onSend={handleSendMessage}
          onFilePick={handleFilePick}
          characterLimit={characterLimit}
          fileInfo={fileInfo}
          sending={sending}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
        />

        <ReportModal
          visible={reportModalVisible}
          onClose={() => setReportModalVisible(false)}
          onSubmit={handleReport}
          selectedReason={selectedReportReason}
          onSelectReason={setSelectedReportReason}
        />

        <Modal
          animationType="slide"
          transparent={true}
          visible={showConfirmationModal}
          onRequestClose={() => setShowConfirmationModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Confirm Project Completion</Text>
              <Text style={styles.modalMessage}>
                By requesting project completion, you confirm that:
                {'\n\n'}• Your work is completed to satisfaction
                {'\n'}• There are no pending issues or conflicts
                {'\n'}• You are ready for final review and payment
                {'\n\n'}Are you sure you want to proceed?
              </Text>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]} 
                  onPress={() => setShowConfirmationModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, styles.confirmButton]} 
                  onPress={confirmRequestCompletion}
                >
                  <Text style={styles.confirmButtonText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Toast />
      </View>
    </SafeAreaView>
  );
};

export default FreelancerChat;
