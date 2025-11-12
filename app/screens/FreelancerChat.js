import React from "react";
import { View, StyleSheet, FlatList, Text } from "react-native";
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
  });

const FreelancerChat = ({ route, navigation }) => {
  const { userData } = useAuth();
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const styles = getStyles(currentTheme);

  const {
    messages,
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

  console.log({ x: job?.assignedFreelancerId });
  console.log({ y: userData.freelancer.id });

  console.log({ chatStatus });

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

        <Toast />
      </View>
    </SafeAreaView>
  );
};

export default FreelancerChat;
