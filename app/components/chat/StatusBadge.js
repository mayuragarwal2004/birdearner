import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const StatusBadge = ({ status }) => {
  const getStatusStyle = () => {
    switch (status) {
      case 'ACCEPTED':
        return styles.statusAccepted;
      case 'REJECTED':
        return styles.statusRejected;
      case 'COMPLETED':
        return styles.statusCompleted;
      default:
        return styles.statusPending;
    }
  };

  return (
    <View style={[styles.statusContainer, getStatusStyle()]}>
      <Text style={styles.statusText}>{status}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  statusContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 6,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  statusText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statusPending: {
    backgroundColor: "#F59E0B",
  },
  statusAccepted: {
    backgroundColor: "#10B981",
  },
  statusRejected: {
    backgroundColor: "#EF4444",
  },
  statusCompleted: {
    backgroundColor: "#3B82F6",
  },
});

export default StatusBadge;
