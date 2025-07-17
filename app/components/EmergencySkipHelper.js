import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import skipTracker from '../lib/skipTracker';
import { useAuth } from '../context/NewAuthContext';

const EmergencySkipHelper = ({ onEmergencySkip }) => {
  const [showEmergencyOption, setShowEmergencyOption] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const checkEmergencyEligibility = async () => {
      try {
        const shouldOffer = await skipTracker.shouldOfferEmergencySkip();
        setShowEmergencyOption(shouldOffer);
      } catch (error) {
        console.error('Error checking emergency skip eligibility:', error);
      }
    };

    checkEmergencyEligibility();
  }, []);

  const handleEmergencySkip = async () => {
    Alert.alert(
      "Emergency Skip",
      "This will skip all profile setup steps and take you directly to the app. You can complete your profile later from the Profile section.\n\nAre you sure you want to do this?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Skip All", 
          style: "destructive",
          onPress: async () => {
            setIsProcessing(true);
            try {
              const success = await skipTracker.emergencySkipAll(user.id, 'user_emergency_skip');
              if (success) {
                Alert.alert(
                  "Success",
                  "Profile setup has been skipped. You can complete it later from your profile.",
                  [{ text: "OK", onPress: onEmergencySkip }]
                );
              } else {
                Alert.alert("Error", "Failed to skip profile setup. Please try again.");
              }
            } catch (error) {
              console.error('Emergency skip failed:', error);
              Alert.alert("Error", "Failed to skip profile setup. Please try again.");
            } finally {
              setIsProcessing(false);
            }
          }
        }
      ]
    );
  };

  if (!showEmergencyOption) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.helpBox}>
        <MaterialIcons name="help-outline" size={24} color="#FF6B6B" />
        <Text style={styles.helpText}>
          Having trouble with profile setup?
        </Text>
        <TouchableOpacity
          style={[styles.emergencyButton, isProcessing && styles.disabledButton]}
          onPress={handleEmergencySkip}
          disabled={isProcessing}
        >
          <Text style={styles.emergencyButtonText}>
            {isProcessing ? 'Processing...' : 'Skip All & Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  helpBox: {
    backgroundColor: '#FFF3E0',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  helpText: {
    fontSize: 16,
    color: '#E65100',
    marginVertical: 10,
    textAlign: 'center',
  },
  emergencyButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  emergencyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default EmergencySkipHelper;
