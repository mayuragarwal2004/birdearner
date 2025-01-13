import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
  Modal,
  Alert,
} from "react-native";
import { appwriteConfig, databases } from "../lib/appwrite";
import { useAuth } from "../context/AuthContext";
import { Query } from "react-native-appwrite";
import { Ionicons } from "@expo/vector-icons";
import Toast from 'react-native-toast-message';

const Chat = ({ route, navigation }) => {
  const { full_name, profileImage, projectId, receiverId } = route.params;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [selectedMessage, setSelectedMessage] = useState(null);
  const { userData } = useAuth();
  const flatListRef = useRef();
  const [showMenu, setShowMenu] = useState(false);
  const [deadlineTimer, setDeadlineTimer] = useState("");
  const [characterLimit, setCharacterLimit] = useState(0);
  const [projectStatus, setProjectStatus] = useState("pending");
  const [job, setJob] = useState(null);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedReportReason, setSelectedReportReason] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isStar, setIsStar] = useState(false)


  const [timeLeft, setTimeLeft] = useState("00D 00H 00M 00S");

  const handleError = (message) => {
    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: message,
    });
  };

  const handleSuccess = (message) => {
    Toast.show({
      type: 'success',
      text1: 'Success',
      text2: message,
    });
  };

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        const response = await databases.getDocument(
          appwriteConfig.databaseId,
          appwriteConfig.jobCollectionID,
          projectId
        );
        setJob(response);
      } catch (err) {
        handleError("Error fetching project details")
      } finally {
        setLoading(false);
      }
    };

    fetchProjectDetails();
  }, [projectId, characterLimit]);

  useEffect(() => {
    const timer = setInterval(() => {
      const deadline = new Date(job?.deadline);

      const now = new Date();
      const diff = deadline - now;

      if (diff <= 0) {
        setTimeLeft("00d 00h 00m 00s");
        clearInterval(timer);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(timer);
  }, [characterLimit, job]);

  useEffect(() => {
    const calculateTotalCharacters = () => {
      const totalCharacters = messages
        .filter((message) => message.sender === userData.$id) // Filter messages sent by the current user
        .reduce((sum, message) => sum + (message.text?.length || 0), 0); // Sum up the character lengths

      // Set the remaining character limit
      const maxCharacters = 200; // Maximum allowed characters
      setCharacterLimit(Math.max(maxCharacters - totalCharacters, 0)); // Ensure limit doesn't go negative
    };

    calculateTotalCharacters();
  }, [messages, userData.$id]);


  // Fetch messages with polling
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.messageCollectionID,
          [
            Query.or([
              Query.and([
                Query.equal("sender", userData.$id),
                Query.equal("receiver", receiverId),
                Query.equal("projectId", projectId),
              ]),
              Query.and([
                Query.equal("sender", receiverId),
                Query.equal("receiver", userData.$id),
                Query.equal("projectId", projectId),
              ]),
            ]),
          ]
        );

        // Sort messages by timestamp
        const sortedMessages = response.documents.sort(
          (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
        );
        setMessages(sortedMessages);
      } catch (err) {
        handleError("Please connect to the network")
      }
    };

    // Initial fetch
    fetchMessages();

    // Polling every 2 seconds
    const interval = setInterval(() => {
      fetchMessages();
    }, 1000);

    // Cleanup on unmount
    return () => clearInterval(interval);
  }, [receiverId, userData.$id]);

  useEffect(() => {
    const fetchBlockedData = async () => {
      try {
        const documents = await databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.blockedAndStarDataCollectionId,
          [
            Query.equal("currentUserId", userData.$id),
            Query.equal("oppositeUserId", receiverId),
            Query.equal("projectId", projectId),
            Query.equal("statusValue", "blocked"),
          ]
        );

        if (documents.total > 0) {
          setIsBlocked(true);
        }
      } catch (error) {
        handleError("Failed to unblock the user.");
      }
    }

    const fetchStarUnstarData = async () => {
      try {
        const documents = await databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.blockedAndStarDataCollectionId,
          [
            Query.equal("currentUserId", userData.$id),
            Query.equal("oppositeUserId", receiverId),
            Query.equal("projectId", projectId),
            Query.equal("statusValue", "star"),
          ]
        );

        if (documents.total > 0) {
          setIsStar(true);
        }
      } catch (error) {
        handleError("Failed to unstar the chat.");
      }
    }

    fetchBlockedData();
    fetchStarUnstarData();
  }, [receiverId, userData.$id])

  // Scroll to bottom whenever messages are updated
  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  // Send a new message
  const sendMessage = async () => {
    if (input.trim()) {
      try {
        const newMessage = await databases.createDocument(
          appwriteConfig.databaseId,
          appwriteConfig.messageCollectionID,
          "unique()",
          {
            text: input,
            sender: userData.$id,
            receiver: receiverId,
            projectId: projectId,
            timestamp: new Date().toISOString(),
          }
        );
        setMessages((prev) => [...prev, newMessage]);
        setInput("");
      } catch (err) {
        Alert.alert("Error sending message:", err)
      }
    }
  };

  // Delete message
  const deleteMessage = async (messageId) => {
    try {
      await databases.deleteDocument(
        appwriteConfig.databaseId,
        appwriteConfig.messageCollectionID,
        messageId
      );
      setMessages((prevMessages) =>
        prevMessages.filter((message) => message.$id !== messageId)
      );
      setSelectedMessage(null); // Close modal after deletion
    } catch (err) {
      Alert.alert("Error deleting message:", err)
    }
  };

  const handleAccept = async () => {
    try {
      const jobDoc = await databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.jobCollectionID,
        projectId
      );

      const projectBudget = jobDoc?.budget;

      const walletBalance = parseFloat(userData?.wallet || 0.0);

      const requiredAmount = projectBudget + projectBudget * 0.10;

      if (walletBalance < requiredAmount) {
        const additionalAmount = projectBudget * 0.10;
        Alert.alert(
          "Balance is insufficient",
          `Please add at least ₹${requiredAmount.toFixed(2)} to your wallet. This includes the project budget of ₹${projectBudget.toFixed(2)} and an additional 10% of ₹${additionalAmount.toFixed(2)}.`
        );
        navigation.navigate('Tabs', {
          screen: 'Profile',
          params: {
            screen: 'Payment',
          },
        });
        return;
      }

      await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.jobCollectionID,
        projectId,
        { assigned_freelancer: receiverId }
      );

      const freelancer = await databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.freelancerCollectionId,
        receiverId
      );

      const updatedAssignedJobs = freelancer.assigned_jobs
        ? [...freelancer.assigned_jobs, projectId]
        : [projectId];

      await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.freelancerCollectionId,
        receiverId,
        { assigned_jobs: updatedAssignedJobs }
      );

      const updatedWalletBalance = walletBalance - requiredAmount;

      await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.clientCollectionId,
        userData?.$id,
        { wallet: updatedWalletBalance }
      );

      await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.paymentHistoryCollectionId,
        'unique()',
        {
          userId: userData?.$id,
          paymentId: projectId,
          amount: requiredAmount,
          status: 'Paid',
          date: new Date().toISOString(),
        }
      );

      setCharacterLimit(null);
    } catch (err) {
      Alert.alert("Error accepting project")
    }
  };


  const handleReject = async () => {
    try {
      const jobId = projectId;
      const freelancerId = receiverId;

      // Fetch the job document
      const jobDoc = await databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.jobCollectionID,
        jobId
      );



      let updatedFreelancers = jobDoc.applied_freelancer;

      updatedFreelancers = updatedFreelancers.filter(id => id !== freelancerId);


      await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.jobCollectionID,
        jobId,
        {
          applied_freelancer: updatedFreelancers,
          updated_at: new Date().toISOString(),
        }
      );

      Alert.alert("Job Rejected", "You have successfully rejected the application.");
      navigation.goBack()
    } catch (error) {
      Alert.alert("Error", "An error occurred while rejecting the job.");
    }
  };

  const handleBlockUnblockAction = async () => {
    if (!isBlocked) {
      // Block user
      try {
        const response = await databases.createDocument(
          appwriteConfig.databaseId,
          appwriteConfig.blockedAndStarDataCollectionId,
          "unique()",
          {
            currentUserId: userData.$id,
            oppositeUserId: receiverId,
            projectId: projectId,
            statusValue: "blocked",
          }
        );
        handleSuccess("The user has been blocked.");
        setIsBlocked(true);
      } catch (error) {
        handleError("Failed to block the user.");
      }
    } else {
      // Unblock user
      try {
        const documents = await databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.blockedAndStarDataCollectionId,
          [
            Query.equal("currentUserId", userData.$id),
            Query.equal("oppositeUserId", receiverId),
            Query.equal("projectId", projectId),
            Query.equal("statusValue", "blocked"),
          ]
        );

        if (documents.total > 0) {
          const documentId = documents.documents[0].$id;
          await databases.deleteDocument(
            appwriteConfig.databaseId,
            appwriteConfig.blockedAndStarDataCollectionId,
            documentId
          );
          handleSuccess("The user has been unblocked.");
          setIsBlocked(false);
        }
      } catch (error) {
        handleError("Failed to unblock the user.");
      }
    }
  };

  const handleStarUnstarAction = async () => {
    if (!isStar) {
      // star this chat
      try {
        const response = await databases.createDocument(
          appwriteConfig.databaseId,
          appwriteConfig.blockedAndStarDataCollectionId,
          "unique()",
          {
            currentUserId: userData.$id,
            oppositeUserId: receiverId,
            projectId: projectId,
            statusValue: "star",
          }
        );
        handleSuccess("This chat has been star.");
        setIsStar(true);
      } catch (error) {
        handleError("Failed to star the chat.");
      }
    } else {
      // Unstar chat
      try {
        const documents = await databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.blockedAndStarDataCollectionId,
          [
            Query.equal("currentUserId", userData.$id),
            Query.equal("oppositeUserId", receiverId),
            Query.equal("projectId", projectId),
            Query.equal("statusValue", "star"),
          ]
        );

        if (documents.total > 0) {
          const documentId = documents.documents[0].$id;
          await databases.deleteDocument(
            appwriteConfig.databaseId,
            appwriteConfig.blockedAndStarDataCollectionId,
            documentId
          );
          handleSuccess("This chat has been unstar");
          setIsStar(false);
        }
      } catch (error) {
        handleError("Failed to unstar the chat.");
      }
    }
  };

  const handleCancelJob = async () => {
    try {
      const jobId = projectId;
      const freelancerId = userData?.role === "freelancer" ? userData?.$id : receiverId;

      // Fetch the job document
      const jobDoc = await databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.jobCollectionID,
        jobId
      );

      const freelancerDoc = await databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.freelancerCollectionId,
        freelancerId
      );

      let updatedFreelancers = jobDoc.applied_freelancer;
      let updatedCancelJob = freelancerDoc.cancelled_jobs || [];

      updatedFreelancers = updatedFreelancers.filter(id => id !== freelancerId);

      if (!updatedCancelJob.includes(jobId)) {
        updatedCancelJob.push(jobId);
      }

      await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.jobCollectionID,
        jobId,
        {
          applied_freelancer: updatedFreelancers,
          updated_at: new Date().toISOString(),
        }
      );

      await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.freelancerCollectionId,
        freelancerId,
        {
          cancelled_jobs: updatedCancelJob,
          updated_at: new Date().toISOString(),
        }
      );

      Alert.alert("Job Cancelled", "You have successfully cancelled your application for this job.");
      navigation.goBack()
    } catch (error) {
      Alert.alert("Error", "An error occurred while cancelling the job.");
    }
  };



  const reportOptions = [
    "Bullying or unwanted contact",
    "Suicide, self-injury or eating disorders",
    "Violence, hate or exploitation",
    "Selling or promoting restricted items",
    "Nudity or sexual activity",
    "Scam, fraud or spam",
    "False information"
  ];

  const dotMapData = userData?.role === "client" && job?.assigned_freelancer === null
    ? ["Cancel this job", "Report this chat", isBlocked ? "Unblock" : "Block", "View Profile"]
    : job?.assigned_freelancer === null
      ? ["Cancel this job", "Report this chat", "View Profile"]
      : [
        "Job Details",
        "Mark Unread",
        isStar ? "Unstar" : "Star",
        "Review",
        "View Profile",
      ];



  // Handle dropdown menu actions
  const handleMenuAction = (action) => {
    switch (action) {
      case "Job Details":
        navigation.navigate("JobDetailsChat", { projectId })
        break;
      case "Mark Unread":
        Alert.alert("Marked Unread", "The chat has been marked as unread.");
        break;
      case "Review":
        navigation.navigate("ReviewGive", { receiverId })
        break;
      case "Delete":
        Alert.alert("Deleted", "The chat has been deleted.");
        break;
      case "Block":
      case "Unblock":
        handleBlockUnblockAction();
        break;
      case "Star":
      case "Unstar":
        handleStarUnstarAction();
        break;
      case "View Profile":
        navigation.navigate("ProfileScreen", { receiverId });
        break;
      case "Report this chat":
        setReportModalVisible(true);
        break;
      case "Cancel this job":
        handleCancelJob()
        break;
      default:
        break;
    }
    setShowMenu(false);
  };


  const handleReportSelect = (reason) => {
    setSelectedReportReason(reason);
    Alert.alert("Reported", `This chat has been reported for: ${reason}`);
    setReportModalVisible(false); // Close the modal after reporting
  };

  // Render individual message
  const renderMessage = ({ item }) => {
    const isCurrentUser = item.sender === userData.$id;

    // Long press handler to show delete confirmation modal
    const handleLongPress = () => {
      setSelectedMessage(item);
    };

    return (
      <TouchableOpacity
        // onLongPress={handleLongPress}
        style={[
          styles.messageContainer,
          isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage,
        ]}
      >
        <Text style={[styles.message, isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage]}>{item.text}</Text>
      </TouchableOpacity>
    );
  };

  // Modal for delete confirmation
  const renderDeleteConfirmation = () => (
    <Modal
      transparent={true}
      animationType="fade"
      visible={selectedMessage !== null}
      onRequestClose={() => setSelectedMessage(null)}
    >
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalText}>
            Are you sure you want to delete this message?
          </Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => deleteMessage(selectedMessage.$id)}
            >
              <Text style={styles.modalButtonText}>Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setSelectedMessage(null)}
            >
              <Text style={styles.modalButtonText}>No</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );


  return (
    <View style={styles.container}>

      <Modal
        visible={reportModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setReportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Report</Text>
            <Text style={styles.modalSubtitle}>
              Why are you reporting this post?
            </Text>
            <Text style={styles.modalDescription}>
              Your report is anonymous. If someone is in immediate danger, call the local emergency services - don't wait.
            </Text>
            {reportOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleReportSelect(option)}
                style={styles.optionButton}
              >
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            ))}
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <View style={styles.headerData}>
          <Text style={styles.profile}>Tap for contact details</Text>
          <Text style={styles.username}>@{full_name}</Text>
          <Text style={styles.profile}>Last online 3 hrs ago</Text>

          {userData.role === "client" ? (
            job?.assigned_freelancer === null ? (
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
                <Text style={styles.deadline}>Deadline Timer</Text>
                <View style={styles.deadlineTimerContainer}>
                  {timeLeft.split(" ").map((timePart, index) => {
                    const unit = timePart.slice(-1);
                    const value = timePart.slice(0, -1);

                    return (
                      <View key={index} style={styles.timeBox}>
                        <Text style={styles.timeText}>{value}</Text>
                        <Text style={styles.unitText}>{unit.toUpperCase()}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )
          ) : (
            <View>
              <Text style={styles.deadline}>Deadline Timer</Text>
              <View style={styles.deadlineTimerContainer}>
                {timeLeft.split(" ").map((timePart, index) => {
                  const unit = timePart.slice(-1);
                  const value = timePart.slice(0, -1);

                  return (
                    <View key={index} style={styles.timeBox}>
                      <Text style={styles.timeText}>{value}</Text>
                      <Text style={styles.unitText}>{unit.toUpperCase()}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

        </View>
        <TouchableOpacity onPress={() => setShowMenu(!showMenu)} >
          <Ionicons name="ellipsis-horizontal" size={24} color="black" />
        </TouchableOpacity>
        {showMenu && (
          // <Modal
          //   transparent={true}
          //   animationType="slide"
          //   onRequestClose={() => setShowMenu(false)}
          // >

          // </Modal>
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

      {job?.assigned_freelancer === null && (
        <View style={styles.limit}>
          <Text style={styles.limitchar}>Characters Limit: {characterLimit}/200</Text>
          <Text style={styles.limitvar}>Please accept this lead to remove the characters limit.</Text>
          {characterLimit === 0 && (
            <Text style={styles.limitvar}>
              You have reached the character limit. Please accept the project to remove the limit.
            </Text>
          )}
        </View>
      )}

      {job?.assigned_freelancer !== userData.$id && job?.assigned_freelancer !== null && userData.role === "freelancer" && (
        <View style={styles.limit}>
          <Text style={styles.limitchar}>Already assigned to someone</Text>
          {/* <Text style={styles.limitvar}>Please accept this lead to remove the characters limit.</Text>
          {characterLimit === 0 && (
            <Text style={styles.limitvar}>
              You have reached the character limit. Please accept the project to remove the limit.
            </Text>
          )} */}
        </View>
      )}

      <FlatList
        data={messages}
        ref={flatListRef}
        keyExtractor={(item) => item.$id}
        renderItem={renderMessage}
        style={styles.chatList}
        contentContainerStyle={styles.chatListContainer}
        onContentSizeChange={() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }}
      />

      {
        isBlocked && (
          <View style={styles.limit}>
            <Text style={styles.limitchar}>You have blocked this chat</Text>
          </View>
        )
      }

      {/* Input Box */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type your message..."
          maxLength={characterLimit || undefined}
          editable={!isBlocked && (characterLimit > 0)}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            isBlocked && styles.disabledButton
          ]}
          onPress={sendMessage}
          disabled={isBlocked}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>


      {/* Delete Confirmation Modal */}
      {renderDeleteConfirmation()}

      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingTop: 30 },
  header: {
    padding: 15,
    // backgroundColor: "#f4f4f4",
    alignItems: "center",
    flex: 0,
    flexDirection: "row",
    justifyContent: "space-around"
  },
  headerData: {
    // padding: 15,
    alignItems: "center",
    flex: 0,
    flexDirection: "column",
  },
  profile: { fontSize: 12, fontWeight: "400", color: "#000000" },
  username: { fontSize: 24, fontWeight: "600", color: "#5c2d91", paddingVertical: 4 },
  deadline: { fontSize: 15, fontWeight: "500", color: "#000000", paddingTop: 6, textAlign: "center" },
  lastOnline: { fontSize: 12, color: "#888" },
  deadlineTimer: { fontSize: 12, color: "#888" },
  chatList: {
    flex: 1,
    backgroundColor: "#F1F1F1",
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
    backgroundColor: "#e0e0e0", // Fallback background for images
  },
  sender: { fontWeight: "bold", color: "#5c2d91" },
  message: { marginTop: 5, color: "#000" },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#ddd",
  },
  input: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
  },
  sendButton: {
    marginLeft: 10,
    padding: 10,
    backgroundColor: "#5c2d91",
    borderRadius: 5,
  },
  sendButtonText: { color: "#fff" },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    width: 300,
    padding: 20,
    backgroundColor: "white",
    borderRadius: 10,
    alignItems: "center",
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
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
  actionButtons: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10, gap: 10, marginTop: 25 },
  acceptButton: { backgroundColor: "#4C0183", paddingHorizontal: 22, paddingVertical: 7, borderRadius: 8 },
  rejectButton: { backgroundColor: "#A00B0B", paddingHorizontal: 22, paddingVertical: 7, borderRadius: 8 },
  buttonText: { color: "#fff", textAlign: "center", fontSize: 16, fontWeight: "600", },

  limit: {
    flex: 0,
    backgroundColor: "#F1F1F1",
    marginHorizontal: 15,
    borderRadius: 10,
    paddingVertical: 20,
  },

  limitchar: {
    color: "#464646", textAlign: "center", fontSize: 12, fontWeight: "600",
  },
  limitvar: {
    color: "#464646", textAlign: "center", fontSize: 10, fontWeight: "400",
  },

  menuButton: { position: "absolute", right: 10, top: 10 },
  menuButtonText: { fontSize: 24, color: "black" },
  menuContainer: {
    position: "absolute",
    top: 100,
    right: 20,
    backgroundColor: "white",
    borderRadius: 5,
    padding: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 2334
  },
  menuItem: { paddingVertical: 10 },
  menuItemText: { fontSize: 16, color: "black" },

  deadlineTimerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 5,
  },
  timeBox: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: "#000000",
    marginHorizontal: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 4
  },
  timeText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF", // White text
  },
  unitText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF", // White text
  },

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
    backgroundColor: "#121212", // Dark background
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
  cancelButton: {
    marginTop: 20,
    backgroundColor: "red",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5
  },
  cancelText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold"
  }

});

export default Chat;