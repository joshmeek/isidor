import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export function BackgroundGradient() {
  return (
    <LinearGradient
      colors={[
        'rgba(59, 130, 246, 0.15)',
        'rgba(59, 130, 246, 0.1)',
        'rgba(255, 255, 255, 0)'
      ]}
      style={styles.backgroundGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      locations={[0, 0.3, 1]}
    />
  );
}

const styles = StyleSheet.create({
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 500,
    zIndex: 0,
  },
}); 