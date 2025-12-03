import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MARKETPLACE_CONSTANTS } from '../../utils/marketplaceUtils';

const PrioritySection = ({ 
  jobs, 
  onPriorityPress,
  theme 
}) => {
  const styles = getStyles(theme);

  const renderPriorityButton = (priority) => {
    const jobCount = jobs[priority]?.length || 0;
    const colors = MARKETPLACE_CONSTANTS.PRIORITY_COLORS[priority];

    return (
      <TouchableOpacity
        key={priority}
        style={styles.priorityBox}
        onPress={() => onPriorityPress(priority)}
      >
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.priorityButton}
        >
          <Text style={styles.priorityText}>
            {priority === 'Immediate' ? 'Immediate Attention' : `${priority} Priority`} • {jobCount}+ Jobs
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.priorityContainer}>
      <Text style={styles.jobsAround}>Jobs around...</Text>
      
      {MARKETPLACE_CONSTANTS.PRIORITIES.map(priority => 
        renderPriorityButton(priority)
      )}
    </View>
  );
};

const getStyles = (currentTheme) => StyleSheet.create({
  priorityContainer: {
    alignItems: "center",
    marginBottom: 50,
  },
  jobsAround: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 10,
    color: currentTheme.text,
  },
  priorityBox: {
    width: "100%",
  },
  priorityButton: {
    width: "100%",
    padding: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  priorityText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 18,
    textAlign: 'center',
  },
});

export default PrioritySection;