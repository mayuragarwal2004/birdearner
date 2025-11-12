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
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  statusText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 12,
  },
  statusPending: {
    backgroundColor: "#FFA500",
  },
  statusAccepted: {
    backgroundColor: "#4CAF50",
  },
  statusRejected: {
    backgroundColor: "#F44336",
  },
  statusCompleted: {
    backgroundColor: "#2196F3",
  },
});

export default StatusBadge;
