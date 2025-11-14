import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, Text, TouchableOpacity } from "react-native";
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
    timeBoxCon: {
      alignItems: "center",
      flexDirection: "column",
      gap: 12,
    },
    applyButtonText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 16,
    },
    conColor: {
      backgroundColor: "#00871E",
      paddingHorizontal: 15,
      borderRadius: 10,
      alignItems: "center",
      marginBottom: 0,
      paddingVertical: 10,
      shadowColor: "#000000",
      shadowOffset: {
        width: 0,
        height: 3,
      },
      shadowOpacity: 0.17,
      shadowRadius: 3.05,
      elevation: 4,
    },
    conColorc: {
      paddingHorizontal: 15,
      alignItems: "center",
      marginBottom: 0,
      color: "#00871E",
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
    assignedBanner: {
      backgroundColor: "#E3F2FD",
      padding: 10,
      marginHorizontal: 15,
      marginVertical: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "#90CAF9",
    },
    assignedText: {
      color: "#1565C0",
      textAlign: "center",
      fontSize: 14,
      fontWeight: "500",
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

  const renderDeadlineSection = () => {
    if (chatStatus !== "ACCEPTED" && chatStatus !== "IN_PROGRESS") return null;

    const isDeadlineOver = job?.deadlineDate && new Date(job.deadlineDate) < new Date();
    const isCompleted = job?.jobStatus === "COMPLETED";

    return (
      <View style={styles.deadlineContainer}>
        {isDeadlineOver && !isCompleted ? (
          <View style={styles.timeBoxCon}>
            <Text style={styles.penaltyText}>Deadline has passed</Text>
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
          <Text style={styles.conColorc}>Project Completed</Text>
        ) : (
          <View style={styles.deadlineTimerContainer}>
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
            job?.assignedFreelancerId === route.params.freelancer.id && 
            (chatStatus === "ACCEPTED" || chatStatus === "IN_PROGRESS")
              ? ["View Profile", "Block", "Report", "Cancel Job"]
              : ["View Profile", "Block", "Report"]
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

        <Toast />
      </View>
    </SafeAreaView>
  );
};

export default ClientChat;