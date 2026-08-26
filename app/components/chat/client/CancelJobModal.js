import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, TextInput, ScrollView } from 'react-native';

const CANCELLATION_REASONS = [
  'Budget constraints',
  'No longer needed',
  'Found another freelancer',
  'Project requirements changed',
  'Communication issues',
  'Freelancer not responding',
  'Quality concerns',
  'Timeline no longer works',
];

const CancelJobModal = ({ visible, onConfirm, onCancel, jobBudget }) => {
  const [selectedReason, setSelectedReason] = useState(null);
  const [customReason, setCustomReason] = useState('');
  const penaltyAmount = jobBudget ? (parseFloat(jobBudget) * 0.02).toFixed(2) : '0.00';

  const finalReason = selectedReason === 'Other' ? customReason.trim() : selectedReason;
  const canConfirm = finalReason && finalReason.length > 0;

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm(finalReason);
    setSelectedReason(null);
    setCustomReason('');
  };

  const handleCancel = () => {
    setSelectedReason(null);
    setCustomReason('');
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>Cancel Job</Text>

            <View style={styles.warningBox}>
              <Text style={styles.warningIcon}>⚠️</Text>
              <Text style={styles.warningText}>
                Warning: A 2% penalty of ₹{penaltyAmount} will be added to your next job. You will need to pay this penalty amount directly to the freelancer you assign to your next job as a token of cancellation penalty.
              </Text>
            </View>

            <Text style={styles.label}>Reason for cancellation *</Text>

            {CANCELLATION_REASONS.map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.reasonOption,
                  selectedReason === item && styles.reasonOptionSelected,
                ]}
                onPress={() => {
                  setSelectedReason(item);
                  setCustomReason('');
                }}
              >
                <View style={[
                  styles.radio,
                  selectedReason === item && styles.radioSelected,
                ]}>
                  {selectedReason === item && <View style={styles.radioInner} />}
                </View>
                <Text style={[
                  styles.reasonText,
                  selectedReason === item && styles.reasonTextSelected,
                ]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[
                styles.reasonOption,
                selectedReason === 'Other' && styles.reasonOptionSelected,
              ]}
              onPress={() => setSelectedReason('Other')}
            >
              <View style={[
                styles.radio,
                selectedReason === 'Other' && styles.radioSelected,
              ]}>
                {selectedReason === 'Other' && <View style={styles.radioInner} />}
              </View>
              <Text style={[
                styles.reasonText,
                selectedReason === 'Other' && styles.reasonTextSelected,
              ]}>
                Other
              </Text>
            </TouchableOpacity>

            {selectedReason === 'Other' && (
              <TextInput
                style={styles.customInput}
                placeholder="Please specify your reason..."
                placeholderTextColor="#999"
                value={customReason}
                onChangeText={setCustomReason}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.confirmButton, !canConfirm && styles.disabledButton]}
                onPress={handleConfirm}
                disabled={!canConfirm}
              >
                <Text style={styles.buttonText}>Yes, Cancel Job</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
              >
                <Text style={styles.buttonText}>Go Back</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    width: '85%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 15,
    color: '#1E293B',
  },
  warningBox: {
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
  },
  warningIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    flex: 1,
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 6,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reasonOptionSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  radioSelected: {
    borderColor: '#6366F1',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#6366F1',
  },
  reasonText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  reasonTextSelected: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  customInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    width: '100%',
    minHeight: 70,
    backgroundColor: '#F9FAFB',
    marginBottom: 15,
    marginTop: 4,
    color: '#333',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  confirmButton: {
    backgroundColor: '#dc3545',
    padding: 12,
    borderRadius: 8,
    width: '48%',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    padding: 12,
    borderRadius: 8,
    width: '48%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default CancelJobModal;
