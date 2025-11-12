import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const AssignmentBanner = ({ assignedFreelancerId, currentFreelancerId }) => {
  if (!assignedFreelancerId || assignedFreelancerId === currentFreelancerId) {
    return null;
  }

  return (
    <View style={styles.assignedBanner}>
      <Text style={styles.assignedText}>
        Job has been assigned to another freelancer
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  assignedBanner: {
    backgroundColor: "#FFE0E0",
    padding: 10,
    marginTop: 10,
    marginHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FFB0B0",
  },
  assignedText: {
    color: "#D32F2F",
    textAlign: "center",
    fontSize: 14,
    fontWeight: "500",
  },
});

export default AssignmentBanner;