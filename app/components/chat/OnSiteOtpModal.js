import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import apiService from "../../lib/apiService";

const DISPUTE_REASON_CHIPS = [
  "Work not completed as agreed",
  "Client refusing cash payment",
  "Freelancer asked for extra money",
  "Work quality or scope mismatch",
  "Freelancer failed to show up / delayed",
];

const PRICE_CHANGE_REASON_CHIPS = [
  "Additional work required",
  "Scope larger than described",
  "Parts & materials needed",
  "Unexpected complication on site",
];

const OnSiteOtpModal = ({
  visible,
  onClose,
  jobId,
  job: parentJob,
  userRole = "client", // 'client' or 'freelancer'
  onJobUpdated,
}) => {
  const [fetchedJob, setFetchedJob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [otpInput, setOtpInput] = useState("");

  // Raise Dispute Reason Modal state
  const [showDisputeReasonModal, setShowDisputeReasonModal] = useState(false);
  const [selectedReasonChip, setSelectedReasonChip] = useState(DISPUTE_REASON_CHIPS[0]);
  const [customReasonText, setCustomReasonText] = useState("");

  // Request Price Change Modal state
  const [showPriceChangeModal, setShowPriceChangeModal] = useState(false);
  const [requestedPriceInput, setRequestedPriceInput] = useState("");
  const [selectedPriceReason, setSelectedPriceReason] = useState(PRICE_CHANGE_REASON_CHIPS[0]);
  const [customExplanationText, setCustomExplanationText] = useState("");

  const isClient = userRole === "client";

  // Merge parentJob and fetchedJob so we always have up-to-date data
  const jobData = fetchedJob || parentJob || {};

  useEffect(() => {
    if (visible && jobId) {
      fetchLatestJob();
    } else {
      setOtpInput("");
      setShowDisputeReasonModal(false);
      setShowPriceChangeModal(false);
    }
  }, [visible, jobId]);

  const fetchLatestJob = async () => {
    try {
      setLoading(true);
      const res = await apiService.getJobById(jobId);
      // Safely unwrap job object whether backend returned { success, data: job } or job directly
      const jobObj = res?.data?.id ? res.data : res?.id ? res : res?.data || res;
      if (jobObj && jobObj.id) {
        setFetchedJob(jobObj);
      }
    } catch (err) {
      console.error("Error loading job in OTP modal:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePhysicalProgress = async (action, payloadData = {}) => {
    try {
      setActionLoading(true);
      const payload = typeof payloadData === "string" ? { otpCode: payloadData } : payloadData;
      const res = await apiService.updatePhysicalJobProgress(jobId, action, payload);
      Alert.alert("Success", "Status updated successfully.");
      const updatedData = res?.data?.id ? res.data : res?.id ? res : res?.data;
      if (updatedData) {
        setFetchedJob((prev) => ({ ...prev, ...updatedData }));
      } else {
        await fetchLatestJob();
      }
      setOtpInput("");
      onJobUpdated?.();
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to update status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmSubmitDispute = async () => {
    const finalReason = customReasonText.trim() || selectedReasonChip;
    if (!finalReason) {
      Alert.alert("Reason Required", "Please select or type a reason for raising the dispute.");
      return;
    }
    try {
      setActionLoading(true);
      await apiService.updatePhysicalJobProgress(jobId, "RAISE_DISPUTE", { reason: finalReason });
      Alert.alert("Dispute Raised", "Dispute raised successfully. Support team will review your case.");
      setShowDisputeReasonModal(false);
      await fetchLatestJob();
      onJobUpdated?.();
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to raise dispute");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestPriceChange = async () => {
    const numPrice = Number(requestedPriceInput);
    const currentBudget = Number(jobData.budgetAmount || 0);

    if (isNaN(numPrice) || numPrice <= 0) {
      Alert.alert("Validation Error", "Please enter a valid positive price amount.");
      return;
    }
    if (numPrice <= currentBudget) {
      Alert.alert(
        "Invalid Price",
        `Requested price (₹${numPrice}) must be greater than the original price (₹${currentBudget}).`
      );
      return;
    }
    try {
      setActionLoading(true);
      await apiService.requestPriceChange(
        jobId,
        numPrice,
        selectedPriceReason,
        customExplanationText
      );
      Alert.alert("Success", "Price change request submitted to the client.");
      setShowPriceChangeModal(false);
      await fetchLatestJob();
      onJobUpdated?.();
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to submit price change request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRespondToPriceChange = async (accept) => {
    try {
      setActionLoading(true);
      await apiService.respondToPriceChange(jobId, accept);
      if (accept) {
        Alert.alert("Price Accepted", "You have accepted the revised booking price.");
      } else {
        Alert.alert(
          "Booking Cancelled",
          "Booking was cancelled due to scope/price mismatch. No penalty applied."
        );
      }
      await fetchLatestJob();
      onJobUpdated?.();
    } catch (err) {
      if (err.message && err.message.includes("Insufficient wallet balance")) {
        Alert.alert(
          "Insufficient Balance",
          err.message,
          [
            { text: "OK", style: "cancel" },
          ]
        );
      } else {
        Alert.alert("Error", err.message || "Failed to respond to price change request");
      }
    } finally {
      setActionLoading(false);
    }
  };

  if (!visible) return null;

  const jobStatus = (jobData?.jobStatus || jobData?.status || "OPEN").toUpperCase();
  const otpCode = jobData?.otpCode;
  const hasOtpCode = Boolean(otpCode && String(otpCode).trim().length > 0);
  const isOtpVerified = Boolean(jobData?.otpVerifiedAt);
  const isArrived = jobStatus === "ARRIVED" || hasOtpCode;
  const isStarted = jobStatus === "JOB_STARTED" || isOtpVerified;
  const isDisputed = jobStatus === "DISPUTE_OPEN" || jobStatus === "DISPUTED";

  // Emergency cancellation window calculation
  let isEmergencyCancelActive = false;
  if (jobData?.postOtpCancellationWindowExpiresAt) {
    const expiresAt = new Date(jobData.postOtpCancellationWindowExpiresAt);
    if (new Date() < expiresAt) {
      isEmergencyCancelActive = true;
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="key-outline" size={22} color="#A855F7" />
              <Text style={styles.modalTitle}>
                {isClient ? "On-Site Verification OTP" : "Work Progress & OTP"}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={26} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {loading && !fetchedJob && !parentJob ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#A855F7" />
              <Text style={styles.loadingText}>Fetching latest status...</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
              {/* Status Badge */}
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>CURRENT STATUS:</Text>
                <View style={[styles.statusBadge, isDisputed ? styles.statusBadgeRed : isStarted ? styles.statusBadgeGreen : styles.statusBadgePurple]}>
                  <Text style={styles.statusBadgeText}>{jobStatus.replace(/_/g, " ")}</Text>
                </View>
              </View>

              {/* CLIENT VIEW */}
              {isClient && (
                <View style={styles.sectionBox}>
                  {/* Pending Price Change Request Banner for Client */}
                  {Boolean(jobData?.priceChangeRequested) && (
                    <View style={styles.priceChangeBannerContainer}>
                      <View style={styles.priceChangeHeader}>
                        <Ionicons name="warning-outline" size={22} color="#F59E0B" />
                        <Text style={styles.priceChangeHeaderTitle}>Price Change Requested</Text>
                      </View>
                      <Text style={styles.priceChangeSubtext}>
                        Freelancer discovered additional work required at site.
                      </Text>

                      <View style={styles.priceComparisonBox}>
                        <View style={styles.priceRow}>
                          <Text style={styles.priceLabel}>Original Price:</Text>
                          <Text style={styles.priceOriginal}>₹{jobData.budgetAmount}</Text>
                        </View>
                        <View style={styles.priceRow}>
                          <Text style={styles.priceLabel}>New Requested Price:</Text>
                          <Text style={styles.priceRequested}>₹{jobData.priceChangeRequested}</Text>
                        </View>
                        <View style={styles.priceRow}>
                          <Text style={styles.priceLabel}>Additional Amount:</Text>
                          <Text style={styles.priceDiff}>
                            + ₹{(Number(jobData.priceChangeRequested) - Number(jobData.budgetAmount)).toFixed(2)}
                          </Text>
                        </View>
                      </View>

                      {Boolean(jobData?.priceChangeReason) && (
                        <View style={styles.reasonBox}>
                          <Text style={styles.reasonBoxTitle}>Reason & Details:</Text>
                          <Text style={styles.reasonBoxText}>{jobData.priceChangeReason}</Text>
                        </View>
                      )}

                      <View style={styles.priceActionRow}>
                        <TouchableOpacity
                          style={styles.acceptPriceButton}
                          onPress={() => handleRespondToPriceChange(true)}
                          disabled={actionLoading}
                        >
                          <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                          <Text style={styles.buttonText}>Accept New Price</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.refusePriceButton}
                          onPress={() => {
                            Alert.alert(
                              "Cancel Due to Price Change",
                              "Are you sure you want to cancel this booking due to scope/price mismatch? No penalties will be applied.",
                              [
                                { text: "No, Keep Booking", style: "cancel" },
                                {
                                  text: "Yes, Cancel",
                                  style: "destructive",
                                  onPress: () => handleRespondToPriceChange(false),
                                },
                              ]
                            );
                          }}
                          disabled={actionLoading}
                        >
                          <Ionicons name="close-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                          <Text style={styles.buttonText}>Cancel Due to Price Change</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {hasOtpCode || isArrived ? (
                    // Freelancer has requested OTP / Arrived -> Show OTP to Client
                    <View style={styles.otpDisplayContainer}>
                      <Text style={styles.otpHeaderLabel}>🔑 YOUR 4-DIGIT VERIFICATION OTP</Text>
                      <View style={styles.otpBox}>
                        <Text style={styles.otpText}>{otpCode}</Text>
                      </View>
                      <Text style={styles.otpInstructions}>
                        Share this 4-digit code with the freelancer when they arrive at your location to begin work.
                      </Text>
                    </View>
                  ) : isStarted ? (
                    <View style={styles.infoBox}>
                      <Ionicons name="checkmark-circle-outline" size={32} color="#22C55E" />
                      <Text style={styles.infoTitle}>OTP Verified & Work Started</Text>
                      <Text style={styles.infoSubtitle}>
                        The freelancer has verified the OTP code and work is currently in progress.
                      </Text>
                    </View>
                  ) : (
                    // Freelancer has NOT requested OTP yet
                    <View style={styles.infoBox}>
                      <Ionicons name="time-outline" size={36} color="#F59E0B" />
                      <Text style={styles.infoTitle}>OTP Not Requested Yet</Text>
                      <Text style={styles.infoSubtitle}>
                        The freelancer has not arrived at your location yet. Your 4-digit OTP will automatically appear here once the freelancer marks "I Have Arrived".
                      </Text>
                    </View>
                  )}

                  {/* Client Action Buttons */}
                  {isStarted && (
                    <View style={styles.actionGroup}>
                      {isEmergencyCancelActive && (
                        <TouchableOpacity
                          style={styles.dangerButton}
                          onPress={() => {
                            Alert.alert("Emergency Cancel", "Cancel this job without penalty?", [
                              { text: "No", style: "cancel" },
                              { text: "Yes, Cancel", style: "destructive", onPress: () => handlePhysicalProgress("EMERGENCY_CANCEL") },
                            ]);
                          }}
                          disabled={actionLoading}
                        >
                          <Ionicons name="close-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                          <Text style={styles.buttonText}>Cancel Job (Emergency 5-min Window)</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              )}

              {/* FREELANCER VIEW */}
              {!isClient && (
                <View style={styles.sectionBox}>
                  {/* Step 1: On My Way */}
                  {(jobStatus === "CONFIRMED" || jobStatus === "IN_PROGRESS") && (
                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={() => handlePhysicalProgress("TRAVELLING")}
                      disabled={actionLoading}
                    >
                      <Ionicons name="navigate-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.buttonText}>I'm On My Way</Text>
                    </TouchableOpacity>
                  )}

                  {/* Step 2: Arrived & Request OTP */}
                  {jobStatus === "FREELANCER_TRAVELLING" && (
                    <TouchableOpacity
                      style={styles.warningButton}
                      onPress={() => handlePhysicalProgress("ARRIVED")}
                      disabled={actionLoading}
                    >
                      <Ionicons name="location-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.buttonText}>I Have Arrived (Request OTP)</Text>
                    </TouchableOpacity>
                  )}

                  {/* Step 3: Enter OTP to Start Work */}
                  {isArrived && !isStarted && (
                    <View style={styles.verifyOtpContainer}>
                      <Text style={styles.verifyOtpTitle}>Enter Client's 4-Digit OTP</Text>
                      <Text style={styles.verifyOtpSubtitle}>
                        Ask the client for the 4-digit code shown on their screen to start the job.
                      </Text>
                      <TextInput
                        style={styles.otpTextInput}
                        placeholder="4-Digit OTP"
                        placeholderTextColor="#64748B"
                        keyboardType="numeric"
                        maxLength={6}
                        value={otpInput}
                        onChangeText={setOtpInput}
                      />
                      <TouchableOpacity
                        style={styles.successButton}
                        onPress={() => {
                          if (!otpInput.trim()) {
                            Alert.alert("Validation Error", "Please enter the 4-digit OTP code.");
                            return;
                          }
                          handlePhysicalProgress("VERIFY_OTP", { otpCode: otpInput.trim() });
                        }}
                        disabled={actionLoading}
                      >
                        <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.buttonText}>Verify OTP & Start Work</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Started Status */}
                  {isStarted && (
                    <View style={styles.infoBox}>
                      <Ionicons name="checkmark-circle" size={32} color="#22C55E" />
                      <Text style={styles.infoTitle}>Work In Progress</Text>
                      <Text style={styles.infoSubtitle}>
                        OTP verified! Perform the service as agreed.
                      </Text>
                    </View>
                  )}

                  {/* Request Price Change Button for Freelancer (after OTP verification) */}
                  {isStarted && !Boolean(jobData?.priceChangeRequested) && !isDisputed && (
                    <TouchableOpacity
                      style={styles.requestPriceChangeBtn}
                      onPress={() => {
                        setRequestedPriceInput("");
                        setSelectedPriceReason(PRICE_CHANGE_REASON_CHIPS[0]);
                        setCustomExplanationText("");
                        setShowPriceChangeModal(true);
                      }}
                      disabled={actionLoading}
                    >
                      <Ionicons name="pricetag-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.buttonText}>Request Price Change (Scope Mismatch)</Text>
                    </TouchableOpacity>
                  )}

                  {/* Pending Price Request Info Box for Freelancer */}
                  {Boolean(jobData?.priceChangeRequested) && (
                    <View style={styles.pendingRequestInfoBox}>
                      <Ionicons name="time-outline" size={24} color="#F59E0B" />
                      <Text style={styles.infoTitle}>Price Change Pending</Text>
                      <Text style={styles.infoSubtitle}>
                        Requested ₹{jobData.priceChangeRequested} (Original: ₹{jobData.budgetAmount}). Waiting for client to accept or cancel.
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Dispute Option for both */}
              {["JOB_STARTED", "IN_PROGRESS", "FREELANCER_TRAVELLING", "ARRIVED"].includes(jobStatus) && (
                <TouchableOpacity
                  style={styles.disputeButton}
                  onPress={() => {
                    setSelectedReasonChip(DISPUTE_REASON_CHIPS[0]);
                    setCustomReasonText(DISPUTE_REASON_CHIPS[0]);
                    setShowDisputeReasonModal(true);
                  }}
                >
                  <Ionicons name="flag-outline" size={16} color="#EF4444" style={{ marginRight: 6 }} />
                  <Text style={styles.disputeButtonText}>Raise Dispute</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          )}

          {actionLoading && (
            <View style={styles.actionOverlay}>
              <ActivityIndicator size="large" color="#A855F7" />
            </View>
          )}
        </View>

        {/* Inner Modal: Request Price Change */}
        <Modal
          visible={showPriceChangeModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPriceChangeModal(false)}
        >
          <View style={styles.innerModalOverlay}>
            <View style={styles.innerModalCard}>
              <View style={styles.innerModalHeader}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Ionicons name="pricetag-outline" size={22} color="#A855F7" />
                  <Text style={[styles.innerModalTitle, { color: "#A855F7" }]}>Request Price Change</Text>
                </View>
                <TouchableOpacity onPress={() => setShowPriceChangeModal(false)}>
                  <Ionicons name="close-circle" size={24} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <Text style={styles.reasonPromptText}>Original Booking Price: ₹{jobData.budgetAmount}</Text>

              <Text style={[styles.reasonPromptText, { marginTop: 8 }]}>New Requested Price (₹):</Text>
              <TextInput
                style={styles.priceInput}
                placeholder={`e.g. ${Number(jobData.budgetAmount || 0) + 500}`}
                placeholderTextColor="#64748B"
                keyboardType="numeric"
                value={requestedPriceInput}
                onChangeText={setRequestedPriceInput}
              />

              <Text style={[styles.reasonPromptText, { marginTop: 10 }]}>Reason for Price Increase:</Text>
              <ScrollView style={{ maxHeight: 120 }} showsVerticalScrollIndicator={false}>
                {PRICE_CHANGE_REASON_CHIPS.map((chip) => {
                  const isSelected = selectedPriceReason === chip;
                  return (
                    <TouchableOpacity
                      key={chip}
                      style={[styles.reasonChip, isSelected && styles.priceChipSelected]}
                      onPress={() => setSelectedPriceReason(chip)}
                    >
                      <Ionicons
                        name={isSelected ? "checkmark-circle" : "radio-button-off"}
                        size={16}
                        color={isSelected ? "#A855F7" : "#64748B"}
                        style={{ marginRight: 8 }}
                      />
                      <Text style={[styles.reasonChipText, isSelected && styles.priceChipTextSelected]}>
                        {chip}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={[styles.reasonPromptText, { marginTop: 10, marginBottom: 4 }]}>Explanation:</Text>
              <TextInput
                style={styles.reasonTextInput}
                placeholder="Explain why additional work/materials are required..."
                placeholderTextColor="#64748B"
                multiline
                numberOfLines={3}
                value={customExplanationText}
                onChangeText={setCustomExplanationText}
              />

              <View style={styles.innerModalButtonRow}>
                <TouchableOpacity
                  style={styles.innerCancelBtn}
                  onPress={() => setShowPriceChangeModal(false)}
                >
                  <Text style={styles.innerCancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.submitPriceBtn}
                  onPress={handleRequestPriceChange}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.innerSubmitBtnText}>Submit Request</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Inner Modal: Select Dispute Reason */}
        <Modal
          visible={showDisputeReasonModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDisputeReasonModal(false)}
        >
          <View style={styles.innerModalOverlay}>
            <View style={styles.innerModalCard}>
              <View style={styles.innerModalHeader}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Ionicons name="alert-circle-outline" size={22} color="#EF4444" />
                  <Text style={styles.innerModalTitle}>Raise Job Dispute</Text>
                </View>
                <TouchableOpacity onPress={() => setShowDisputeReasonModal(false)}>
                  <Ionicons name="close-circle" size={24} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <Text style={styles.reasonPromptText}>Select or specify the reason for raising a dispute:</Text>

              {/* Reason Chips */}
              <ScrollView style={{ maxHeight: 150 }} showsVerticalScrollIndicator={false}>
                {DISPUTE_REASON_CHIPS.map((chip) => {
                  const isSelected = selectedReasonChip === chip;
                  return (
                    <TouchableOpacity
                      key={chip}
                      style={[styles.reasonChip, isSelected && styles.reasonChipSelected]}
                      onPress={() => {
                        setSelectedReasonChip(chip);
                        setCustomReasonText(chip);
                      }}
                    >
                      <Ionicons
                        name={isSelected ? "checkmark-circle" : "radio-button-off"}
                        size={16}
                        color={isSelected ? "#EF4444" : "#64748B"}
                        style={{ marginRight: 8 }}
                      />
                      <Text style={[styles.reasonChipText, isSelected && styles.reasonChipTextSelected]}>
                        {chip}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Custom Details Input */}
              <Text style={[styles.reasonPromptText, { marginTop: 12, marginBottom: 6 }]}>Additional Details:</Text>
              <TextInput
                style={styles.reasonTextInput}
                placeholder="Type dispute details here..."
                placeholderTextColor="#64748B"
                multiline
                numberOfLines={3}
                value={customReasonText}
                onChangeText={setCustomReasonText}
              />

              <View style={styles.innerModalButtonRow}>
                <TouchableOpacity
                  style={styles.innerCancelBtn}
                  onPress={() => setShowDisputeReasonModal(false)}
                >
                  <Text style={styles.innerCancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.innerSubmitBtn}
                  onPress={handleConfirmSubmitDispute}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.innerSubmitBtnText}>Submit Dispute</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)", // Dark background
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#0F172A", // Dark Slate / Black pop-up background
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#334155",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#F8FAFC",
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#94A3B8",
  },
  scrollBody: {
    paddingBottom: 10,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    backgroundColor: "#1E293B",
    padding: 12,
    borderRadius: 12,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94A3B8",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgePurple: {
    backgroundColor: "rgba(168, 85, 247, 0.2)",
  },
  statusBadgeGreen: {
    backgroundColor: "rgba(34, 197, 94, 0.2)",
  },
  statusBadgeRed: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#E2E8F0",
  },
  sectionBox: {
    marginBottom: 16,
  },
  otpDisplayContainer: {
    alignItems: "center",
    backgroundColor: "#1E1B4B",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#4338CA",
  },
  otpHeaderLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#A5B4FC",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  otpBox: {
    backgroundColor: "#312E81",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#6366F1",
    marginBottom: 12,
  },
  otpText: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 8,
    textAlign: "center",
  },
  otpInstructions: {
    fontSize: 12,
    color: "#C7D2FE",
    textAlign: "center",
    lineHeight: 18,
  },
  infoBox: {
    alignItems: "center",
    backgroundColor: "#1E293B",
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#F8FAFC",
    marginTop: 8,
    marginBottom: 4,
  },
  infoSubtitle: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 18,
  },
  actionGroup: {
    marginTop: 14,
    gap: 10,
  },
  primaryButton: {
    flexDirection: "row",
    backgroundColor: "#6366F1",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  warningButton: {
    flexDirection: "row",
    backgroundColor: "#F59E0B",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  successButton: {
    flexDirection: "row",
    backgroundColor: "#22C55E",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dangerButton: {
    flexDirection: "row",
    backgroundColor: "#EF4444",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  verifyOtpContainer: {
    backgroundColor: "#1E293B",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  verifyOtpTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F8FAFC",
    marginBottom: 4,
  },
  verifyOtpSubtitle: {
    fontSize: 12,
    color: "#94A3B8",
    marginBottom: 12,
  },
  otpTextInput: {
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "#475569",
    borderRadius: 10,
    padding: 12,
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: 4,
    marginBottom: 12,
  },
  disputeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    marginTop: 6,
  },
  disputeButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#EF4444",
  },
  actionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  innerModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  innerModalCard: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#475569",
  },
  innerModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  innerModalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#EF4444",
  },
  reasonPromptText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#CBD5E1",
    marginBottom: 10,
  },
  reasonChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0F172A",
    padding: 10,
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#334155",
  },
  reasonChipSelected: {
    borderColor: "#EF4444",
    backgroundColor: "rgba(239, 68, 68, 0.15)",
  },
  reasonChipText: {
    fontSize: 12,
    color: "#94A3B8",
  },
  reasonChipTextSelected: {
    color: "#F8FAFC",
    fontWeight: "700",
  },
  reasonTextInput: {
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 10,
    padding: 10,
    color: "#FFFFFF",
    fontSize: 13,
    textAlignVertical: "top",
    marginBottom: 14,
  },
  innerModalButtonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  innerCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#334155",
  },
  innerCancelBtnText: {
    color: "#CBD5E1",
    fontWeight: "600",
    fontSize: 13,
  },
  innerSubmitBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#EF4444",
  },
  innerSubmitBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  priceChangeBannerContainer: {
    backgroundColor: "#1E1B4B",
    borderWidth: 1,
    borderColor: "#4338CA",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  priceChangeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  priceChangeHeaderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F59E0B",
  },
  priceChangeSubtext: {
    fontSize: 12,
    color: "#C7D2FE",
    marginBottom: 12,
  },
  priceComparisonBox: {
    backgroundColor: "#0F172A",
    borderRadius: 12,
    padding: 12,
    gap: 6,
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceLabel: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "600",
  },
  priceOriginal: {
    fontSize: 13,
    color: "#94A3B8",
    textDecorationLine: "line-through",
  },
  priceRequested: {
    fontSize: 14,
    color: "#38BDF8",
    fontWeight: "700",
  },
  priceDiff: {
    fontSize: 14,
    color: "#22C55E",
    fontWeight: "800",
  },
  reasonBox: {
    backgroundColor: "#1E293B",
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  reasonBoxTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#A5B4FC",
    marginBottom: 4,
  },
  reasonBoxText: {
    fontSize: 12,
    color: "#E2E8F0",
    lineHeight: 16,
  },
  priceActionRow: {
    gap: 10,
  },
  acceptPriceButton: {
    flexDirection: "row",
    backgroundColor: "#22C55E",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  refusePriceButton: {
    flexDirection: "row",
    backgroundColor: "#EF4444",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  requestPriceChangeBtn: {
    flexDirection: "row",
    backgroundColor: "#A855F7",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  pendingRequestInfoBox: {
    alignItems: "center",
    backgroundColor: "#1E293B",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F59E0B",
    marginTop: 10,
  },
  priceInput: {
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "#475569",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 10,
  },
  priceChipSelected: {
    borderColor: "#A855F7",
    backgroundColor: "rgba(168, 85, 247, 0.15)",
  },
  priceChipTextSelected: {
    color: "#F8FAFC",
    fontWeight: "700",
  },
  submitPriceBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#A855F7",
  },
});

export default OnSiteOtpModal;
