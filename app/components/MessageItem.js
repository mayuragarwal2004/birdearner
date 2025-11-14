import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import apiService from "../lib/apiService";
import { Modal } from "react-native";
import CashPaymentMessage from "./chat/CashPaymentMessage";

const MessageItem = ({ messageItem, message, isCurrentUser, media = [], onMessageUpdate, currentUserId, userRole }) => {
  const [downloadingIndex, setDownloadingIndex] = useState(null);
  const [loadingImages, setLoadingImages] = useState({});
  const [fullImage, setFullImage] = useState(null); // { uri: string, name: string, index: number }

  console.log({messageItem, message, isCurrentUser});
  

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

  return (
    <View
      style={[
        styles.messageContainer,
        isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage,
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

      {messageItem?.messageType === 'cash_payment' ? (
        <CashPaymentMessage 
          message={messageItem} 
          onUpdate={onMessageUpdate}
          currentUserId={currentUserId}
          userRole={userRole}
        />
      ) : message && (
        <Text
          style={[
            styles.messageText,
            isCurrentUser ? styles.currentUserText : styles.otherUserText,
          ]}
        >
          {message}
        </Text>
      )}

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
});

export default MessageItem;
