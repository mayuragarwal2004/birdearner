import KeyboardAwareScrollView from "../KeyboardAwareScrollView";
import React, { useEffect, useState } from "react";
import { Modal, View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView, ActivityIndicator } from "react-native";

// Must match CLIENT_EMERGENCY_REASONS in api/lib/services/jobs.ts (the server rejects anything else)
export const CLIENT_EMERGENCY_REASONS = [
  "Freelancer did not start the work",
  "Freelancer asked for extra money",
  "Freelancer is not providing the requested service",
  "Wrong service",
  "Other",
];

/**
 * Reason picker shown before an emergency cancellation (inside the 5-minute post-OTP window).
 * - CLIENT: must pick one of the listed reasons.
 * - FREELANCER: must type a reason.
 * onSubmit receives the reason string to send with EMERGENCY_CANCEL.
 */
export default function EmergencyCancelReasonModal({ visible, role = "CLIENT", submitting = false, onClose, onSubmit }) {
  const [selected, setSelected] = useState(null);
  const [freelancerReason, setFreelancerReason] = useState("");

  useEffect(() => {
    if (!visible) {
      setSelected(null);
      setFreelancerReason("");
    }
  }, [visible]);

  const isClient = role === "CLIENT";
  const reason = isClient ? selected : freelancerReason.trim();
  const canSubmit = Boolean(reason) && !submitting;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Cancel job without penalty?</Text>
          <Text style={styles.subtitle}>
            {isClient
              ? "Tell us why you are cancelling. This is recorded on the booking."
              : "Tell us why you are cancelling. This is recorded on the booking and reviewed by BirdEarner."}
          </Text>

          {isClient ? (
            <KeyboardAwareScrollView style={styles.options}>
              {CLIENT_EMERGENCY_REASONS.map((option) => {
                const active = selected === option;
                return (
                  <TouchableOpacity
                    key={option}
                    style={[styles.option, active && styles.optionActive]}
                    onPress={() => setSelected(option)}
                    disabled={submitting}
                  >
                    <View style={[styles.radio, active && styles.radioActive]} />
                    <Text style={[styles.optionText, active && styles.optionTextActive]}>{option}</Text>
                  </TouchableOpacity>
                );
              })}
            </KeyboardAwareScrollView>
          ) : (
            <TextInput
              style={styles.input}
              placeholder="Describe the reason"
              placeholderTextColor="#9CA3AF"
              value={freelancerReason}
              onChangeText={setFreelancerReason}
              multiline
              editable={!submitting}
            />
          )}

          <View style={styles.row}>
            <TouchableOpacity style={[styles.button, styles.secondary]} onPress={onClose} disabled={submitting}>
              <Text style={styles.secondaryText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.danger, !canSubmit && styles.disabled]}
              onPress={() => canSubmit && onSubmit(reason)}
              disabled={!canSubmit}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.dangerText}>Cancel Job</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20 },
  title: { fontSize: 17, fontWeight: "800", color: "#0F172A", marginBottom: 6 },
  subtitle: { fontSize: 13, color: "#64748B", marginBottom: 14 },
  options: { maxHeight: 320, marginBottom: 14 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 8,
  },
  optionActive: { borderColor: "#EF4444", backgroundColor: "#FEF2F2" },
  radio: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: "#94A3B8", marginRight: 10 },
  radioActive: { borderColor: "#EF4444", backgroundColor: "#EF4444" },
  optionText: { flex: 1, fontSize: 14, color: "#334155" },
  optionTextActive: { color: "#0F172A", fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
    minHeight: 90,
    textAlignVertical: "top",
    marginBottom: 14,
    color: "#0F172A",
  },
  row: { flexDirection: "row", gap: 10 },
  button: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  secondary: { backgroundColor: "#F1F5F9" },
  secondaryText: { color: "#334155", fontWeight: "700" },
  danger: { backgroundColor: "#EF4444" },
  dangerText: { color: "#FFFFFF", fontWeight: "700" },
  disabled: { opacity: 0.5 },
});
