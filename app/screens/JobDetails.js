import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  StatusBar,
  Platform,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import ImageViewer from "react-native-image-zoom-viewer";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/NewAuthContext";
import apiService from "../lib/apiService";

const JobDetailsScreen = ({ route, navigation }) => {
  const { formData } = route.params;
  const [modalVisible, setModalVisible] = useState(false);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentJob, setCurrentJob] = useState(formData);
  const [otpInput, setOtpInput] = useState("");
  const [workFileUrl, setWorkFileUrl] = useState("");
  const [workNotes, setWorkNotes] = useState("");
  const [showWorkModal, setShowWorkModal] = useState(false);
  const [priceModalVisible, setPriceModalVisible] = useState(false);
  const [requestedPrice, setRequestedPrice] = useState("");
  const [priceReason, setPriceReason] = useState("");
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
  const isClient = userData?.userType === "CLIENT" || userData?.client?.id === (currentJob.clientId || currentJob.client?.id);

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme] || themeStyles.light;
  const styles = getStyles(currentTheme);

  const openImageModal = (imageUri) => {
    setImages([{ url: imageUri }]);
    setModalVisible(true);
  };

  const handleSubmit = () => {
    navigation.navigate("JobSubmissionTimmer", { formData: currentJob });
  };

  const handleExtendDeadline = async () => {
    try {
      setLoading(true);
      const res = await apiService.extendApplicationDeadline(currentJob.id);
      Alert.alert("Success", "Application deadline extended by +24 hours.");
      if (res) setCurrentJob({ ...currentJob, ...res });
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to extend deadline");
    } finally {
      setLoading(false);
    }
  };

  const handlePhysicalProgress = async (action, extraPayload = {}) => {
    try {
      setLoading(true);
      const payload = typeof extraPayload === 'string' ? { otpCode: extraPayload } : extraPayload;
      const res = await apiService.updatePhysicalJobProgress(currentJob.id, action, payload);
      Alert.alert("Success", `Status updated: ${action}`);
      if (res?.data) setCurrentJob({ ...currentJob, ...res.data });
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to update progress");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmRaiseDispute = async () => {
    const finalReason = disputeReasonText.trim() || selectedDisputeChip;
    if (!finalReason) {
      Alert.alert("Reason Required", "Please select or type a reason for raising the dispute.");
      return;
    }
    try {
      setLoading(true);
      setDisputeModalVisible(false);
      const res = await apiService.updatePhysicalJobProgress(currentJob.id, "RAISE_DISPUTE", { reason: finalReason });
      Alert.alert("Dispute Raised", "Your dispute has been submitted to support for review.");
      if (res?.data) setCurrentJob({ ...currentJob, ...res.data });
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to raise dispute");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitWork = async () => {
    if (!workFileUrl.trim()) {
      Alert.alert("Validation Error", "Please provide a valid file URL/link for submission.");
      return;
    }
    try {
      setLoading(true);
      const res = await apiService.submitDigitalWork(currentJob.id, {
        fileUrl: workFileUrl.trim(),
        notes: workNotes.trim(),
      });
      Alert.alert("Success", "Work submitted for review successfully.");
      setShowWorkModal(false);
      if (res?.data) setCurrentJob({ ...currentJob, ...res.data });
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to submit work");
    } finally {
      setLoading(false);
    }
  };

  const handleRespondWork = async (decision, notes = "") => {
    try {
      setLoading(true);
      const res = await apiService.respondToDigitalWork(currentJob.id, decision, notes);
      Alert.alert("Success", decision === "ACCEPT" ? "Work accepted! Payment released." : "Revision requested.");
      if (res?.data) setCurrentJob({ ...currentJob, ...res.data });
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to respond");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPriceChange = async () => {
    const num = parseFloat(requestedPrice);
    if (isNaN(num) || num <= 0 || !priceReason.trim()) {
      Alert.alert("Validation Error", "Please enter a valid requested price and reason.");
      return;
    }
    try {
      setLoading(true);
      const res = await apiService.requestScopePriceChange(currentJob.id, num, priceReason.trim());
      Alert.alert("Success", "Price change request sent to client.");
      setPriceModalVisible(false);
      if (res?.data) setCurrentJob({ ...currentJob, ...res.data });
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to request price change");
    } finally {
      setLoading(false);
    }
  };

  const handleRespondPriceChange = async (accept) => {
    try {
      setLoading(true);
      const res = await apiService.respondToScopePriceChange(currentJob.id, accept);
      Alert.alert("Notice", accept ? "Price change accepted." : "Booking cancelled due to scope mismatch.");
      if (res?.data) setCurrentJob({ ...currentJob, ...res.data });
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to respond to price change");
    } finally {
      setLoading(false);
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

  const clientName =
    userData?.client?.companyName ||
    userData?.fullName ||
    "Your Profile";
  const clientType = `Client \u2022 ${userData?.client?.organizationType || "Individual"}`;
  const companyName = userData?.client?.address || "Your Company";

  const isPlatformPayment = formData.paymentMethod === "PLATFORM";
  const pType = (formData.jobType || formData.projectType || "").toLowerCase();
  const loc = (formData.jobLocation || "").toLowerCase();
  const isRemote = pType.includes("remote") || (loc.includes("remote") && !pType.includes("on-site"));

  const attachedFiles = formData.portfolioImages || [];
  const filesCount = attachedFiles.length;

  const skillsList = Array.isArray(formData.skills)
    ? formData.skills
    : typeof formData.skills === "string"
    ? formData.skills.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

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
          <Text style={styles.headerSubtitle}>
            Review job information before confirming
          </Text>
        </View>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="document-text-outline" size={18} color="#6B21A8" />
            </View>
            <Text style={styles.cardHeaderTitle}>Job Description</Text>
          </View>
          <View style={styles.cardContentPadding}>
            <Text style={styles.jobTitleText}>
              {formData.jobTitle || "Job Title"}
            </Text>
            <Text style={styles.jobDescriptionBodyText}>
              {formData.jobDes || "No description provided"}
            </Text>
            {skillsList.length > 0 && (
              <View style={styles.skillsContainer}>
                <Text style={styles.skillsLabel}>Skills:</Text>
                <Text style={styles.skillsText}>
                  {skillsList.join(", ")}
                </Text>
              </View>
            )}
          </View>
        </View>

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
                  {isPlatformPayment ? "Platform Payment" : "Cash Payment"}
                </Text>
                <Text style={styles.paymentSubtitle}>
                  {isPlatformPayment
                    ? "Payment will be processed securely through BirdEarner"
                    : "You will handle payment directly with the freelancer"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.gridRow}>
          <View style={[styles.card, styles.gridCard]}>
            <View style={styles.gridCardHeader}>
              <View style={styles.smallIconCircle}>
                <Text style={styles.rupeeIconSymbol}>{"\u20B9"}</Text>
              </View>
              <Text style={styles.gridCardLabel}>Budget</Text>
            </View>
            <Text style={styles.gridCardValue}>
              {formatCurrency(formData.budget)}
            </Text>
          </View>
          <View style={[styles.card, styles.gridCard]}>
            <View style={styles.gridCardHeader}>
              <View style={styles.smallIconCircle}>
                <Ionicons name="calendar-outline" size={15} color="#6B21A8" />
              </View>
              <Text style={styles.gridCardLabel}>Work Duration</Text>
            </View>
            <Text style={styles.gridCardValue}>
              {formData.workDurationDays || 1} {formData.workDurationDays === 1 ? "Day" : "Days"}
            </Text>
            <Text style={styles.gridCardSubtext}>After booking confirmed</Text>
          </View>
        </View>

        <View style={styles.gridRow}>
          <View style={[styles.card, styles.gridCard]}>
            <View style={styles.gridCardHeader}>
              <View style={styles.smallIconCircle}>
                <Ionicons name="location-outline" size={15} color="#6B21A8" />
              </View>
              <Text style={styles.gridCardLabel}>Location</Text>
            </View>
            <Text style={styles.gridCardValue} numberOfLines={2}>
              {formData.jobLocation || "Remote"}
            </Text>
            <Text style={styles.gridCardSubtext}>
              {isRemote ? "Work from anywhere" : "On-site Work"}
            </Text>
          </View>
          <View style={[styles.card, styles.gridCard]}>
            <View style={styles.gridCardHeader}>
              <View style={styles.smallIconCircle}>
                <Ionicons name="pricetag-outline" size={15} color="#6B21A8" />
              </View>
              <Text style={styles.gridCardLabel}>Category</Text>
            </View>
            <Text style={styles.gridCardValue} numberOfLines={1}>
              {formData.freelancerType || formData.jobCategory || "General"}
            </Text>
            <Text style={styles.gridCardSubtext} numberOfLines={1}>
              {formData.subcategory || "Design & Creative"}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            if (filesCount > 0) {
              openImageModal(attachedFiles[0].uri);
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

        <View style={styles.card}>
          <View style={styles.statusCardRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="time-outline" size={20} color="#6B21A8" />
            </View>
            <View style={styles.statusContentCol}>
              <Text style={styles.statusLabelText}>Job Status & Timelines</Text>
              <View style={styles.statusBadgeRow}>
                <View style={styles.statusPill}>
                  <Text style={styles.statusPillText}>
                    {currentJob.jobStatus || "OPEN"}
                  </Text>
                </View>
              </View>
              {currentJob.jobStatus === "OPEN" && (
                <Text style={styles.statusNoticeText}>
                  Application Deadline: 24 Hours from posting.
                </Text>
              )}
              {currentJob.workDeadline && (
                <Text style={styles.statusNoticeText}>
                  Work Deadline: {formatDate(currentJob.workDeadline)} ({currentJob.workDurationDays || 1} Day{currentJob.workDurationDays > 1 ? "s" : ""})
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Dynamic Action Controls for Complete Booking Flow */}
        <View style={styles.actionsContainer}>
          {loading && <ActivityIndicator size="large" color="#6B21A8" style={{ marginBottom: 12 }} />}

          {/* OPEN Job: Client option to Extend Application Deadline (+24h) */}
          {currentJob.jobStatus === "OPEN" && isClient && !currentJob.applicationExtended && (
            <TouchableOpacity
              style={styles.primaryConfirmButton}
              onPress={handleExtendDeadline}
              activeOpacity={0.8}
            >
              <Ionicons name="time-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryConfirmButtonText}>Extend Application Deadline (+24h)</Text>
            </TouchableOpacity>
          )}

          {/* Physical Service Flow Buttons */}
          {!isRemote && (currentJob.jobStatus === "CONFIRMED" || currentJob.jobStatus === "IN_PROGRESS") && !isClient && (
            <TouchableOpacity
              style={styles.primaryConfirmButton}
              onPress={() => handlePhysicalProgress("TRAVELLING")}
              activeOpacity={0.8}
            >
              <Ionicons name="navigate-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryConfirmButtonText}>I'm On My Way</Text>
            </TouchableOpacity>
          )}

          {!isRemote && currentJob.jobStatus === "FREELANCER_TRAVELLING" && !isClient && (
            <TouchableOpacity
              style={styles.primaryConfirmButton}
              onPress={() => handlePhysicalProgress("ARRIVED")}
              activeOpacity={0.8}
            >
              <Ionicons name="location-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryConfirmButtonText}>Arrived at Location</Text>
            </TouchableOpacity>
          )}

          {!isRemote && currentJob.jobStatus === "ARRIVED" && !isClient && (
            <TouchableOpacity
              style={styles.primaryConfirmButton}
              onPress={() => handlePhysicalProgress("REQUEST_OTP")}
              activeOpacity={0.8}
            >
              <Ionicons name="key-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryConfirmButtonText}>Request OTP from Client</Text>
            </TouchableOpacity>
          )}

          {!isRemote && currentJob.jobStatus === "ARRIVED" && isClient && (
            <View style={{ marginBottom: 14, backgroundColor: "#FFF8E7", padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#FCD34D" }}>
              <Text style={{ fontSize: 12, color: "#92400E", fontWeight: "600", marginBottom: 6 }}>
                The freelancer has requested the OTP. Share it verbally only after verifying their physical presence.
              </Text>
              {currentJob.otpCode ? (
                <View style={{ backgroundColor: "#FFFFFF", borderRadius: 10, padding: 12, alignItems: "center", marginTop: 6, borderWidth: 1, borderColor: "#E5E7EB" }}>
                  <Text style={{ fontSize: 11, color: "#6B7280", marginBottom: 4 }}>Your OTP Code</Text>
                  <Text style={{ fontSize: 24, fontWeight: "800", color: "#6B21A8", letterSpacing: 6 }}>
                    {currentJob.otpCode}
                  </Text>
                </View>
              ) : (
                <Text style={{ fontSize: 12, color: "#78716C", marginTop: 4 }}>
                  Waiting for freelancer to request OTP...
                </Text>
              )}
            </View>
          )}

          {!isRemote && currentJob.jobStatus === "ARRIVED" && !isClient && (
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
              <TextInput
                style={{ flex: 1, borderWidth: 1, borderColor: "#DDD", borderRadius: 10, paddingHorizontal: 12, fontSize: 16 }}
                placeholder="Enter 6-digit OTP"
                keyboardType="number-pad"
                value={otpInput}
                onChangeText={setOtpInput}
              />
              <TouchableOpacity
                style={{ backgroundColor: "#22C55E", paddingHorizontal: 16, borderRadius: 10, justifyContent: "center" }}
                onPress={() => handlePhysicalProgress("VERIFY_OTP", otpInput)}
              >
                <Text style={{ color: "#FFF", fontWeight: "700" }}>Verify</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Post-OTP Emergency Cancellation Window (5 min after OTP verify) */}
          {!isRemote && currentJob.jobStatus === "JOB_STARTED" && currentJob.postOtpCancellationWindowExpiresAt && (
            (() => {
              const expiresAt = new Date(currentJob.postOtpCancellationWindowExpiresAt);
              const now = new Date();
              if (now < expiresAt) {
                return (
                  <View style={{ backgroundColor: "#FEF3C7", padding: 12, borderRadius: 12, marginBottom: 14, borderWidth: 1, borderColor: "#FCD34D" }}>
                    <Text style={{ fontSize: 12, color: "#92400E", fontWeight: "600", marginBottom: 6 }}>
                      Emergency Cancellation Window Active
                    </Text>
                    <Text style={{ fontSize: 11, color: "#78716C", marginBottom: 8 }}>
                      Either party may cancel without penalty within 5 minutes of OTP verification.
                    </Text>
                    <TouchableOpacity
                      style={{ backgroundColor: "#EF4444", paddingVertical: 8, borderRadius: 8, alignItems: "center" }}
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

          {/* Dispute Button - available after emergency window expires and work is in progress */}
          {!isRemote && ["JOB_STARTED", "IN_PROGRESS", "TRAVELLING", "ARRIVED"].includes(currentJob.jobStatus) && (
            <TouchableOpacity
              style={[styles.secondaryCancelButton, { marginBottom: 10 }]}
              onPress={() => {
                setSelectedDisputeChip("Work not completed as agreed");
                setDisputeReasonText("Work not completed as agreed");
                setDisputeModalVisible(true);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="flag-outline" size={18} color="#EF4444" style={{ marginRight: 8 }} />
              <Text style={[styles.secondaryCancelButtonText, { color: "#EF4444" }]}>Raise Dispute</Text>
            </TouchableOpacity>
          )}

          {/* Client: Confirm Work Completed (on-site, after OTP verified) */}
          {!isRemote && isClient && currentJob.jobStatus === "JOB_STARTED" && (
            <TouchableOpacity
              style={styles.primaryConfirmButton}
              onPress={() => {
                Alert.alert("Confirm Completion", "Confirm that the freelancer has completed the work?", [
                  { text: "No", style: "cancel" },
                  { text: "Yes, Work Done", onPress: () => handlePhysicalProgress("CONFIRM_WORK_COMPLETED") },
                ]);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-done-circle" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryConfirmButtonText}>Confirm Work Completed</Text>
            </TouchableOpacity>
          )}

          {/* Scope Mismatch Price Change Request */}
          {!isClient && (currentJob.jobStatus === "CONFIRMED" || currentJob.jobStatus === "ARRIVED" || currentJob.jobStatus === "JOB_STARTED") && (
            <TouchableOpacity
              style={[styles.secondaryCancelButton, { marginBottom: 10 }]}
              onPress={() => setPriceModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="pricetag-outline" size={18} color="#6B21A8" style={{ marginRight: 8 }} />
              <Text style={styles.secondaryCancelButtonText}>Request Price Change (Scope Mismatch)</Text>
            </TouchableOpacity>
          )}

          {/* Pending Scope Price Change Notification for Client */}
          {currentJob.priceChangeRequested && isClient && (
            <View style={{ backgroundColor: "#EFF6FF", padding: 12, borderRadius: 12, marginBottom: 14 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#1D4ED8", marginBottom: 4 }}>
                Price Change Requested: ₹{currentJob.priceChangeRequested}
              </Text>
              <Text style={{ fontSize: 12, color: "#374151", marginBottom: 8 }}>
                Reason: {currentJob.priceChangeReason}
              </Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  style={{ flex: 1, backgroundColor: "#22C55E", paddingVertical: 10, borderRadius: 8, alignItems: "center" }}
                  onPress={() => handleRespondPriceChange(true)}
                >
                  <Text style={{ color: "#FFF", fontWeight: "700" }}>Accept New Price</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 1, backgroundColor: "#EF4444", paddingVertical: 10, borderRadius: 8, alignItems: "center" }}
                  onPress={() => handleRespondPriceChange(false)}
                >
                  <Text style={{ color: "#FFF", fontWeight: "700" }}>Cancel Job (No Penalty)</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Digital Work Submission Flow */}
          {isRemote && !isClient && (currentJob.jobStatus === "CONFIRMED" || currentJob.jobStatus === "IN_PROGRESS" || currentJob.jobStatus === "REVISION_REQUESTED") && (
            <TouchableOpacity
              style={styles.primaryConfirmButton}
              onPress={() => setShowWorkModal(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="cloud-upload-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryConfirmButtonText}>Submit Work Preview for Review</Text>
            </TouchableOpacity>
          )}

          {/* Work Submitted Review Banner for Client */}
          {currentJob.jobStatus === "WORK_SUBMITTED" && isClient && (
            <View style={{ backgroundColor: "#F3E8FF", padding: 14, borderRadius: 12, marginBottom: 14 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#6B21A8", marginBottom: 4 }}>
                Work Submitted for Review
              </Text>
              <Text style={{ fontSize: 12, color: "#4B5563", marginBottom: 10 }}>
                Please review the submitted work. If no response within 12 hours, the work will be automatically accepted according to BirdEarner completion policy.
              </Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity
                  style={{ flex: 1, backgroundColor: "#22C55E", paddingVertical: 10, borderRadius: 8, alignItems: "center" }}
                  onPress={() => handleRespondWork("ACCEPT")}
                >
                  <Text style={{ color: "#FFF", fontWeight: "700" }}>Accept Work</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 1, backgroundColor: "#6B21A8", paddingVertical: 10, borderRadius: 8, alignItems: "center" }}
                  onPress={() => handleRespondWork("REQUEST_REVISION", "Minor changes requested")}
                >
                  <Text style={{ color: "#FFF", fontWeight: "700" }}>Request Revisions</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {!currentJob.id && (
            <TouchableOpacity
              style={styles.primaryConfirmButton}
              onPress={handleSubmit}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryConfirmButtonText}>Confirm Job</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.secondaryCancelButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={18} color="#6B21A8" style={{ marginRight: 8 }} />
            <Text style={styles.secondaryCancelButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>

        {/* Modal for Digital Work Upload */}
        <Modal visible={showWorkModal} transparent animationType="slide">
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 }}>
            <View style={{ backgroundColor: "#FFF", borderRadius: 16, padding: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: "#1F192F", marginBottom: 12 }}>
                Submit Work Preview
              </Text>
              <Text style={{ fontSize: 12, color: "#6B7280", marginBottom: 10 }}>
                Provide file preview URL or watermarked video link:
              </Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: "#DDD", borderRadius: 10, padding: 12, fontSize: 14, marginBottom: 12 }}
                placeholder="https://preview.birdearner.com/file.mp4"
                value={workFileUrl}
                onChangeText={setWorkFileUrl}
              />
              <TextInput
                style={{ borderWidth: 1, borderColor: "#DDD", borderRadius: 10, padding: 12, fontSize: 14, marginBottom: 16 }}
                placeholder="Notes / instructions for client"
                multiline
                numberOfLines={3}
                value={workNotes}
                onChangeText={setWorkNotes}
              />
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  style={{ flex: 1, paddingVertical: 12, borderWidth: 1, borderColor: "#DDD", borderRadius: 10, alignItems: "center" }}
                  onPress={() => setShowWorkModal(false)}
                >
                  <Text style={{ color: "#666", fontWeight: "700" }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 1, paddingVertical: 12, backgroundColor: "#6B21A8", borderRadius: 10, alignItems: "center" }}
                  onPress={handleSubmitWork}
                >
                  <Text style={{ color: "#FFF", fontWeight: "700" }}>Submit Preview</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal for Scope Mismatch Price Change */}
        <Modal visible={priceModalVisible} transparent animationType="slide">
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 }}>
            <View style={{ backgroundColor: "#FFF", borderRadius: 16, padding: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: "#1F192F", marginBottom: 12 }}>
                Request Price Change (Scope Mismatch)
              </Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: "#DDD", borderRadius: 10, padding: 12, fontSize: 14, marginBottom: 12 }}
                placeholder="New requested price (₹)"
                keyboardType="numeric"
                value={requestedPrice}
                onChangeText={setRequestedPrice}
              />
              <TextInput
                style={{ borderWidth: 1, borderColor: "#DDD", borderRadius: 10, padding: 12, fontSize: 14, marginBottom: 16 }}
                placeholder="Reason for additional work discovered"
                multiline
                numberOfLines={3}
                value={priceReason}
                onChangeText={setPriceReason}
              />
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  style={{ flex: 1, paddingVertical: 12, borderWidth: 1, borderColor: "#DDD", borderRadius: 10, alignItems: "center" }}
                  onPress={() => setPriceModalVisible(false)}
                >
                  <Text style={{ color: "#666", fontWeight: "700" }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 1, paddingVertical: 12, backgroundColor: "#6B21A8", borderRadius: 10, alignItems: "center" }}
                  onPress={handleRequestPriceChange}
                >
                  <Text style={{ color: "#FFF", fontWeight: "700" }}>Send Request</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

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

const getStyles = (currentTheme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: "#FFFFFF",
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
    jobTitleText: {
      fontSize: 16,
      fontWeight: "700",
      color: "#1F192F",
      marginBottom: 6,
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
    primaryConfirmButton: {
      backgroundColor: "#008744",
      borderRadius: 12,
      paddingVertical: 14,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 12,
    },
    primaryConfirmButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "700",
    },
    secondaryCancelButton: {
      backgroundColor: "#FFFFFF",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#DDD6FE",
      paddingVertical: 14,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
    },
    secondaryCancelButtonText: {
      color: "#6B21A8",
      fontSize: 16,
      fontWeight: "700",
    },
  });

export default JobDetailsScreen;
