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
import ClientActions from "../components/chat/client/ClientActions";
import WarningModal from "../components/chat/client/WarningModal";
import CancelJobModal from "../components/chat/client/CancelJobModal";
import ReportModal from "../components/chat/ReportModal";
import ReviewFormModal from "../components/chat/ReviewFormModal";
import { useChatData } from "../hooks/useChatSWR";
import { useAuth } from "../context/NewAuthContext";
import ApiService from "../lib/apiService";

const getStyles = (currentTheme, isKeyboardVisible) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background || "#F1F5F9",
      paddingBottom: isKeyboardVisible ? 0 : (Platform.OS === "ios" ? 85 : 70), // Dynamic padding based on keyboard visibility
    },
    deadlineContainer: {
      alignItems: "center",
      marginVertical: 8,
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
      marginVertical: 4,
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
    timeBoxCon: {
      alignItems: "center",
      flexDirection: "column",
      gap: 16,
      backgroundColor: currentTheme.surface || "#FFFFFF",
      borderRadius: 20,
      padding: 20,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 6,
    },
    applyButtonText: {
      color: "#FFFFFF",
      fontWeight: "700",
      fontSize: 16,
      letterSpacing: 0.5,
    },
    conColor: {
      backgroundColor: "#10B981",
      paddingHorizontal: 24,
      borderRadius: 16,
      alignItems: "center",
      paddingVertical: 16,
      shadowColor: "#10B981",
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
      minWidth: 200,
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
    penaltyText: {
      backgroundColor: "#EF4444",
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 12,
      alignItems: "center",
      marginBottom: 12,
      shadowColor: "#EF4444",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
    },
    penaltyTextContent: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "600",
      letterSpacing: 0.3,
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
    assignedBanner: {
      backgroundColor: "#DBEAFE",
      padding: 16,
      marginHorizontal: 16,
      marginVertical: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "#93C5FD",
      shadowColor: "#3B82F6",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    assignedText: {
      color: "#1E40AF",
      textAlign: "center",
      fontSize: 15,
      fontWeight: "600",
      letterSpacing: 0.3,
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

const ClientChat = ({ route, navigation }) => {
  const { userData } = useAuth();
  const { theme, themeStyles } = useTheme();
  const { isKeyboardVisible } = useKeyboard();
  const currentTheme = themeStyles[theme];

  // Safety guard for when user logs out but screen is still in transition/stack
  if (!userData) return null;

  const styles = getStyles(currentTheme, isKeyboardVisible);

  // Local state for UI interactions
  const [modalVisible, setModalVisible] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedReportReason, setSelectedReportReason] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [sending, setSending] = useState(false);
  const [currentInputLength, setCurrentInputLength] = useState(0);


  // Review Modal State
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewMessageId, setReviewMessageId] = useState(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  const api = ApiService;

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
    handleJobCancel: swrHandleJobCancel,
    mutateMessages,
    mutateJob,
    mutateThread,
  } = useChatData("client", route.params);

  console.log({ messages });


  // Countdown timer for cancel modal
  useEffect(() => {
    let timer;
    if (cancelModalVisible && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCancelModalVisible(false);
      setCountdown(30);
    }
    return () => clearInterval(timer);
  }, [cancelModalVisible, countdown]);

  const handleViewProfile = () => {
    navigation.navigate("ProfileScreen", { userId: route.params.freelancer.user.id });
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
      case "Cancel Job":
        setCancelModalVisible(true);
        break;
      case "Request Project Completion":
        handleRequestCompletion();
        break;
      case "Write Review":
        handleReviewPressManual();
        break;
      default:
        break;
    }
    setShowMenu(false);
  };

  // File picking functionality - Upload to Cloudinary via new chat route
  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'video/*', 'application/*'],
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const file = result.assets[0];
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType,
      });

      setIsUploading(true);
      try {
        const response = await api.makeRequest(
          '/chats/upload-chat-document',
          {
            method: 'POST',
            body: formData,
          }
        );

        if (response.success) {
          setFileInfo({
            name: file.name,
            url: response.secure_url,
            cloudinaryPublicId: response.cloudinaryPublicId,
            mimeType: file.mimeType,
            size: file.size,
          });

          Toast.show({
            type: 'success',
            text1: 'Success',
            text2: 'File uploaded to cloud',
          });
        } else {
          throw new Error(response.message || 'Upload failed');
        }
      } catch (uploadError) {
        console.error('Upload error:', uploadError);
        Toast.show({
          type: 'error',
          text1: 'Upload Failed',
          text2: uploadError.message || 'Failed to upload file to cloud',
        });
      } finally {
        setIsUploading(false);
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
        await sendMessage(messageToSend, undefined);
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
          reportedUserId: route.params.freelancer.user.id,
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

  const handleBlock = async () => {
    try {
      await api.init();
      const res = await api.makeRequest(`/chats/block`, {
        method: "POST",
        body: JSON.stringify({
          threadId: thread.id,
          userId: userData.id,
          blockedUserId: route.params.freelancer.user.id,
        }),
      });

      if (res.success) {
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "User blocked successfully",
        });
        navigation.goBack();
      }
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to block user",
      });
    }
  };

  const handleReject = async () => {
    const jobId = route.params.jobId || route.params.projectId;
    const freelancerId = route.params.freelancer?.id || route.params.freelancer?.userId;
    const threadId = route.params.threadId || thread?.id;

    if (!jobId || !freelancerId) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Missing job or freelancer information",
      });
      return;
    }

    try {
      await api.init();
      
      const res = await api.makeRequest(`/jobs/${jobId}/reject-freelancer`, {
        method: "POST",
        body: JSON.stringify({
          freelancerId,
          threadId,
        }),
      });
      console.log('Client reject freelancer response:', res);

      if (res.success) {
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Freelancer rejected successfully",
        });
        mutateJob();
        mutateThread?.();
        mutateMessages();
        navigation.goBack();
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: res.message || "Failed to reject freelancer",
        });
      }
    } catch (err) {
      console.error("Rejection error:", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to reject freelancer",
      });
    }
  };

  const handleConfirm = async () => {
    setModalVisible(false);
    try {
      await api.init();
      const res = await api.makeRequest(`/jobs/${route.params.jobId || route.params.projectId}/assign`, {
        method: "PATCH",
        body: JSON.stringify({
          freelancerId: route.params.freelancer.id,
        }),
      });

      if (res.success) {
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Freelancer assigned successfully",
        });
        // Mutate job and messages immediately to update UI
        mutateJob();
        mutateThread?.();
        mutateMessages();
      }
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err.message || "Failed to assign freelancer"
      });
    }
  };

  const handleCancelJob = async () => {
    try {
      await api.init();
      const res = await api.makeRequest(`/jobs/${route.params.jobId || route.params.projectId}/cancel`, {
        method: "PATCH",
        body: JSON.stringify({
          userRole: "client",
        }),
      });

      if (res.success) {
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Job cancelled successfully",
        });
        setCancelModalVisible(false);
        navigation.goBack();
      }
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to cancel job",
      });
    }
  };

  const handleRequestCompletion = () => {
    setShowConfirmationModal(true);
  };

  const handleReviewPress = (message) => {
    setReviewMessageId(message.id);
    setReviewModalVisible(true);
  };

  const handleReviewPressManual = () => {
    // Try to find a pending review request in messages
    const pendingReviewMsg = messages.find(m => {
      if (m.messageType !== 'review_request') return false;
      try {
        const content = JSON.parse(m.messageContent);
        return content.status === 'pending';
      } catch (e) { return false; }
    });

    if (pendingReviewMsg) {
      handleReviewPress(pendingReviewMsg);
    } else {
      // Just open the modal
      setReviewMessageId(null);
      setReviewModalVisible(true);
    }
  };

  const calculateReviewLevel = (totalXP) => {
    // Client side estimation optional, backend handles it.
  };

  const handleSubmitReview = async (reviewData) => {
    setSubmittingReview(true);
    try {
      await api.init();
      const { ratings, reviewText } = reviewData;
      const averageRating = parseFloat(((ratings.experience + ratings.knowledge + ratings.response) / 3).toFixed(1));

      console.log("Submitting review with job:", job);
      console.log("Freelancer params:", route.params.freelancer); // Added log
      if (!job?.clientId) {
        console.error("Job or clientId missing:", job);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Missing job or client information'
        });
        setSubmittingReview(false);
        return;
      }

      const res = await api.makeRequest('/reviews', {
        method: 'POST',
        body: JSON.stringify({
          reviewerId: userData.id, // Use User ID
          revieweeId: route.params.freelancer.user.id, // Use Freelancer's User ID
          jobId: route.params.jobId || route.params.projectId,
          rating: averageRating,
          ratingDetails: ratings, // Send detailed ratings
          reviewText: reviewText,
          reviewType: 'FREELANCER',
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
        // Refresh messages to show updated status
        mutateMessages();
        mutateJob();
      } else {
        throw new Error(res.error || res.message || "Failed to submit review");
      }
    } catch (error) {
      console.error("Submit review error", error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to submit review'
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  const confirmRequestCompletion = async () => {
    setShowConfirmationModal(false);
    try {
      await api.init();
      const res = await api.makeRequest(`/chats/message/completion-request/client`, {
        method: 'POST',
        body: JSON.stringify({
          threadId: thread.id,
          jobId: job?.id
        }),
      });

      if (res.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Completion request sent to freelancer',
        });
        // Refresh messages to show the new completion request using SWR
        mutateMessages();
        mutateJob();
        mutateThread?.();
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

  const renderDeadlineSection = () => {
    if (chatStatus !== "ACCEPTED" && chatStatus !== "IN_PROGRESS") return null;

    const isDeadlineOver = job?.deadlineDate && new Date(job.deadlineDate) < new Date();
    const isCompleted = job?.jobStatus === "COMPLETED";

    return (
      <View style={styles.deadlineContainer}>
        {isDeadlineOver && !isCompleted ? (
          <View style={styles.timeBoxCon}>
            <View style={styles.penaltyText}>
              <Text style={styles.penaltyTextContent}>Deadline has passed</Text>
            </View>
            <TouchableOpacity
              style={styles.conColor}
              onPress={handleConfirmProjComp}
            >
              <Text style={styles.applyButtonText}>
                Confirm Project Completion
              </Text>
            </TouchableOpacity>
          </View>
        ) : isCompleted ? (
          <View style={styles.conColorc}>
            <Text style={styles.completedText}>Project Completed ✓</Text>
          </View>
        ) : (
          <View style={styles.deadlineTimerContainer}>
            {isCompleted ? (
              <View style={styles.conColorc}>
                <Text style={styles.completedText}>Project Completed ✓</Text>
              </View>
            ) : (
              <DeadlineTimer
                deadline={job?.deadlineDate}
                jobCompleted={isCompleted}
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
        )}
      </View>
    );
  };

  const handleConfirmProjComp = async () => {
    try {
      await api.init();

      console.log(job?.paymentMethod);
      console.log(job);



      if (job?.paymentMethod === 'CASH') {
        console.log("Budget amount", job.budgetAmount);
        // For cash payments, create special message for payment flow
        const res = await api.makeRequest(`/jobs/${route.params.jobId || route.params.projectId}/complete-cash`, {
          method: "POST",
          body: JSON.stringify({
            userRole: "client",
            threadId: thread?.id,
            freelancerId: route.params.freelancer.id,
            budgetAmount: job.budgetAmount
          }),
        });

        if (res.success) {
          Toast.show({
            type: "success",
            text1: "Success",
            text2: "Project completion initiated",
          });
          // Refresh messages to show the new payment flow message using SWR
          mutateMessages(); // This will trigger a refresh
        }
      } else {
        // For platform payments, use existing flow
        const res = await api.makeRequest(`/jobs/${route.params.jobId || route.params.projectId}/complete`, {
          method: "PATCH",
          body: JSON.stringify({
            userRole: "client",
          }),
        });

        if (res.success) {
          // Trigger review request immediately after completion
          try {
            await api.makeRequest('/chats/review-request/client', {
              method: 'POST',
              body: JSON.stringify({
                threadId: thread?.id,
                jobId: route.params.jobId || route.params.projectId
              })
            });
          } catch (e) {
            console.error("Failed to trigger review request", e);
          }

          Toast.show({
            type: "success",
            text1: "Success",
            text2: "Project marked as completed",
          });
          // Refresh to show review request
          mutateMessages();
          mutateJob();
        }
      }
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to mark project as completed",
      });
    }
  };

  const renderAssignmentBanner = () => {
    if (!job?.assignedFreelancerId) return null;

    if (job.assignedFreelancerId !== route.params.freelancer.id) {
      return (
        <View style={styles.assignedBanner}>
          <Text style={styles.assignedText}>
            You have assigned this job to another freelancer
          </Text>
        </View>
      );
    }

    return null;
  };

  console.log({ job });


  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: currentTheme.background || "#fff",
      }}
    >
      <View style={styles.container}>
        <ChatHeader
          user={route.params.freelancer}
          chatStatus={chatStatus}
          onBack={() => navigation.goBack()}
          onViewProfile={handleViewProfile}
          showMenu={showMenu}
          setShowMenu={setShowMenu}
          onMenuAction={handleMenuAction}
          menuOptions={
            (() => {
              const baseOptions = ["View Profile", "Block", "Report"];

              // Add Write Review option if job is completed
              if (job?.jobStatus === "COMPLETED") {
                baseOptions.push("Write Review");
              }

              if (job?.assignedFreelancerId === route.params.freelancer.id &&
                (chatStatus === "ACCEPTED" || chatStatus === "IN_PROGRESS")) {
                const options = [...baseOptions, "Cancel Job"];
                if (chatStatus === "IN_PROGRESS" && !job?.completedStatus) {
                  options.push("Request Project Completion");
                }
                return options;
              }
              return baseOptions;
            })()
          }
        />

        {renderAssignmentBanner()}

        <ClientActions
          job={job}
          freelancer={route.params.freelancer}
          chatStatus={chatStatus}
          onAccept={() => setModalVisible(true)}
          onReject={handleReject}
          onCancelJob={() => setCancelModalVisible(true)}
          onConfirmCompletion={handleConfirmProjComp}
        />

        {renderDeadlineSection()}

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
              userRole="client"
              onMessageUpdate={(type, data) => {
                if (type === 'review_press') {
                  handleReviewPress(data);
                } else {
                  // Handle other updates if needed
                  mutateMessages();
                }
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
              {`Limit will be removed once you accept the freelancer for this job.`}
            </Text>
            {otherCharactersRemaining === 0 && (
              <Text style={styles.limitWarn}>
                {`Freelancer has exhausted their character limit.`}
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

        <WarningModal
          visible={modalVisible}
          onConfirm={handleConfirm}
          onCancel={() => setModalVisible(false)}
        />

        <CancelJobModal
          visible={cancelModalVisible}
          onConfirm={handleCancelJob}
          onCancel={() => setCancelModalVisible(false)}
          countdown={countdown}
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
                {'\n\n'}• The work meets your requirements
                {'\n'}• There are no pending issues or conflicts
                {'\n'}• You are ready to proceed with payment
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

export default ClientChat;