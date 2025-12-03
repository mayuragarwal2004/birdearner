import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Entypo from '@expo/vector-icons/Entypo';
import { generateSliderLines, MARKETPLACE_CONSTANTS } from '../../utils/marketplaceUtils';

const DistanceSlider = ({
  distance,
  sliderRef,
  panResponder,
  onSliderLayout,
  onIncrementDistance,
  onDecrementDistance,
  isLoading = false,
  theme
}) => {
  const styles = getStyles(theme);
  const lines = generateSliderLines();

  return (
    <View style={styles.sliderContainer}>
      <View style={styles.distanceTextContainer}>
        <Text style={styles.distanceText}>{distance} km</Text>
        {isLoading && (
          <ActivityIndicator 
            size="small" 
            color="#762BAD" 
            style={styles.loadingIndicator}
          />
        )}
      </View>

      <View style={styles.sliderControls}>
        {/* - Button */}
        <TouchableOpacity
          onPress={onDecrementDistance}
          style={styles.iconButton}
        >
          <Entypo name="circle-with-minus" size={29} color="black" />
        </TouchableOpacity>

        {/* Slider Body */}
        <View
          style={styles.customSliderWrapper}
          onLayout={onSliderLayout}
          ref={sliderRef}
          {...panResponder.panHandlers}
        >
          {/* Gradient background and lines */}
          <LinearGradient
            colors={["#232222", "#898686"]}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            style={styles.sliderBackground}
            pointerEvents="none"
          >
            <View style={styles.linesContainer}>
              {lines.map((lineIndex) => (
                <LinearGradient
                  key={lineIndex}
                  colors={["#232222", "#898686"]}
                  start={{ x: 1, y: 0 }}
                  end={{ x: 0, y: 0 }}
                  style={styles.line}
                />
              ))}
            </View>
            <View
              style={[
                styles.sliderIndicator,
                { left: `${(distance / MARKETPLACE_CONSTANTS.MAX_DISTANCE) * 100}%` },
              ]}
            >
              <Text style={styles.sliderIndicatorText}>▼</Text>
            </View>
          </LinearGradient>
        </View>

        {/* + Button */}
        <TouchableOpacity
          onPress={onIncrementDistance}
          style={styles.iconButton}
        >
          <Entypo name="circle-with-plus" size={29} color="black" />
        </TouchableOpacity>
      </View>

      <Text style={styles.sliderLabel}>
        Scroll the wheel to adjust job area
      </Text>
    </View>
  );
};

const getStyles = (currentTheme) => StyleSheet.create({
  sliderContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  distanceTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  distanceText: {
    fontSize: 18,
    fontWeight: "bold",
    color: currentTheme.subText,
  },
  loadingIndicator: {
    marginLeft: 8,
  },
  sliderControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  customSliderWrapper: {
    width: MARKETPLACE_CONSTANTS.SLIDER_WIDTH,
    height: MARKETPLACE_CONSTANTS.SLIDER_HEIGHT,
    borderRadius: 6,
    position: "relative",
    overflow: "visible",
  },
  sliderBackground: {
    width: "100%",
    height: "100%",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  linesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    height: "100%",
    paddingHorizontal: 5,
    alignItems: "center",
  },
  sliderIndicator: {
    position: "absolute",
    top: -12,
    transform: [{ translateX: -6 }],
  },
  sliderIndicatorText: {
    fontSize: 14,
    color: currentTheme.text || "#000",
  },
  line: {
    width: 3,
    height: "72%",
  },
  sliderLabel: {
    color: "#6f28d4",
    marginTop: 10,
    fontSize: 14,
    fontWeight: "600",
  },
});

export default DistanceSlider;