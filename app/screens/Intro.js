import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import SafeSpinner from '../components/SafeSpinner';
import * as SplashScreen from 'expo-splash-screen';
import { useAuth } from '../context/NewAuthContext';

const Intro = ({ navigation }) => {
  const { user, userData, loading } = useAuth();

  const navigateToNextScreen = () => {
    if (user) {
      if (userData && !userData.mobile) {
        navigation.replace("OtpVerification", { mode: "attach" });
        return;
      }
      navigation.replace('MainTabs');
    } else {
      navigation.replace('Login');
    }
  };

  // Keep the native splash (logo + name) up the whole time so the user only
  // ever sees one branded screen, then reveal Login / MainTabs underneath.
  useEffect(() => {
    if (loading) {
      return;
    }

    const timer = setTimeout(async () => {
      await SplashScreen.hideAsync().catch(() => {});
      navigateToNextScreen();
    }, __DEV__ ? 150 : 900);

    return () => clearTimeout(timer);
  }, [loading, user, userData?.mobile]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: "#4B0082" }]}>
      <View style={[styles.container, { backgroundColor: "#4B0082" }]}>
        {__DEV__ && (
          <TouchableOpacity 
            style={styles.skipButton}
            onPress={async () => {
              await SplashScreen.hideAsync().catch(() => {});
              navigateToNextScreen();
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.skipButtonText}>Skip (Dev)</Text>
          </TouchableOpacity>
        )}

        {/* Same logo as Login, with app name — matches native splash */}
        <View style={styles.logoCircle}>
          <Image 
            source={require('../../assets/login-logo.png')} 
            style={styles.logo} 
            resizeMode="contain"
          />
        </View>

        <Text style={[styles.title, { color: "white" }]}>BirdEARNER</Text>

        {loading && (
          <SafeSpinner 
            color="white" 
            size={42}
            style={styles.loadingIndicator}
          />
        )}
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
  logoCircle: {
    width: 100,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
  },
  loadingIndicator: {
    marginTop: 20,
    marginBottom: 20,
  },
});

export default Intro;
