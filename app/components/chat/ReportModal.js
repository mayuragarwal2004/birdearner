import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { useTheme } from "../../context/ThemeContext";

const ReportModal = ({
  visible,
  onClose,
  onSubmit,
  selectedReason,
  onSelectReason,
}) => {
  const reportOptions = [
    "Inappropriate content",
    "Spam",
    "Harassment",
    "Fraud",
    "Other",
  ];

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Report</Text>
          <Text style={styles.modalSubtitle}>
            Why are you reporting this user?
          </Text>
          <Text style={styles.modalDescription}>
            Your report is anonymous. If someone is in immediate danger,
            call the local emergency services - don't wait.
          </Text>
          {reportOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => onSelectReason(option)}
              style={styles.optionButton}
            >
              <Text style={styles.optionText}>{option}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            onPress={onSubmit}
            style={[styles.modalButton, { marginTop: 20 }]}
            disabled={!selectedReason}
          >
            <Text style={styles.modalButtonText}>Submit Report</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onClose}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "100%",
    height: "100%",
    padding: 30,
    backgroundColor: "#121212",
    borderRadius: 10,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 10,
  },
  modalDescription: {
    fontSize: 14,
    color: "#b0b0b0",
    textAlign: "center",
    marginBottom: 20,
  },
  optionButton: {
    width: "100%",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#303030",
  },
  optionText: {
    fontSize: 16,
    color: "#fff",
    textAlign: "left",
  },
  modalButton: {
    padding: 10,
    backgroundColor: "#5c2d91",
    borderRadius: 5,
    width: "45%",
    alignItems: "center",
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  cancelButton: {
    marginTop: 10,
    padding: 10,
  },
  cancelText: {
    color: "#fff",
    fontSize: 16,
  },
});

export default ReportModal;