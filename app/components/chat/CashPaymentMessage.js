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

  let messageData = {};
  try {
    messageData = message.messageData ? JSON.parse(message.messageData) : {};
  } catch (error) {
    console.error('Error parsing messageData:', error, 'Raw messageData:', message.messageData);
    messageData = {};
  }
  
  const { 
    amount = '0', 
    clientConfirmed = false, 
    freelancerConfirmed = false, 
    step = 'initial' 
  } = messageData;
  
  // Ensure amount is always a string and handle edge cases
  const safeAmount = typeof amount === 'string' ? amount : String(amount || '0');
  
  console.log('CashPaymentMessage debug:', {
    messageId: message.id,
    messageType: message.messageType,
    rawAmount: amount,
    safeAmount,
    clientConfirmed,
    freelancerConfirmed,
    step,
    userRole
  });

  const handleClientConfirmPayment = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const api = ApiService;
      await api.init();
      
      const res = await api.makeRequest(`/chat/message/cash-payment/client-confirm`, {
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
      
      const res = await api.makeRequest(`/chat/message/cash-payment/freelancer-confirm`, {
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
          <Text style={styles.statusText}>Both parties have confirmed the cash payment</Text>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <Text style={styles.titleText}>💰 Cash Payment Required</Text>
        <Text style={styles.amountText}>Amount to pay: ₹{safeAmount}</Text>
        
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
    marginVertical: 8,
    marginHorizontal: 15,
  },
  container: {
    backgroundColor: '#FFF3E0',
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  completedContainer: {
    backgroundColor: '#E8F5E8',
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    alignItems: 'center',
  },
  titleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 8,
  },
  completedText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D84315',
    marginBottom: 12,
    textAlign: 'center',
  },
  stepContainer: {
    marginVertical: 12,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 4,
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  stepCompleted: {
    backgroundColor: '#E8F5E8',
    borderColor: '#81C784',
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF9800',
    color: 'white',
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 12,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#5D4037',
  },
  checkmark: {
    fontSize: 18,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  clientButton: {
    backgroundColor: '#4CAF50',
  },
  freelancerButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  waitingText: {
    fontSize: 13,
    color: '#757575',
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
  statusText: {
    fontSize: 13,
    color: '#2E7D32',
    textAlign: 'center',
    marginTop: 4,
  },
});

export default CashPaymentMessage;