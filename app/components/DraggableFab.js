import React, { useRef } from "react";
import { Animated, Dimensions, PanResponder, StyleSheet } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const EDGE = 8;
// Movement (px) before a touch counts as a drag instead of a tap
const DRAG_THRESHOLD = 4;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// Round floating button that the user can drag anywhere on screen.
// It starts at initialRight / initialBottom and stays inside the screen.
// topLimit keeps it below the status bar; it can be dragged anywhere else inside the screen.
const DraggableFab = ({
  onPress,
  size = 56,
  backgroundColor = "#3B0764",
  initialRight = 20,
  initialBottom = 100,
  topLimit = 60,
  children,
}) => {
  const startLeft = SCREEN_WIDTH - initialRight - size;
  const startTop = SCREEN_HEIGHT - initialBottom - size;

  // Offset from the starting position, in px
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  // Position where the current drag started, and the latest position after it
  const startPos = useRef({ x: 0, y: 0 });
  const lastPos = useRef({ x: 0, y: 0 });
  const dragged = useRef(false);

  const bounds = {
    minX: EDGE - startLeft,
    maxX: SCREEN_WIDTH - size - EDGE - startLeft,
    minY: topLimit - startTop,
    maxY: SCREEN_HEIGHT - size - EDGE - startTop,
  };
  const boundsRef = useRef(bounds);
  boundsRef.current = bounds;

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > DRAG_THRESHOLD || Math.abs(g.dy) > DRAG_THRESHOLD,
      onPanResponderGrant: () => {
        dragged.current = false;
        startPos.current = lastPos.current;
      },
      onPanResponderMove: (_, g) => {
        if (Math.abs(g.dx) > DRAG_THRESHOLD || Math.abs(g.dy) > DRAG_THRESHOLD) {
          dragged.current = true;
        }
        // g.dx/g.dy are measured from the touch start, so always add them to the start position
        const b = boundsRef.current;
        const next = {
          x: clamp(startPos.current.x + g.dx, b.minX, b.maxX),
          y: clamp(startPos.current.y + g.dy, b.minY, b.maxY),
        };
        pan.setValue(next);
        lastPos.current = next;
      },
      onPanResponderRelease: () => {
        // The button stays where the finger lifted
        if (!dragged.current && onPress) onPress();
      },
      onPanResponderTerminate: () => {
        // Keep the last position if the gesture is taken over
        pan.setValue(lastPos.current);
      },
    })
  ).current;

  return (
    <Animated.View
      {...responder.panHandlers}
      style={[
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
          left: startLeft,
          top: startTop,
          transform: pan.getTranslateTransform(),
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2C1B3F",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    zIndex: 20,
  },
});

export default DraggableFab;
