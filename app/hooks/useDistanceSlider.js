import { useState, useRef, useCallback, useMemo } from 'react';
import { Animated, PanResponder } from 'react-native';
import { MARKETPLACE_CONSTANTS, snapDistance, debounce } from '../utils/marketplaceUtils';

export const useDistanceSlider = (onDistanceChange) => {
  const [distance, setDistance] = useState(MARKETPLACE_CONSTANTS.MAX_DISTANCE);
  const [sliderWidth, setSliderWidth] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  
  const animatedValue = useRef(new Animated.Value(0)).current;
  const sliderRef = useRef(null);

  // Memoize the debounced function to prevent recreation on every render
  const debouncedOnDistanceChange = useMemo(
    () => debounce((dist) => {
      if (onDistanceChange) {
        onDistanceChange(dist);
      }
    }, MARKETPLACE_CONSTANTS.DEBOUNCE_DELAY),
    [onDistanceChange]
  );

  const updateDistance = (newDistance, triggerFetch = true) => {
    const snappedDistance = snapDistance(
      newDistance, 
      MARKETPLACE_CONSTANTS.DISTANCE_STEP, 
      MARKETPLACE_CONSTANTS.MAX_DISTANCE
    );
    
    setDistance(snappedDistance);

    Animated.timing(animatedValue, {
      toValue: (snappedDistance / MARKETPLACE_CONSTANTS.MAX_DISTANCE) * 100,
      duration: 100, // Faster animation for smoothness
      useNativeDriver: false,
    }).start();

    if (triggerFetch) {
      debouncedOnDistanceChange(snappedDistance);
    }
  };

  // Memoize PanResponder to prevent recreation on every render
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => setIsSliding(true),
    onPanResponderMove: (evt, gestureState) => {
      if (sliderWidth === 0) return;
      let x = gestureState.moveX;
      
      // Get slider's left offset
      sliderRef.current?.measure((fx, fy, width, height, px, py) => {
        let localX = x - px;
        localX = Math.max(0, Math.min(localX, sliderWidth));
        const percentage = (localX / sliderWidth) * 100;
        const newDistance = (percentage / 100) * MARKETPLACE_CONSTANTS.MAX_DISTANCE;
        updateDistance(newDistance, false); // Don't trigger fetch on every move
      });
    },
    onPanResponderRelease: (evt, gestureState) => {
      setIsSliding(false);
      if (sliderWidth === 0) return;
      let x = gestureState.moveX;
      
      sliderRef.current?.measure((fx, fy, width, height, px, py) => {
        let localX = x - px;
        localX = Math.max(0, Math.min(localX, sliderWidth));
        const percentage = (localX / sliderWidth) * 100;
        const newDistance = (percentage / 100) * MARKETPLACE_CONSTANTS.MAX_DISTANCE;
        updateDistance(newDistance, true); // Trigger fetch on release
      });
    },
  }), [sliderWidth, debouncedOnDistanceChange]);

  const incrementDistance = () => {
    updateDistance(distance + MARKETPLACE_CONSTANTS.DISTANCE_STEP);
  };

  const decrementDistance = () => {
    updateDistance(distance - MARKETPLACE_CONSTANTS.DISTANCE_STEP);
  };

  const onSliderLayout = (event) => {
    setSliderWidth(event.nativeEvent.layout.width);
  };

  return {
    distance,
    isSliding,
    animatedValue,
    sliderRef,
    panResponder,
    incrementDistance,
    decrementDistance,
    onSliderLayout,
    updateDistance
  };
};