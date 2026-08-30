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
    <View style={styles.cardContainer}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={[styles.iconContainer, isCompleted ? styles.iconCompleted : styles.iconPending]}>
            <MaterialIcons
              name="rate-review"
              size={20}
              color="#FFF"
            />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>
              {isCompleted
                ? (isClient ? "Review Submitted" : "Review Received")
                : "Review Requested"}
            </Text>
            <Text style={styles.subtitle}>
              {isCompleted
                ? (isClient
                  ? "Thank you for your feedback!"
                  : "The client has submitted their feedback.")
                : (isClient 
                  ? "Please rate your experience with the freelancer."
                  : "Waiting for client review.")}
            </Text>
          </View>
        </View>

        {!isCompleted && isClient && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onReviewPress(message)}
          >
            <Text style={styles.buttonText}>Write Review</Text>
            <MaterialIcons name="arrow-forward" size={16} color="#FFF" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginVertical: 4,
    marginHorizontal: 4,
    maxWidth: '100%',
  },
  content: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  iconPending: {
    backgroundColor: '#F59E0B', // Amber for pending
  },
  iconCompleted: {
    backgroundColor: '#10B981', // Emerald for completed
  },
  textContainer: {
    flex: 1,
    flexShrink: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 15,
  },
  actionButton: {
    backgroundColor: '#4C0183',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 12,
    marginRight: 4,
  },
});

export default ReviewRequestMessage;
