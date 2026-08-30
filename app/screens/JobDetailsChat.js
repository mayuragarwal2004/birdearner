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
  TextInput,
  ActivityIndicator,
} from "react-native";
import SafeSpinner from "../components/SafeSpinner";
import { Ionicons } from "@expo/vector-icons";
import ImageViewer from "react-native-image-zoom-viewer";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/NewAuthContext";
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
  const [otpInput, setOtpInput] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [disputeModalVisible, setDisputeModalVisible] = useState(false);
  const [disputeReasonText, setDisputeReasonText] = useState("");
  const [selectedDisputeChip, setSelectedDisputeChip] = useState("Work not completed as agreed");

  const disputeReasonChips = [
    "Work not completed as agreed",
    "Client refusing cash payment",
    "Freelancer asked for extra money",
    "Work quality or scope mismatch",
    "Freelancer failed to show up / delayed",
    "Other issue",
  ];

  const { userData } = useAuth();
  const isClient = userData?.userType === "CLIENT" || userData?.client?.id === job?.client?.id;

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

  const handlePhysicalProgress = async (action, extraPayload = {}) => {
    try {
      setActionLoading(true);
      const payload = typeof extraPayload === 'string' ? { otpCode: extraPayload } : extraPayload;
      const res = await apiService.updatePhysicalJobProgress(job.id, action, payload);
      Alert.alert("Success", `Status updated: ${action}`);
      if (res) setJob({ ...job, ...res });
      setOtpInput("");
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to update progress");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmRaiseDispute = async () => {
    const finalReason = disputeReasonText.trim() || selectedDisputeChip;
    if (!finalReason) {
      Alert.alert("Reason Required", "Please select or type a reason for raising the dispute.");
      return;
    }
    try {
      setActionLoading(true);
      setDisputeModalVisible(false);
      const res = await apiService.updatePhysicalJobProgress(job.id, "RAISE_DISPUTE", { reason: finalReason });
      Alert.alert("Dispute Raised", "Your dispute has been submitted to support for review.");
      if (res) setJob({ ...job, ...res });
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to raise dispute");
    } finally {
      setActionLoading(false);
    }
  };

  const handleExtendDeadline = async () => {
    try {
      setActionLoading(true);
      await apiService.extendApplicationDeadline(job.id);
      Alert.alert("Success", "Application deadline extended by 24 hours.");
      fetchJobDetails();
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to extend deadline");
    } finally {
      setActionLoading(false);
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
    switch (status?.toUpperCase()) {
      case "OPEN": return "#22C55E";
      case "CONFIRMED": return "#3B82F6";
      case "FREELANCER_TRAVELLING": return "#F59E0B";
      case "ARRIVED": return "#F59E0B";
      case "JOB_STARTED": return "#6B21A8";
      case "WORK_ACCEPTED": return "#22C55E";
      case "COMPLETED": return "#22C55E";
      case "WORK_SUBMITTED": return "#3B82F6";
      case "AUTO_ACCEPTED": return "#22C55E";
      case "DISPUTE_RESOLVED": return "#22C55E";
      case "CANCELLED_BY_CLIENT":
      case "CANCELLED_BY_FREELANCER":
      case "CANCELLED":
      case "CANCELLED_SCOPE_MISMATCH":
      case "REFUNDED": return "#EF4444";
      case "EXPIRED":
      case "DEADLINE_EXPIRED": return "#EF4444";
      case "DISPUTE_OPEN": return "#EF4444";
      case "IN_PROGRESS": return "#3B82F6";
      default: return "#6B7280";
    }
  };

  const getStatusBg = (status) => {
    switch (status?.toUpperCase()) {
      case "OPEN": return "#DCFCE7";
      case "CONFIRMED": return "#EFF6FF";
      case "FREELANCER_TRAVELLING": return "#FFF7ED";
      case "ARRIVED": return "#FFF7ED";
      case "JOB_STARTED": return "#F5F3FF";
      case "WORK_ACCEPTED": return "#DCFCE7";
      case "COMPLETED": return "#DCFCE7";
      case "WORK_SUBMITTED": return "#EFF6FF";
      case "AUTO_ACCEPTED": return "#DCFCE7";
      case "DISPUTE_RESOLVED": return "#DCFCE7";
      case "CANCELLED_BY_CLIENT":
      case "CANCELLED_BY_FREELANCER":
      case "CANCELLED":
      case "CANCELLED_SCOPE_MISMATCH":
      case "REFUNDED": return "#FDECEC";
      case "EXPIRED":
      case "DEADLINE_EXPIRED": return "#FDECEC";
      case "DISPUTE_OPEN": return "#FDECEC";
      case "IN_PROGRESS": return "#EFF6FF";
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
  const pType = (job.projectType || job.jobType || "").toLowerCase();
  const loc = (job.location || "").toLowerCase();
  const isRemote = pType.includes("remote") || (loc.includes("remote") && !pType.includes("on-site"));
  const attachedFilesList = job.attachedFiles || job.attached_files || [];
  const filesCount = attachedFilesList.length;
  const skillsList = job.skillsRequired || job.skills || [];
  const rawStatus = (job.jobStatus || job.status || "OPEN").toUpperCase();
  const isCash = job.paymentMethod === "CASH" || !job.paymentMethod;
  const statusText = (rawStatus === "REFUNDED" && isCash)
    ? "CANCELLED (NO PAYMENT REQUIRED)"
    : (rawStatus === "DISPUTE_RESOLVED" && isCash)
    ? "DISPUTE RESOLVED (PAY FREELANCER IN CASH)"
    : rawStatus;

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
              <Text style={styles.gridCardLabel}>Work Duration</Text>
            </View>
            <Text style={styles.gridCardValue}>{job.workDurationDays || 1} Day{(job.workDurationDays || 1) > 1 ? "s" : ""}</Text>
            <Text style={styles.gridCardSubtext}>After booking confirmed</Text>
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
          {actionLoading && <ActivityIndicator size="large" color="#6B21A8" style={{ marginBottom: 12 }} />}

          {/* Timeline info */}
          {job.applicationDeadline && statusText === "OPEN" && (
            <View style={{ backgroundColor: "#EFF6FF", padding: 12, borderRadius: 12, marginBottom: 14 }}>
              <Text style={{ fontSize: 12, color: "#1D4ED8", fontWeight: "600" }}>
                Application Deadline: {formatDate(job.applicationDeadline)}
              </Text>
            </View>
          )}
          {job.workDeadline && (
            <View style={{ backgroundColor: "#F0FDF4", padding: 12, borderRadius: 12, marginBottom: 14 }}>
              <Text style={{ fontSize: 12, color: "#166534", fontWeight: "600" }}>
                Work Deadline: {formatDate(job.workDeadline)} ({job.workDurationDays || 1} Day{job.workDurationDays > 1 ? "s" : ""})
              </Text>
            </View>
          )}

          {/* OPEN Job: Client option to Extend Application Deadline (+24h) */}
          {statusText === "OPEN" && isClient && !job.applicationExtended && (
            <TouchableOpacity style={styles.primaryActionBtn} onPress={handleExtendDeadline} activeOpacity={0.8}>
              <Ionicons name="time-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryActionBtnText}>Extend Application Deadline (+24h)</Text>
            </TouchableOpacity>
          )}

          {/* Freelancer: "I'm On My Way" — CONFIRMED status */}
          {!isRemote && !isClient && (statusText === "CONFIRMED" || statusText === "IN_PROGRESS") && (
            <TouchableOpacity style={styles.primaryActionBtn} onPress={() => handlePhysicalProgress("TRAVELLING")} activeOpacity={0.8}>
              <Ionicons name="navigate-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryActionBtnText}>I'm On My Way</Text>
            </TouchableOpacity>
          )}

          {/* Freelancer: "Arrived at Location" — FREELANCER_TRAVELLING status */}
          {!isRemote && !isClient && statusText === "FREELANCER_TRAVELLING" && (
            <TouchableOpacity style={styles.primaryActionBtn} onPress={() => handlePhysicalProgress("ARRIVED")} activeOpacity={0.8}>
              <Ionicons name="location-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryActionBtnText}>Arrived at Location</Text>
            </TouchableOpacity>
          )}

          {/* Freelancer: "Request OTP from Client" — ARRIVED status */}
          {!isRemote && !isClient && statusText === "ARRIVED" && (
            <TouchableOpacity style={styles.primaryActionBtn} onPress={() => handlePhysicalProgress("REQUEST_OTP")} activeOpacity={0.8}>
              <Ionicons name="key-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryActionBtnText}>Request OTP from Client</Text>
            </TouchableOpacity>
          )}

          {/* Client: OTP Display — ARRIVED status, otpCode exists */}
          {!isRemote && isClient && statusText === "ARRIVED" && (
            <View style={{ marginBottom: 14, backgroundColor: "#FFF8E7", padding: 14, borderRadius: 12, borderWidth: 1, borderColor: "#FCD34D" }}>
              <Text style={{ fontSize: 12, color: "#92400E", fontWeight: "600", marginBottom: 6 }}>
                The freelancer has requested the OTP. Share it verbally after verifying their physical presence.
              </Text>
              {job.otpCode ? (
                <View style={{ backgroundColor: "#FFFFFF", borderRadius: 10, padding: 14, alignItems: "center", marginTop: 8, borderWidth: 1, borderColor: "#E5E7EB" }}>
                  <Text style={{ fontSize: 11, color: "#6B7280", marginBottom: 4 }}>Your OTP Code</Text>
                  <Text style={{ fontSize: 26, fontWeight: "800", color: "#6B21A8", letterSpacing: 6 }}>
                    {job.otpCode}
                  </Text>
                </View>
              ) : (
                <Text style={{ fontSize: 12, color: "#78716C", marginTop: 4 }}>
                  Waiting for freelancer to request OTP...
                </Text>
              )}
            </View>
          )}

          {/* Freelancer: OTP Input — ARRIVED status */}
          {!isRemote && !isClient && statusText === "ARRIVED" && (
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
              <TextInput
                style={{ flex: 1, borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 10, paddingHorizontal: 14, fontSize: 16, backgroundColor: "#FFFFFF" }}
                placeholder="Enter 6-digit OTP"
                keyboardType="number-pad"
                maxLength={6}
                value={otpInput}
                onChangeText={setOtpInput}
              />
              <TouchableOpacity
                style={{ backgroundColor: "#22C55E", paddingHorizontal: 18, borderRadius: 10, justifyContent: "center" }}
                onPress={() => handlePhysicalProgress("VERIFY_OTP", otpInput)}
              >
                <Text style={{ color: "#FFF", fontWeight: "700" }}>Verify</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Post-OTP Emergency Cancellation Window (5 min after OTP verify) */}
          {!isRemote && statusText === "JOB_STARTED" && job.postOtpCancellationWindowExpiresAt && (
            (() => {
              const expiresAt = new Date(job.postOtpCancellationWindowExpiresAt);
              const now = new Date();
              if (now < expiresAt) {
                return (
                  <View style={{ backgroundColor: "#FEF3C7", padding: 14, borderRadius: 12, marginBottom: 14, borderWidth: 1, borderColor: "#FCD34D" }}>
                    <Text style={{ fontSize: 12, color: "#92400E", fontWeight: "600", marginBottom: 4 }}>
                      Emergency Cancellation Window Active
                    </Text>
                    <Text style={{ fontSize: 11, color: "#78716C", marginBottom: 10 }}>
                      Either party may cancel without penalty within 5 minutes of OTP verification.
                    </Text>
                    <TouchableOpacity
                      style={{ backgroundColor: "#EF4444", paddingVertical: 10, borderRadius: 8, alignItems: "center" }}
                      onPress={() => {
                        Alert.alert("Emergency Cancel", "Cancel this job without penalty?", [
                          { text: "No", style: "cancel" },
                          { text: "Yes, Cancel", style: "destructive", onPress: () => handlePhysicalProgress("EMERGENCY_CANCEL") },
                        ]);
                      }}
                    >
                      <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 13 }}>Cancel Job (No Penalty)</Text>
                    </TouchableOpacity>
                  </View>
                );
              }
              return null;
            })()
          )}

          {/* Client: Confirm Work Completed — JOB_STARTED status */}
          {!isRemote && isClient && statusText === "JOB_STARTED" && (
            <TouchableOpacity
              style={styles.primaryActionBtn}
              onPress={() => {
                Alert.alert("Confirm Completion", "Confirm that the freelancer has completed the work?", [
                  { text: "No", style: "cancel" },
                  { text: "Yes, Work Done", onPress: () => handlePhysicalProgress("CONFIRM_WORK_COMPLETED") },
                ]);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-done-circle" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryActionBtnText}>Confirm Work Completed</Text>
            </TouchableOpacity>
          )}

          {/* Dispute Button — on-site jobs in progress */}
          {!isRemote && ["JOB_STARTED", "IN_PROGRESS", "FREELANCER_TRAVELLING", "ARRIVED"].includes(statusText) && (
            <TouchableOpacity
              style={[styles.secondaryActionBtn, { borderColor: "#EF4444", marginBottom: 10 }]}
              onPress={() => {
                setSelectedDisputeChip("Work not completed as agreed");
                setDisputeReasonText("Work not completed as agreed");
                setDisputeModalVisible(true);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="flag-outline" size={18} color="#EF4444" style={{ marginRight: 8 }} />
              <Text style={[styles.secondaryActionBtnText, { color: "#EF4444" }]}>Raise Dispute</Text>
            </TouchableOpacity>
          )}

          {/* Existing buttons */}
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

        {/* Modal for Raise Dispute */}
        <Modal visible={disputeModalVisible} transparent animationType="slide">
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 }}>
            <View style={{ backgroundColor: "#FFF", borderRadius: 16, padding: 20 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Ionicons name="alert-circle" size={24} color="#EF4444" />
                <Text style={{ fontSize: 18, fontWeight: "700", color: "#1F192F" }}>
                  Raise Dispute
                </Text>
              </View>
              <Text style={{ fontSize: 12, color: "#6B7280", marginBottom: 14 }}>
                Please select or explain why you are raising a dispute. Support will review your reason.
              </Text>

              <Text style={{ fontSize: 11, fontWeight: "700", color: "#4C1D95", marginBottom: 8, textTransform: "uppercase" }}>
                Select Reason:
              </Text>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {disputeReasonChips.map((chip, idx) => {
                    const isSelected = selectedDisputeChip === chip;
                    return (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => {
                          setSelectedDisputeChip(chip);
                          if (chip !== "Other issue") {
                            setDisputeReasonText(chip);
                          } else {
                            setDisputeReasonText("");
                          }
                        }}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 20,
                          backgroundColor: isSelected ? "#FEE2E2" : "#F3F4F6",
                          borderWidth: 1,
                          borderColor: isSelected ? "#EF4444" : "#E5E7EB",
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: isSelected ? "700" : "500", color: isSelected ? "#991B1B" : "#374151" }}>
                          {chip}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              <Text style={{ fontSize: 11, fontWeight: "700", color: "#4C1D95", marginBottom: 6, textTransform: "uppercase" }}>
                Additional Details / Explanation:
              </Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: "#DDD", borderRadius: 10, padding: 12, fontSize: 14, minHeight: 80, textAlignVertical: "top", marginBottom: 16, color: "#1F192F" }}
                placeholder="Provide specific details about what happened..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                value={disputeReasonText}
                onChangeText={setDisputeReasonText}
              />

              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  style={{ flex: 1, paddingVertical: 12, borderWidth: 1, borderColor: "#DDD", borderRadius: 10, alignItems: "center" }}
                  onPress={() => setDisputeModalVisible(false)}
                >
                  <Text style={{ color: "#666", fontWeight: "700" }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 1, paddingVertical: 12, backgroundColor: "#EF4444", borderRadius: 10, alignItems: "center" }}
                  onPress={handleConfirmRaiseDispute}
                >
                  <Text style={{ color: "#FFF", fontWeight: "700" }}>Submit Dispute</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
    primaryActionBtn: { backgroundColor: "#6B21A8", borderRadius: 12, paddingVertical: 14, flexDirection: "row", justifyContent: "center", alignItems: "center", marginBottom: 12 },
    primaryActionBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
    secondaryActionBtn: { backgroundColor: "#FFFFFF", borderRadius: 12, borderWidth: 1, borderColor: "#DDD6FE", paddingVertical: 14, flexDirection: "row", justifyContent: "center", alignItems: "center", marginBottom: 12 },
    secondaryActionBtnText: { color: "#6B21A8", fontSize: 15, fontWeight: "700" },
    primaryMessageButton: { backgroundColor: "#008744", borderRadius: 12, paddingVertical: 14, flexDirection: "row", justifyContent: "center", alignItems: "center", marginBottom: 12 },
    primaryMessageButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
    secondaryBackButton: { backgroundColor: "#FFFFFF", borderRadius: 12, borderWidth: 1, borderColor: "#DDD6FE", paddingVertical: 14, flexDirection: "row", justifyContent: "center", alignItems: "center" },
    secondaryBackButtonText: { color: "#6B21A8", fontSize: 16, fontWeight: "700" },
  });

export default JobDetailsChatScreen;
