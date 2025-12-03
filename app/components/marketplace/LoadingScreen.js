import React from 'react';
import { SafeAreaView, ActivityIndicator, StyleSheet } from 'react-native';

const LoadingScreen = ({ theme }) => {
  const styles = getStyles(theme);
  
  return (
    <SafeAreaView style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#762BAD" />
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