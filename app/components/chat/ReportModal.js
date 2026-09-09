import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ReportModal = ({
  visible,
  onClose,
  onSubmit,
  selectedReason,
  onSelectReason,
  details,
  onChangeDetails,
  isSubmitting = false,
}) => {
  const [localDetails, setLocalDetails] = useState('');

  const reportOptions = [
    "Inappropriate content",
    "Spam",
    "Harassment",
    "Fraud",
    "Other",
  ];

  const handleDetailsChange = (text) => {
    setLocalDetails(text);
    if (onChangeDetails) {
      onChangeDetails(text);
    }
  };

  const handleSubmit = () => {
    if (!selectedReason || isSubmitting) return;
    onSubmit(localDetails);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.safeContainer}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.modalTitle}>Report User</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeIconButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              <Text style={styles.modalSubtitle}>
                Why are you reporting this user?
              </Text>

              {/* Options */}
              {reportOptions.map((option, index) => {
                const isSelected = selectedReason === option;
                return (
                  <TouchableOpacity
                    key={index}
                    activeOpacity={0.7}
                    onPress={() => onSelectReason(option)}
                    style={[styles.optionButton, isSelected && styles.optionButtonSelected]}
                  >
                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                      {option}
                    </Text>
                    <Ionicons
                      name={isSelected ? "radio-button-on" : "radio-button-off"}
                      size={22}
                      color={isSelected ? "#A855F7" : "#64748B"}
                    />
                  </TouchableOpacity>
                );
              })}

              {/* Optional Details Input */}
              {selectedReason && (
                <View style={styles.detailsContainer}>
                  <Text style={styles.detailsLabel}>Additional Details (Optional)</Text>
                  <TextInput
                    style={styles.detailsInput}
                    placeholder="Describe the issue in more detail..."
                    placeholderTextColor="#64748B"
                    multiline
                    numberOfLines={3}
                    value={details !== undefined ? details : localDetails}
                    onChangeText={handleDetailsChange}
                  />
                </View>
              )}

              {/* Buttons */}
              <TouchableOpacity
                onPress={handleSubmit}
                style={[
                  styles.submitButton,
                  (!selectedReason || isSubmitting) && styles.submitButtonDisabled,
                ]}
                disabled={!selectedReason || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit Report</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onClose}
                style={styles.cancelButton}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "#121212",
  },
  safeContainer: {
    flex: 1,
    backgroundColor: "#121212",
  },
  modalContent: {
    flex: 1,
    backgroundColor: "#121212",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 20 : 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  closeIconButton: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F1F5F9",
    marginBottom: 12,
  },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1E293B',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.2)',
  },
  modalDescription: {
    flex: 1,
    fontSize: 13,
    color: "#94A3B8",
    lineHeight: 18,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: "100%",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  optionButtonSelected: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderColor: '#A855F7',
  },
  optionText: {
    fontSize: 15,
    fontWeight: '500',
    color: "#CBD5E1",
  },
  optionTextSelected: {
    color: "#FFFFFF",
    fontWeight: '600',
  },
  detailsContainer: {
    marginTop: 10,
    marginBottom: 10,
  },
  detailsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 8,
  },
  detailsInput: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    color: '#FFFFFF',
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#334155',
  },
  submitButton: {
    marginTop: 20,
    paddingVertical: 14,
    backgroundColor: "#7C3AED",
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: "#334155",
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  cancelButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelText: {
    color: "#94A3B8",
    fontSize: 15,
    fontWeight: "600",
  },
});

export default ReportModal;