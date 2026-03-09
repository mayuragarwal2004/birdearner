import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Image,
} from "react-native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import ImageViewer from "react-native-image-zoom-viewer";
import { useAuth } from "../context/NewAuthContext";
import { useTheme } from "../context/ThemeContext";
import apiService from "../lib/apiService";

const JobDetailsChatScreen = ({ route, navigation }) => {
  const { jobId } = route.params || {};
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme] || themeStyles.light;

  // Early return if required props are missing
  if (!jobId) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Error: Job ID not provided</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            padding: 10,
            backgroundColor: currentTheme.primary,
            borderRadius: 5,
            marginTop: 10,
          }}
        >
          <Text style={{ color: "white" }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const styles = getStyles(currentTheme);

  // State management
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [flagged, setFlagged] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [images, setImages] = useState([]);

  // Fetch job details on component mount
  useEffect(() => {
    fetchJobDetails();
    checkBookmarkStatus();
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.getJobById(jobId);
      console.log("Debug - Using jobId:", jobId);
      console.log("Debug - API Response:", response);

      // Map API response fields to expected frontend fields
      const apiJob = response;
      const mappedJob = {
        title: apiJob.jobTitle,
        description: apiJob.jobDescription,
        category: apiJob.jobCategory,
        subCategory: apiJob.jobSubCategory,
        skills: apiJob.skillsRequired || [],
        deadline: apiJob.deadlineDate,
        budget: apiJob.budgetAmount,
        attached_files: apiJob.attachedFiles || [],
        status: apiJob.jobStatus,
        urgent: apiJob.isUrgent,
        client: apiJob.client
          ? {
            fullname: apiJob.client.user?.fullName,
            name: apiJob.client.companyName,
            accountType: apiJob.client.organizationType,
            location: [apiJob.client.city, apiJob.client.state]
              .filter(Boolean)
              .join(", "),
          }
          : null,
        paymentType: apiJob.budgetType,
        location: apiJob.location,
        category: apiJob.jobCategory,
        assignedFreelancer: apiJob.assignedFreelancer,
      };
      setJob(mappedJob);
      console.log("Debug - Mapped job data:", mappedJob);

      // Prepare images for modal viewer
      if (mappedJob.attached_files && mappedJob.attached_files.length > 0) {
        const imageUrls = mappedJob.attached_files.map((file) => ({
          url: file,
          props: {},
        }));
        setImages(imageUrls);
      }
    } catch (error) {
      console.error("Error fetching job details:", error);
      setError("Unable to load job details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const checkBookmarkStatus = async () => {
    try {
      const response = await apiService.isJobBookmarked(jobId);
      if (response.success) {
        setFlagged(response.data.isBookmarked);
      }
    } catch (error) {
      console.error("Error checking bookmark status:", error);
    }
  };

  const toggleFlag = async () => {
    try {
      const response = await apiService.toggleJobBookmark(jobId);

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
      console.error("Error toggling bookmark:", error);
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

  const handleGoBack = () => {
    navigation.goBack();
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={currentTheme?.primary || "#4e2587"}
        />
        <Text style={styles.loadingText}>Loading job details...</Text>
      </View>
    );
  }

  // Error state
  if (error || !job) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || "Job not found"}</Text>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
            imageUrls={images}
            enableSwipeDown={true}
            onSwipeDown={() => setModalVisible(false)}
            renderIndicator={() => null}
            renderHeader={() => (
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="arrow-back" size={24} color="#fff" />
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
                {job.title || "Job Title Not Available"}
              </Text>
            </View>
            <TouchableOpacity onPress={toggleFlag} style={styles.flagIcon}>
              <FontAwesome
                name={flagged ? "flag" : "flag-o"}
                size={24}
                color={flagged ? "#4e2587" : currentTheme.text || "#666"}
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
                {job.client.fullname || job.client.name || "Client Name"}
              </Text>
              <Text style={styles.clientType}>
                Client • {job.client.accountType || "Individual"}
              </Text>
              {job.client.location && (
                <Text style={styles.clientLocation}>
                  📍 {job.client.location}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Job Description */}
        <Text style={styles.sectionTitle}>Job Description</Text>
        <View style={styles.jobDescription}>
          <Text style={styles.descriptionText}>
            {job.description || "No description available"}
          </Text>
        </View>

        {/* Skills Required */}
        {job.skills && job.skills.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Skills Required</Text>
            <Text style={styles.skillText}>
              {Array.isArray(job.skills) ? job.skills.join(", ") : job.skills}
            </Text>
          </>
        )}

        {/* Payment Type Indicator */}
        <View style={styles.paymentTypeContainer}>
          <View style={[
            styles.paymentTypeBadge,
            job.paymentType === 'PLATFORM' ? styles.platformPayment : styles.cashPayment
          ]}>
            <FontAwesome
              name={job.paymentType === 'PLATFORM' ? 'credit-card' : 'money'}
              size={18}
              color="#FFF"
              style={styles.paymentIcon}
            />
            <Text style={styles.paymentTypeText}>
              {job.paymentType === 'PLATFORM' ? 'Platform Payment' : 'Cash Payment'}
            </Text>
          </View>
        </View>

        {/* Job Details Grid */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.sectionTitle}>Budget</Text>
            <Text style={styles.detailValue}>{formatCurrency(job.budget)}</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.sectionTitle}>Deadline</Text>
            <Text style={styles.detailValue}>{formatDate(job.deadline)}</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.sectionTitle}>Location</Text>
            <Text style={styles.detailValue}>{job.location || "Remote"}</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.sectionTitle}>Category</Text>
            <Text style={styles.detailValue}>{job.category || "General"}</Text>
          </View>
        </View>

        {/* Status Section */}
        <View style={styles.statusSection}>
          <View style={styles.statusItem}>
            <Text style={styles.sectionTitle}>Status</Text>
            <Text
              style={[
                styles.statusValue,
                { color: getStatusColor(job.status) },
              ]}
            >
              {job.status || "Open"}
            </Text>
          </View>

          {job.urgent && (
            <View style={styles.urgentBadge}>
              <Text style={styles.urgentText}>URGENT</Text>
            </View>
          )}
        </View>

        {job.paymentType && (
          <Text style={styles.detailText}>
            <Text style={styles.boldText}>Payment Type: </Text>
            {job.paymentType}
          </Text>
        )}

        {/* Attached Files */}
        {job.attached_files && job.attached_files.length > 0 && (
          <View style={styles.attachedFilesContainer}>
            <Text style={styles.sectionTitle}>Attached Files</Text>
            <View style={styles.filePreviewContainer}>
              {job.attached_files.map((fileUri, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => openImageModal(fileUri)}
                >
                  <Image
                    source={{ uri: fileUri }}
                    style={styles.filePreview}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {job.assignedFreelancer && (
            <TouchableOpacity
              style={[styles.backActionButton, { marginBottom: 15, backgroundColor: "#4CAF50" }]}
              onPress={() => {
                navigation.navigate("ClientChat", {
                  jobId,
                  freelancer: job.assignedFreelancer,
                  receiverId: job.assignedFreelancer.userId,
                });
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="chatbubble-ellipses" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.actionButtonText}>Message Freelancer</Text>
              </View>
            </TouchableOpacity>
          )}
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
const getStyles = (currentTheme = {}) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background || "#fff",
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: currentTheme.background || "#fff",
    },
    loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: currentTheme.text || "#000",
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: currentTheme.background || "#fff",
      padding: 20,
    },
    errorText: {
      fontSize: 18,
      color: "#FF3B30",
      marginBottom: 20,
      textAlign: "center",
    },
    backButton: {
      backgroundColor: "#4e2587",
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
    },
    backButtonText: {
      color: "#fff",
      fontSize: 16,
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
    paymentTypeContainer: {
      marginBottom: 15,
      marginTop: 5,
    },
    paymentTypeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 15,
      paddingVertical: 10,
      borderRadius: 25,
      alignSelf: 'flex-start',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.15,
      shadowRadius: 3,
    },
    platformPayment: {
      backgroundColor: '#4CAF50', // Green for platform payment
    },
    cashPayment: {
      backgroundColor: '#FF9800', // Orange for cash payment
    },
    paymentTypeText: {
      color: '#FFF',
      fontSize: 15,
      fontWeight: '600',
      marginLeft: 8,
    },
    paymentIcon: {
      marginRight: 4,
    },
  });

export default JobDetailsChatScreen;
