import React, { useState, useEffect, useRef } from "react";
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
  PanResponder
} from "react-native";
import Entypo from "@expo/vector-icons/Entypo";
import MapView, { Marker } from "react-native-maps";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { appwriteConfig, databases } from "../lib/appwrite";
import { useTheme } from "../context/ThemeContext";

const colors = {
  Immediate: ["#E22323", "#7C1313"],
  High: ["#896D08", "#EFBE0E"],
  Standard: ["#34660C", "#77CB35"],
};

const maxDist = 6000;

const MarketplaceScreen = ({ navigation }) => {
  const [distance, setDistance] = useState(600);
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const step = 5;
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [jobs, setJobs] = useState({
    Immediate: [],
    High: [],
    Standard: [],
  });
  const [loading, setLoading] = useState(true);

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];

  const styles = getStyles(currentTheme);

  const updateDistance = (newDistance) => {
    const boundedDistance = Math.min(maxDist, Math.max(0, newDistance));
    const snappedDistance = Math.round(boundedDistance / step) * step; // Snap to nearest 5km
    setDistance(snappedDistance);

    Animated.timing(animatedValue, {
      toValue: (snappedDistance / maxDist) * 100, // Convert distance to percentage
      duration: 300, // Animation duration
      useNativeDriver: false,
    }).start();
  };

  const handleSlide = (locationX) => {
    const percentage = (locationX / 307) * 100;
    const newDistance = (percentage / 100) * maxDist;
    updateDistance(newDistance);
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 15; // Earth's radius in km
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

  const categorizeJobs = (jobs) => {
    const currentDate = new Date();
    const categorizedJobs = {
      Immediate: [],
      High: [],
      Standard: [],
    };

    jobs.forEach((job) => {
      const deadline = new Date(job.deadline);
      const timeDiff = (deadline - currentDate) / (1000 * 60 * 60 * 24);
      if (timeDiff < 2) {
        categorizedJobs.Immediate.push(job);
      } else if (timeDiff <= 10) {
        categorizedJobs.High.push(job);
      } else {
        categorizedJobs.Standard.push(job);
      }
    });

    return categorizedJobs;
  };

  const fetchJobs = async (filterByLocation = false) => {
    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.jobCollectionID
      );
      const allJobs = response.documents;

      const remainingJobs = allJobs.filter((job) => job?.assigned_freelancer === null);
      console.log(remainingJobs);
      

      if (filterByLocation && location) {
        const filteredJobs = remainingJobs.filter((job) => {
          const jobDistance = calculateDistance(
            location.latitude,
            location.longitude,
            job.latitude,
            job.longitude
          );
          return jobDistance <= distance;
        });
        setJobs(categorizeJobs(filteredJobs));
      } else {
        setJobs(categorizeJobs(remainingJobs));
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to fetch jobs. Please try again later.",
        [{ text: "OK" }]
      );
    } finally {
      setLoading(false);
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
    getLocation()
    fetchJobs();
  }, []);


  useEffect(() => {
    if (location) {
      fetchJobs(true);
    }
  }, [distance, location]);

  const handlePriorityPress = (priority) => {
    navigation.navigate("JobPriority", { priority, jobs });
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
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#762BAD" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Marketplace</Text>
        <View style={styles.sliderContainer}>
          <Text style={styles.distanceText}>{distance} km</Text>

          <View style={styles.customSliderWrapper}>
            <LinearGradient
              colors={["#232222", "#898686"]}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 0 }}
              style={styles.sliderBackground}
              onStartShouldSetResponder={(e) => {
                const { locationX } = e.nativeEvent;
                handleSlide(locationX);
                return true;
              }}
              onMoveShouldSetResponder={() => true}
              onResponderMove={(e) => {
                const { locationX } = e.nativeEvent;
                handleSlide(locationX);
              }}
            >
              {/* <Animated.View
                style={[
                  styles.linesContainer,
                  {
                    transform: [
                      {
                        translateX: animatedValue.interpolate({
                          inputRange: [0, 100],
                          outputRange: [0, -200], // Move lines left when sliding right
                        }),
                      },
                    ],
                  },
                ]}
              >
                {renderLines()}
              </Animated.View> */}

              <View style={styles.linesContainer}>
                {renderLines()}
              </View>

              <View
                style={[
                  styles.sliderIndicator,
                  { left: `${(distance / maxDist) * 100}%` },
                ]}
              >
                <Text style={styles.sliderIndicatorText}>▼</Text>
              </View>
            </LinearGradient>

            <View style={styles.iconButtonContain}>
              <TouchableOpacity
                onPress={() => updateDistance(distance + step)}
                style={styles.iconButtonminus}
              >
                <Entypo name="circle-with-plus" size={29} color="black" />
              </TouchableOpacity>
            </View>
            <View style={styles.iconButtonContainminus}>
              <TouchableOpacity
                onPress={() => updateDistance(distance - step)}
                style={styles.iconButton}
              >
                <Entypo name="circle-with-minus" size={29} color="black" />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.sliderLabel}>
            Scroll the wheel to adjust job area
          </Text>
        </View>


        <MapView
          style={styles.map}
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
            <Marker
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              title="Our Location"
              description="This is our current location"
              pinColor="blue"
            />
          )}

          {jobs.Immediate.map((job, index) =>
            job.latitude && job.longitude ? (
              <Marker
                key={`immediate-${index}`}
                coordinate={{
                  latitude: job.latitude,
                  longitude: job.longitude,
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
                key={`high-${index}`}
                coordinate={{
                  latitude: job.latitude,
                  longitude: job.longitude,
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
                key={`standard-${index}`}
                coordinate={{
                  latitude: job.latitude,
                  longitude: job.longitude,
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
              style={styles.priorityButton}
            >
              <Text style={styles.priorityText}>Immediate Attention</Text>
              <Text style={styles.prioritySubText}>
                {jobs.Immediate.length}+ Jobs
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.priorityBox}
            onPress={() => handlePriorityPress("High")}
          >
            <LinearGradient colors={colors.High} style={styles.priorityButton}>
              <Text style={styles.priorityText}>High Priority</Text>
              <Text style={styles.prioritySubText}>
                {jobs.High.length}+ Jobs
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.priorityBox}
            onPress={() => handlePriorityPress("Standard")}
          >
            <LinearGradient
              colors={colors.Standard}
              style={styles.priorityButton}
            >
              <Text style={styles.priorityText}>Standard Priority</Text>
              <Text style={styles.prioritySubText}>
                {jobs.Standard.length}+ Jobs
              </Text>
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
        <TouchableOpacity style={styles.allJobsButton}>
          <Text style={styles.allJobsText}>All Jobs</Text>
        </TouchableOpacity>
      </LinearGradient>
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
      color: currentTheme.text
    },
    sliderContainer: {
      alignItems: "center",
      marginBottom: 20,
    },
    distanceText: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 10,
      color: currentTheme.subText
    },
    customSliderWrapper: {
      // flexDirection: "row",
      alignItems: "center",
      // justifyContent: "space-between",
      width: 360,
      height: 24,
      // backgroundColor: "transparent",
      margin: "auto",
      position: "relative"
    },
    iconButtonContain: {
      justifyContent: "center",
      alignItems: "center",
      position: "absolute",
      right: 14,
      top: 1,
      backgroundColor: "white",
      width: 29,
      height: 29,
      borderRadius: 20
    },
    iconButtonContainminus: {
      justifyContent: "center",
      alignItems: "center",
      position: "absolute",
      left: 15,
      top: 1,
      backgroundColor: "white",
      width: 29,
      height: 29,
      borderRadius: 20,
      padding: 0,
      margin: 0
    },
    // iconButton: {
    //   position: "absolute",
    //   right: 14,
    //   top: 1
    // },
    // iconButtonminus: {
    //   position: "absolute",
    //   left: 15,
    //   top: 1
    // },
    sliderBackground: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      width: 332,
      height: 32,
      borderRadius: 6,
      backgroundColor: "#232222",
      position: "relative",
      // overflow: "hidden"
    },
    linesContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      width: "100%",
      height: "100%",
      paddingHorizontal: 5,
      alignItems: "center"
    },
    line: {
      width: 3,
      height: "72%",
      // backgroundColor: "#898686",
    },
    sliderIndicator: {
      position: "absolute",
      top: -10,
      alignItems: "center",
    },
    sliderIndicatorText: {
      fontSize: 14,
      color: currentTheme.text || "#000",
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
      color: currentTheme.text
    },
    priorityContainer: {
      alignItems: "center",
      marginBottom: 20,
    },
    priorityBox: {
      width: "100%",
    },
    priorityButton: {
      width: "100%",
      padding: 10,
      paddingHorizontal: 20,
      borderRadius: 12,
      marginBottom: 12,
      alignItems: "baseline",
      flexDirection: "row",
      justifyContent: "flex-start",
      gap: 7,
    },
    priorityText: {
      color: "#fff",
      fontWeight: "semibold",
      fontSize: 20,
    },
    prioritySubText: {
      color: "#fff",
      fontSize: 14,
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
      justifyContent: "center"
    }
  });

export default MarketplaceScreen;
