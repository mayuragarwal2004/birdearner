import { useState, useRef, useCallback, useMemo } from 'react';
import { Animated, PanResponder } from 'react-native';
import { MARKETPLACE_CONSTANTS, snapDistance, debounce } from '../utils/marketplaceUtils';

export const useDistanceSlider = (onDistanceChange) => {
  const [distance, setDistance] = useState(MARKETPLACE_CONSTANTS.DEFAULT_DISTANCE);
  const [sliderWidth, setSliderWidth] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  
  const animatedValue = useRef(new Animated.Value((MARKETPLACE_CONSTANTS.DEFAULT_DISTANCE / MARKETPLACE_CONSTANTS.MAX_DISTANCE) * 100)).current;
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

  const updateDistance = useCallback((newDistance, triggerFetch = true) => {
    // Validate input distance
    if (typeof newDistance !== 'number' || isNaN(newDistance) || newDistance < 0) {
      console.warn('Invalid distance provided to updateDistance:', newDistance);
      return;
    }
    
    const snappedDistance = snapDistance(
      newDistance, 
      MARKETPLACE_CONSTANTS.DISTANCE_STEP, 
      MARKETPLACE_CONSTANTS.MAX_DISTANCE
    );
    
    // Double-check snapped distance is valid
    if (isNaN(snappedDistance) || snappedDistance < 0) {
      console.warn('Invalid snapped distance:', snappedDistance);
      return;
    }
    
    setDistance(snappedDistance);

    const animationValue = (snappedDistance / MARKETPLACE_CONSTANTS.MAX_DISTANCE) * 100;
    if (!isNaN(animationValue)) {
      Animated.timing(animatedValue, {
        toValue: animationValue,
        duration: 100, // Faster animation for smoothness
        useNativeDriver: false,
      }).start();
    }

    if (triggerFetch) {
      debouncedOnDistanceChange(snappedDistance);
    }
  }, [debouncedOnDistanceChange, animatedValue]);

  // Handle tap/click on slider
  const handleSliderPress = useCallback((event) => {
    if (sliderWidth === 0) return;
    
    const { locationX } = event.nativeEvent;
    
    // Validate locationX
    if (typeof locationX !== 'number' || isNaN(locationX)) {
      console.warn('Invalid locationX:', locationX);
      return;
    }
    
    // Make sure locationX is within bounds
    const boundedX = Math.max(0, Math.min(locationX, sliderWidth));
    const percentage = (boundedX / sliderWidth) * 100;
    const calculatedDistance = (percentage / 100) * MARKETPLACE_CONSTANTS.MAX_DISTANCE;
    
    // Validate calculated distance
    if (isNaN(calculatedDistance) || calculatedDistance < 0) {
      console.warn('Invalid calculated distance:', calculatedDistance);
      return;
    }
    
    const newDistance = Math.max(
      MARKETPLACE_CONSTANTS.MIN_DISTANCE, 
      calculatedDistance
    );
    
    updateDistance(newDistance, true);
  }, [sliderWidth, updateDistance]);

  // Memoize PanResponder to prevent recreation on every render
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => {
        return true;
    },
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      // Only start pan responder for actual movements (not just taps)
      return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
    },
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
      
      // If it's a tap (minimal movement), handle as click
      if (Math.abs(gestureState.dx) < 2 && Math.abs(gestureState.dy) < 2) {
        
        // Handle tap directly with evt coordinates
        if (sliderWidth === 0) return;
        let x = evt.nativeEvent.pageX; // Use pageX from the original event
        
        sliderRef.current?.measure((fx, fy, width, height, px, py) => {
          let localX = x - px;
          localX = Math.max(0, Math.min(localX, sliderWidth));
          const percentage = (localX / sliderWidth) * 100;
          const newDistance = Math.max(
            MARKETPLACE_CONSTANTS.MIN_DISTANCE,
            (percentage / 100) * MARKETPLACE_CONSTANTS.MAX_DISTANCE
          );
          
          if (!isNaN(newDistance) && newDistance > 0) {
            updateDistance(newDistance, true);
          }
        });
        return;
      }
      
      // Otherwise, handle as drag release
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
  }), [sliderWidth, debouncedOnDistanceChange, handleSliderPress]);

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
    updateDistance,
    handleSliderPress
  };
};