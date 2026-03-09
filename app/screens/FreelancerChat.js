import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, Text, TouchableOpacity, Modal, Alert, Platform, Keyboard } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from "../context/ThemeContext";
import { useKeyboard } from "../context/KeyboardContext";
import DeadlineTimer from "../components/DeadlineTimer";
import MessageItem from "../components/MessageItem";
import ChatHeader from "../components/chat/ChatHeader";
import ChatInput from "../components/chat/ChatInput";
import AssignmentBanner from "../components/chat/freelancer/AssignmentBanner";
import ReportModal from "../components/chat/ReportModal";
import { useChatData } from "../hooks/useChatSWR";
import { useAuth } from "../context/NewAuthContext";
import ApiService from "../lib/apiService";
import ReviewFormModal from "../components/chat/ReviewFormModal";

const getStyles = (currentTheme, isKeyboardVisible) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background || "#F1F5F9",
      paddingBottom: isKeyboardVisible ? 0 : (Platform.OS === "ios" ? 85 : 70), // Dynamic padding based on keyboard visibility
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
  const { isKeyboardVisible } = useKeyboard();
  const currentTheme = themeStyles[theme];

  // Safety guard for when user logs out but screen is still in transition/stack
  if (!userData) return null;

  const styles = getStyles(currentTheme, isKeyboardVisible);

  // Local state for UI interactions
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewMessageId, setReviewMessageId] = useState(null);
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
    navigation.navigate("ProfileScreen", { userId: route.params.client.user.id });
  };

  const handleRequestCompletion = () => {
    setShowConfirmationModal(true);
  };

  const confirmRequestCompletion = async () => {
    setShowConfirmationModal(false);
    await swrHandleRequestCompletion();
  };

  // File picking and Cloudinary upload functionality
  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const file = result.assets[0];

        setIsUploading(true);
        setUploadProgress(0);

        try {
          const api = ApiService;
          await api.init();

          // Create FormData for multipart upload
          const formData = new FormData();
          formData.append('file', {
            uri: file.uri,
            type: file.mimeType || 'application/octet-stream',
            name: file.name,
          });

          // Upload to Cloudinary via new chat document route
          const uploadRes = await api.makeRequest('/chats/upload-chat-document', {
            method: 'POST',
            body: formData,
          });

          if (uploadRes.success && uploadRes.secure_url) {
            // Store Cloudinary URL instead of local file reference
            setFileInfo({
              name: file.name,
              url: uploadRes.secure_url,
              cloudinaryPublicId: uploadRes.cloudinaryPublicId,
              mimeType: file.mimeType,
              size: file.size,
            });
          } else {
            throw new Error(uploadRes.message || 'Upload failed');
          }
        } catch (uploadError) {
          console.error('Cloudinary upload error:', uploadError);
          Toast.show({
            type: 'error',
            text1: 'Upload Failed',
            text2: uploadError.message || 'Failed to upload file to Cloudinary',
          });
          setFileInfo(null);
        } finally {
          setIsUploading(false);
          setUploadProgress(0);
        }
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
    // Validate message or file
    if (!messageContent.trim() && !fileInfo && !fileData) return;

    setSending(true);
    try {
      const messageToSend = messageContent.trim() || '';
      const attachmentData = fileData || fileInfo;

      // If file exists, send with attachment data
      if (attachmentData && (attachmentData.url || attachmentData.secure_url)) {
        await sendMessage(messageToSend, {
          attachmentUrl: attachmentData.url || attachmentData.secure_url,
          attachmentName: attachmentData.originalName || attachmentData.name || 'attachment',
          attachmentSize: attachmentData.size || 0,
          attachmentMime: attachmentData.mimeType || attachmentData.mimetype || 'application/octet-stream',
        });
      } else {
        // Send text-only message
        await sendMessage(messageToSend, null);
      }

      setFileInfo(null); // Clear file after sending
      setCurrentInputLength(0); // Reset input length after sending
    } catch (error) {
      console.error('Error sending message:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to send message',
      });
    } finally {
      setSending(false);
    }
  };

  // Remove attached file functionality
  const handleRemoveFile = () => {
    setFileInfo(null);
    setUploadProgress(0);
    setIsUploading(false);
  };

  // Report functionality
  const handleReport = async () => {
    if (!selectedReportReason) return;

    try {
      const api = ApiService;
      await api.init();

      const res = await api.makeRequest('/chats/report', {
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

  const handleSubmitReview = async (reviewData) => {
    setSubmittingReview(true);
    try {
      const api = ApiService;
      await api.init();
      const { ratings, reviewText } = reviewData;
      const averageRating = parseFloat(((ratings.experience + ratings.knowledge + ratings.response) / 3).toFixed(1));

      const res = await api.makeRequest('/reviews', {
        method: 'POST',
        body: JSON.stringify({
          reviewerId: userData.id,
          revieweeId: route.params.client?.user?.id,
          jobId: route.params.jobId,
          rating: averageRating,
          ratingDetails: ratings,
          reviewText: reviewText,
          reviewType: 'CLIENT',
          messageId: reviewMessageId
        })
      });

      if (res.success) {
        Toast.show({
          type: 'success',
          text1: 'Review Submitted',
          text2: 'Thank you for your feedback!'
        });
        setReviewModalVisible(false);
      } else {
        throw new Error(res.error || res.message || "Failed to submit review");
      }
    } catch (error) {
      console.error("Review submission error:", error);
      Toast.show({
        type: 'error',
        text1: 'Submission Failed',
        text2: error.message
      });
    } finally {
      setSubmittingReview(false);
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
      case "Write Review":
        setReviewModalVisible(true);
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
            (job?.assignedFreelancer?.user?.id === userData?.id || job?.assignedFreelancerId === userData?.id || job?.assignedFreelancerId === userData?.freelancer?.id) &&
              (chatStatus === 'IN_PROGRESS' || chatStatus === 'ACCEPTED') && job?.jobStatus !== 'COMPLETED'
              ? ["View Profile", "Block", "Report", "Request Project Completion"]
              : job?.jobStatus === "COMPLETED"
                ? ["View Profile", "Block", "Report", "Write Review"]
                : ["View Profile", "Block", "Report"]
          }
        />

        <AssignmentBanner
          assignedFreelancerId={job?.assignedFreelancerId}
          currentFreelancerId={userData?.freelancer?.id}
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
              isCurrentUser={item.senderId === userData?.id}
              media={item.userMedia}
              isUploading={item.isUploading}
              currentUserId={userData?.id}
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
          onRemoveFile={handleRemoveFile}
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

        <ReviewFormModal
          visible={reviewModalVisible}
          onClose={() => setReviewModalVisible(false)}
          onSubmit={handleSubmitReview}
          isSubmitting={submittingReview}
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
