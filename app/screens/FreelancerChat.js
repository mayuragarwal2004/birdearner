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
import FreelancerCancelJobModal from "../components/chat/freelancer/FreelancerCancelJobModal";
import ReportModal from "../components/chat/ReportModal";
import NegotiationPanel from "../components/chat/NegotiationPanel";
import { useChatData } from "../hooks/useChatSWR";
import { useAuth } from "../context/NewAuthContext";
import ApiService from "../lib/apiService";
import ReviewFormModal from "../components/chat/ReviewFormModal";
import OnSiteOtpModal from "../components/chat/OnSiteOtpModal";
import SafeSpinner from "../components/SafeSpinner";
import { Ionicons } from "@expo/vector-icons";

const getStyles = (currentTheme, isKeyboardVisible) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background || "#F1F5F9",
      paddingBottom: isKeyboardVisible ? 0 : (Platform.OS === "ios" ? 85 : 70), // Dynamic padding based on keyboard visibility
    },
    negotiationBarTrigger: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: currentTheme.surface || '#F3EAFF',
      borderWidth: 1,
      borderColor: currentTheme.border || '#E9D5FF',
      borderRadius: 10,
      marginHorizontal: 16,
      marginTop: 4,
      marginBottom: 2,
      paddingHorizontal: 12,
      paddingVertical: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    negotiationBarLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    negotiationBarTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: currentTheme.text || '#4C0183',
    },
    negotiationBarRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    negotiationBarSubtitle: {
      fontSize: 12,
      fontWeight: '600',
      color: '#7B2CFF',
    },
    drawerOverlay: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      flexDirection: 'row',
    },
    drawerBackdrop: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    drawerContainer: {
      width: '50%',
      height: '100%',
      backgroundColor: currentTheme.surface || '#FFFFFF',
      zIndex: 1001,
      shadowColor: '#000',
      shadowOffset: { width: 4, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 10,
      position: 'relative',
    },
    drawerToggleHandle: {
      position: 'absolute',
      top: 16,
      right: -28,
      width: 28,
      height: 40,
      backgroundColor: currentTheme.isDark ? '#3A2A55' : '#4C0183',
      borderTopRightRadius: 20,
      borderBottomRightRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 2, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 6,
      zIndex: 1002,
    },
    floatingSideToggle: {
      position: 'absolute',
      top: 16,
      left: 0,
      width: 32,
      height: 40,
      backgroundColor: currentTheme.isDark ? '#3A2A55' : '#4C0183',
      borderTopRightRadius: 20,
      borderBottomRightRadius: 20,
      borderTopLeftRadius: 0,
      borderBottomLeftRadius: 0,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 2, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 6,
      zIndex: 999,
    },
    deadlineContainer: {
      alignItems: "stretch",
      width: "100%",
      marginVertical: 2,
      paddingLeft: 38,
      paddingRight: 16,
    },
    deadline: {
      fontSize: 14,
      fontWeight: "600",
      color: currentTheme.text || "#1E293B",
      paddingTop: 4,
      textAlign: "center",
      letterSpacing: 0.3,
    },
    deadlineTimerContainer: {
      width: "100%",
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginVertical: 2,
      backgroundColor: currentTheme.surface || "#FFFFFF",
      borderRadius: 10,
      paddingVertical: 4,
      paddingHorizontal: 8,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    timeContainer: {
      flexDirection: "row",
      alignItems: "stretch",
      gap: 4,
      width: "100%",
    },
    timeBox: {
      flex: 1,
      minWidth: 0,
      paddingHorizontal: 2,
      paddingVertical: 3,
      backgroundColor: currentTheme.primary || "#3B82F6",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 6,
      overflow: "hidden",
    },
    timeText: {
      fontSize: 13,
      fontWeight: "700",
      color: "#FFFFFF",
      textAlign: "center",
    },
    unitText: {
      fontSize: 9,
      fontWeight: "600",
      color: "#FFFFFF",
      textAlign: "center",
      marginTop: 0,
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
    chatWarning: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#FEF3C7",
      marginHorizontal: 16,
      marginTop: 2,
      marginBottom: 2,
      borderRadius: 6,
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderWidth: 1,
      borderColor: "#FCD34D",
    },
    chatWarningText: {
      fontSize: 10,
      color: "#92400E",
      flex: 1,
      lineHeight: 13,
    },
    limit: {
      backgroundColor: currentTheme.surface || "#FFFFFF",
      marginHorizontal: 16,
      borderRadius: 10,
      paddingVertical: 6,
      paddingHorizontal: 12,
      marginVertical: 2,
      borderWidth: 1,
      borderColor: currentTheme.border || "#E2E8F0",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.03,
      shadowRadius: 2,
      elevation: 1,
    },
    limitchar: {
      color: currentTheme.text || "#475569",
      textAlign: "center",
      fontSize: 12,
      fontWeight: "700",
      marginBottom: 1,
    },
    limitvar: {
      color: currentTheme.subText || "#64748B",
      textAlign: "center",
      fontSize: 11,
      fontWeight: "500",
      marginBottom: 1,
    },
    limitInfo: {
      color: currentTheme.subText || "#64748B",
      textAlign: "center",
      fontSize: 10,
      marginTop: 2,
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
    reviewBanner: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#F3E8FF",
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginHorizontal: 16,
      marginTop: 8,
      marginBottom: 8,
      borderRadius: 12,
    },
    reviewBannerText: {
      fontSize: 12,
      color: "#5B21B6",
      flex: 1,
      lineHeight: 16,
      fontWeight: "500",
    },
  });

const FreelancerChat = ({ route, navigation }) => {
  const { userData } = useAuth();
  const { theme, themeStyles } = useTheme();
  const { isKeyboardVisible } = useKeyboard();
  const currentTheme = themeStyles[theme];
  const isDark = theme === "dark" || Boolean(currentTheme?.isDark);

  const styles = getStyles(currentTheme, isKeyboardVisible);

  // Local state for UI interactions
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isNegotiationOpen, setIsNegotiationOpen] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewMessageId, setReviewMessageId] = useState(null);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedReportReason, setSelectedReportReason] = useState(null);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [fileInfo, setFileInfo] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [sending, setSending] = useState(false);
  const [currentInputLength, setCurrentInputLength] = useState(0);
  const [showOtpModal, setShowOtpModal] = useState(false);

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
    clientOffer,
    freelancerOffer,
    agreedAmount,
    clientDays,
    freelancerDays,
    agreedDays,
    isNegotiable,
    updateOffer,
    isLoading,
    sendMessage,
    handleRequestCompletion: swrHandleRequestCompletion,
    handleJobCancel,
    mutateMessages,
    mutateJob,
    mutateThread,
  } = useChatData("freelancer", route.params);

  // Safety guard for when user logs out but screen is still in transition/stack
  if (!userData) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: currentTheme?.background || "#FFFFFF", justifyContent: "center", alignItems: "center" }}>
        <SafeSpinner size={36} color="#6B21A8" />
      </SafeAreaView>
    );
  }

  const handleViewProfile = () => {
    const c = route.params.client;
    const userId = c?.user?.id || c?.userId || c?.id;
    if (userId) {
      navigation.navigate("ProfileScreen", { userId });
    }
  };

  const handleRequestCompletion = () => {
    const pType = (job?.projectType || job?.jobType || '').toLowerCase();
    const isOnSite = pType === 'on-site' || (pType !== 'remote' && job?.location?.toLowerCase() !== 'remote');
    if (isOnSite && !job?.otpVerifiedAt) {
      Alert.alert(
        'OTP Not Verified',
        'You must complete the OTP verification flow before requesting project completion.',
        [{ text: 'OK' }]
      );
      return;
    }
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
  const handleReport = async (reportDetails = '') => {
    if (!selectedReportReason) return;

    setSubmittingReport(true);
    try {
      const api = ApiService;
      await api.init();

      const reportedUserId =
        route.params?.client?.user?.id ||
        route.params?.client?.userId ||
        route.params?.client?.id ||
        thread?.client?.userId;

      const res = await api.makeRequest('/chats/report', {
        method: 'POST',
        body: JSON.stringify({
          threadId: thread?.id,
          reason: selectedReportReason,
          reportedUserId: reportedUserId,
          details: reportDetails,
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
      } else {
        throw new Error(res.error || res.message || 'Failed to submit report');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to submit report',
      });
    } finally {
      setSubmittingReport(false);
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
      case "Negotiation & Offers":
      case "Negotiation":
        setIsNegotiationOpen(true);
        break;
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
      case "Cancel Job":
        setCancelModalVisible(true);
        break;
      default:
        break;
    }
    setShowMenu(false);
  };

  const handleCancelJob = async (reason) => {
    try {
      await handleJobCancel(reason);
      setCancelModalVisible(false);
    } catch (error) {
      console.error("Error cancelling job:", error);
    }
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
            (() => {
              const baseOptions = ["View Profile", "Block", "Report"];

              const isMyJob = job?.assignedFreelancer?.user?.id === userData?.id || job?.assignedFreelancerId === userData?.id || job?.assignedFreelancerId === userData?.freelancer?.id;
              const isCompleted = job?.jobStatus === 'COMPLETED';
              const pType = (job?.projectType || job?.jobType || '').toLowerCase();
              const isOnSite = pType === 'on-site' || (pType !== 'remote' && job?.location?.toLowerCase() !== 'remote');
              const canRequestCompletion = isMyJob && !isCompleted && (chatStatus === 'IN_PROGRESS' || chatStatus === 'ACCEPTED') && (!isOnSite || ['JOB_STARTED', 'WORK_COMPLETED', 'PAYMENT_RELEASED'].includes(job?.jobStatus));
              
              if (isCompleted) {
                baseOptions.push("Write Review");
                return baseOptions;
              }
              if (canRequestCompletion) {
                baseOptions.push("Request Project Completion", "Cancel Job");
                return baseOptions;
              }
              return baseOptions;
            })()
          }
        />

        <AssignmentBanner
          assignedFreelancerId={job?.assignedFreelancerId}
          currentFreelancerId={userData?.freelancer?.id}
        />

        {!job?.assignedFreelancerId && chatStatus !== "ACCEPTED" && !["CANCELLED", "CANCELLED_BY_CLIENT", "CANCELLED_BY_FREELANCER", "CANCELLED_SCOPE_MISMATCH"].includes(job?.jobStatus) && (
          <View style={styles.reviewBanner}>
            <Ionicons name="information-circle-outline" size={20} color="#6D28D9" style={{ marginRight: 8 }} />
            <Text style={styles.reviewBannerText}>
              Your offer is currently under review. The client hasn't accepted it yet. Please wait for the client to accept your offer, and you will get the project.
            </Text>
          </View>
        )}

        <View style={{ flex: 1, position: "relative" }}>
          {(clientOffer || freelancerOffer || isNegotiable) && !isNegotiationOpen && (
            <TouchableOpacity
              style={styles.floatingSideToggle}
              onPress={() => setIsNegotiationOpen(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="menu" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}

          {(() => {
            return true;
          })() && (
            <View style={styles.deadlineContainer}>
              <View style={styles.deadlineTimerContainer}>
                {["CANCELLED", "CANCELLED_BY_CLIENT", "CANCELLED_BY_FREELANCER", "CANCELLED_SCOPE_MISMATCH"].includes(job?.jobStatus) ? (
                  <DeadlineTimer
                    jobCancelled={true}
                    style={{
                      timeBox: styles.timeBox,
                      timeText: styles.timeText,
                      unitText: styles.unitText,
                      completedText: styles.conColorc,
                      timeContainer: styles.timeContainer,
                    }}
                  />
                ) : job?.jobStatus === "COMPLETED" ? (
                  <View style={styles.conColorc}>
                    <Text style={styles.completedText}>Project Completed ✓</Text>
                  </View>
                ) : (
                  <DeadlineTimer
                    deadline={job?.deadlineDate}
                    jobCompleted={false}
                    jobCancelled={false}
                    style={{
                      timeBox: styles.timeBox,
                      timeText: styles.timeText,
                      unitText: styles.unitText,
                      completedText: styles.conColorc,
                      timeContainer: styles.timeContainer,
                      label: { fontSize: 11, fontWeight: '600', marginBottom: 2, color: currentTheme.text || '#1E293B' },
                    }}
                  />
                )}
              </View>

              {/* On-Site Job: Show Status Button for Freelancer below deadline timer */}
              {(() => {
                const pType = (job?.projectType || job?.jobType || '').toLowerCase();
                const isOnSite = pType.includes('on-site') || (!pType.includes('remote') && job?.location?.toLowerCase() !== 'remote');
                const isCancelled = ["CANCELLED", "CANCELLED_BY_CLIENT", "CANCELLED_BY_FREELANCER", "CANCELLED_SCOPE_MISMATCH"].includes(job?.jobStatus);
                if (isOnSite && !isCancelled) {
                  return (
                    <TouchableOpacity
                      style={{
                        backgroundColor: "#111827",
                        paddingVertical: 6,
                        paddingHorizontal: 12,
                        borderRadius: 8,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: 4,
                      }}
                      onPress={() => {
                        setShowOtpModal(true);
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Ionicons name="location" size={18} color="#A78BFA" style={{ marginRight: 8 }} />
                        <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "600" }}>
                          On-Site Job Status
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                    </TouchableOpacity>
                  );
                }
                return null;
              })()}
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
                  mutateMessages();
                }}
              />
            )}
            style={styles.chatList}
            contentContainerStyle={styles.chatListContainer}
          />

          {(!messages || messages.length === 0) && (
            <View style={styles.chatWarning}>
              <Ionicons name="information-circle-outline" size={14} color="#D97706" style={{ marginRight: 6 }} />
              <Text style={styles.chatWarningText}>
                This chat is recorded. If any issues arise, the conversation will be reviewed.
              </Text>
            </View>
          )}

          {jobStatus === "OPEN" && characterLimit && (
            <View style={styles.limit}>
              <Text style={styles.limitchar}>Character Limit Active</Text>
              <Text style={styles.limitvar}>
                {charactersRemaining !== null
                  ? `${Math.max(0, charactersRemaining - currentInputLength)} characters remaining (${charactersUsed + currentInputLength}/${characterLimit} used)`
                  : `Maximum ${characterLimit} characters total`
                }
              </Text>
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

          {isNegotiationOpen && (
            <View style={styles.drawerOverlay}>
              <TouchableOpacity
                style={styles.drawerBackdrop}
                activeOpacity={1}
                onPress={() => setIsNegotiationOpen(false)}
              />
              <View style={styles.drawerContainer}>
                <TouchableOpacity
                  style={styles.drawerToggleHandle}
                  onPress={() => setIsNegotiationOpen(false)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="chevron-back" size={18} color="#FFFFFF" />
                </TouchableOpacity>

                <NegotiationPanel
                  role="freelancer"
                  otherPartyName={
                    route.params.client?.companyName ||
                    route.params.client?.user?.fullName ||
                    route.params.client?.name ||
                    "Client"
                  }
                  clientOffer={clientOffer}
                  freelancerOffer={freelancerOffer}
                  agreedAmount={agreedAmount}
                  clientDays={clientDays}
                  freelancerDays={freelancerDays}
                  agreedDays={agreedDays}
                  isNegotiable={isNegotiable}
                  onUpdateOffer={updateOffer}
                  onRefresh={() => {
                    mutateThread?.();
                    mutateMessages?.();
                  }}
                  onViewProposalDetails={() => {
                    navigation.navigate("JobDetailsChat", { jobId: job?.id || route.params.jobId });
                  }}
                  jobId={job?.id || route.params.jobId}
                  onClose={() => setIsNegotiationOpen(false)}
                />
              </View>
            </View>
          )}
        </View>

        <ReportModal
          visible={reportModalVisible}
          onClose={() => setReportModalVisible(false)}
          onSubmit={handleReport}
          selectedReason={selectedReportReason}
          onSelectReason={setSelectedReportReason}
          isSubmitting={submittingReport}
        />

        <FreelancerCancelJobModal
          visible={cancelModalVisible}
          onConfirm={handleCancelJob}
          onCancel={() => setCancelModalVisible(false)}
          jobBudget={job?.budgetAmount}
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

        <OnSiteOtpModal
          visible={showOtpModal}
          onClose={() => setShowOtpModal(false)}
          jobId={job?.id || route.params.jobId}
          job={job}
          userRole="freelancer"
          onJobUpdated={() => {
            mutateJob?.();
            mutateThread?.();
            mutateMessages?.();
          }}
        />

        <Toast />
      </View>
    </SafeAreaView>
  );
};

export default FreelancerChat;
