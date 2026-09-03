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
  Linking,
  SafeAreaView,
  StatusBar,
  Platform,
} from "react-native";
import SafeSpinner from "../components/SafeSpinner";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import ImageViewer from "react-native-image-zoom-viewer";
import { useAuth } from "../context/NewAuthContext";
import { useTheme } from "../context/ThemeContext";
import apiService from "../lib/apiService";

const JobDescriptionScreen = ({ route, navigation }) => {
  const { job } = route.params || {};
  const { userData, refreshUserData, userProfile } = useAuth();
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const isOwnJob =
    (job?.clientUserId && job?.clientUserId === userData?.id) ||
    (job?.client?.userId && job?.client?.userId === userData?.id) ||
    (job?.clientId && userData?.client?.id && job?.clientId === userData?.client?.id);

  const handleApply = async () => {
    if (isOwnJob) {
      Alert.alert(
        "Own Job",
        "This job was created by your Client profile. You cannot apply to or message on your own job post.",
        [{ text: "OK" }]
      );
      return;
    }

    try {
      setIsCheckingBalance(true);

      // Refresh user data to get the latest balance
      await refreshUserData();

      // Check if user is a freelancer and has a negative balance
      if (
        userData?.role === "FREELANCER" &&
        userProfile &&
        parseFloat(userProfile.withdrawableAmount) < 0
      ) {
        Alert.alert(
          "Outstanding Fees",
          "You have a negative balance due to unpaid platform fees. Please settle your outstanding fees before applying for new jobs.",
          [{ text: "OK" }]
        );
        return;
      }

      // Extract required params
      const jobId = job.id || job.jobId;
      const full_name =
        job.client?.user?.fullName || job.client?.companyName || "";
      const client = job.client;
      navigation.navigate("FreelancerChat", { jobId, full_name, client });
    } catch (error) {
      console.error("Error during application check:", error);
      const jobId = job?.id || job?.jobId;
      const full_name =
        job?.client?.user?.fullName || job?.client?.companyName || "";
      const client = job?.client;
      navigation.navigate("FreelancerChat", { jobId, full_name, client });
    } finally {
      setIsCheckingBalance(false);
    }
  };

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme] || themeStyles.light;
  const styles = getStyles(currentTheme);

  // State
  const [flagged, setFlagged] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [images, setImages] = useState([]);

  useEffect(() => {
    if (
      job &&
      (job.attachedFiles || job.attached_files) &&
      (job.attachedFiles || job.attached_files).length > 0
    ) {
      const files = job.attachedFiles || job.attached_files;
      const imageUrls = files.map((file) => ({ url: file, props: {} }));
      setImages(imageUrls);
    }
    if (job?.id) {
      checkBookmarkStatus();
    }
  }, [job]);

  const checkBookmarkStatus = async () => {
    try {
      const response = await apiService.isJobBookmarked(job.id);
      if (response.success) {
        setFlagged(response.data.bookmarked);
      }
    } catch (error) {
      // Silent fail
    }
  };

  const toggleFlag = async () => {
    if (!job?.id) return;
    try {
      const response = await apiService.toggleJobBookmark(job.id);
      if (response.success) {
        setFlagged(response.data.bookmarked);
        const message = response.data.bookmarked
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
    if (images.length > 0) {
      setModalVisible(true);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Feb 5, 2026";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch (error) {
      return dateString || "Date not available";
    }
  };

  const formatCurrency = (amount) => {
    if (amount == null) return "₹5,000";
    try {
      const num = Number(amount);
      if (isNaN(num)) return `₹${amount}`;
      return `₹${num.toLocaleString("en-IN")}`;
    } catch (error) {
      return `₹${amount}`;
    }
  };

  const openInMaps = () => {
    if (job?.latitude && job?.longitude) {
      const url = `https://www.google.com/maps?q=${job.latitude},${job.longitude}`;
      Linking.openURL(url).catch(() =>
        Alert.alert("Error", "Could not open maps application")
      );
    }
  };

  const handleReportJob = () => {
    Alert.alert(
      "Report Job",
      "Are you sure you want to report this job posting?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Report",
          style: "destructive",
          onPress: () => {
            Alert.alert("Thank you", "Your report has been submitted for review.");
          },
        },
      ]
    );
  };

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
            backgroundColor: currentTheme.primary || "#4e2587",
            borderRadius: 5,
          }}
        >
          <Text style={{ color: "white" }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const canApply = job.client?.user?.id !== userData?.id && !job.hasApplied;
  const pType = (job.projectType || job.jobType || "").toLowerCase();
  const loc = (job.location || "").toLowerCase();
  const isRemote = pType.includes("remote") || (loc.includes("remote") && !pType.includes("on-site"));

  const attachedFilesList = job.attachedFiles || job.attached_files || [];
  const filesCount = attachedFilesList.length;

  const isPlatformPayment = job.paymentMethod === "PLATFORM";

  const clientName =
    job.client?.user?.fullName ||
    job.client?.companyName ||
    "Client";
  const clientType = `Client • ${job.client?.organizationType || "Individual"}`;
  const companyName = job.client?.companyName || job.client?.address || "Company";

  const jobDescriptionText =
    job.jobDescription || job.description || "";

  const rawCategory = job.jobCategory || job.category || job.freelancerType || "Service";
  const subCategoryText =
    job.subcategory ||
    job.categoryDescription ||
    (rawCategory.toLowerCase().includes("household") || rawCategory.toLowerCase().includes("plumber")
      ? "Home Services"
      : "Professional Services");

  const locationText = job.location || (isRemote ? "Remote Work" : "On-site Location");
  const locationSubtext = isRemote ? "Work from anywhere" : "On-site Work";

  const statusText = (job.jobStatus || job.status || "OPEN").toUpperCase();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Image Modal */}
      {modalVisible && images.length > 0 && (
        <Modal
          visible={modalVisible}
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <ImageViewer
            imageUrls={images.map((img) => ({
              url: apiService.loadImageURI(img.url),
            }))}
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

      {/* Navigation Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={handleGoBack}
          style={styles.headerIconButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={22} color="#1F192F" />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Job Details</Text>
          <Text style={styles.headerSubtitle}>
            Review job information before applying
          </Text>
        </View>

        <TouchableOpacity
          onPress={toggleFlag}
          style={styles.headerIconButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={flagged ? "bookmark" : "bookmark-outline"}
            size={22}
            color={flagged ? "#6B21A8" : "#1F192F"}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Remote / On-site Mode Badge */}
        <View style={styles.modeBadgeContainer}>
          <View style={styles.modeBadge}>
            <Ionicons
              name={isRemote ? "laptop-outline" : "location"}
              size={15}
              color="#FFFFFF"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.modeBadgeText}>
              {isRemote ? "Remote" : "On-site"}
            </Text>
          </View>
        </View>

        {/* Card 1: Client Information */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="person-outline" size={18} color="#6B21A8" />
            </View>
            <Text style={styles.cardHeaderTitle}>Client Information</Text>
          </View>

          <View style={styles.cardContentPadding}>
            <Text style={styles.clientNameText}>{clientName}</Text>
            <Text style={styles.clientMetaText}>{clientType}</Text>
            <View style={styles.locationPinRow}>
              <Ionicons name="location-outline" size={14} color="#EF4444" style={{ marginRight: 4 }} />
              <Text style={styles.companyNameText}>{companyName}</Text>
            </View>
          </View>
        </View>

        {/* Card 2: Job Description */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="document-text-outline" size={18} color="#6B21A8" />
            </View>
            <Text style={styles.cardHeaderTitle}>Job Description</Text>
          </View>

          <View style={styles.cardContentPadding}>
            <Text style={styles.jobDescriptionBodyText}>
              {jobDescriptionText}
            </Text>

            {(job.skillsRequired && job.skillsRequired.length > 0) ||
            (job.skills && job.skills.length > 0) ? (
              <View style={styles.skillsContainer}>
                <Text style={styles.skillsLabel}>Skills:</Text>
                <Text style={styles.skillsText}>
                  {(job.skillsRequired || job.skills).join(", ")}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Card 3: Payment Method */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="wallet-outline" size={18} color="#6B21A8" />
            </View>
            <Text style={styles.cardHeaderTitle}>Payment Method</Text>
          </View>

          <View style={styles.cardContentPadding}>
            <View style={styles.paymentMethodRow}>
              <View style={styles.paymentIconSquare}>
                <Ionicons
                  name={isPlatformPayment ? "shield-checkmark-outline" : "cash-outline"}
                  size={20}
                  color="#6B21A8"
                />
              </View>
              <View style={styles.paymentTextCol}>
                <Text style={styles.paymentTitle}>
                  {isPlatformPayment ? "Platform Payment" : "Cash/Platform Payment"}
                </Text>
                <Text style={styles.paymentSubtitle}>
                  {isPlatformPayment
                    ? "You will get paid securely through BirdEarner"
                    : "You will receive payment in cash"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 2x2 Details Grid */}
        <View style={styles.gridRow}>
          {/* Budget Card */}
          <View style={[styles.card, styles.gridCard]}>
            <View style={styles.gridCardHeader}>
              <View style={styles.smallIconCircle}>
                <Text style={styles.rupeeIconSymbol}>₹</Text>
              </View>
              <Text style={styles.gridCardLabel}>Budget</Text>
            </View>
            <Text style={styles.gridCardValue}>
              {formatCurrency(job.budgetAmount || job.budget)}
            </Text>
          </View>

          {/* Deadline Card */}
          <View style={[styles.card, styles.gridCard]}>
            <View style={styles.gridCardHeader}>
              <View style={styles.smallIconCircle}>
                <Ionicons name="calendar-outline" size={15} color="#6B21A8" />
              </View>
              <Text style={styles.gridCardLabel}>Deadline</Text>
            </View>
            <Text style={styles.gridCardValue}>
              {formatDate(job.deadlineDate || job.deadline)}
            </Text>
          </View>
        </View>

        <View style={styles.gridRow}>
          {/* Location Card */}
          <TouchableOpacity
            activeOpacity={job.latitude && job.longitude ? 0.7 : 1}
            onPress={job.latitude && job.longitude ? openInMaps : null}
            style={[styles.card, styles.gridCard]}
          >
            <View style={styles.gridCardHeader}>
              <View style={styles.smallIconCircle}>
                <Ionicons name="location-outline" size={15} color="#6B21A8" />
              </View>
              <Text style={styles.gridCardLabel}>Location</Text>
            </View>
            <Text style={styles.gridCardValue} numberOfLines={2}>
              {locationText}
            </Text>
            <Text style={styles.gridCardSubtext}>{locationSubtext}</Text>
          </TouchableOpacity>

          {/* Category Card */}
          <View style={[styles.card, styles.gridCard]}>
            <View style={styles.gridCardHeader}>
              <View style={styles.smallIconCircle}>
                <Ionicons name="pricetag-outline" size={15} color="#6B21A8" />
              </View>
              <Text style={styles.gridCardLabel}>Category</Text>
            </View>
            <Text style={styles.gridCardValue} numberOfLines={1}>
              {rawCategory}
            </Text>
            <Text style={styles.gridCardSubtext} numberOfLines={1}>
              {subCategoryText}
            </Text>
          </View>
        </View>
               {/* Card 5: View Attachments */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            if (filesCount > 0) {
              openImageModal();
            } else {
              Alert.alert("No Attachments", "No files are attached to this job.");
            }
          }}
          style={styles.card}
        >
          <View style={styles.attachmentsRow}>
            <View style={styles.attachmentsLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="attach-outline" size={18} color="#6B21A8" />
              </View>
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.attachmentsTitle}>View Attachments</Text>
                <Text style={styles.attachmentsSubtext}>
                  {filesCount > 0
                    ? `${filesCount} file${filesCount > 1 ? "s" : ""} attached`
                    : "No files attached"}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#6B21A8" />
          </View>
        </TouchableOpacity>

        {/* Card 6: Status */}
        <View style={styles.card}>
          <View style={styles.statusCardRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#6B21A8" />
            </View>

            <View style={styles.statusContentCol}>
              <Text style={styles.statusLabelText}>Status</Text>
              <View style={styles.statusBadgeRow}>
                <View style={styles.statusPill}>
                  <Text style={styles.statusPillText}>{statusText}</Text>
                </View>
                <Text style={styles.statusNoticeText}>
                  This job is accepting applications
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {isOwnJob && (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#F3E8FF',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 12,
              marginBottom: 12,
            }}>
              <Ionicons name="information-circle" size={20} color="#7E22CE" style={{ marginRight: 8 }} />
              <Text style={{ flex: 1, fontSize: 13, color: "#6B21A8", fontWeight: "500", lineHeight: 18 }}>
                This job was posted by your Client profile. You cannot apply to or message on your own job.
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.primaryApplyButton,
              { opacity: canApply && !isCheckingBalance && !isOwnJob ? 1 : 0.5 },
              job.hasApplied && { backgroundColor: '#10B981' },
              isOwnJob && { backgroundColor: '#6B7280' },
            ]}
            onPress={handleApply}
            disabled={!canApply || isCheckingBalance || isOwnJob}
            activeOpacity={0.8}
          >
            {isCheckingBalance ? (
              <SafeSpinner size={22} color="#FFFFFF" />
            ) : (
              <>
                <Ionicons
                  name={isOwnJob ? "lock-closed" : (job.hasApplied ? "checkmark-circle" : "paper-plane")}
                  size={18}
                  color="#FFFFFF"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.primaryApplyButtonText}>
                  {isOwnJob ? "Created by Your Client Profile" : (job.hasApplied ? "Already Applied" : "Apply for Job")}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryReportButton}
            onPress={handleReportJob}
            activeOpacity={0.8}
          >
            <Ionicons
              name="alert-circle-outline"
              size={18}
              color="#DC2626"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.secondaryReportButtonText}>Report this Job</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Styles
const getStyles = (currentTheme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: "#FFFFFF",
      paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 10 : 0,
    },
    scrollView: {
      flex: 1,
      backgroundColor: "#FFFFFF",
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 80,
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
    topHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: "#FFFFFF",
      borderBottomWidth: 1,
      borderBottomColor: "#F3F4F6",
    },
    headerIconButton: {
      padding: 6,
      borderRadius: 8,
    },
    headerTitleContainer: {
      alignItems: "center",
      flex: 1,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: "#1F192F",
    },
    headerSubtitle: {
      fontSize: 12,
      color: "#6B7280",
      marginTop: 2,
    },
    modeBadgeContainer: {
      alignItems: "center",
      marginVertical: 14,
    },
    modeBadge: {
      backgroundColor: "#6B21A8",
      paddingHorizontal: 18,
      paddingVertical: 6,
      borderRadius: 20,
      flexDirection: "row",
      alignItems: "center",
    },
    modeBadgeText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "600",
    },
    card: {
      backgroundColor: "#FFFFFF",
      borderRadius: 16,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: "#F0EBFF",
      shadowColor: "#6B21A8",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.03,
      shadowRadius: 6,
      elevation: 1,
    },
    cardHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    iconCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: "#F3E8FF",
      justifyContent: "center",
      alignItems: "center",
    },
    cardHeaderTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: "#1F192F",
      marginLeft: 10,
    },
    cardContentPadding: {
      paddingLeft: 42,
    },
    clientNameText: {
      fontSize: 15,
      fontWeight: "700",
      color: "#1F192F",
      marginBottom: 2,
    },
    clientMetaText: {
      fontSize: 12,
      color: "#6B7280",
      marginBottom: 4,
    },
    locationPinRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    companyNameText: {
      fontSize: 12,
      color: "#6B7280",
    },
    jobDescriptionBodyText: {
      fontSize: 13,
      color: "#374151",
      lineHeight: 19,
    },
    skillsContainer: {
      marginTop: 8,
      flexDirection: "row",
      flexWrap: "wrap",
    },
    skillsLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: "#6B21A8",
      marginRight: 4,
    },
    skillsText: {
      fontSize: 12,
      color: "#4B5563",
    },
    paymentMethodRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    paymentIconSquare: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: "#F3E8FF",
      justifyContent: "center",
      alignItems: "center",
    },
    paymentTextCol: {
      marginLeft: 10,
      flex: 1,
    },
    paymentTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: "#1F192F",
    },
    paymentSubtitle: {
      fontSize: 11,
      color: "#6B7280",
      marginTop: 2,
    },
    gridRow: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    gridCard: {
      flex: 1,
      marginHorizontal: 4,
      padding: 12,
    },
    gridCardHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    smallIconCircle: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: "#F3E8FF",
      justifyContent: "center",
      alignItems: "center",
    },
    rupeeIconSymbol: {
      fontSize: 13,
      fontWeight: "700",
      color: "#6B21A8",
    },
    gridCardLabel: {
      fontSize: 13,
      fontWeight: "700",
      color: "#1F192F",
      marginLeft: 8,
    },
    gridCardValue: {
      fontSize: 14,
      fontWeight: "700",
      color: "#111827",
      marginTop: 2,
    },
    gridCardSubtext: {
      fontSize: 11,
      color: "#6B7280",
      marginTop: 2,
    },
    attachmentsRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    attachmentsLeft: {
      flexDirection: "row",
      alignItems: "center",
    },
    attachmentsTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: "#6B21A8",
    },
    attachmentsSubtext: {
      fontSize: 11,
      color: "#6B7280",
      marginTop: 2,
    },
    statusCardRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    statusContentCol: {
      marginLeft: 10,
      flex: 1,
    },
    statusLabelText: {
      fontSize: 14,
      fontWeight: "700",
      color: "#1F192F",
      marginBottom: 4,
    },
    statusBadgeRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    statusPill: {
      backgroundColor: "#DCFCE7",
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
      marginRight: 8,
    },
    statusPillText: {
      fontSize: 11,
      fontWeight: "700",
      color: "#166534",
    },
    statusNoticeText: {
      fontSize: 11,
      color: "#6B7280",
    },
    actionsContainer: {
      marginTop: 16,
      marginBottom: 40,
    },
    primaryApplyButton: {
      backgroundColor: "#008744",
      borderRadius: 12,
      paddingVertical: 14,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 12,
    },
    primaryApplyButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "700",
    },
    secondaryReportButton: {
      backgroundColor: "#FFFFFF",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#FCA5A5",
      paddingVertical: 14,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
    },
    secondaryReportButtonText: {
      color: "#DC2626",
      fontSize: 16,
      fontWeight: "700",
    },
  });

export default JobDescriptionScreen;

