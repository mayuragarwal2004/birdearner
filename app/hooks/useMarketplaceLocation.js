import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

export const useLocation = () => {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const getLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied.");
        Alert.alert(
          "Permission Denied",
          "Location permissions are required to use this feature. Please enable them in your device settings."
        );
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLocation(currentLocation.coords);
      return currentLocation.coords;
    } catch (error) {
      setErrorMsg("Failed to fetch location. Please try again.");
      Alert.alert("Error fetching location:", error);
      return null;
    }
  };

  useEffect(() => {
    getLocation();
  }, []);

  return {
    location,
    errorMsg,
    getLocation,
    hasLocation: !!location
  };
};