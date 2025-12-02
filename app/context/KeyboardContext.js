import React, { createContext, useContext, useState, useEffect } from 'react';
import { Keyboard, Platform } from 'react-native';

const KeyboardContext = createContext();

export const useKeyboard = () => {
  const context = useContext(KeyboardContext);
  if (!context) {
    throw new Error('useKeyboard must be used within KeyboardProvider');
  }
  return context;
};

export const KeyboardProvider = ({ children }) => {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardVisible(true);
      setKeyboardHeight(e.endCoordinates.height);
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
      setKeyboardHeight(0);
    });

    const keyboardWillShowListener = Platform.OS === 'ios' 
      ? Keyboard.addListener('keyboardWillShow', (e) => {
          setKeyboardVisible(true);
          setKeyboardHeight(e.endCoordinates.height);
        })
      : null;

    const keyboardWillHideListener = Platform.OS === 'ios'
      ? Keyboard.addListener('keyboardWillHide', () => {
          setKeyboardVisible(false);
          setKeyboardHeight(0);
        })
      : null;

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
      if (keyboardWillShowListener) keyboardWillShowListener.remove();
      if (keyboardWillHideListener) keyboardWillHideListener.remove();
    };
  }, []);

  return (
    <KeyboardContext.Provider 
      value={{ 
        isKeyboardVisible, 
        keyboardHeight,
      }}
    >
      {children}
    </KeyboardContext.Provider>
  );
};