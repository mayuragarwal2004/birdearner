import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, Text, TouchableOpacity, Modal, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useTheme } from "../context/ThemeContext";
import DeadlineTimer from "../components/DeadlineTimer";
import MessageItem from "../components/MessageItem";
import ChatHeader from "../components/chat/ChatHeader";
import ChatInput from "../components/chat/ChatInput";
import ClientActions from "../components/chat/client/ClientActions";
import WarningModal from "../components/chat/client/WarningModal";
import CancelJobModal from "../components/chat/client/CancelJobModal";
import ReportModal from "../components/chat/ReportModal";
import { useChatLogic } from "../hooks/useChatLogic";
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
  const currentTheme = themeStyles[theme];
  const styles = getStyles(currentTheme);

  const [modalVisible, setModalVisible] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  const api = ApiService;

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
  } = useChatLogic("client", route.params);

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
    navigation.navigate("Profile", { userId: route.params.freelancer.user.id });
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
      default:
        break;
    }
    setShowMenu(false);
  };

  const handleBlock = async () => {
    try {
      await api.init();
      const res = await api.makeRequest(`/chat/block`, {
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
    try {
      await api.init();
      const res = await api.makeRequest(`/jobs/${route.params.jobId}/reject-freelancer`, {
        method: "POST",
        body: JSON.stringify({
          freelancerId: route.params.freelancer.id,
          threadId: thread?.id,
        }),
      });

      if (res.success) {
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Freelancer rejected successfully",
        });
        navigation.goBack();
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
      const res = await api.makeRequest(`/jobs/${route.params.jobId}/assign`, {
        method: "PATCH",
        body: JSON.stringify({
          freelancerId: route.params.freelancer.id,
          jobStatus: "IN_PROGRESS",
          deadlineDate: new Date(
            Date.now() + parseInt(job.deadlineDate) * 24 * 60 * 60 * 1000
          ),
        }),
      });

      if (res.success) {
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Freelancer assigned successfully",
        });
        // The useChatLogic hook will handle refreshing the job data
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
      const res = await api.makeRequest(`/jobs/${route.params.jobId}/cancel`, {
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

  const confirmRequestCompletion = async () => {
    setShowConfirmationModal(false);
    try {
      await api.init();
      const res = await api.makeRequest(`/chat/message/completion-request/client`, {
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
      
      if (job?.paymentMethod === 'CASH') {
        // For cash payments, create special message for payment flow
        const res = await api.makeRequest(`/jobs/${route.params.jobId}/complete-cash`, {
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
          // Refresh messages to show the new payment flow message
          handleSendMessage("", null); // This will trigger a refresh
        }
      } else {
        // For platform payments, use existing flow
        const res = await api.makeRequest(`/jobs/${route.params.jobId}/complete`, {
          method: "PATCH",
          body: JSON.stringify({
            userRole: "client",
          }),
        });

        if (res.success) {
          Toast.show({
            type: "success",
            text1: "Success",
            text2: "Project marked as completed",
          });
          navigation.goBack();
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
              isCurrentUser={item.senderId === userData.id}
              media={item.userMedia}
              isUploading={item.isUploading}
              currentUserId={userData.id}
              userRole="client"
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