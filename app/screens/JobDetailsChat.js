import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  SafeAreaView,
  StatusBar,
  Platform,
} from "react-native";
import SafeSpinner from "../components/SafeSpinner";
import { Ionicons } from "@expo/vector-icons";
import ImageViewer from "react-native-image-zoom-viewer";
import { useTheme } from "../context/ThemeContext";
import apiService from "../lib/apiService";

const JobDetailsChatScreen = ({ route, navigation }) => {
  const { jobId } = route.params || {};
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme] || themeStyles.light;
  const styles = getStyles(currentTheme);

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [images, setImages] = useState([]);

  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const apiJob = await apiService.getJobById(jobId);
      setJob(apiJob);
      if (apiJob?.attachedFiles && apiJob.attachedFiles.length > 0) {
        setImages(apiJob.attachedFiles.map((file) => ({ url: file, props: {} })));
      }
    } catch (err) {
      console.error("Error fetching job details:", err);
      setError("Unable to load job details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const openImageModal = (imageUri) => {
    if (images.length > 0) {
      setModalVisible(true);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
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
    if (amount == null) return "\u20B90";
    try {
      const num = Number(amount);
      if (isNaN(num)) return `\u20B9${amount}`;
      return `\u20B9${num.toLocaleString("en-IN")}`;
    } catch (error) {
      return `\u20B9${amount}`;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "open": return "#22C55E";
      case "in_progress": return "#2563EB";
      case "completed": return "#22C55E";
      case "cancelled": return "#EF4444";
      case "paused": return "#F59E0B";
      default: return "#6B7280";
    }
  };

  const getStatusBg = (status) => {
    switch (status?.toLowerCase()) {
      case "open": return "#DCFCE7";
      case "in_progress": return "#EAF1FF";
      case "completed": return "#DCFCE7";
      case "cancelled": return "#FDECEC";
      case "paused": return "#FFF6DF";
      default: return "#F3F4F6";
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.topHeader}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerIconButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={22} color="#1F192F" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Job Details</Text>
          </View>
          <View style={{ width: 34 }} />
        </View>
        <View style={styles.loadingContainer}>
          <SafeSpinner size={42} color="#6B21A8" />
          <Text style={styles.loadingText}>Loading job details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !job) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.topHeader}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerIconButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={22} color="#1F192F" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Job Details</Text>
          </View>
          <View style={{ width: 34 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={38} color="#EF4444" />
          <Text style={styles.errorText}>{error || "Job not found"}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchJobDetails}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const clientName = job.client?.user?.fullName || job.client?.companyName || "Client";
  const clientType = `Client \u2022 ${job.client?.organizationType || "Individual"}`;
  const companyName = job.client?.address || job.client?.city || "";
  const clientLocation = [job.client?.city, job.client?.state].filter(Boolean).join(", ");
  const isPlatformPayment = job.budgetType === "PLATFORM";
  const isRemote = job.location?.toLowerCase() === "remote" || !job.location;
  const attachedFilesList = job.attachedFiles || job.attached_files || [];
  const filesCount = attachedFilesList.length;
  const skillsList = job.skillsRequired || job.skills || [];
  const statusText = (job.jobStatus || job.status || "OPEN").toUpperCase();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {modalVisible && images.length > 0 && (
        <Modal visible={modalVisible} transparent={true} onRequestClose={() => setModalVisible(false)}>
          <ImageViewer
            imageUrls={images.map((img) => ({
              url: typeof img.url === "string" && !img.url.startsWith("http")
                ? apiService.loadImageURI(img.url) : img.url,
            }))}
            enableSwipeDown={true}
            onSwipeDown={() => setModalVisible(false)}
            renderIndicator={() => null}
            renderHeader={() => (
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseButton}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
            )}
          />
        </Modal>
      )}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={22} color="#1F192F" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Job Details</Text>
          <Text style={styles.headerSubtitle}>{job.assignedFreelancer ? "Assigned job details" : "View posted job information"}</Text>
        </View>
        <View style={{ width: 34 }} />
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.modeBadgeContainer}>
          <View style={styles.modeBadge}>
            <Ionicons name={isRemote ? "laptop-outline" : "location"} size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.modeBadgeText}>{isRemote ? "Remote" : "On-site"}</Text>
          </View>
        </View>
        {job.client && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.iconCircle}><Ionicons name="person-outline" size={18} color="#6B21A8" /></View>
              <Text style={styles.cardHeaderTitle}>Client Information</Text>
            </View>
            <View style={styles.cardContentPadding}>
              <Text style={styles.clientNameText}>{clientName}</Text>
              <Text style={styles.clientMetaText}>{clientType}</Text>
              {(clientLocation || companyName) && (
                <View style={styles.locationPinRow}>
                  <Ionicons name="location-outline" size={14} color="#EF4444" style={{ marginRight: 4 }} />
                  <Text style={styles.companyNameText}>{clientLocation || companyName}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.iconCircle}><Ionicons name="document-text-outline" size={18} color="#6B21A8" /></View>
            <Text style={styles.cardHeaderTitle}>Job Description</Text>
          </View>
          <View style={styles.cardContentPadding}>
            <Text style={styles.jobTitleText}>{job.jobTitle || "Job Title"}</Text>
            <Text style={styles.jobDescriptionBodyText}>{job.jobDescription || job.description || "No description provided"}</Text>
            {skillsList.length > 0 && (
              <View style={styles.skillsContainer}>
                <Text style={styles.skillsLabel}>Skills:</Text>
                <Text style={styles.skillsText}>{Array.isArray(skillsList) ? skillsList.join(", ") : skillsList}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.iconCircle}><Ionicons name="wallet-outline" size={18} color="#6B21A8" /></View>
            <Text style={styles.cardHeaderTitle}>Payment Method</Text>
          </View>
          <View style={styles.cardContentPadding}>
            <View style={styles.paymentMethodRow}>
              <View style={styles.paymentIconSquare}>
                <Ionicons name={isPlatformPayment ? "shield-checkmark-outline" : "cash-outline"} size={20} color="#6B21A8" />
              </View>
              <View style={styles.paymentTextCol}>
                <Text style={styles.paymentTitle}>{isPlatformPayment ? "Platform Payment" : "Cash Payment"}</Text>
                <Text style={styles.paymentSubtitle}>{isPlatformPayment ? "Payment will be processed securely through BirdEarner" : "Payment handled directly with the client"}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.gridRow}>
          <View style={[styles.card, styles.gridCard]}>
            <View style={styles.gridCardHeader}>
              <View style={styles.smallIconCircle}><Text style={styles.rupeeIconSymbol}>{"\u20B9"}</Text></View>
              <Text style={styles.gridCardLabel}>Budget</Text>
            </View>
            <Text style={styles.gridCardValue}>{formatCurrency(job.budgetAmount || job.budget)}</Text>
          </View>
          <View style={[styles.card, styles.gridCard]}>
            <View style={styles.gridCardHeader}>
              <View style={styles.smallIconCircle}><Ionicons name="calendar-outline" size={15} color="#6B21A8" /></View>
              <Text style={styles.gridCardLabel}>Deadline</Text>
            </View>
            <Text style={styles.gridCardValue}>{formatDate(job.deadlineDate || job.deadline)}</Text>
          </View>
        </View>
        <View style={styles.gridRow}>
          <View style={[styles.card, styles.gridCard]}>
            <View style={styles.gridCardHeader}>
              <View style={styles.smallIconCircle}><Ionicons name="location-outline" size={15} color="#6B21A8" /></View>
              <Text style={styles.gridCardLabel}>Location</Text>
            </View>
            <Text style={styles.gridCardValue} numberOfLines={2}>{job.location || "Remote"}</Text>
            <Text style={styles.gridCardSubtext}>{isRemote ? "Work from anywhere" : "On-site Work"}</Text>
          </View>
          <View style={[styles.card, styles.gridCard]}>
            <View style={styles.gridCardHeader}>
              <View style={styles.smallIconCircle}><Ionicons name="pricetag-outline" size={15} color="#6B21A8" /></View>
              <Text style={styles.gridCardLabel}>Category</Text>
            </View>
            <Text style={styles.gridCardValue} numberOfLines={1}>{job.jobCategory || job.category || "General"}</Text>
            <Text style={styles.gridCardSubtext} numberOfLines={1}>{job.jobSubCategory || "Design & Creative"}</Text>
          </View>
        </View>

        <TouchableOpacity activeOpacity={0.7} onPress={() => { if (filesCount > 0) openImageModal(); else Alert.alert("No Attachments", "No files are attached to this job."); }} style={styles.card}>
          <View style={styles.attachmentsRow}>
            <View style={styles.attachmentsLeft}>
              <View style={styles.iconCircle}><Ionicons name="attach-outline" size={18} color="#6B21A8" /></View>
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.attachmentsTitle}>View Attachments</Text>
                <Text style={styles.attachmentsSubtext}>{filesCount > 0 ? `${filesCount} file${filesCount > 1 ? "s" : ""} attached` : "No files attached"}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#6B21A8" />
          </View>
        </TouchableOpacity>

        <View style={styles.card}>
          <View style={styles.statusCardRow}>
            <View style={styles.iconCircle}><Ionicons name="checkmark-circle-outline" size={20} color="#6B21A8" /></View>
            <View style={styles.statusContentCol}>
              <Text style={styles.statusLabelText}>Status</Text>
              <View style={styles.statusBadgeRow}>
                <View style={[styles.statusPill, { backgroundColor: getStatusBg(job.jobStatus || job.status) }]}>
                  <Text style={[styles.statusPillText, { color: getStatusColor(job.jobStatus || job.status) }]}>{statusText}</Text>
                </View>
              </View>
            </View>
            {job.isUrgent && (<View style={styles.urgentBadge}><Text style={styles.urgentText}>URGENT</Text></View>)}
          </View>
        </View>

        <View style={styles.actionsContainer}>
          {job.assignedFreelancer && (
            <TouchableOpacity style={styles.primaryMessageButton} onPress={() => { navigation.navigate("ClientChat", { jobId, freelancer: job.assignedFreelancer, receiverId: job.assignedFreelancer.userId }); }} activeOpacity={0.8}>
              <Ionicons name="chatbubble-ellipses" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryMessageButtonText}>Message Freelancer</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.secondaryBackButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={18} color="#6B21A8" style={{ marginRight: 8 }} />
            <Text style={styles.secondaryBackButtonText}>Back to Jobs</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (currentTheme = {}) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: "#FFFFFF", paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 10 : 0 },
    scrollView: { flex: 1, backgroundColor: "#FFFFFF" },
    scrollContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 80 },
    loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFFFF" },
    loadingText: { marginTop: 10, fontSize: 16, color: "#6B7280" },
    errorContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFFFF", padding: 20 },
    errorText: { fontSize: 16, color: "#EF4444", marginBottom: 20, textAlign: "center" },
    retryButton: { backgroundColor: "#6B21A8", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
    retryButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
    modalCloseButton: { position: "absolute", top: 50, left: 20, zIndex: 10, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 20, padding: 10 },
    topHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
    headerIconButton: { padding: 6, borderRadius: 8 },
    headerTitleContainer: { alignItems: "center", flex: 1 },
    headerTitle: { fontSize: 18, fontWeight: "700", color: "#1F192F" },
    headerSubtitle: { fontSize: 12, color: "#6B7280", marginTop: 2 },
    modeBadgeContainer: { alignItems: "center", marginVertical: 14 },
    modeBadge: { backgroundColor: "#6B21A8", paddingHorizontal: 18, paddingVertical: 6, borderRadius: 20, flexDirection: "row", alignItems: "center" },
    modeBadgeText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
    card: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: "#F0EBFF", shadowColor: "#6B21A8", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 },
    cardHeaderRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
    iconCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#F3E8FF", justifyContent: "center", alignItems: "center" },
    cardHeaderTitle: { fontSize: 14, fontWeight: "700", color: "#1F192F", marginLeft: 10 },
    cardContentPadding: { paddingLeft: 42 },
    clientNameText: { fontSize: 15, fontWeight: "700", color: "#1F192F", marginBottom: 2 },
    clientMetaText: { fontSize: 12, color: "#6B7280", marginBottom: 4 },
    locationPinRow: { flexDirection: "row", alignItems: "center" },
    companyNameText: { fontSize: 12, color: "#6B7280" },
    jobTitleText: { fontSize: 16, fontWeight: "700", color: "#1F192F", marginBottom: 6 },
    jobDescriptionBodyText: { fontSize: 13, color: "#374151", lineHeight: 19 },
    skillsContainer: { marginTop: 8, flexDirection: "row", flexWrap: "wrap" },
    skillsLabel: { fontSize: 12, fontWeight: "700", color: "#6B21A8", marginRight: 4 },
    skillsText: { fontSize: 12, color: "#4B5563" },
    paymentMethodRow: { flexDirection: "row", alignItems: "center" },
    paymentIconSquare: { width: 34, height: 34, borderRadius: 10, backgroundColor: "#F3E8FF", justifyContent: "center", alignItems: "center" },
    paymentTextCol: { marginLeft: 10, flex: 1 },
    paymentTitle: { fontSize: 14, fontWeight: "700", color: "#1F192F" },
    paymentSubtitle: { fontSize: 11, color: "#6B7280", marginTop: 2 },
    gridRow: { flexDirection: "row", justifyContent: "space-between" },
    gridCard: { flex: 1, marginHorizontal: 4, padding: 12 },
    gridCardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
    smallIconCircle: { width: 26, height: 26, borderRadius: 13, backgroundColor: "#F3E8FF", justifyContent: "center", alignItems: "center" },
    rupeeIconSymbol: { fontSize: 13, fontWeight: "700", color: "#6B21A8" },
    gridCardLabel: { fontSize: 13, fontWeight: "700", color: "#1F192F", marginLeft: 8 },
    gridCardValue: { fontSize: 14, fontWeight: "700", color: "#111827", marginTop: 2 },
    gridCardSubtext: { fontSize: 11, color: "#6B7280", marginTop: 2 },
    attachmentsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    attachmentsLeft: { flexDirection: "row", alignItems: "center" },
    attachmentsTitle: { fontSize: 14, fontWeight: "700", color: "#6B21A8" },
    attachmentsSubtext: { fontSize: 11, color: "#6B7280", marginTop: 2 },
    statusCardRow: { flexDirection: "row", alignItems: "center" },
    statusContentCol: { marginLeft: 10, flex: 1 },
    statusLabelText: { fontSize: 14, fontWeight: "700", color: "#1F192F", marginBottom: 4 },
    statusBadgeRow: { flexDirection: "row", alignItems: "center" },
    statusPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    statusPillText: { fontSize: 11, fontWeight: "700" },
    urgentBadge: { backgroundColor: "#FEE2E2", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    urgentText: { fontSize: 11, fontWeight: "700", color: "#DC2626" },
    actionsContainer: { marginTop: 16, marginBottom: 40 },
    primaryMessageButton: { backgroundColor: "#008744", borderRadius: 12, paddingVertical: 14, flexDirection: "row", justifyContent: "center", alignItems: "center", marginBottom: 12 },
    primaryMessageButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
    secondaryBackButton: { backgroundColor: "#FFFFFF", borderRadius: 12, borderWidth: 1, borderColor: "#DDD6FE", paddingVertical: 14, flexDirection: "row", justifyContent: "center", alignItems: "center" },
    secondaryBackButtonText: { color: "#6B21A8", fontSize: 16, fontWeight: "700" },
  });

export default JobDetailsChatScreen;
