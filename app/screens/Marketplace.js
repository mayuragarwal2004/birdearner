import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
  Platform,
  RefreshControl,
  PanResponder,
} from "react-native";
import Entypo from "@expo/vector-icons/Entypo";
import MapView, { PROVIDER_GOOGLE, Marker, Circle } from "react-native-maps";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useAuth } from "../context/NewAuthContext";
import { useTheme } from "../context/ThemeContext";
import apiService from "../lib/apiService";
import Toast from "react-native-toast-message";
import { Audio } from 'expo-av';

const colors = {
  Immediate: ["#7C1313", "#E22323"],
  High: ["#896D08", "#EFBE0E"],
  Standard: ["#34660C", "#77CB35"],
};

const priorities = ["Immediate", "High", "Standard"];

const maxDist = 20;

const MarketplaceScreen = ({ navigation }) => {
  const { user, userData, userProfile, fetchUserProfile } = useAuth();
  const mapRef = useRef(null);
  const [distance, setDistance] = useState(20);
  const [sliderWidth, setSliderWidth] = useState(0);
  const sliderRef = useRef(null);
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const step = 0.5;
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [isSliding, setIsSliding] = useState(false);
  const [jobs, setJobs] = useState({
    Immediate: [],
    High: [],
    Standard: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [availableServices, setAvailableServices] = useState([]);
  const [currentUserRole, setCurrentUserRole] = useState(userData?.role || 'FREELANCER');
  const [userServices, setUserServices] = useState([]);

  // Priority wheel state
  const [priorityIndex, setPriorityIndex] = useState(0);
  const [rotation] = useState(new Animated.Value(0));
  const [sound, setSound] = useState();

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];

  const styles = getStyles(currentTheme);

  // Toast helper
  const showToast = (type, text1, text2) => {
    Toast.show({ type, text1, text2, position: "top" });
  };

  // Play wheel sound
  async function playWheelSound() {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require("../../assets/wheel-turn.mp3")
      );
      setSound(sound);
      await sound.replayAsync();
    } catch (e) {
      // Ignore sound errors
    }
  }

  // Unload sound on unmount
  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  // Handle wheel rotation and navigation
  const handlePriorityWheel = (direction) => {
    let newIndex;
    if (direction === "left") {
      newIndex = (priorityIndex + 1) % priorities.length;
    } else {
      newIndex = (priorityIndex - 1 + priorities.length) % priorities.length;
    }
    setPriorityIndex(newIndex);
    playWheelSound();
    
    Animated.timing(rotation, {
      toValue: direction === "left" ? -180 : 180,
      duration: 300,
      useNativeDriver: true,
    }).start(() => rotation.setValue(0));
    
    // Navigate to JobPriority for the new priority
    setTimeout(() => {
      handlePriorityPress(priorities[newIndex]);
    }, 150); // Small delay to let animation start
  };

  // PanResponder for wheel
  const wheelPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx > 50) {
        handlePriorityWheel("right"); // Swipe right
      } else if (gestureState.dx < -50) {
        handlePriorityWheel("left"); // Swipe left
      }
    },
  });

  // Load user services and role info
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        if (userData && userData.role === 'FREELANCER' && userProfile?.selectedServices) {
          console.log('Loading services for user:', userData.id);
          console.log('Selected services:', userProfile.selectedServices);
          
          // Load service details for the user's selected services
          const services = await Promise.all(
            userProfile.selectedServices.map(async (serviceId) => {
              try {
                console.log(`Loading service: ${serviceId}`);
                const service = await apiService.getServiceById(serviceId);
                console.log(`Service ${serviceId} loaded:`, service);
                return service;
              } catch (error) {
                console.error(`Error loading service ${serviceId}:`, error.message);
                // Return null for invalid services instead of breaking
                return null;
              }
            })
          );
          
          // Filter out null services (failed to load)
          const validServices = services.filter(s => s !== null);
          console.log('Valid services loaded:', validServices.length);
          setUserServices(validServices);
          
          // Show warning if some services failed to load
          if (validServices.length < userProfile.selectedServices.length) {
            const failedCount = userProfile.selectedServices.length - validServices.length;
            console.warn(`${failedCount} service(s) failed to load`);
            showToast("warning", "Warning", `Some services could not be loaded (${failedCount} failed)`);
          }
        } else {
          // Clear services if user is not a freelancer or has no selected services
          setUserServices([]);
        }
        setCurrentUserRole(userData?.role || 'FREELANCER');
      } catch (error) {
        console.error('Error loading user info:', error);
        setUserServices([]);
        showToast("error", "Error", "Failed to load user services");
      }
    };

    if (userData) {
      loadUserInfo();
    }
  }, [userData, userProfile]);

  // Debounce job fetching for slider
  const debounce = (func, delay) => {
    let timer;
    return (...args) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => func(...args), delay);
    };
  };

  // Fetch jobs when distance changes (debounced)
  const debouncedFetchJobs = useCallback(
    debounce((dist) => {
      fetchJobs(location ? true : false);
    }, 250),
    [location, currentUserRole, userServices]
  );

  const updateDistance = (newDistance, triggerFetch = true) => {
    const boundedDistance = Math.min(maxDist, Math.max(0, newDistance));
    const snappedDistance = Math.round(boundedDistance / step) * step; // Snap to nearest step
    setDistance(snappedDistance);

    Animated.timing(animatedValue, {
      toValue: (snappedDistance / maxDist) * 100, // Convert distance to percentage
      duration: 100, // Faster animation for smoothness
      useNativeDriver: false,
    }).start();

    if (triggerFetch) {
      debouncedFetchJobs(snappedDistance);
    }
  };

  // PanResponder for smooth slider
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => setIsSliding(true),
    onPanResponderMove: (evt, gestureState) => {
      if (sliderWidth === 0) return;
      let x = gestureState.moveX;
      // Get slider's left offset
      sliderRef.current?.measure((fx, fy, width, height, px, py) => {
        let localX = x - px;
        localX = Math.max(0, Math.min(localX, sliderWidth));
        const percentage = (localX / sliderWidth) * 100;
        const newDistance = (percentage / 100) * maxDist;
        updateDistance(newDistance, false); // Don't trigger fetch on every move
      });
    },
    onPanResponderRelease: (evt, gestureState) => {
      setIsSliding(false);
      if (sliderWidth === 0) return;
      let x = gestureState.moveX;
      sliderRef.current?.measure((fx, fy, width, height, px, py) => {
        let localX = x - px;
        localX = Math.max(0, Math.min(localX, sliderWidth));
        const percentage = (localX / sliderWidth) * 100;
        const newDistance = (percentage / 100) * maxDist;
        updateDistance(newDistance, true); // Trigger fetch on release
      });
    },
  });

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  };

  const fetchJobs = async (filterByLocation = false) => {
    try {
      setLoading(true);
      
      // Build filter parameters
      const filters = {
        status: 'OPEN', // Only get open jobs that are available
        unassigned: true, // Filter out jobs that already have freelancers
      };

      // If user is a freelancer, filter jobs by their services
      if (currentUserRole === 'FREELANCER' && userServices.length > 0) {
        filters.serviceIds = userServices.map(service => service.id);
      }

      // Add location filtering if requested
      if (filterByLocation && location) {
        filters.latitude = location.latitude;
        filters.longitude = location.longitude;
        filters.maxDistance = distance;
      }

      console.log('Fetching jobs with filters:', filters);

      // Get jobs categorized by priority from the new backend
      const categorizedJobs = await apiService.getAllJobsCategorizedByPriority(filters);

      console.log('Categorized jobs API response:', categorizedJobs);

      setJobs(categorizedJobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack
      });
      showToast("error", "Error", "Failed to fetch jobs. Please try again later.");
      // Set empty jobs on error
      setJobs({
        Immediate: [],
        High: [],
        Standard: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      console.log('Starting refresh...');
      
      // Refresh user profile to get latest services
      if (fetchUserProfile) {
        try {
          console.log('Refreshing user profile...');
          await fetchUserProfile();
          console.log('User profile refreshed successfully');
        } catch (error) {
          console.error('Error refreshing user profile:', error);
          // Don't block the entire refresh if profile fails
          showToast("warning", "Warning", "Could not refresh user profile");
        }
      }
      
      // Refresh jobs data
      console.log('Refreshing jobs data...');
      await fetchJobs(location ? true : false);
      console.log('Jobs data refreshed successfully');
      
      showToast("success", "Refreshed", "Jobs data updated successfully");
    } catch (error) {
      console.error('Error during refresh:', error);
      showToast("error", "Error", "Failed to refresh data");
    } finally {
      setRefreshing(false);
      console.log('Refresh completed');
    }
  };

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
      fetchJobs(true); // Fetch jobs filtered by location
    } catch (error) {
      setErrorMsg("Failed to fetch location. Please try again.");
      Alert.alert("Error fetching location:", error);
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Ensure API service is initialized
        await apiService.init();
        // Get location and fetch jobs
        getLocation();
        fetchJobs();
      } catch (error) {
        console.error('Error initializing app:', error);
        showToast("error", "Error", "Failed to initialize app");
      }
    };

    initializeApp();
  }, []);

  useEffect(() => {
    if (location && userData && !isSliding) {
      fetchJobs(true);
    }
    // eslint-disable-next-line
  }, [location, currentUserRole, userServices]);

  const handlePriorityPress = (priority) => {
    // Pass the jobs data with the new backend format
    const jobsData = {
      Immediate: jobs.Immediate,
      High: jobs.High,
      Standard: jobs.Standard,
    };
    navigation.navigate("JobPriority", { priority, jobs: jobsData });
  };

  const handleAllJobsPress = () => {
    // Navigate to a screen showing all jobs regardless of priority
    const allJobs = [...jobs.Immediate, ...jobs.High, ...jobs.Standard];
    navigation.navigate("JobPriority", { 
      priority: "All", 
      jobs: { All: allJobs, Immediate: [], High: [], Standard: [] }
    });
  };

  const renderLines = () => {
    const lines = [];
    for (let i = 0; i < 50; i++) {
      lines.push(
        <LinearGradient
          key={i}
          colors={["#232222", "#898686"]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 0 }}
          style={styles.line}
        />
      );
    }
    return lines;
    // return [];
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#762BAD" />
      </SafeAreaView>
    );
  }

  // console.log("Slider Width:", sliderWidth);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#762BAD']} // Android
            tintColor={'#762BAD'} // iOS
            title="Pull to refresh jobs..."
            titleColor={'#762BAD'}
          />
        }
      >
        {/* Header */}
        <Text style={styles.title}>Marketplace</Text>

        {/* User services section for freelancers */}
        {currentUserRole === 'FREELANCER' && (
          <View style={styles.servicesContainer}>
            {userServices.length > 0 ? (
              <>
                <Text style={styles.servicesTitle}>Your Services:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.servicesScroll}>
                  {userServices.map((service, index) => (
                    <View key={service.id} style={styles.serviceTag}>
                      <Text style={styles.serviceTagText}>{service.name}</Text>
                    </View>
                  ))}
                </ScrollView>
                <Text style={styles.servicesSubtext}>
                  Showing jobs matching your services ({userServices.length} services)
                </Text>
              </>
            ) : (
              <View style={styles.noServicesContainer}>
                <Text style={styles.noServicesTitle}>No Services Selected</Text>
                <Text style={styles.noServicesText}>
                  You haven't selected any services yet. Showing all available jobs.
                </Text>
                <TouchableOpacity 
                  style={styles.addServicesButton}
                  onPress={() => navigation.navigate('Profile')}
                >
                  <Text style={styles.addServicesButtonText}>Add Services</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        <View style={styles.sliderContainer}>
          <Text style={styles.distanceText}>{distance} km</Text>

          <View style={styles.sliderControls}>
            {/* - Button */}
            <TouchableOpacity
              onPress={() => updateDistance(distance - step)}
              style={styles.iconButton}
            >
              <Entypo name="circle-with-minus" size={29} color="black" />
            </TouchableOpacity>

            {/* Slider Body */}
            <View
              style={styles.customSliderWrapper}
              onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
              ref={sliderRef}
              {...panResponder.panHandlers}
            >
              {/* Gradient background and lines */}
              <LinearGradient
                colors={["#232222", "#898686"]}
                start={{ x: 0, y: 1 }}
                end={{ x: 1, y: 0 }}
                style={styles.sliderBackground}
                pointerEvents="none"
              >
                <View style={styles.linesContainer}>{renderLines()}</View>
                <View
                  style={[
                    styles.sliderIndicator,
                    { left: `${(distance / maxDist) * 100}%` },
                  ]}
                >
                  <Text style={styles.sliderIndicatorText}>▼</Text>
                </View>
              </LinearGradient>
            </View>

            {/* + Button */}
            <TouchableOpacity
              onPress={() => updateDistance(distance + step)}
              style={styles.iconButton}
            >
              <Entypo name="circle-with-plus" size={29} color="black" />
            </TouchableOpacity>
          </View>

          <Text style={styles.sliderLabel}>
            Scroll the wheel to adjust job area
          </Text>
        </View>

        <MapView
          style={styles.map}
          provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
          showsUserLocation
          showsMyLocationButton
          ref={mapRef}
          onMapReady={() => console.log("Map is ready")}
          onError={(e) => {
            console.error("Map error:", e.nativeEvent);
          }}
          region={
            location
              ? {
                  latitude: location.latitude,
                  longitude: location.longitude,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }
              : {
                  latitude: 22.886473,
                  longitude: 79.610891,
                  latitudeDelta: 1.0,
                  longitudeDelta: 1.0,
                }
          }
        >
          {location && (
            <Circle
              key={(location.latitude + location.longitude).toString()}
              center={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              radius={distance * 1000}
              strokeWidth={1}
              strokeColor={"#1a66ff"}
              fillColor={"rgba(230,238,255,0.5)"}
              // onRegionChangeComplete={this.onRegionChangeComplete.bind(this)}
            />
          )}

          {jobs.Immediate.map((job, index) =>
            job.latitude && job.longitude ? (
              <Marker
                key={`immediate-${job.id}-${index}`}
                coordinate={{
                  latitude: parseFloat(job.latitude),
                  longitude: parseFloat(job.longitude),
                }}
                title={job.title}
                description={job.description}
                pinColor="red"
              />
            ) : null
          )}

          {jobs.High.map((job, index) =>
            job.latitude && job.longitude ? (
              <Marker
                key={`high-${job.id}-${index}`}
                coordinate={{
                  latitude: parseFloat(job.latitude),
                  longitude: parseFloat(job.longitude),
                }}
                title={job.title}
                description={job.description}
                pinColor="orange"
              />
            ) : null
          )}

          {jobs.Standard.map((job, index) =>
            job.latitude && job.longitude ? (
              <Marker
                key={`standard-${job.id}-${index}`}
                coordinate={{
                  latitude: parseFloat(job.latitude),
                  longitude: parseFloat(job.longitude),
                }}
                title={job.title}
                description={job.description}
                pinColor="green"
              />
            ) : null
          )}
        </MapView>

        <Text style={styles.jobsAround}>Jobs around...</Text>

        <View style={styles.priorityContainer}>
          <TouchableOpacity
            style={styles.priorityBox}
            onPress={() => handlePriorityPress("Immediate")}
          >
            <LinearGradient
              colors={colors.Immediate}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.priorityButton}
            >
              <Text style={styles.priorityText}>Immediate Attention • {jobs.Immediate.length}+ Jobs</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.priorityBox}
            onPress={() => handlePriorityPress("High")}
          >
            <LinearGradient 
              colors={colors.High} 
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.priorityButton}
            >
              <Text style={styles.priorityText}>High Priority • {jobs.High.length}+ Jobs</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.priorityBox}
            onPress={() => handlePriorityPress("Standard")}
          >
            <LinearGradient
              colors={colors.Standard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.priorityButton}
            >
              <Text style={styles.priorityText}>Standard Priority • {jobs.Standard.length}+ Jobs</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <LinearGradient
        colors={["#762BAD", "#300E49"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.allJobsContainer}
      >
        <TouchableOpacity style={styles.allJobsButton} onPress={() => handlePriorityPress("All")}>
          <Text style={styles.allJobsText}>View Jobs</Text>
        </TouchableOpacity>
      </LinearGradient>

      <Toast />
    </SafeAreaView>
  );
};

const getStyles = (currentTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background || "#fff",
      paddingTop: 30,
    },
    scrollContent: {
      padding: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 20,
      color: currentTheme.text,
    },
    servicesContainer: {
      marginBottom: 20,
      backgroundColor: '#f8f9fa',
      padding: 15,
      borderRadius: 12,
    },
    servicesTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 8,
    },
    servicesScroll: {
      marginBottom: 8,
    },
    serviceTag: {
      backgroundColor: '#762BAD',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      marginRight: 8,
    },
    serviceTagText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '500',
    },
    servicesSubtext: {
      fontSize: 12,
      color: '#666',
      fontStyle: 'italic',
    },
    noServicesContainer: {
      alignItems: 'center',
      padding: 16,
    },
    noServicesTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 8,
    },
    noServicesText: {
      fontSize: 14,
      color: '#666',
      textAlign: 'center',
      marginBottom: 12,
    },
    addServicesButton: {
      backgroundColor: '#762BAD',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
    },
    addServicesButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    sliderContainer: {
      alignItems: "center",
      marginBottom: 20,
    },
    distanceText: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 10,
      color: currentTheme.subText,
    },
    sliderControls: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
    },

    iconButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: "white",
      alignItems: "center",
      justifyContent: "center",
      elevation: 2,
    },

    customSliderWrapper: {
      width: 300,
      height: 32,
      borderRadius: 6,
      position: "relative",
      overflow: "visible",
    },

    sliderBackground: {
      width: "100%",
      height: "100%",
      borderRadius: 6,
      justifyContent: "center",
      alignItems: "center",
    },

    linesContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      width: "100%",
      height: "100%",
      paddingHorizontal: 5,
      alignItems: "center",
    },

    sliderIndicator: {
      position: "absolute",
      top: -12,
      transform: [{ translateX: -6 }],
    },

    sliderIndicatorText: {
      fontSize: 14,
      color: currentTheme.text || "#000",
      // color: "#fff",
    },
    line: {
      width: 3,
      height: "72%",
      // backgroundColor: "#898686",
    },
    sliderLabel: {
      color: "#6f28d4",
      marginTop: 10,
      fontSize: 14,
      fontWeight: "600",
    },
    map: {
      width: "100%",
      height: 220,
      marginVertical: 20,
    },
    jobsAround: {
      fontSize: 20,
      fontWeight: "bold",
      textAlign: "center",
      marginVertical: 10,
      color: currentTheme.text,
    },
    priorityContainer: {
      alignItems: "center",
      marginBottom: 50,
    },
    priorityWheel: {
      width: 355,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
    },
    priorityBox: {
      width: "100%",
    },
    priorityButton: {
      width: "100%",
      padding: 15,
      paddingHorizontal: 20,
      borderRadius: 12,
      marginBottom: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    priorityTouchable: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    priorityText: {
      color: "#fff",
      fontWeight: "600",
      fontSize: 18,
      textAlign: 'center',
    },
    prioritySubText: {
      color: "#fff",
      fontSize: 14,
      textAlign: 'center',
      marginTop: 5,
    },
    swipeHint: {
      color: '#fff',
      fontSize: 12,
      marginTop: 8,
      textAlign: 'center',
      opacity: 0.8,
    },
    allJobsContainer: {
      alignItems: "center",
      width: 450,
      height: 450,
      borderRadius: 300,
      position: "absolute",
      bottom: -380,
      right: -30,
      padding: 10,
    },
    allJobsButton: {
      paddingVertical: 15,
      alignItems: "center",
      justifyContent: "center",
      width: "90%",
    },
    allJobsText: {
      color: "#fff",
      fontSize: 20,
      fontWeight: "semibold",
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
    },
  });

export default MarketplaceScreen;
