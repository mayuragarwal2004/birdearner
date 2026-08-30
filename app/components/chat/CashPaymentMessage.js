import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import ApiService from '../../lib/apiService';
import Toast from 'react-native-toast-message';

const CashPaymentMessage = ({ message, onUpdate, currentUserId, userRole }) => {
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const styles = getStyles(currentTheme);
  const [isProcessing, setIsProcessing] = useState(false);

  // Add safety checks for message prop
  if (!message) {
    console.warn('CashPaymentMessage: message prop is null or undefined');
    return <Text>Error loading payment message</Text>;
  }

  let messageData = message.messageData;
  
  const { 
    amount = '0', 
    clientConfirmed = false, 
    freelancerConfirmed = false, 
    step = 'initial',
    budgetAmount,
    discountAmount,
    penaltyAmount,
  } = messageData || {};
  
  // Ensure amount is always a string and handle edge cases
  const safeAmount = typeof amount === 'string' ? amount : String(amount || '0');

  const handleClientConfirmPayment = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const api = ApiService;
      await api.init();
      
      const res = await api.makeRequest(`/chats/message/cash-payment/client-confirm`, {
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
          text2: 'Payment confirmation sent',
        });
        onUpdate && onUpdate();
      }
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to confirm payment',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFreelancerConfirmReceived = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const api = ApiService;
      await api.init();
      
      const res = await api.makeRequest(`/chats/message/cash-payment/freelancer-confirm`, {
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
          text2: 'Receipt confirmation sent',
        });
        onUpdate && onUpdate();
      }
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to confirm receipt',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const renderContent = () => {
    if (step === 'completed') {
      return (
        <View style={styles.completedContainer}>
          <Text style={styles.completedText}>✅ Payment Completed</Text>
          <Text style={styles.amountText}>Amount: ₹{safeAmount}</Text>
          <Text style={styles.statusText}>Both parties confirmed the cash payment</Text>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <Text style={styles.titleText}>💰 Cash Payment Required</Text>
        <Text style={styles.amountText}>Amount to pay: ₹{safeAmount}</Text>

        {budgetAmount && (
          <View style={styles.breakdownContainer}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Budget:</Text>
              <Text style={styles.breakdownValue}>₹{budgetAmount}</Text>
            </View>
            {parseFloat(penaltyAmount || '0') > 0 && (
              <View style={styles.breakdownRow}>
                <Text style={[styles.breakdownLabel, { color: '#D32F2F' }]}>Penalty:</Text>
                <Text style={[styles.breakdownValue, { color: '#D32F2F' }]}>+₹{penaltyAmount}</Text>
              </View>
            )}
            {parseFloat(discountAmount || '0') > 0 && (
              <View style={styles.breakdownRow}>
                <Text style={[styles.breakdownLabel, { color: '#2E7D32' }]}>Discount:</Text>
                <Text style={[styles.breakdownValue, { color: '#2E7D32' }]}>-₹{discountAmount}</Text>
              </View>
            )}
            <View style={[styles.breakdownRow, styles.breakdownTotal]}>
              <Text style={styles.breakdownTotalLabel}>Total to pay:</Text>
              <Text style={styles.breakdownTotalValue}>₹{safeAmount}</Text>
            </View>
          </View>
        )}
        
        <View style={styles.stepContainer}>
          <View style={[styles.step, clientConfirmed && styles.stepCompleted]}>
            <Text style={styles.stepNumber}>1</Text>
            <Text style={styles.stepText}>Client pays in cash</Text>
            {clientConfirmed && <Text style={styles.checkmark}>✓</Text>}
          </View>
          
          <View style={[styles.step, freelancerConfirmed && styles.stepCompleted]}>
            <Text style={styles.stepNumber}>2</Text>
            <Text style={styles.stepText}>Freelancer confirms receipt</Text>
            {freelancerConfirmed && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </View>

        {!clientConfirmed && userRole === 'client' && (
          <TouchableOpacity
            style={[styles.button, styles.clientButton]}
            onPress={handleClientConfirmPayment}
            disabled={isProcessing}
          >
            <Text style={styles.buttonText}>
              {isProcessing ? 'Processing...' : 'I have paid in cash'}
            </Text>
          </TouchableOpacity>
        )}

        {clientConfirmed && !freelancerConfirmed && userRole === 'freelancer' && (
          <TouchableOpacity
            style={[styles.button, styles.freelancerButton]}
            onPress={handleFreelancerConfirmReceived}
            disabled={isProcessing}
          >
            <Text style={styles.buttonText}>
              {isProcessing ? 'Processing...' : 'I have received the payment'}
            </Text>
          </TouchableOpacity>
        )}

        {!clientConfirmed && userRole === 'freelancer' && (
          <Text style={styles.waitingText}>Waiting for client to confirm payment...</Text>
        )}

        {clientConfirmed && !freelancerConfirmed && userRole === 'client' && (
          <Text style={styles.waitingText}>Waiting for freelancer to confirm receipt...</Text>
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
    backgroundColor: '#FFF3E0',
    padding: 10,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  completedContainer: {
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
    color: '#E65100',
    marginBottom: 4,
  },
  completedText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  amountText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#D84315',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepContainer: {
    marginVertical: 8,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginVertical: 3,
    backgroundColor: '#FFF8E1',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  stepCompleted: {
    backgroundColor: '#E8F5E8',
    borderColor: '#81C784',
  },
  stepNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF9800',
    color: 'white',
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 11,
    fontWeight: 'bold',
    marginRight: 8,
  },
  stepText: {
    flex: 1,
    fontSize: 12,
    color: '#5D4037',
  },
  checkmark: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  clientButton: {
    backgroundColor: '#4CAF50',
  },
  freelancerButton: {
    backgroundColor: '#2196F3',
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
    marginTop: 8,
    fontStyle: 'italic',
  },
  statusText: {
    fontSize: 11,
    color: '#2E7D32',
    textAlign: 'center',
    marginTop: 4,
  },
  breakdownContainer: {
    backgroundColor: '#FFF8E1',
    borderRadius: 6,
    padding: 8,
    marginTop: 4,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  breakdownLabel: {
    fontSize: 11,
    color: '#5D4037',
  },
  breakdownValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5D4037',
  },
  breakdownTotal: {
    borderTopWidth: 1,
    borderTopColor: '#FFB74D',
    marginTop: 4,
    paddingTop: 6,
  },
  breakdownTotalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E65100',
  },
  breakdownTotalValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E65100',
  },
});

export default CashPaymentMessage;