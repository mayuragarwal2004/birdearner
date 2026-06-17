import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Briefcase, Sparkle } from 'phosphor-react-native';
import { MARKETPLACE_CONSTANTS } from '../../utils/marketplaceUtils';

const AllJobsButton = ({ 
  onPress, 
  currentPriority = "All", 
  rotation,
  panHandlers,
  jobs = { All: [], Immediate: [], High: [], Standard: [] }
}) => {
  // Use a dark purple gradient for the base, matching the screenshot
  const defaultColors = ['#4A148C', '#2E0854']; // Dark purple gradient
  const colors = currentPriority === "All" ? defaultColors : (MARKETPLACE_CONSTANTS.PRIORITY_COLORS[currentPriority] || defaultColors);
  
  const jobCount = currentPriority === "All" 
    ? (jobs.Immediate?.length || 0) + (jobs.High?.length || 0) + (jobs.Standard?.length || 0)
    : jobs[currentPriority]?.length || 0;

  const displayText = currentPriority === "All" ? "All Jobs" : 
                     currentPriority === "Immediate" ? "Immediate Attention" :
                     `${currentPriority} Priority`;

  return (
    <View style={styles.wrapper} {...panHandlers}>
      {/* 
        The outer container clips the circle into a semi-circle. 
        It has panHandlers attached to capture swipes on the area.
      */}
      <Animated.View
        style={[
          styles.circleContainer,
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
          end={{ x: 0, y: 1 }}
          style={styles.gradientCircle}
        >
          {/* Decorative Stars */}
          <Sparkle size={16} color="rgba(255,255,255,0.4)" weight="fill" style={{ position: 'absolute', top: 40, left: 60 }} />
          <Sparkle size={12} color="rgba(255,255,255,0.3)" weight="fill" style={{ position: 'absolute', top: 80, right: 40 }} />
          <Sparkle size={10} color="rgba(255,255,255,0.2)" weight="fill" style={{ position: 'absolute', bottom: 50, left: 80 }} />

          <TouchableOpacity 
            style={styles.content} 
            onPress={onPress}
            activeOpacity={0.8}
          >
            <View style={styles.iconWrapper}>
              <Briefcase size={24} color="#FFF" weight="fill" />
            </View>
            
            <Text style={styles.titleText}>{displayText}</Text>
            
            <View style={styles.pillContainer}>
              <Text style={styles.pillText}>{jobCount}+ Jobs Available</Text>
            </View>
            
            <Text style={styles.subtitleText}>
              Browse all available jobs in your area
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    height: 180, // Half of 360
    alignItems: 'center',
    overflow: 'hidden', // Clips the bottom half to create a semi-circle
    marginBottom: 10,
  },
  circleContainer: {
    width: 360,
    height: 360,
    borderRadius: 180,
    position: 'absolute',
    top: 0, // Align top of circle with top of wrapper
  },
  gradientCircle: {
    flex: 1,
    borderRadius: 180,
    alignItems: 'center',
    paddingTop: 20, // Push content down a bit from the very top edge
  },
  content: {
    alignItems: 'center',
    width: '80%',
    height: 160, // Restrict interaction area to the visible top half
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  titleText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  pillContainer: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  pillText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  subtitleText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default AllJobsButton;