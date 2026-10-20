import React, { forwardRef } from "react";
import { ScrollView } from "react-native";
import { KeyboardAwareScrollView as KeyboardControllerScrollView } from "react-native-keyboard-controller";

// Space kept between the field being typed in and the top of the keyboard
const KEYBOARD_GAP = 24;

// Drop-in replacement for ScrollView. When the keyboard opens, the focused field is scrolled above it
// (with KEYBOARD_GAP of space), including when the focus moves to another field.
const KeyboardAwareScrollView = forwardRef(function KeyboardAwareScrollView(props, ref) {
  if (props.horizontal) {
    return <ScrollView ref={ref} {...props} />;
  }
  return <KeyboardControllerScrollView ref={ref} bottomOffset={KEYBOARD_GAP} {...props} />;
});

export default KeyboardAwareScrollView;
