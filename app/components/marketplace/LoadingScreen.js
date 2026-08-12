import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import SafeSpinner from '../SafeSpinner';

const LoadingScreen = ({ theme }) => {
  const styles = getStyles(theme);
  
  return (
    <SafeAreaView style={styles.loadingContainer}>
      <SafeSpinner size={42} color="#762BAD" />
    </SafeAreaView>
  );
};

const getStyles = (currentTheme) => StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: currentTheme.background || "#fff",
  },
});

export default LoadingScreen;