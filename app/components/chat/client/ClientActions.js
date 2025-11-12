import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from "../../../context/ThemeContext";

const ClientActions = ({ onAccept, onReject, status, assignedFreelancerId, currentFreelancerId }) => {
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const styles = getStyles(currentTheme);

  if (assignedFreelancerId || status !== 'PENDING') return null;

  return (
    <View style={styles.actionButtons}>
      <TouchableOpacity
        style={styles.acceptButton}
        onPress={onAccept}
      >
        <Text style={styles.buttonText}>Accept</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.rejectButton}
        onPress={onReject}
      >
        <Text style={styles.buttonText}>Reject</Text>
      </TouchableOpacity>
    </View>
  );
};

const getStyles = (currentTheme) => StyleSheet.create({
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    gap: 10,
    marginTop: 25,
    paddingHorizontal: 15,
  },
  acceptButton: {
    backgroundColor: "#4C0183",
    paddingHorizontal: 22,
    paddingVertical: 7,
    borderRadius: 8,
  },
  rejectButton: {
    backgroundColor: "#A00B0B",
    paddingHorizontal: 22,
    paddingVertical: 7,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ClientActions;