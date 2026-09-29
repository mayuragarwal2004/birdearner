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

  // Show accept/reject buttons ONLY when job data is loaded AND job is strictly OPEN and unassigned.
  // Fail-closed: while job is loading/undefined, never show the buttons.
  const isJobOpenAndUnassigned =
    Boolean(job?.jobStatus) &&
    job.jobStatus.toUpperCase() === 'OPEN' &&
    !job?.assignedFreelancerId &&
    !job?.assignedFreelancer?.id &&
    !['ACCEPTED', 'REJECTED', 'BLOCKED', 'COMPLETED'].includes((chatStatus || '').toUpperCase());

  if (isJobOpenAndUnassigned) {
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