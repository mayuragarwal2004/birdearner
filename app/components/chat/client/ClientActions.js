import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from "../../../context/ThemeContext";

const ClientActions = ({ 
  job, 
  freelancer, 
  chatStatus, 
  onAccept, 
  onReject, 
  onCancelJob, 
  onConfirmCompletion 
}) => {
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const styles = getStyles(currentTheme);

  const isCancelled = ["CANCELLED", "CANCELLED_BY_CLIENT", "CANCELLED_BY_FREELANCER", "CANCELLED_SCOPE_MISMATCH", "DEADLINE_EXPIRED"].includes(job?.jobStatus);

  // Don't show any actions if job is cancelled
  if (isCancelled) return null;

  // Do NOT show accept/reject buttons if:
  // 1. Job is already assigned (job.assignedFreelancerId or assignedFreelancer is present)
  // 2. Job status is not OPEN (e.g. IN_PROGRESS, CONFIRMED, COMPLETED, ASSIGNED, etc.)
  // 3. Chat status is ACCEPTED, REJECTED, BLOCKED, or COMPLETED
  const isAssignedOrAccepted = 
    Boolean(job?.assignedFreelancerId) ||
    Boolean(job?.assignedFreelancer?.id) ||
    (job?.jobStatus && job?.jobStatus?.toUpperCase() !== 'OPEN') ||
    ['ACCEPTED', 'REJECTED', 'BLOCKED', 'COMPLETED'].includes(chatStatus?.toUpperCase());

  // Show accept/reject buttons ONLY when job is strictly OPEN and unassigned
  if (!isAssignedOrAccepted) {
    return (
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={onAccept}
        >
          <Text style={styles.buttonText}>✓  Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.rejectButton}
          onPress={onReject}
        >
          <Text style={styles.buttonText}>✕  Reject</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
};

const getStyles = (currentTheme) => StyleSheet.create({
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
    gap: 10,
    marginTop: 8,
    paddingHorizontal: 15,
  },
  acceptButton: {
    backgroundColor: "#4C0183",
    paddingHorizontal: 22,
    paddingVertical: 7,
    borderRadius: 8,
    flex: 1,
  },
  rejectButton: {
    backgroundColor: "#A00B0B",
    paddingHorizontal: 22,
    paddingVertical: 7,
    borderRadius: 8,
    flex: 1,
  },
  cancelButton: {
    backgroundColor: "#FF6B35",
    paddingHorizontal: 22,
    paddingVertical: 7,
    borderRadius: 8,
    flex: 1,
  },
  completionButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 22,
    paddingVertical: 7,
    borderRadius: 8,
    flex: 1,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ClientActions;