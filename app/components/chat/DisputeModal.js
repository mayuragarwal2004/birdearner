import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
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

const DisputeModal = ({ visible, onClose, jobId, onDisputeRaised }) => {
  const [loading, setLoading] = useState(false);
  const [selectedReason, setSelectedReason] = useState(DISPUTE_REASON_CHIPS[0]);
  const [customReasonText, setCustomReasonText] = useState(DISPUTE_REASON_CHIPS[0]);

  const handleSubmit = async () => {
    const finalReason = customReasonText.trim() || selectedReason;
    if (!finalReason) {
      return;
    }
    try {
      setLoading(true);
      await apiService.updatePhysicalJobProgress(jobId, "RAISE_DISPUTE", { reason: finalReason });
      onClose();
      onDisputeRaised?.();
    } catch (err) {
      console.error("Failed to raise dispute:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedReason(DISPUTE_REASON_CHIPS[0]);
    setCustomReasonText(DISPUTE_REASON_CHIPS[0]);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="alert-circle-outline" size={22} color="#EF4444" />
              <Text style={styles.title}>Raise Job Dispute</Text>
            </View>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close-circle" size={24} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <Text style={styles.promptText}>Select or specify the reason for raising a dispute:</Text>

          <ScrollView style={{ maxHeight: 150 }} showsVerticalScrollIndicator={false}>
            {DISPUTE_REASON_CHIPS.map((chip) => {
              const isSelected = selectedReason === chip;
              return (
                <TouchableOpacity
                  key={chip}
                  style={[styles.reasonChip, isSelected && styles.reasonChipSelected]}
                  onPress={() => {
                    setSelectedReason(chip);
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

          <Text style={[styles.promptText, { marginTop: 12, marginBottom: 6 }]}>Additional Details:</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Type dispute details here..."
            placeholderTextColor="#64748B"
            multiline
            numberOfLines={3}
            value={customReasonText}
            onChangeText={setCustomReasonText}
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, loading && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Submit Dispute</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1E293B",
  },
  promptText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#64748B",
    marginBottom: 10,
  },
  reasonChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 6,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  reasonChipSelected: {
    backgroundColor: "#FEF2F2",
    borderColor: "#EF4444",
  },
  reasonChipText: {
    fontSize: 13,
    color: "#475569",
    flex: 1,
  },
  reasonChipTextSelected: {
    color: "#DC2626",
    fontWeight: "600",
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: "#1E293B",
    backgroundColor: "#F8FAFC",
    minHeight: 70,
    textAlignVertical: "top",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  submitBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#EF4444",
    alignItems: "center",
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

export default DisputeModal;
