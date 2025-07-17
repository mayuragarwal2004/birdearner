import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Animated,
  RefreshControl,
  Modal,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Picker } from "@react-native-picker/picker";
import * as Location from "expo-location";
import MapView, { PROVIDER_GOOGLE, Marker } from "react-native-maps";
import apiService from "../lib/apiService";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/NewAuthContext";

const JobRequirementsScreen = ({ navigation, route }) => {
  const [jobLocation, setJobLocation] = useState("");
  const [deadline, setDeadline] = useState(new Date());
  const [budget, setBudget] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [skills, setSkills] = useState([""]);
  const [jobDes, setJobDes] = useState("");
  const [portfolioImages, setPortfolioImages] = useState([]);
  const [jobTitle, setJobTitle] = useState("");
  const [freelancerType, setFrelancerType] = useState("");
  const [jobType, setJobType] = useState("Remote");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [services, setServices] = useState([]);
  const [isOnSite, setIsOnSite] = useState(false); // Default to Remote (false = Remote, true = On-site)
  const [refreshing, setRefreshing] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [tempLocation, setTempLocation] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
  });
  const toggleAnim = new Animated.Value(isOnSite ? 1 : 0); // Animation value (0 = Remote, 1 = On-site)

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];

  const styles = getStyles(currentTheme);

  useEffect(() => {
    if (route.params?.freelancerType) {
      setFrelancerType(route.params.freelancerType);
    }
  }, [route.params?.freelancerType]);
  const handleToggle = () => {
    // Toggle state and animate translation
    setIsOnSite(!isOnSite);

    if (!isOnSite) {
      setJobType("On-site");
      // Clear location data when switching to on-site
      setJobLocation("");
      setLatitude(null);
      setLongitude(null);
    } else {
      setJobType("Remote");
      // Set default values for remote jobs
      setJobLocation("Remote Work");
      setLatitude(0);
      setLongitude(0);
    }

    Animated.timing(toggleAnim, {
      toValue: isOnSite ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const formData = {
    jobLocation,
    deadline: deadline.toISOString(),
    budget,
    skills,
    jobDes,
    portfolioImages,
    jobTitle,
    freelancerType,
    jobType,
    latitude,
    longitude,
  };

  const requestPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission denied",
        "Location access is needed to use this feature."
      );
      return false;
    }
    return true;
  };

  useEffect(() => {
    async function fetchServices() {
      try {
        await apiService.init(); // Initialize the API service
        const category = isOnSite ? "household" : "freelance";
        const services = await apiService.getServicesByCategory(category);
        console.log("Fetching services for category:", category);
        console.log({services});
        
        
        // Extract service names/roles from the response
        const serviceNames = services.map((service) => service.name || service.role || service.title);
        setServices(serviceNames);
      } catch (error) {
        console.error("Error fetching services:", error);
        Alert.alert("Error", "Failed to fetch services. Please try again.");
      }
    }
    fetchServices();
  }, [isOnSite]);

  // Function to handle manual refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await apiService.init(); // Initialize the API service
      const category = isOnSite ? "household" : "freelance";
      const services = await apiService.getServicesByCategory(category);
      console.log("Refreshing services for category:", category);
      console.log({services});
      
      // Extract service names/roles from the response
      const serviceNames = services.map((service) => service.name || service.role || service.title);
      setServices(serviceNames);
    } catch (error) {
      console.error("Error refreshing services:", error);
      Alert.alert("Error", "Failed to refresh services. Please try again.");
    } finally {
      setRefreshing(false);
    }
  };

  const fetchCoordinates = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    setLocationLoading(true);
    try {
      const [result] = await Location.geocodeAsync(jobLocation);
      if (result) {
        setLatitude(parseFloat(result.latitude));
        setLongitude(parseFloat(result.longitude));
        Alert.alert("Success", "Location coordinates found successfully!");
      } else {
        Alert.alert("Error", "Unable to fetch coordinates. Please try again.");
      }
    } catch (error) {
      Alert.alert("Error", `Failed to fetch coordinates: ${error.message}`);
    } finally {
      setLocationLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    setLocationLoading(true);
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      const { latitude, longitude } = location.coords;
      setLatitude(parseFloat(latitude));
      setLongitude(parseFloat(longitude));

      // Update map region and temp location
      const newRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setMapRegion(newRegion);
      setTempLocation({ latitude, longitude });

      // Get address from coordinates
      const addressResponse = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (addressResponse.length > 0) {
        const address = addressResponse[0];
        const formattedAddress = `${address.street || ''} ${address.city || ''} ${address.region || ''} ${address.country || ''}`.trim();
        setJobLocation(formattedAddress);
        Alert.alert("Success", "Current location detected successfully!");
      }
    } catch (error) {
      Alert.alert("Error", `Failed to get current location: ${error.message}`);
    } finally {
      setLocationLoading(false);
    }
  };

  const openMapModal = () => {
    if (latitude && longitude) {
      const newRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setMapRegion(newRegion);
      setTempLocation({ latitude, longitude });
    }
    setShowMapModal(true);
  };

  const handleMapPress = (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setTempLocation({ latitude, longitude });
  };

  const confirmLocationFromMap = async () => {
    setLocationLoading(true);
    try {
      const { latitude, longitude } = tempLocation;
      setLatitude(parseFloat(latitude));
      setLongitude(parseFloat(longitude));

      // Get address from coordinates
      const addressResponse = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (addressResponse.length > 0) {
        const address = addressResponse[0];
        const formattedAddress = `${address.street || ''} ${address.city || ''} ${address.region || ''} ${address.country || ''}`.trim();
        setJobLocation(formattedAddress);
      } else {
        setJobLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      }

      setShowMapModal(false);
      Alert.alert("Success", "Location selected successfully!");
    } catch (error) {
      Alert.alert("Error", `Failed to get address: ${error.message}`);
      // Still save the coordinates even if reverse geocoding fails
      setLatitude(parseFloat(tempLocation.latitude));
      setLongitude(parseFloat(tempLocation.longitude));
      setJobLocation(`${tempLocation.latitude.toFixed(6)}, ${tempLocation.longitude.toFixed(6)}`);
      setShowMapModal(false);
    } finally {
      setLocationLoading(false);
    }
  };

  const addSkills = () => {
    setSkills([...skills, ""]);
  };

  const onChangeDeadline = (event, selectedDate) => {
    const currentDate = selectedDate || deadline;
    setShowDatePicker(false);
    setDeadline(currentDate);
  };

  const uploadPortfolioImages = async () => {
    try {
      let permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          "Permission required",
          "You need to grant permission to access your photos."
        );
        return;
      }

      let pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [1, 1],
        quality: 1,
        allowsMultipleSelection: true,
      });

      if (!pickerResult.canceled) {
        const newImages = pickerResult.assets.map((asset) => asset.uri);
        setPortfolioImages([...portfolioImages, ...newImages]);
      }
    } catch (error) {
      Alert.alert("Error", `Failed to pick images: ${error.message}`);
    }
  };

  const removeImage = (index) => {
    setPortfolioImages(portfolioImages.filter((_, i) => i !== index));
  };

  // Validation function
  const validateForm = () => {
    if (!jobTitle) {
      Alert.alert("Validation Error", "Please enter a job title.");
      return false;
    }
    if (!freelancerType) {
      Alert.alert("Validation Error", "Please select a freelancer type.");
      return false;
    }
    if (!jobType) {
      Alert.alert("Validation Error", "Please select a job type.");
      return false;
    }
    if (deadline < new Date()) {
      Alert.alert("Validation Error", "Deadline must be a future date.");
      return false;
    }
    if (!budget || isNaN(budget) || budget <= 0) {
      Alert.alert("Validation Error", "Please enter a valid budget.");
      return false;
    }
    if (skills.some((skill) => skill === "")) {
      Alert.alert("Validation Error", "Please enter all required skills.");
      return false;
    }
    if (!jobDes) {
      Alert.alert("Validation Error", "Please enter a job description.");
      return false;
    }
    if (portfolioImages.length === 0) {
      Alert.alert(
        "Validation Error",
        "Please upload at least one portfolio image."
      );
      return false;
    }
    
    // Only validate location for on-site jobs
    if (jobType === "On-site") {
      if (!jobLocation || jobLocation.trim() === "") {
        Alert.alert("Validation Error", "Please enter a job location for on-site work.");
        return false;
      }
      if (!latitude || !longitude) {
        Alert.alert("Validation Error", "Please fetch coordinates for the job location.");
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      if (jobType === "On-site") {
        // For on-site jobs, coordinates should already be set
        if (latitude && longitude) {
          navigation.navigate("JobDetails", { formData });
        } else {
          Alert.alert("Validation Error", "Please set the job location coordinates.");
        }
      } else {
        // For remote jobs, set default location data
        const updatedFormData = {
          ...formData,
          jobLocation: "Remote Work",
          latitude: 0,
          longitude: 0,
        };
        navigation.navigate("JobDetails", { formData: updatedFormData });
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#6A0DAD"]} // Android
            tintColor="#6A0DAD" // iOS
            title="Refreshing services..." // iOS
            titleColor="#6A0DAD" // iOS
          />
        }
      >
        <View style={styles.main}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={currentTheme.text || black}
            />
          </TouchableOpacity>
          <Text style={styles.header}>Job Requirements</Text>
        </View>

        <View style={styles.toggleContainer}>
          {/* Animated View for Toggle */}
          <Animated.View
            style={[
              styles.toggle,
              {
                transform: [
                  {
                    translateX: toggleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 100], // Translate horizontally
                    }),
                  },
                ],
                backgroundColor: toggleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["#6A0DAD", "#6A0DAD"], // Purple for "On-site", Dark Gray for "Remote"
                }),
              },
            ]}
          />
          {/* Touchable for changing state */}
          <TouchableOpacity
            style={[styles.side, styles.leftSide]}
            onPress={() => isOnSite && handleToggle()}
            activeOpacity={0.8}
          >
            <Text style={[styles.text, !isOnSite && styles.activeText]}>
              Remote
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.side, styles.rightSide]}
            onPress={() => !isOnSite && handleToggle()}
            activeOpacity={0.8}
          >
            <Text style={[styles.text, isOnSite && styles.activeText]}>
              On-site
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.jobTypeIndicator}>
          <Text style={styles.jobTypeText}>
            Selected: {jobType} {isOnSite ? "🏢" : "💻"}
          </Text>
          <Text style={styles.serviceTypeText}>
            Services: {isOnSite ? "Household Services" : "Freelance Services"}
          </Text>
        </View>

        {jobType === "On-site" && (
          <View style={styles.locationSection}>
            <Text style={styles.label}>Job Location</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter job address (e.g., 123 Main St, City, State)"
              value={jobLocation}
              onChangeText={setJobLocation}
              multiline
            />
            
            <View style={styles.locationButtonsRow}>
              <TouchableOpacity 
                style={[styles.locationButton, locationLoading && styles.disabledButton]}
                onPress={getCurrentLocation}
                disabled={locationLoading}
              >
                <Ionicons name="location" size={20} color="#fff" />
                <Text style={styles.locationButtonText}>
                  {locationLoading ? "Getting..." : "Use Current"}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.locationButton, styles.geocodeButton, locationLoading && styles.disabledButton]}
                onPress={fetchCoordinates}
                disabled={locationLoading || !jobLocation.trim()}
              >
                <Ionicons name="map" size={20} color="#fff" />
                <Text style={styles.locationButtonText}>
                  {locationLoading ? "Loading..." : "Get Coordinates"}
                </Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={[styles.mapButton, !latitude && !longitude && styles.disabledButton]}
              onPress={openMapModal}
              disabled={!latitude && !longitude}
            >
              <Ionicons name="map-outline" size={20} color="#fff" />
              <Text style={styles.mapButtonText}>
                View & Adjust on Map
              </Text>
            </TouchableOpacity>
            
            {latitude && longitude && (
              <View style={styles.coordinatesDisplay}>
                <Text style={styles.coordinatesText}>
                  📍 Coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}
                </Text>
              </View>
            )}
            
            <Text style={styles.helpText}>
              💡 Tip: Use "Current Location" for your current position, or enter an address and tap "Get Coordinates"
            </Text>
          </View>
        )}

        <Text style={styles.label}>Freelancer Type</Text>
        <View style={styles.dropdown}>
          <Picker
            selectedValue={freelancerType}
            onValueChange={(itemValue) => setFrelancerType(itemValue)}
            style={[styles.picker, { color: currentTheme.text }]}
            dropdownIconColor={currentTheme.text}
            mode="dropdown"
          >
            <Picker.Item
              label="Select Freelancer Type"
              value=""
              style={styles.pickerItem}
            />
            {services.map((service, id) => (
              <Picker.Item
                key={id}
                label={service}
                value={service}
                style={styles.pickerItem}
              />
            ))}
          </Picker>
        </View>

        <View style={styles.row}>
          <View>
            <Text style={styles.label}>Deadline</Text>
            <TouchableOpacity
              style={styles.dob}
              onPress={() => setShowDatePicker(true)}
            >
              <Text>{deadline ? deadline.toDateString() : "Deadline"}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={deadline}
                mode="date"
                display="default"
                onChange={onChangeDeadline}
              />
            )}
          </View>
          <View style={styles.dropdownContainer}>
            <Text style={styles.label}>Budget</Text>
            <TextInput
              style={styles.input}
              placeholder=""
              keyboardType="number-pad"
              value={budget}
              onChangeText={setBudget}
            />
          </View>
        </View>

        <Text style={styles.label}>Job Title</Text>
        <TextInput
          style={styles.input}
          placeholder="Looking for a ...."
          value={jobTitle}
          onChangeText={setJobTitle}
        />

        <Text style={styles.label}>Skills Required</Text>
        {skills.map((skill, index) => (
          <TextInput
            key={index}
            style={styles.input}
            placeholder="Add the required skills"
            value={skill}
            onChangeText={(text) => {
              const updatedSkills = [...skills];
              updatedSkills[index] = text;
              setSkills(updatedSkills);
            }}
          />
        ))}
        <TouchableOpacity onPress={addSkills}>
          <Text style={styles.addMore}>+ Add more skills</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Job Description</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Describe your job"
          value={jobDes}
          multiline
          onChangeText={setJobDes}
        />

        <Text style={styles.label}>Attachments</Text>
        <TouchableOpacity
          style={styles.imageUploadButton}
          onPress={uploadPortfolioImages}
        >
          <Text style={styles.imageUploadButtonText}>
            Upload Portfolio Images
          </Text>
        </TouchableOpacity>

        <View style={styles.uploadedImages}>
          {portfolioImages.map((image, index) => (
            <View key={index} style={styles.imagePreviewContainer}>
              <Image source={{ uri: image }} style={styles.uploadedImage} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeImage(index)}
              >
                <Text style={styles.removeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <Text style={styles.bulletPoint}>
          1. Upload your image in 1080x1080 px
        </Text>
        <Text style={styles.bulletPoint}>
          2. Image size should be between 100 KB-2 MB.
        </Text>
        <Text style={styles.bulletPoint}>
          3. Don’t upload any inappropriate or NSFW content.
        </Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.nextButton} onPress={handleSubmit}>
            <Text style={styles.nextButtonText}>Submit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.nextButtonTextc}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Map Modal */}
      <Modal
        visible={showMapModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.mapModalContainer}>
          <View style={styles.mapModalHeader}>
            <TouchableOpacity 
              style={styles.mapModalCloseButton}
              onPress={() => setShowMapModal(false)}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.mapModalTitle}>Select Job Location</Text>
            <TouchableOpacity 
              style={styles.mapModalConfirmButton}
              onPress={confirmLocationFromMap}
              disabled={locationLoading}
            >
              <Text style={styles.mapModalConfirmText}>
                {locationLoading ? "Loading..." : "Confirm"}
              </Text>
            </TouchableOpacity>
          </View>
          
          <MapView
            style={styles.map}
            region={mapRegion}
            provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
            onPress={handleMapPress}
            showsUserLocation={true}
            showsMyLocationButton={true}
          >
            <Marker
              coordinate={tempLocation}
              draggable={true}
              onDragEnd={(e) => setTempLocation(e.nativeEvent.coordinate)}
              title="Job Location"
              description="Drag to adjust the exact location"
            />
          </MapView>
          
          <View style={styles.mapModalFooter}>
            <Text style={styles.mapHelpText}>
              📍 Tap anywhere on the map or drag the pin to set the exact job location
            </Text>
            <Text style={styles.coordinatesText}>
              Coordinates: {tempLocation.latitude.toFixed(6)}, {tempLocation.longitude.toFixed(6)}
            </Text>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const getStyles = (currentTheme) =>
  StyleSheet.create({
    container: {
      backgroundColor: currentTheme.background || "#fff",
      padding: 20,
      paddingHorizontal: 30,
      paddingVertical: 20,
      flexGrow: 1,
    },
    main: {
      marginBottom: 30,
      display: "flex",
      flexDirection: "row",
      gap: 50,
      alignItems: "center",
    },
    header: {
      fontSize: 24,
      fontWeight: "bold",
      textAlign: "center",
      color: currentTheme.text,
    },
    dropdown: {
      backgroundColor: currentTheme.background3 || "#ededed",
      borderRadius: 12,
      marginBottom: 20,
      height: 53,
    },
    // picker: {
    //   // flex: 1,
    //   // marginLeft: 10,
    //   // marginRight: 40,
    //   backgroundColor: currentTheme.background3,
    //   // borderRadius: 12
    // },
    pickerItem: {
      color: currentTheme.text,
      backgroundColor: currentTheme.background3,
    },
    label: {
      color: currentTheme.text || "000",
      marginVertical: 8,
      fontWeight: "600",
      fontSize: 16,
      marginLeft: 12,
    },
    input: {
      backgroundColor: currentTheme.background3 || "#ededed",
      borderRadius: 12,
      paddingHorizontal: 10,
      marginBottom: 15,
      height: 44,
      color: currentTheme.subText,
    },
    bulletPoint: {
      color: currentTheme.subText || "#000000",
      fontSize: 14,
      fontWeight: "400",
      lineHeight: 25,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 0,
      gap: 20,
    },
    inputContainer: {
      flex: 1,
      marginRight: 10,
    },
    dropdownContainer: {
      flex: 1,
    },
    dob: {
      width: "100%",
      height: 44,
      borderColor: currentTheme.border || "#ccc",
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 10,
      backgroundColor: currentTheme.background3 || "#ededed",
      justifyContent: "center",
    },
    addMore: {
      color: currentTheme.text || "#000",
      marginBottom: 10,
      marginLeft: 12,
    },
    textArea: {
      height: 180,
      borderColor: currentTheme.border || "#fff",
      borderWidth: 1,
      borderRadius: 5,
      padding: 10,
      backgroundColor: currentTheme.background3 || "#ededed",
      color: currentTheme.subText || "#000",
      textAlignVertical: "top",
    },
    imageUploadButton: {
      backgroundColor: "#4c0183",
      padding: 15,
      borderRadius: 8,
      alignItems: "center",
    },
    imageUploadButtonText: {
      color: "#ffffff",
      fontWeight: "bold",
    },
    uploadedImages: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginTop: 20,
    },
    imagePreviewContainer: {
      position: "relative",
      width: 100,
      height: 100,
      margin: 5,
    },
    uploadedImage: {
      width: "100%",
      height: "100%",
      borderRadius: 8,
    },
    removeButton: {
      position: "absolute",
      top: 5,
      right: 5,
      backgroundColor: "#3b006b",
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 12,
    },
    removeButtonText: {
      color: "#ffffff",
      fontSize: 10,
      fontWeight: "600",
    },
    buttonRow: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginTop: 30,
      alignItems: "center",
    },
    nextButton: {
      width: "35%",
      height: 40,
      backgroundColor: "#6A0DAD",
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    cancelButton: {
      width: "35%",
      height: 40,
      backgroundColor: currentTheme.background3 || "#9a9a9a",
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    nextButtonText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 20,
    },
    nextButtonTextc: {
      color: "#A39E9E",
      fontWeight: "bold",
      fontSize: 20,
    },
    toggleContainer: {
      width: 200, // Total width
      height: 50,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: currentTheme.border || "#fff",
      backgroundColor: currentTheme.background3 || "#ededed",
      flexDirection: "row",
      position: "relative",
      overflow: "hidden",
    },
    toggle: {
      position: "absolute",
      width: "50%",
      height: "100%",
      borderRadius: 12,
      zIndex: 1,
    },
    side: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      zIndex: 2, // Keep text above toggle
    },
    text: {
      fontSize: 18,
      fontWeight: "bold",
      color: currentTheme.subText || "#343434",
      textAlign: "center",
    },
    activeText: {
      color: "#FFFFFF",
    },
    leftSide: {
      justifyContent: "center",
      alignItems: "center",
    },
    rightSide: {
      justifyContent: "center",
      alignItems: "center",
    },
    locationSection: {
      marginBottom: 20,
    },
    locationButtonsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 10,
      marginBottom: 15,
      gap: 10,
    },
    locationButton: {
      flex: 1,
      backgroundColor: "#6A0DAD",
      paddingVertical: 12,
      paddingHorizontal: 15,
      borderRadius: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    geocodeButton: {
      backgroundColor: "#4c0183",
    },
    disabledButton: {
      backgroundColor: "#cccccc",
      opacity: 0.6,
    },
    locationButtonText: {
      color: "#ffffff",
      fontWeight: "600",
      fontSize: 14,
    },
    coordinatesDisplay: {
      backgroundColor: "#e8f5e8",
      padding: 12,
      borderRadius: 8,
      marginBottom: 10,
    },
    coordinatesText: {
      color: "#2d5016",
      fontWeight: "500",
      textAlign: "center",
    },
    helpText: {
      color: currentTheme.subText || "#666666",
      fontSize: 12,
      fontStyle: "italic",
      textAlign: "center",
      marginTop: 5,
    },
    jobTypeIndicator: {
      backgroundColor: currentTheme.background3 || "#f0f0f0",
      padding: 12,
      borderRadius: 8,
      marginVertical: 15,
      alignItems: "center",
    },
    jobTypeText: {
      color: currentTheme.text || "#000000",
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 4,
    },
    serviceTypeText: {
      color: currentTheme.subText || "#666666",
      fontSize: 14,
      fontWeight: "400",
    },
    mapButton: {
      backgroundColor: "#2E8B57",
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginTop: 10,
    },
    mapButtonText: {
      color: "#ffffff",
      fontWeight: "600",
      fontSize: 16,
    },
    mapModalContainer: {
      flex: 1,
      backgroundColor: "#ffffff",
    },
    mapModalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: "#6A0DAD",
      paddingHorizontal: 20,
      paddingVertical: 15,
    },
    mapModalCloseButton: {
      padding: 5,
    },
    mapModalTitle: {
      color: "#ffffff",
      fontSize: 18,
      fontWeight: "600",
    },
    mapModalConfirmButton: {
      backgroundColor: "#2E8B57",
      paddingHorizontal: 15,
      paddingVertical: 8,
      borderRadius: 6,
    },
    mapModalConfirmText: {
      color: "#ffffff",
      fontWeight: "600",
    },
    map: {
      flex: 1,
    },
    mapModalFooter: {
      backgroundColor: "#f8f9fa",
      padding: 15,
      borderTopWidth: 1,
      borderTopColor: "#e0e0e0",
    },
    mapHelpText: {
      color: "#666666",
      fontSize: 14,
      textAlign: "center",
      marginBottom: 8,
    },
  });

export default JobRequirementsScreen;
