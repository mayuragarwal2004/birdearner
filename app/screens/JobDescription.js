const handleGoBack = () => {
  navigation.goBack();
};

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import ImageViewer from "react-native-image-zoom-viewer";
import { useAuth } from "../context/NewAuthContext";
import { useTheme } from "../context/ThemeContext";
import apiService from "../lib/apiService";

const JobDescriptionScreen = ({ route, navigation }) => {
  // Handler for Apply button
  const { job } = route.params || {};
  const handleApply = () => {
    // Extract required params
    const projectId = job.id || job._id || job.projectId;
    const full_name = job.client?.user?.fullName || job.client?.companyName || "";
    const client = job.client;
    navigation.navigate("FreelancerChat", { projectId, full_name, client });
  };
  console.log("Job data received:", job);
  
  // Defensive fallback for missing job
  if (!job) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: currentTheme.background || "#fff",
        }}
      >
        <Text style={{ fontSize: 18, color: "#FF3B30", marginBottom: 10 }}>
          Error: Job data not provided
        </Text>
        <TouchableOpacity
          onPress={handleGoBack}
          style={{
            padding: 10,
            backgroundColor: currentTheme.primary,
            borderRadius: 5,
          }}
        >
          <Text style={{ color: "white" }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { user } = useAuth();
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme] || themeStyles.light;
  const styles = getStyles(currentTheme);

  // State
  const [flagged, setFlagged] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [images, setImages] = useState([]);

  useEffect(() => {
    // Prepare images for modal viewer
    if (
      job &&
      (job.attachedFiles || job.attached_files) &&
      (job.attachedFiles || job.attached_files).length > 0
    ) {
      const files = job.attachedFiles || job.attached_files;
      const imageUrls = files.map((file) => ({ url: file, props: {} }));
      setImages(imageUrls);
    }
    checkBookmarkStatus();
  }, [job]);

  const checkBookmarkStatus = async () => {
    try {
      const response = await apiService.isJobBookmarked(job.id);
      if (response.success) {
        setFlagged(response.data.isBookmarked);
      }
    } catch (error) {
      // Silent fail
    }
  };

  const toggleFlag = async () => {
    try {
      const response = await apiService.toggleJobBookmark(job.id);
      if (response.success) {
        setFlagged(response.data.isBookmarked);
        const message = response.data.isBookmarked
          ? "Job bookmarked successfully!"
          : "Bookmark removed successfully!";
        Alert.alert("Success", message);
      } else {
        Alert.alert("Error", response.message || "Failed to update bookmark");
      }
    } catch (error) {
      Alert.alert("Error", "Unable to update bookmark. Please try again.");
    }
  };

  const openImageModal = (imageUri) => {
    const imageIndex = images.findIndex((img) => img.url === imageUri);
    if (imageIndex !== -1) {
      setModalVisible(true);
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      return "Date not available";
    }
  };

  const formatCurrency = (amount) => {
    try {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
      }).format(amount);
    } catch (error) {
      return `Rs. ${amount}/-`;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "open":
        return "#34C759";
      case "in_progress":
        return "#007AFF";
      case "completed":
        return "#32D74B";
      case "cancelled":
        return "#FF3B30";
      case "paused":
        return "#FF9500";
      default:
        return "#8E8E93";
    }
  };

  return (
    <View style={styles.container}>
      {/* Image Modal */}
      {modalVisible && images.length > 0 && (
        <Modal
          visible={modalVisible}
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <ImageViewer
            imageUrls={images.map((img) => ({ url: apiService.loadImageURI(img.url) }))}
            enableSwipeDown={true}
            onSwipeDown={() => setModalVisible(false)}
            renderIndicator={() => null}
            renderHeader={() => (
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <FontAwesome name="arrow-left" size={24} color="#fff" />
              </TouchableOpacity>
            )}
          />
        </Modal>
      )}

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Job Header */}
        <View style={styles.jobHeader}>
          <View style={styles.jobInfo}>
            <View style={styles.jobTitlebar}>
              <Text style={styles.jobTitle}>
                {job.jobTitle || job.title || "Job Title Not Available"}
              </Text>
            </View>
            <TouchableOpacity onPress={toggleFlag} style={styles.flagIcon}>
              <FontAwesome
                name={flagged ? "flag" : "flag-o"}
                size={24}
                color={
                  flagged ? currentTheme.primary : currentTheme.text || "#666"
                }
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Client Information */}
        {job.client && (
          <View style={styles.clientSection}>
            <Text style={styles.sectionTitle}>Client Information</Text>
            <View style={styles.clientInfo}>
              <Text style={styles.clientName}>
                {job.client.user?.fullName ||
                  job.client.companyName ||
                  "Client Name"}
              </Text>
              <Text style={styles.clientType}>
                Client • {job.client.organizationType || "Individual"}
              </Text>
              {job.client.companyName && (
                <Text style={styles.clientLocation}>
                  📍 {job.client.companyName}
                </Text>
              )}
              {job.client.user?.email && (
                <Text style={styles.clientLocation}>
                  Email: {job.client.user?.email}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Job Description */}
        <Text style={styles.sectionTitle}>Job Description</Text>
        <View style={styles.jobDescription}>
          <Text style={styles.descriptionText}>
            {job.jobDescription ||
              job.description ||
              "No description available"}
          </Text>
        </View>

        {/* Skills Required */}
        {(job.skillsRequired && job.skillsRequired.length > 0) ||
        (job.skills && job.skills.length > 0) ? (
          <>
            <Text style={styles.sectionTitle}>Skills Required</Text>
            <Text style={styles.skillText}>
              {(job.skillsRequired || job.skills).join(", ")}
            </Text>
          </>
        ) : null}

        {/* Job Details Grid */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Budget</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(job.budgetAmount || job.budget)}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Deadline</Text>
            <Text style={styles.detailValue}>
              {formatDate(job.deadlineDate || job.deadline)}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Location</Text>
            <Text style={styles.detailValue}>
              {job.location || job.projectType || "Remote"}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Category</Text>
            <Text style={styles.detailValue}>
              {job.jobCategory || job.category || "General"}
            </Text>
          </View>
        </View>

        {/* Status Section */}
        <View style={styles.statusSection}>
          <View style={styles.statusItem}>
            <Text style={styles.sectionTitle}>Status</Text>
            <Text
              style={[
                styles.statusValue,
                { color: getStatusColor(job.jobStatus || job.status) },
              ]}
            >
              {job.jobStatus || job.status || "Open"}
            </Text>
          </View>
          {(job.urgent || job.isUrgent) && (
            <View style={styles.urgentBadge}>
              <Text style={styles.urgentText}>URGENT</Text>
            </View>
          )}
        </View>

        {/* Additional Details */}
        {job.experienceLevel && (
          <Text style={styles.detailText}>
            <Text style={styles.boldText}>Experience Level: </Text>
            {job.experienceLevel}
          </Text>
        )}
        {job.projectDuration && (
          <Text style={styles.detailText}>
            <Text style={styles.boldText}>Project Duration: </Text>
            {job.projectDuration}
          </Text>
        )}
        {job.budgetType && (
          <Text style={styles.detailText}>
            <Text style={styles.boldText}>Payment Type: </Text>
            {job.budgetType}
          </Text>
        )}

        {/* Attached Files */}
        {(job.attachedFiles || job.attached_files) &&
          (job.attachedFiles || job.attached_files).length > 0 && (
            <View style={styles.attachedFilesContainer}>
              <Text style={styles.sectionTitle}>Attached Files</Text>
              <View style={styles.filePreviewContainer}>
                {(job.attachedFiles || job.attached_files).map(
                  (fileUri, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => openImageModal(fileUri)}
                    >
                      <Image
                        source={{
                          uri: apiService.loadImageURI(fileUri)
                        }}
                        style={styles.filePreview}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  )
                )}
              </View>
            </View>
          )}

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.applyActionButton}
            onPress={handleApply}
          >
            <Text style={styles.actionButtonText}>Apply for Job</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backActionButton}
            onPress={handleGoBack}
          >
            <Text style={styles.actionButtonText}>Back to Jobs</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

// Styles
const getStyles = (currentTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background || "#fff",
    },
    scrollContent: {
      padding: 20,
      paddingTop: 50,
    },
    modalCloseButton: {
      position: "absolute",
      top: 50,
      left: 20,
      zIndex: 10,
      backgroundColor: "rgba(0,0,0,0.5)",
      borderRadius: 20,
      padding: 10,
    },
    jobHeader: {
      marginBottom: 25,
    },
    jobInfo: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    jobTitlebar: {
      flex: 1,
      paddingRight: 15,
    },
    jobTitle: {
      fontSize: 22,
      fontWeight: "bold",
      color: currentTheme.primary || "#4e2587",
      marginBottom: 8,
      lineHeight: 28,
    },
    flagIcon: {
      padding: 5,
    },
    clientSection: {
      backgroundColor: currentTheme.cardBackground || "#f9f9f9",
      padding: 15,
      borderRadius: 12,
      marginBottom: 20,
    },
    clientInfo: {
      marginTop: 5,
    },
    clientName: {
      fontSize: 16,
      fontWeight: "600",
      color: currentTheme.text || "#000",
      marginBottom: 3,
    },
    clientType: {
      fontSize: 14,
      color: "#666",
      marginBottom: 2,
    },
    clientLocation: {
      fontSize: 14,
      color: "#666",
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: currentTheme.text || "#000",
      marginBottom: 8,
      marginTop: 20,
    },
    jobDescription: {
      backgroundColor: currentTheme.cardBackground || "#f9f9f9",
      padding: 15,
      borderRadius: 12,
      marginBottom: 10,
    },
    descriptionText: {
      fontSize: 15,
      color: currentTheme.text || "#333",
      lineHeight: 22,
    },
    skillText: {
      fontSize: 15,
      color: "#4e2587",
      fontWeight: "500",
      marginBottom: 10,
      lineHeight: 20,
    },
    detailsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      marginVertical: 15,
    },
    detailItem: {
      width: "48%",
      backgroundColor: currentTheme.cardBackground || "#f9f9f9",
      padding: 12,
      borderRadius: 8,
      marginBottom: 10,
    },
    detailLabel: {
      fontSize: 16,
      fontWeight: "bold",
      color: currentTheme.text || "#000",
      marginBottom: 4,
    },
    detailValue: {
      fontSize: 14,
      color: currentTheme.text || "#666",
      marginTop: 2,
    },
    detailText: {
      fontSize: 15,
      color: currentTheme.text || "#666",
      marginBottom: 10,
      lineHeight: 20,
    },
    boldText: {
      fontWeight: "bold",
      color: currentTheme.text || "#000",
    },
    statusSection: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: currentTheme.cardBackground || "#f9f9f9",
      padding: 15,
      borderRadius: 12,
      marginVertical: 15,
    },
    statusItem: {
      flex: 1,
    },
    statusValue: {
      fontSize: 14,
      fontWeight: "600",
      marginTop: 2,
    },
    urgentBadge: {
      backgroundColor: "#FF3B30",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 15,
    },
    urgentText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "bold",
    },
    attachedFilesContainer: {
      marginTop: 20,
      marginBottom: 30,
    },
    filePreviewContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "flex-start",
      marginTop: 10,
    },
    filePreview: {
      width: 100,
      height: 100,
      backgroundColor: "#ccc",
      borderRadius: 8,
      marginRight: 10,
      marginBottom: 10,
    },
    actionContainer: {
      marginTop: 30,
      marginBottom: 20,
      alignItems: "center",
    },
    applyActionButton: {
      backgroundColor: "#00871E",
      paddingHorizontal: 30,
      paddingVertical: 12,
      borderRadius: 25,
      minWidth: 150,
      alignItems: "center",
      marginBottom: 15,
    },
    backActionButton: {
      backgroundColor: "#4e2587",
      paddingHorizontal: 30,
      paddingVertical: 12,
      borderRadius: 25,
      minWidth: 150,
      alignItems: "center",
    },
    actionButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
  });

export default JobDescriptionScreen;
