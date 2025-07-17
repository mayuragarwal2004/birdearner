import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/NewAuthContext'; 

const Intro = () => {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (user) {
      router.push('/screens/Home'); 
    } else {
      router.push('/screens/Login');
    }
  }, [loading, user, router]);

  return (
    <View style={styles.container}>
      {/* Logo Image */}
      <Image
        source={require('../assets/logo11.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      {/* Heading */}
      <Text style={styles.heading}>BirdEarner</Text>

      {/* Description */}
      <Text style={styles.description}>Be BirdEarner, Become Bread Earner!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4B0082', // Background color
  },
  logo: {
    width: 140,
    height: 140,
    marginBottom: 20,
  },
  heading: {
    fontSize: 52,
    fontWeight: 'bold',
    color: '#fff', // Heading color
  },
  description: {
    fontSize: 13,
    color: '#f0f0f0', // Description color
    marginTop: 0,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default Intro;
