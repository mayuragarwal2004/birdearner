import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator 
} from 'react-native';
import { useAuth } from '../context/NewAuthContext';
import { InstagramLogoIcon, XLogoIcon } from "phosphor-react-native";
import { Linking, Alert } from "react-native"; 

const Intro = ({ navigation }) => {
  const { user, loading } = useAuth();

  const navigateToNextScreen = () => {
    if (user) {
      // User is authenticated, go to main tabs
      navigation.replace('MainTabs');
    } else {
      // User is not authenticated, go to login
      navigation.replace('Login');
    }
  };

  const handleSocialMediaPress = async (platform) => {
    let url = "";
    
    switch (platform) {
      case "instagram":
        url = "https://www.instagram.com/thebirdearner/";
        break;
      case "x":
        url = "https://x.com/birdearner";
        break;
      default:
        return;
    }

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          "Unable to open link",
          `Cannot open ${platform} at this time. Please try again later.`
        );
      }
    } catch (error) {
      console.error("Error opening social media link:", error);
      Alert.alert(
        "Error",
        `Failed to open ${platform}. Please try again later.`
      );
    }
  };

  useEffect(() => {
    if (loading) {
      return;
    }

    const timer = setTimeout(() => {
      navigateToNextScreen();
    }, 8000); // Show splash for 8 seconds (increased for development)

    return () => clearTimeout(timer);
  }, [loading, user]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: "#4B0082" }]}>
      <View style={[styles.container, { backgroundColor: "#4B0082" }]}>
        {/* Development Skip Button */}
        {__DEV__ && (
          <TouchableOpacity 
            style={styles.skipButton}
            onPress={navigateToNextScreen}
            activeOpacity={0.7}
          >
            <Text style={styles.skipButtonText}>Skip (Dev)</Text>
          </TouchableOpacity>
        )}

        {/* Logo */}
        <Image 
          source={require('../assets/logo11.png')} 
          style={styles.logo} 
          resizeMode="contain"
        />

        {/* App Name */}
        <Text style={[styles.title, { color: "white" }]}>BirdEARNER</Text>
        <Text style={[styles.subtitle, { color: "white" }]}>
          Be BirdEARNER, Become Bread Earner!
        </Text>

        {/* Loading Indicator */}
        {loading && (
          <ActivityIndicator 
            color="white" 
            size="large" 
            style={styles.loadingIndicator}
          />
        )}

        {/* Social Icons */}
        <View style={styles.socialContainer}>
          <TouchableOpacity 
            style={styles.socialIcon}
            onPress={() => handleSocialMediaPress("instagram")}
            activeOpacity={0.7}
          >
            <InstagramLogoIcon size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.socialIcon}
            onPress={() => handleSocialMediaPress("x")}
            activeOpacity={0.7}
          >
            <XLogoIcon size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  skipButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 40,
    textAlign: 'center',
  },
  loadingIndicator: {
    marginTop: 20,
    marginBottom: 20,
  },
  socialContainer: {
    flexDirection: "row",
    marginTop: 40,
  },
  socialIcon: {
    marginHorizontal: 10,
  },
});

export default Intro;
