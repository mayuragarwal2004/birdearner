import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MARKETPLACE_CONSTANTS } from '../../utils/marketplaceUtils';

const AllJobsButton = ({ 
  onPress, 
  currentPriority = "All", 
  rotation,
  panHandlers,
  jobs = { All: [], Immediate: [], High: [], Standard: [] }
}) => {
  const colors = MARKETPLACE_CONSTANTS.PRIORITY_COLORS[currentPriority] || MARKETPLACE_CONSTANTS.PRIORITY_COLORS.All;
  const jobCount = currentPriority === "All" 
    ? (jobs.Immediate?.length || 0) + (jobs.High?.length || 0) + (jobs.Standard?.length || 0)
    : jobs[currentPriority]?.length || 0;

  const displayText = currentPriority === "All" ? "All Jobs" : 
                     currentPriority === "Immediate" ? "Immediate Attention" :
                     `${currentPriority} Priority`;

  return (
    <Animated.View
      {...panHandlers}
      style={[
        styles.allJobsContainer,
        {
          transform: [
            {
              rotate: rotation.interpolate({
                inputRange: [-180, 180],
                outputRange: ["-180deg", "180deg"],
              }),
            },
          ],
        },
      ]}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.allJobsCircle}
      >
        <TouchableOpacity 
          style={styles.allJobsContent} 
          onPress={onPress}
          activeOpacity={0.7}
        >
          <Text style={styles.allJobsText}>{displayText}</Text>
          <Text style={styles.jobCount}>{jobCount}+ Jobs</Text>
          <Text style={styles.swipeHint}>
            (Swipe left/right to filter)
          </Text>
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  allJobsContainer: {
    width: 450,
    height: 450,
    borderRadius: 300,
    position: "absolute",
    bottom: -300,
    right: -30,
    overflow: "hidden",
  },
  allJobsCircle: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  allJobsContent: {
    justifyContent: "flex-start",
    alignItems: "center",
    width: "80%",
    height: "80%",
  },
  allJobsText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 20,
  },
  jobCount: {
    color: "#fff",
    fontSize: 16,
    marginTop: 5,
    textAlign: "center",
  },
  swipeHint: {
    color: '#fff',
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
    opacity: 0.8,
  },
});

export default AllJobsButton;