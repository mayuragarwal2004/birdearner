import React, { useState } from "react";
import { View, StyleSheet, FlatList, Text, TouchableOpacity, Modal, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from "../context/ThemeContext";
import DeadlineTimer from "../components/DeadlineTimer";
import MessageItem from "../components/MessageItem";
import ChatHeader from "../components/chat/ChatHeader";
import ChatInput from "../components/chat/ChatInput";
import AssignmentBanner from "../components/chat/freelancer/AssignmentBanner";
import ReportModal from "../components/chat/ReportModal";
import { useChatData } from "../hooks/useChatSWR";
import { useAuth } from "../context/NewAuthContext";
import ApiService from "../lib/apiService";

const getStyles = (currentTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background || "#F1F5F9",
    },
    deadlineContainer: {
      alignItems: "center",
      marginVertical: 4,
      paddingHorizontal: 20,
    },
    deadline: {
      fontSize: 16,
      fontWeight: "600",
      color: currentTheme.text || "#1E293B",
      paddingTop: 8,
      textAlign: "center",
      letterSpacing: 0.3,
    },
    deadlineTimerContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginVertical: 12,
      backgroundColor: currentTheme.surface || "#FFFFFF",
      borderRadius: 16,
      padding: 16,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
    },
    timeBox: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: currentTheme.primary || "#3B82F6",
      marginHorizontal: 4,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 12,
      minWidth: 44,
      shadowColor: currentTheme.primary || "#3B82F6",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    timeText: {
      fontSize: 20,
      fontWeight: "700",
      color: "#FFFFFF",
      textAlign: "center",
    },
    unitText: {
      fontSize: 12,
      fontWeight: "600",
      color: "#FFFFFF",
      textAlign: "center",
      marginTop: 2,
      opacity: 0.9,
    },
    conColorc: {
      paddingHorizontal: 20,
      paddingVertical: 12,
      backgroundColor: "#10B981",
      borderRadius: 12,
      alignItems: "center",
      marginBottom: 8,
      shadowColor: "#10B981",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    completedText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "600",
      letterSpacing: 0.5,
    },
    chatList: {
      flex: 1,
      backgroundColor: currentTheme.surface || "#FFFFFF",
      marginHorizontal: 16,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    chatListContainer: {
      padding: 16,
      paddingBottom: 20,
    },
    limit: {
      backgroundColor: currentTheme.surface || "#FFFFFF",
      marginHorizontal: 16,
      borderRadius: 16,
      paddingVertical: 20,
      paddingHorizontal: 20,
      marginVertical: 8,
      borderWidth: 1,
      borderColor: currentTheme.border || "#E2E8F0",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 1,
    },
    limitchar: {
      color: currentTheme.text || "#475569",
      textAlign: "center",
      fontSize: 14,
      fontWeight: "600",
      marginBottom: 4,
    },
    limitvar: {
      color: currentTheme.subText || "#64748B",
      textAlign: "center",
      fontSize: 12,
      fontWeight: "500",
    },
    limitInfo: {
      color: currentTheme.subText || "#64748B",
      textAlign: "center",
      fontSize: 12,
      marginTop: 8,
      fontStyle: 'italic',
    },
    limitWarn: {
      color: "#EF4444",
      textAlign: "center",
      fontSize: 12,
      marginTop: 6,
      fontWeight: '600',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    modalContent: {
      backgroundColor: currentTheme.surface || '#FFFFFF',
      borderRadius: 24,
      padding: 32,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.15,
      shadowRadius: 24,
      elevation: 8,
      borderWidth: 1,
      borderColor: currentTheme.border || '#F1F5F9',
      maxWidth: '100%',
      width: '100%',
    },
    modalTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: currentTheme.text || '#1E293B',
      marginBottom: 16,
      textAlign: 'center',
      letterSpacing: 0.3,
    },
    modalMessage: {
      fontSize: 16,
      color: currentTheme.subText || '#475569',
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 32,
      paddingHorizontal: 8,
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      gap: 12,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    cancelButton: {
      backgroundColor: currentTheme.surface || '#F8FAFC',
      borderWidth: 2,
      borderColor: currentTheme.border || '#E2E8F0',
    },
    confirmButton: {
      backgroundColor: currentTheme.primary || '#3B82F6',
      shadowColor: currentTheme.primary || '#3B82F6',
      shadowOpacity: 0.3,
    },
    cancelButtonText: {
      color: currentTheme.text || '#475569',
      fontWeight: '600',
      fontSize: 16,
      textAlign: 'center',
    },
    confirmButtonText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 16,
      textAlign: 'center',
      letterSpacing: 0.5,
    },
  });

const FreelancerChat = ({ route, navigation }) => {
  const { userData } = useAuth();
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const styles = getStyles(currentTheme);
  
  // Local state for UI interactions
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedReportReason, setSelectedReportReason] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [sending, setSending] = useState(false);
  const [currentInputLength, setCurrentInputLength] = useState(0);

  // SWR data hooks
  const {
    messages,
    thread,
    job,
    chatStatus,
    jobStatus,
    characterLimit,
    charactersUsed,
    charactersRemaining,
    otherCharactersUsed,
    otherCharactersRemaining,
    isLoading,
    sendMessage,
    handleRequestCompletion: swrHandleRequestCompletion,
    mutateMessages,
    mutateJob,
  } = useChatData("freelancer", route.params);

  const handleViewProfile = () => {
    navigation.navigate("Profile", { userId: route.params.client.user.id });
  };

  const handleRequestCompletion = () => {
    setShowConfirmationModal(true);
  };

  const confirmRequestCompletion = async () => {
    setShowConfirmationModal(false);
    await swrHandleRequestCompletion();
  };

  // File picking functionality
  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const file = result.assets[0];
        setFileInfo({
          name: file.name,
          uri: file.uri,
          mimeType: file.mimeType,
          size: file.size,
        });
      }
    } catch (error) {
      console.error('Error picking file:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to pick file',
      });
    }
  };

  // Send message functionality
  const handleSendMessage = async (messageContent, fileData = null) => {
    if (!messageContent.trim() && !fileInfo && !fileData) return;

    setSending(true);
    try {
      await sendMessage(messageContent, fileInfo || fileData);
      setFileInfo(null); // Clear file after sending
      setCurrentInputLength(0); // Reset input length after sending
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  // Report functionality
  const handleReport = async () => {
    if (!selectedReportReason) return;

    try {
      const api = ApiService;
      await api.init();
      
      const res = await api.makeRequest('/chat/report', {
        method: 'POST',
        body: JSON.stringify({
          threadId: thread?.id,
          reason: selectedReportReason,
          reportedUserId: route.params.client.userId,
        }),
      });

      if (res.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Report submitted successfully',
        });
        setReportModalVisible(false);
        setSelectedReportReason(null);
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to submit report',
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
              {job?.jobStatus === "COMPLETED" ? (
                <View style={styles.conColorc}>
                  <Text style={styles.completedText}>Project Completed ✓</Text>
                </View>
              ) : (
                <DeadlineTimer
                  deadline={job?.deadlineDate}
                  jobCompleted={job?.jobStatus === "COMPLETED"}
                  style={{
                    timeBox: styles.timeBox,
                    timeText: styles.timeText,
                    unitText: styles.unitText,
                    completedText: styles.conColorc,
                    timeContainer: styles.timeContainer,
                  }}
                />
              )}
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
                // Refresh messages when cash payment status updates using SWR
                mutateMessages();
              }}
            />
          )}
          style={styles.chatList}
          contentContainerStyle={styles.chatListContainer}
        />

        {jobStatus === "OPEN" && characterLimit && (
          <View style={styles.limit}>
            <Text style={styles.limitchar}>Character Limit Active</Text>
            <Text style={styles.limitvar}>
              {charactersRemaining !== null 
                ? `${Math.max(0, charactersRemaining - currentInputLength)} characters remaining (${charactersUsed + currentInputLength}/${characterLimit} used)`
                : `Maximum ${characterLimit} characters total`
              }
            </Text>
            {/* Info about character limit removal and other user's status */}
            <Text style={styles.limitInfo}>
              {`Limit will be removed once the client accepts you as their freelancer.`}
            </Text>
            {otherCharactersRemaining === 0 && (
              <Text style={styles.limitWarn}>
                {`Client has exhausted their character limit.`}
              </Text>
            )}
          </View>
        )}

        <ChatInput
          onSend={handleSendMessage}
          onFilePick={handleFilePick}
          characterLimit={characterLimit}
          charactersRemaining={charactersRemaining}
          onInputChange={setCurrentInputLength}
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
