import { useState, useRef } from 'react';
import { Animated, PanResponder } from 'react-native';
import { Audio } from 'expo-av';
import { MARKETPLACE_CONSTANTS } from '../utils/marketplaceUtils';

export const usePriorityWheel = (onPriorityPress) => {
  const [priorityIndex, setPriorityIndex] = useState(0); // Start with "All" (index 0)
  const [rotation] = useState(new Animated.Value(0));
  const [sound, setSound] = useState();

  // Play wheel sound
  const playWheelSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require("../../assets/wheel-turn.mp3")
      );
      setSound(sound);
      await sound.replayAsync();
    } catch (e) {
      // Ignore sound errors
    }
  };

  // Handle wheel rotation and navigation
  const handlePriorityWheel = (direction) => {
    let newIndex;
    if (direction === "left") {
      newIndex = (priorityIndex + 1) % MARKETPLACE_CONSTANTS.PRIORITY_FILTERS.length;
    } else {
      newIndex = (priorityIndex - 1 + MARKETPLACE_CONSTANTS.PRIORITY_FILTERS.length) % MARKETPLACE_CONSTANTS.PRIORITY_FILTERS.length;
    }
    
    setPriorityIndex(newIndex);
    playWheelSound();
    
    Animated.timing(rotation, {
      toValue: direction === "left" ? -180 : 180,
      duration: 300,
      useNativeDriver: true,
    }).start(() => rotation.setValue(0));
    
    // Navigate to JobPriority for the new priority
    setTimeout(() => {
      if (onPriorityPress) {
        onPriorityPress(MARKETPLACE_CONSTANTS.PRIORITY_FILTERS[newIndex]);
      }
    }, 150); // Small delay to let animation start
  };

  // PanResponder for wheel
  const wheelPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx > 50) {
        handlePriorityWheel("right"); // Swipe right
      } else if (gestureState.dx < -50) {
        handlePriorityWheel("left"); // Swipe left
      }
    },
  });

  const getCurrentPriority = () => {
    return MARKETPLACE_CONSTANTS.PRIORITY_FILTERS[priorityIndex];
  };

  const resetToAllJobs = () => {
    setPriorityIndex(0); // Reset to "All" jobs (index 0)
  };

  const cleanupSound = () => {
    if (sound) {
      sound.unloadAsync();
    }
  };

  return {
    priorityIndex,
    rotation,
    wheelPanResponder,
    handlePriorityWheel,
    getCurrentPriority,
    resetToAllJobs,
    cleanupSound
  };
};