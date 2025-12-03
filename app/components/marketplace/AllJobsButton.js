import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const AllJobsButton = ({ onPress }) => {
  return (
    <LinearGradient
      colors={["#762BAD", "#300E49"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.allJobsContainer}
    >
      <TouchableOpacity 
        style={styles.allJobsButton} 
        onPress={onPress}
      >
        <Text style={styles.allJobsText}>View Jobs</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  allJobsContainer: {
    alignItems: "center",
    width: 450,
    height: 450,
    borderRadius: 300,
    position: "absolute",
    bottom: -300,
    right: -30,
    padding: 10,
  },
  allJobsButton: {
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    width: "90%",
  },
  allJobsText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "semibold",
  },
});

export default AllJobsButton;