import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
  Modal,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import apiService from "../lib/apiService";
import Toast from "react-native-toast-message";
import { useTheme } from "../context/ThemeContext";
import CashPaymentMessage from "./chat/CashPaymentMessage";
import CompletionRequestMessage from "./chat/CompletionRequestMessage";
import ReviewRequestMessage from "./chat/ReviewRequestMessage";

const MessageItem = ({ messageItem, message, isCurrentUser, media = [], onMessageUpdate, currentUserId, userRole }) => {
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme] || themeStyles.light;
  const isDark = theme === "dark";
  const [downloadingIndex, setDownloadingIndex] = useState(null);
  const [loadingImages, setLoadingImages] = useState({});
  const [fullImage, setFullImage] = useState(null); // { uri: string, name: string, index: number }
  const [revisionModalVisible, setRevisionModalVisible] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState("");
  const [submittingDecision, setSubmittingDecision] = useState(false);

  console.log({messageItem, message, isCurrentUser});

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const messageDate = new Date(timestamp);
    if (isNaN(messageDate.getTime())) return '';
    return messageDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  

  const handleDownload = async (url, index) => {
    try {
      setDownloadingIndex(index);
      await Linking.openURL(apiService.loadImageURI(url));
    } catch (error) {
      console.error("Download error:", error);
    } finally {
      setDownloadingIndex(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    if (bytes < 1024 * 1024 * 1024)
      return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB";
  };

  const getFileIcon = (mimeType) => {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("video/")) return "video-library";
    if (mimeType.startsWith("audio/")) return "audiotrack";
    if (mimeType.includes("pdf")) return "picture-as-pdf";
    if (mimeType.includes("word")) return "description";
    if (mimeType.includes("excel")) return "table-chart";
    if (mimeType.includes("zip")) return "folder-zip";
    return "insert-drive-file";
  };

  if (['cash_payment', 'completion_request', 'review_request'].includes(messageItem?.messageType)) {
    return (
      <View style={{ width: "100%", marginVertical: 4, paddingHorizontal: 2 }}>
        {messageItem?.messageType === 'cash_payment' ? (
          <CashPaymentMessage 
            message={messageItem} 
            onUpdate={onMessageUpdate}
            currentUserId={currentUserId}
            userRole={userRole}
          />
        ) : messageItem?.messageType === 'completion_request' ? (
          <CompletionRequestMessage 
            message={messageItem} 
            onUpdate={onMessageUpdate}
            currentUserId={currentUserId}
            userRole={userRole}
          />
        ) : (
          <ReviewRequestMessage
            message={messageItem}
            onReviewPress={(msg) => onMessageUpdate && onMessageUpdate('review_press', msg)}
            currentUserId={currentUserId}
            userRole={userRole}
          />
        )}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.messageContainer,
        isCurrentUser
          ? [styles.currentUserMessage, isDark && { backgroundColor: "#3A2A55" }]
          : [styles.otherUserMessage, isDark && { backgroundColor: "#1E1E2E", borderWidth: 1, borderColor: "#2D2D3F" }],
      ]}
    >
      <Modal
        animationType="slide"
        visible={!!fullImage}
        onRequestClose={() => {
          setFullImage(null);
        }}
        onBackdropPress={() => setFullImage(null)}
        onBackButtonPress={() => setFullImage(null)} // For Android back button
        style={{ margin: 0 }}
      >
        <View style={styles.fullScreenModal}>
          <Image
            source={{ uri: fullImage?.uri }}
            style={styles.fullScreenImage}
            resizeMode="contain"
          />
          <TouchableOpacity
            style={styles.downloadBtn}
            onPress={async () => {
              handleDownload(fullImage?.uri, fullImage?.index)
            }}
          >
            <MaterialIcons name="file-download" size={28} color="#fff" />
            <Text style={{ color: "#fff", marginLeft: 5 }}>Download</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {messageItem?.attachments?.length > 0 ? (
        <View>
          {/* Display caption if present */}
          {message && (
            <Text
              style={[
                styles.messageText,
                isCurrentUser
                  ? [styles.currentUserText, isDark && { color: "#FFFFFF" }]
                  : [styles.otherUserText, isDark && { color: "#E2E8F0" }],
              ]}
            >
              {message}
            </Text>
          )}
          
          {/* Display attachments */}
          {messageItem.attachments.map((attachment, index) => (
            <View key={index} style={styles.attachmentContainer}>
              {attachment.mimeType?.startsWith('image/') ? (
                // Image attachment
                <TouchableOpacity
                  onPress={() => setFullImage({ uri: attachment.url, name: attachment.name, index })}
                >
                  <Image
                    source={{ uri: attachment.url }}
                    style={styles.attachmentImage}
                    onLoadStart={() => setLoadingImages(prev => ({ ...prev, [index]: true }))}
                    onLoadEnd={() => setLoadingImages(prev => ({ ...prev, [index]: false }))}
                  />
                  {loadingImages[index] && (
                    <View style={styles.imageLoadingOverlay}>
                      <Text style={{ color: '#fff' }}>Loading...</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ) : (
                // File attachment
                <TouchableOpacity
                  style={styles.fileAttachment}
                  onPress={() => handleDownload(attachment.url, index)}
                >
                  <MaterialIcons 
                    name={getFileIcon(attachment.mimeType)} 
                    size={24} 
                    color="#3B82F6" 
                  />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.attachmentName} numberOfLines={2}>
                      {attachment.name}
                    </Text>
                    <Text style={styles.attachmentSize}>
                      {formatFileSize(attachment.size)}
                    </Text>
                  </View>
                  <MaterialIcons 
                    name={downloadingIndex === index ? "hourglass-empty" : "download"} 
                    size={20} 
                    color="#3B82F6" 
                  />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      ) : message ? (
        <Text
          style={[
            styles.messageText,
            isCurrentUser
              ? [styles.currentUserText, isDark && { color: "#FFFFFF" }]
              : [styles.otherUserText, isDark && { color: "#E2E8F0" }],
          ]}
        >
          {message}
        </Text>
      ) : null}

      {/* Work Submission Card & Decision Actions for Remote Jobs */}
      {(() => {
        let msgData = {};
        try {
          if (messageItem?.messageData) {
            msgData = typeof messageItem.messageData === "string" ? JSON.parse(messageItem.messageData) : messageItem.messageData;
          }
        } catch (e) {}

        const isWorkSubmission = msgData?.isWorkSubmission || messageItem?.messageType === 'WORK_SUBMISSION' || msgData?.submissionStatus;
        const submissionStatus = msgData?.submissionStatus || 'PENDING';

        if (!isWorkSubmission) return null;

        // Hide previous unreviewed submission review buttons completely when superseded by newer attachments
        if (submissionStatus === 'PENDING' && (msgData.reviewControlActive === false || msgData.isLatestForVersion === false)) {
          return null;
        }

        const handleAcceptSubmission = () => {
          Alert.alert(
            "Accept Work Submission",
            "Are you sure you want to accept this work submission? This will complete the project and release payment to the freelancer.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Accept & Complete",
                style: "default",
                onPress: async () => {
                  try {
                    setSubmittingDecision(true);
                    await apiService.respondToWorkSubmissionMessage(messageItem.id, 'ACCEPT');
                    Toast.show({
                      type: 'success',
                      text1: 'Work Accepted',
                      text2: 'Project completed successfully!',
                    });
                    onMessageUpdate?.();
                  } catch (err) {
                    Alert.alert("Error", err.message || "Failed to accept submission");
                  } finally {
                    setSubmittingDecision(false);
                  }
                }
              }
            ]
          );
        };

        const handleConfirmRevision = async () => {
          if (!revisionNotes.trim()) {
            Alert.alert("Required", "Please enter revision details.");
            return;
          }
          try {
            setSubmittingDecision(true);
            await apiService.respondToWorkSubmissionMessage(messageItem.id, 'REVISE_REQUESTED', revisionNotes.trim());
            setRevisionModalVisible(false);
            Toast.show({
              type: 'info',
              text1: 'Revision Requested',
              text2: 'Freelancer has been notified to make changes.',
            });
            setRevisionNotes("");
            onMessageUpdate?.();
          } catch (err) {
            Alert.alert("Error", err.message || "Failed to request revision");
          } finally {
            setSubmittingDecision(false);
          }
        };

        const isClientUser = userRole?.toLowerCase() === 'client' || (!isCurrentUser && userRole?.toLowerCase() !== 'freelancer');

        return (
          <View style={styles.submissionBox}>
            <View style={styles.submissionHeaderRow}>
              <MaterialIcons name="assignment" size={16} color="#3B82F6" />
              <Text style={styles.submissionTitle}>
                Work Submission {msgData.version ? `(v${msgData.version})` : ''}
              </Text>
            </View>

            {submissionStatus === 'PENDING' ? (
              isClientUser ? (
                <View style={styles.decisionButtonRow}>
                  <TouchableOpacity
                    style={[styles.decisionBtn, styles.acceptBtn, submittingDecision && { opacity: 0.6 }]}
                    disabled={submittingDecision}
                    onPress={handleAcceptSubmission}
                  >
                    <MaterialIcons name="check-circle" size={16} color="#FFFFFF" />
                    <Text style={styles.decisionBtnText}>Accept</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.decisionBtn, styles.reviseBtn, submittingDecision && { opacity: 0.6 }]}
                    disabled={submittingDecision}
                    onPress={() => setRevisionModalVisible(true)}
                  >
                    <MaterialIcons name="edit" size={16} color="#FFFFFF" />
                    <Text style={styles.decisionBtnText}>Revise Change</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.statusBadgePending}>
                  <MaterialIcons name="hourglass-empty" size={14} color="#D97706" />
                  <Text style={styles.statusBadgePendingText}>
                    v{msgData.version || 1} - Pending Client Review
                  </Text>
                </View>
              )
            ) : submissionStatus === 'ACCEPTED' ? (
              <View style={styles.statusBadgeAccepted}>
                <MaterialIcons name="check-circle" size={14} color="#059669" />
                <Text style={styles.statusBadgeAcceptedText}>v{msgData.version || 1} Accepted & Completed</Text>
              </View>
            ) : submissionStatus === 'REVISE_REQUESTED' ? (
              <View style={styles.statusBadgeRevised}>
                <MaterialIcons name="rate-review" size={14} color="#EA580C" />
                <Text style={styles.statusBadgeRevisedText}>
                  v{msgData.version || 1} Revision Requested: {msgData.revisionNotes || 'Client requested revisions'}
                </Text>
              </View>
            ) : null}

            {/* Revision Modal */}
            <Modal
              visible={revisionModalVisible}
              transparent={true}
              animationType="fade"
              statusBarTranslucent={true}
              onRequestClose={() => {
                if (!submittingDecision) {
                  setRevisionModalVisible(false);
                  setRevisionNotes("");
                }
              }}
            >
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.modalOverlay}>
                  <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ width: "100%", alignItems: "center" }}
                  >
                    <View style={styles.revisionModalCard}>
                      <Text style={styles.revisionModalTitle}>Request Revision</Text>
                      <Text style={styles.revisionModalSub}>
                        Please describe the changes or revisions you would like the freelancer to make.
                      </Text>
                      <TextInput
                        style={styles.revisionInput}
                        multiline={true}
                        numberOfLines={4}
                        placeholder="Enter revision instructions..."
                        placeholderTextColor="#94A3B8"
                        value={revisionNotes}
                        onChangeText={setRevisionNotes}
                        autoFocus={true}
                        editable={!submittingDecision}
                      />
                      <View style={styles.revisionModalBtnRow}>
                        <TouchableOpacity
                          style={[styles.modalActionBtn, styles.cancelModalBtn]}
                          disabled={submittingDecision}
                          onPress={() => {
                            setRevisionModalVisible(false);
                            setRevisionNotes("");
                          }}
                        >
                          <Text style={styles.cancelModalBtnText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.modalActionBtn,
                            styles.submitRevisionBtn,
                            submittingDecision && { opacity: 0.6 }
                          ]}
                          disabled={submittingDecision}
                          onPress={handleConfirmRevision}
                        >
                          {submittingDecision ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <Text style={styles.submitRevisionBtnText}>Send Revision</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  </KeyboardAvoidingView>
                </View>
              </TouchableWithoutFeedback>
            </Modal>
          </View>
        );
      })()}

      {media?.length > 0 &&
        media.map((item, index) => {
          console.log({ item });
          console.log(apiService.loadImageURI(item.path));

          return (
            <View key={item.id} style={styles.mediaContainer}>
              {item.mimeType.startsWith("image/") ? (
                <View style={styles.imageWrapper}>
                  {loadingImages[item.id] && (
                    <View style={styles.imageLoader}>
                      <MaterialIcons
                        name="hourglass-empty"
                        size={30}
                        color="#888"
                      />
                      <Text style={styles.loaderText}>Loading...</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    onPress={() =>
                      setFullImage({
                        uri: apiService.loadImageURI(item.path),
                        name: item.fileName,
                        index: index,
                      })
                    }
                  >
                    <Image
                      source={{ uri: apiService.loadImageURI(item.path) }}
                      style={styles.imagePreview}
                      resizeMode="cover"
                      onLoadStart={() =>
                        setLoadingImages((prev) => ({
                          ...prev,
                          [item.id]: true,
                        }))
                      }
                      onLoadEnd={() =>
                        setLoadingImages((prev) => ({
                          ...prev,
                          [item.id]: false,
                        }))
                      }
                    />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.fileInfo}>
                  <View style={styles.fileInfoRowA}>
                    <MaterialIcons
                      name={getFileIcon(item.mimeType)}
                      size={24}
                      color={isCurrentUser ? "#333" : "#fff"}
                    />
                    <Text
                      style={[
                        styles.fileName,
                        isCurrentUser
                          ? styles.currentUserText
                          : styles.otherUserText,
                      ]}
                      numberOfLines={1}
                    >
                      {item.fileName}
                    </Text>
                  </View>
                  <View style={styles.fileInfoRowB}>
                    <Text
                      style={[
                        styles.fileSize,
                        isCurrentUser
                          ? styles.currentUserSubText
                          : styles.otherUserSubText,
                      ]}
                    >
                      {formatFileSize(item.fileSize)}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleDownload(item.path, index)}
                      disabled={downloadingIndex === index}
                      style={styles.downloadButton}
                    >
                      <MaterialIcons
                        name={
                          downloadingIndex === index
                            ? "hourglass-empty"
                            : "file-download"
                        }
                        size={24}
                        color={isCurrentUser ? "#4C0183" : "#fff"}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              <Text
                style={[
                  styles.expiryText,
                  isCurrentUser
                    ? styles.currentUserSubText
                    : styles.otherUserSubText,
                ]}
              >
                Expires in{" "}
                {Math.ceil(
                  (new Date(item.expiresAt) - new Date()) /
                    (1000 * 60 * 60 * 24)
                )}{" "}
                days
              </Text>
            </View>
          );
        })}
      
      {/* Message timestamp */}
      <Text style={[
        styles.timestamp,
        isCurrentUser 
          ? [styles.currentUserTimestamp, isDark && { color: "#C4B5FD" }]
          : [styles.otherUserTimestamp, isDark && { color: "#94A3B8" }],
      ]}>
        {formatTimestamp(messageItem?.createdAt)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    maxWidth: "80%",
    marginVertical: 5,
    padding: 10,
    borderRadius: 10,
  },
  currentUserMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#DADADA",
  },
  otherUserMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#4C0183",
  },
  messageText: {
    fontSize: 16,
  },
  currentUserText: {
    color: "#333",
  },
  otherUserText: {
    color: "#fff",
  },
  currentUserSubText: {
    color: "#666",
  },
  otherUserSubText: {
    color: "#ddd",
  },
  mediaContainer: {
    // marginTop: 10,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  fileInfo: {
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.1)",
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 4,
  },
  fileInfoRowA: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },

  fileInfoRowB: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 5,
  },
  fileDetails: {
    flex: 1,
    marginHorizontal: 10,
  },
  fileName: {
    fontSize: 14,
    fontWeight: "500",
  },
  fileSize: {
    fontSize: 12,
    marginTop: 2,
  },
  downloadButton: {
    padding: 5,
  },
  expiryText: {
    fontSize: 12,
    marginTop: 5,
    textAlign: "right",
  },
  imageWrapper: {
    width: "100%",
    height: 200,
    position: "relative",
    borderRadius: 5,
    overflow: "hidden",
  },
  imageLoader: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  loaderText: {
    marginTop: 4,
    fontSize: 12,
    color: "#666",
  },
  fullScreenModal: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenImage: {
    width: "100%",
    height: "80%",
  },
  downloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#4C0183",
    borderRadius: 6,
    marginTop: 20,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: "400",
  },
  currentUserTimestamp: {
    color: "#666",
    textAlign: "right",
  },
  otherUserTimestamp: {
    color: "#ddd",
    textAlign: "left",
  },
  attachmentContainer: {
    marginVertical: 8,
    borderRadius: 8,
    overflow: "hidden",
  },
  attachmentImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  imageLoadingOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  fileAttachment: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#3B82F6",
  },
  attachmentName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#3B82F6",
  },
  attachmentSize: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  submissionBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  submissionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  submissionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
    marginLeft: 6,
  },
  decisionButtonRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  decisionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    gap: 4,
  },
  acceptBtn: {
    backgroundColor: "#059669",
  },
  reviseBtn: {
    backgroundColor: "#D97706",
  },
  decisionBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  statusBadgePending: {
    flexDirection: "row",
    alignItems: "center",
    padding: 6,
    backgroundColor: "#FEF3C7",
    borderRadius: 6,
    gap: 4,
  },
  statusBadgePendingText: {
    fontSize: 12,
    color: "#D97706",
    fontWeight: "500",
  },
  statusBadgeSuperseded: {
    flexDirection: "row",
    alignItems: "center",
    padding: 6,
    backgroundColor: "#F1F5F9",
    borderRadius: 6,
    gap: 4,
  },
  statusBadgeSupersededText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  statusBadgeAccepted: {
    flexDirection: "row",
    alignItems: "center",
    padding: 6,
    backgroundColor: "#D1FAE5",
    borderRadius: 6,
    gap: 4,
  },
  statusBadgeAcceptedText: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "600",
  },
  statusBadgeRevised: {
    flexDirection: "row",
    alignItems: "center",
    padding: 6,
    backgroundColor: "#FFEDD5",
    borderRadius: 6,
    gap: 4,
  },
  statusBadgeRevisedText: {
    fontSize: 12,
    color: "#EA580C",
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  revisionModalCard: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  revisionModalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  revisionModalSub: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 12,
  },
  revisionInput: {
    width: "100%",
    minHeight: 80,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    padding: 10,
    textAlignVertical: "top",
    fontSize: 14,
    color: "#0F172A",
    backgroundColor: "#F8FAFC",
    marginBottom: 16,
  },
  revisionModalBtnRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  modalActionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  cancelModalBtn: {
    backgroundColor: "#F1F5F9",
  },
  cancelModalBtnText: {
    color: "#475569",
    fontWeight: "600",
    fontSize: 13,
  },
  submitRevisionBtn: {
    backgroundColor: "#D97706",
  },
  submitRevisionBtnText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 13,
  },
});

export default MessageItem;
