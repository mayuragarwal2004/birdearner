import React, { useEffect, useRef } from "react";
import { Animated, Easing, View, StyleSheet } from "react-native";

const SafeSpinner = ({ size = "small", color = "#7B2CFF", style }) => {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [rotation]);

  const isLarge = size === "large";
  const dimension = isLarge ? 36 : 18;
  const borderWidth = isLarge ? 4 : 2.5;

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={[{ alignItems: "center", justifyContent: "center" }, style]}>
      <Animated.View
        style={{
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
          borderWidth: borderWidth,
          borderColor: "rgba(0,0,0,0.1)",
          borderTopColor: color,
          transform: [{ rotate: spin }],
        }}
      />
    </View>
  );
};

export default SafeSpinner;
