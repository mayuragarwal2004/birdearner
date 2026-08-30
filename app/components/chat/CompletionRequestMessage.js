import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import ApiService from '../../lib/apiService';
import Toast from 'react-native-toast-message';

const CompletionRequestMessage = ({ message, onUpdate, currentUserId, userRole }) => {
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const styles = getStyles(currentTheme);
  const [isProcessing, setIsProcessing] = useState(false);

  // Add safety checks for message prop
  if (!message) {
    console.warn('CompletionRequestMessage: message prop is null or undefined');
    return <Text>Error loading completion request</Text>;
  }

  let messageData = message.messageData;

  const {
    requestedBy,
    status = 'pending',
    paymentMethod,
    budgetAmount = '0',
    jobId
  } = messageData || {};

  // Ensure amount is always a string
  const safeAmount = typeof budgetAmount === 'string' ? budgetAmount : String(budgetAmount || '0');

  const handleConfirmCompletion = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const api = ApiService;
      await api.init();
      
      const res = await api.makeRequest(`/chats/message/completion-request/confirm`, {
        method: 'POST',
        body: JSON.stringify({
          messageId: message.id,
          threadId: message.chatThreadId || message.threadId
        }),
      });

      if (res.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Project completion confirmed',
        });
        onUpdate && onUpdate();
      }
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to confirm completion',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const renderContent = () => {
    if (status === 'confirmed') {
      return (
        <View style={styles.confirmedContainer}>
          <Text style={styles.confirmedText}>✅ Project Completion Confirmed</Text>
          <Text style={styles.amountText}>Project Value: ₹{safeAmount}</Text>
          <Text style={styles.statusText}>
            {paymentMethod === 'CASH' 
              ? 'Cash payment process initiated' 
              : 'Platform payment will be processed automatically'
            }
          </Text>
        </View>
      );
    }

    if (status === 'closed') {
      return (
        <View style={styles.closedContainer}>
          <Text style={styles.closedText}>❌ Request Closed</Text>
          <Text style={styles.closedSubtext}>
            This completion request has been superseded by a newer request
          </Text>
        </View>
      );
    }

    const isMyRequest = message.senderId === currentUserId;
    const canConfirm = !isMyRequest && status === 'pending';
    const otherPartyRole = userRole === 'client' ? 'freelancer' : 'client';
    const senderRoleName = requestedBy === 'freelancer' ? 'Freelancer' : 'Client';

    return (
      <View style={styles.container}>
        <Text style={styles.titleText}>🎯 Project Completion Request</Text>
        <Text style={styles.requestText}>
          {isMyRequest
            ? `You sent a project completion request. Waiting for ${otherPartyRole} confirmation...`
            : `${senderRoleName} has requested confirmation that the project is completed.`}
        </Text>
        <Text style={styles.amountText}>Project Value: ₹{safeAmount}</Text>
        <Text style={styles.paymentInfo}>
          Payment Method: {paymentMethod === 'CASH' ? 'Cash Payment' : 'Platform Payment'}
        </Text>

        {canConfirm && (
          <TouchableOpacity
            style={[styles.button, styles.confirmButton]}
            onPress={handleConfirmCompletion}
            disabled={isProcessing}
          >
            <Text style={styles.buttonText}>
              {isProcessing ? 'Processing...' : 'Confirm Project Completion'}
            </Text>
          </TouchableOpacity>
        )}

        {isMyRequest && (
          <Text style={styles.waitingText}>
            Waiting for {otherPartyRole} confirmation...
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.messageContainer}>
      {renderContent()}
    </View>
  );
};

const getStyles = (currentTheme) => StyleSheet.create({
  messageContainer: {
    marginVertical: 6,
    marginHorizontal: 4,
    maxWidth: '100%',
  },
  container: {
    backgroundColor: '#FFF9C4',
    padding: 10,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FBC02D',
  },
  confirmedContainer: {
    backgroundColor: '#E8F5E8',
    padding: 10,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    alignItems: 'center',
  },
  titleText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F57F17',
    marginBottom: 4,
  },
  confirmedText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  closedContainer: {
    backgroundColor: '#FFEBEE',
    padding: 10,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
    alignItems: 'center',
  },
  closedText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#C62828',
    marginBottom: 4,
  },
  closedSubtext: {
    fontSize: 11,
    color: '#8D6E63',
    textAlign: 'center',
  },
  requestText: {
    fontSize: 12,
    color: '#5D4037',
    marginBottom: 8,
    lineHeight: 17,
  },
  amountText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#D84315',
    marginBottom: 6,
    textAlign: 'center',
  },
  paymentInfo: {
    fontSize: 11,
    color: '#6D4C41',
    marginBottom: 10,
    textAlign: 'center',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
  },
  waitingText: {
    fontSize: 11,
    color: '#757575',
    textAlign: 'center',
    marginTop: 6,
    fontStyle: 'italic',
  },
  statusText: {
    fontSize: 11,
    color: '#2E7D32',
    textAlign: 'center',
    marginTop: 4,
  },
});

export default CompletionRequestMessage;