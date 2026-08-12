import React from 'react';
import { View, StyleSheet } from 'react-native';
import SafeSpinner from './SafeSpinner';

const Loader = () => {
  return (
    <View style={styles.loaderContainer}>
      <SafeSpinner size={42} color="#0000ff" />
    </View>
  );
};

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Loader;
