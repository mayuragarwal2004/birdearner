import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const ReviewRequestMessage = ({ message, onReviewPress, currentUserId, userRole }) => {
  const isClient = userRole === 'client';
  
  let content = {};
  try {
      content = typeof message.messageContent === 'string' 
          ? JSON.parse(message.messageContent) 
          : message.messageContent;
  } catch (e) {
      console.warn("ReviewRequestMessage: Failed to parse content", e);
  }

  const isCompleted = content?.status === 'completed';

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
            <View style={[styles.iconContainer, isCompleted ? styles.iconCompleted : styles.iconPending]}>
                <MaterialIcons 
                    name={isCompleted ? "rate-review" : "rate-review"} 
                    size={24} 
                    color="#FFF" 
                />
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.title}>
                    {isCompleted ? "Review Submitted" : "Review Requested"}
                </Text>
                <Text style={styles.subtitle}>
                    {isCompleted 
                        ? "Thank you for your feedback!" 
                        : "Please rate your experience with the freelancer."}
                </Text>
            </View>
        </View>

        {!isCompleted && isClient && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => onReviewPress(message)}
          >
            <Text style={styles.buttonText}>Write Review</Text>
            <MaterialIcons name="arrow-forward" size={18} color="#FFF" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    width: '100%',
    alignItems: 'center',
  },
  content: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    width: '85%',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconPending: {
    backgroundColor: '#F59E0B', // Amber for pending
  },
  iconCompleted: {
    backgroundColor: '#10B981', // Emerald for completed
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  actionButton: {
    backgroundColor: '#4C0183',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: "#4C0183",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
    marginRight: 6,
  },
});

export default ReviewRequestMessage;
