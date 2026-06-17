import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Lightning, Star, Flag, CaretRight, Sparkle } from 'phosphor-react-native';

const getPriorityConfig = (priority) => {
  switch (priority) {
    case 'Immediate':
      return {
        title: 'Immediate Attention',
        color: '#FF3B30', // Red
        bg: '#FFF0F0',
        iconBg: '#FFD6D6',
        icon: <Lightning size={24} color="#FF3B30" weight="fill" />
      };
    case 'High':
      return {
        title: 'High Priority',
        color: '#FF9500', // Orange
        bg: '#FFF9E6',
        iconBg: '#FFECC0',
        icon: <Star size={24} color="#FF9500" weight="fill" />
      };
    case 'Standard':
    default:
      return {
        title: 'Standard Priority',
        color: '#34C759', // Green
        bg: '#E8F5E9',
        iconBg: '#CDEBCE',
        icon: <Flag size={24} color="#34C759" weight="fill" />
      };
  }
};

const PrioritySection = ({ 
  jobs, 
  onPriorityPress,
  theme 
}) => {
  const isDark = theme.theme === 'dark';

  const renderPriorityCard = (priority) => {
    const jobCount = jobs[priority]?.length || 0;
    const config = getPriorityConfig(priority);

    return (
      <TouchableOpacity
        key={priority}
        style={[
          styles.priorityCard,
          { backgroundColor: isDark ? '#1f2937' : config.bg } // Adjust bg for dark mode
        ]}
        onPress={() => onPriorityPress(priority)}
        activeOpacity={0.8}
      >
        <View style={[styles.iconBox, { backgroundColor: isDark ? '#374151' : config.iconBg }]}>
          {config.icon}
        </View>

        <View style={styles.textContainer}>
          <Text style={[styles.priorityTitle, { color: isDark ? '#FFF' : '#000' }]}>
            {config.title}
          </Text>
          <Text style={[styles.jobCount, { color: isDark ? '#9CA3AF' : '#666' }]}>
            {jobCount}+ Jobs
          </Text>
        </View>

        <View style={[styles.viewJobsButton, { borderColor: config.color }]}>
          <Text style={[styles.viewJobsText, { color: config.color }]}>View Jobs</Text>
          <CaretRight size={14} color={config.color} weight="bold" style={styles.caret} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.priorityContainer}>
      <View style={styles.headerRow}>
        <Sparkle size={20} color="#C4B5FD" weight="fill" />
        <Text style={[styles.jobsAround, { color: isDark ? '#FFF' : '#000' }]}>
          Jobs around you
        </Text>
        <Sparkle size={20} color="#C4B5FD" weight="fill" />
      </View>
      
      {['Immediate', 'High', 'Standard'].map(priority => 
        renderPriorityCard(priority)
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  priorityContainer: {
    marginBottom: 40, // Space for the All Jobs wheel
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  jobsAround: {
    fontSize: 20,
    fontWeight: "bold",
    marginHorizontal: 8,
  },
  priorityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  priorityTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  jobCount: {
    fontSize: 13,
  },
  viewJobsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  viewJobsText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  caret: {
    marginLeft: 4,
  }
});

export default PrioritySection;