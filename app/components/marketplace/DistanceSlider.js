import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { MapPin, Minus, Plus } from 'phosphor-react-native';
import Toast from 'react-native-toast-message';
import { MARKETPLACE_CONSTANTS } from '../../utils/marketplaceUtils';

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

  // Generate 40 tick lines for the track
  const lines = Array.from({ length: 40 }, (_, i) => i);

  return (
    <View style={styles.sliderWrapper}>
      <View style={styles.distanceTextContainer}>
        <MapPin size={20} color="#762BAD" weight="bold" style={styles.pinIcon} />
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
        <TouchableOpacity
          onPress={onDecrementDistance}
          style={styles.iconButton}
          activeOpacity={0.7}
        >
          <Minus size={20} color={theme.text || "#000"} />
        </TouchableOpacity>

        <View
          style={styles.customSliderWrapper}
          onLayout={onSliderLayout}
          ref={sliderRef}
          {...panResponder.panHandlers}
        >
          <View style={styles.sliderBackground} pointerEvents="box-only">
            <View style={styles.linesContainer}>
              {lines.map((lineIndex) => (
                <View
                  key={lineIndex}
                  style={[
                    styles.line,
                    // Make every 5th line slightly taller/more opaque if desired
                    { opacity: lineIndex % 5 === 0 ? 0.8 : 0.4 }
                  ]}
                />
              ))}
            </View>
            
            {/* The Thumb Indicator */}
            <View
              style={[
                styles.sliderIndicator,
                { left: `${(distance / MARKETPLACE_CONSTANTS.MAX_DISTANCE) * 100}%` },
              ]}
            >
              <View style={styles.triangle} />
              <View style={styles.indicatorLine} />
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={onIncrementDistance}
          style={styles.iconButton}
          activeOpacity={0.7}
        >
          <Plus size={20} color={theme.text || "#000"} />
        </TouchableOpacity>

      </View>

      <Text style={styles.sliderLabel}>
        Scroll the wheel to adjust job area
      </Text>
    </View>
  );
};

const getStyles = (currentTheme) => StyleSheet.create({
  sliderWrapper: {
    backgroundColor: currentTheme.theme === 'dark' ? '#1f2937' : '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: currentTheme.theme === 'dark' ? 1 : 0,
    borderColor: '#374151',
  },
  distanceTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  pinIcon: {
    marginRight: 6,
  },
  distanceText: {
    fontSize: 20,
    fontWeight: "bold",
    color: currentTheme.text || '#000',
  },
  loadingIndicator: {
    marginLeft: 8,
  },
  sliderControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: currentTheme.text || "#000",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: 'transparent',
  },
  lockButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5D5FF',
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: currentTheme.theme === 'dark' ? '#2e1f4a' : '#FFF',
  },
  customSliderWrapper: {
    flex: 1,
    height: 36,
    marginHorizontal: 12,
    position: "relative",
  },
  sliderBackground: {
    width: "100%",
    height: "100%",
    backgroundColor: "#1A1A1A",
    borderRadius: 18,
    justifyContent: "center",
    overflow: "hidden",
  },
  linesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 10,
    height: "100%",
  },
  line: {
    width: 1.5,
    height: "40%",
    backgroundColor: "#FFFFFF",
    borderRadius: 1,
  },
  sliderIndicator: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 20,
    transform: [{ translateX: -10 }],
    alignItems: "center",
  },
  triangle: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#762BAD",
    marginTop: -1, // Push it up slightly so it points in from the top
  },
  indicatorLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#762BAD",
    marginTop: 2,
    marginBottom: 4,
    borderRadius: 1,
  },
  sliderLabel: {
    color: "#762BAD",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default DistanceSlider;