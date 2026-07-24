import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import CustomPicker from "../components/CustomPicker";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import {
  Briefcase,
  CalendarBlank,
  CloudArrowUp,
  FloppyDisk,
  Laptop,
  MapPin,
  Microphone,
  PaperPlaneTilt,
  Percent,
  ShieldCheck,
  Tag,
  User,
  Wallet,
} from "phosphor-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import MapView, { PROVIDER_GOOGLE, Marker } from "react-native-maps";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { format } from "date-fns";
import apiService from "../lib/apiService";
import { useTheme } from "../context/ThemeContext";

const { calculateBirdFee } = require("../utils/feeCalculator");

const PURPLE = "#7B2CFF";
const DRAFT_KEY = "jobRequirementsDraft";

const formatDisplayDate = (date) => {
  if (!date) return "";
  try {
    return format(date, "EEE, MMM d, yyyy");
  } catch {
    return date.toDateString?.() || "";
  }
};

const JobRequirementsScreen = ({ navigation }) => {
  const [jobLocation, setJobLocation] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [deadline, setDeadline] = useState(null);
  const [budget, setBudget] = useState("");
  const [walletData, setWalletData] = useState(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [budgetError, setBudgetError] = useState("");
  const [showWalletInfo, setShowWalletInfo] = useState(false);
  const [budgetValidating, setBudgetValidating] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState(null); // 'start' | 'end'
  const [skills, setSkills] = useState([""]);
  const [jobDes, setJobDes] = useState("");
  const [calculatedBirdFee, setCalculatedBirdFee] = useState(null);
  const [portfolioImages, setPortfolioImages] = useState([]);
  const [jobTitle, setJobTitle] = useState("");
  const [freelancerType, setFrelancerType] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [jobType, setJobType] = useState("Remote");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [services, setServices] = useState([]);
  const [isOnSite, setIsOnSite] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("PLATFORM");
  const [showMapModal, setShowMapModal] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
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

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const isDark = theme === "dark";
  const styles = useMemo(() => getStyles(currentTheme, isDark), [currentTheme, isDark]);
  const accent = isDark ? "#B794FF" : PURPLE;

  useEffect(() => {
    validateBudget(budget);
    return () => setBudgetError("");
  }, [paymentMethod]);

  useFocusEffect(
    useCallback(() => {
      const loadServiceInfo = async () => {
        try {
          const stored = await AsyncStorage.getItem("selectedService");
          if (stored) {
            const { serviceId: storedId, serviceName, serviceType } = JSON.parse(stored);
            if (storedId && serviceType) {
              if (serviceType === "freelance") {
                setIsOnSite(false);
                setJobType("Remote");
              } else {
                setIsOnSite(true);
                setJobType("On-site");
              }
              setFrelancerType(serviceName);
              setServiceId(storedId);
              await AsyncStorage.removeItem("selectedService");
            }
          }
        } catch (err) {
          console.error("Failed to load service info:", err);
        }
      };
      loadServiceInfo();
    }, [])
  );

  useEffect(() => {
    fetchWalletData();
    loadDraft();
    const unsubscribe = navigation.addListener("focus", fetchWalletData);
    return unsubscribe;
  }, [navigation]);

  const fetchWalletData = async () => {
    setWalletLoading(true);
    try {
      const response = await apiService.getClientWalletInfo();
      if (response.success) setWalletData(response.data);
    } catch (error) {
      // Session expiry is handled globally (toast + logout)
      if (!error?.isAuthError) {
        console.error("Error fetching wallet data:", error);
      }
    } finally {
      setWalletLoading(false);
    }
  };

  const loadDraft = async () => {
    try {
      const raw = await AsyncStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (draft.jobTitle) setJobTitle(draft.jobTitle);
      if (draft.jobDes) setJobDes(draft.jobDes);
      if (draft.budget) setBudget(String(draft.budget));
      if (Array.isArray(draft.skills) && draft.skills.length) setSkills(draft.skills);
      if (draft.jobType) {
        setJobType(draft.jobType);
        setIsOnSite(draft.jobType === "On-site");
      }
      if (draft.paymentMethod) setPaymentMethod(draft.paymentMethod);
      if (draft.jobLocation) setJobLocation(draft.jobLocation);
      if (draft.latitude != null) setLatitude(draft.latitude);
      if (draft.longitude != null) setLongitude(draft.longitude);
      if (draft.serviceId) setServiceId(draft.serviceId);
      if (draft.freelancerType) setFrelancerType(draft.freelancerType);
      if (draft.couponCode) setCouponCode(draft.couponCode);
      if (draft.startDate) setStartDate(new Date(draft.startDate));
      if (draft.deadline) setDeadline(new Date(draft.deadline));
    } catch (error) {
      console.error("Failed to load draft:", error);
    }
  };

  const validateBudget = (budgetValue) => {
    const budgetNum = parseFloat(budgetValue);
    setBudgetError("");
    setBudgetValidating(false);
    const selected = services.find((s) => s.id === serviceId);

    if (!budgetValue || isNaN(budgetNum) || budgetNum <= 0) {
      setBudgetError("Please enter a valid budget amount");
      return false;
    }

    if (selected) {
      const { birdFee } = selected;
      const minBudget = birdFee?.minimumBudget || 0;
      const maxBudget = birdFee?.maximumBudget || Infinity;

      if (budgetNum < minBudget || budgetNum > maxBudget) {
        setBudgetError(
          `Budget must be between ₹${minBudget.toFixed(2)} and ₹${maxBudget.toFixed(2)}`
        );
        return false;
      }

      const feeResult = calculateBirdFee(budgetNum, birdFee);
      if (!feeResult.isValid) {
        setBudgetError(feeResult.error);
        setCalculatedBirdFee(null);
        return false;
      }
      setCalculatedBirdFee(feeResult);
      return true;
    }

    if (paymentMethod === "PLATFORM") {
      if (!walletData) {
        setBudgetError("Unable to verify wallet balance. Please try again.");
        return false;
      }
      if (budgetNum > walletData.availableBalance) {
        setBudgetError(
          `Insufficient balance. \nRequired: ₹${budgetNum.toFixed(2)}. \nAvailable: ₹${walletData.availableBalance?.toFixed(2)}`
        );
        return false;
      }
    }

    return true;
  };

  const handleBudgetChange = (value) => {
    setBudget(value);
    if (value && walletData) {
      setBudgetValidating(true);
      setTimeout(() => validateBudget(value), 300);
    } else {
      setBudgetError("");
      setBudgetValidating(false);
    }
  };

  const navigateToWallet = () => navigation.navigate("WalletClient");

  const setJobMode = (onSite) => {
    setIsOnSite(onSite);
    if (onSite) {
      setJobType("On-site");
      setJobLocation("");
      setLatitude(null);
      setLongitude(null);
    } else {
      setJobType("Remote");
      setJobLocation("Remote Work");
      setLatitude(0);
      setLongitude(0);
    }
  };

  const formData = {
    jobLocation,
    startDate: startDate?.toISOString?.() || new Date().toISOString(),
    deadline: deadline ? deadline.toISOString() : null,
    budget,
    skills,
    jobDes,
    portfolioImages,
    jobTitle,
    freelancerType,
    jobType,
    latitude,
    longitude,
    serviceId,
    paymentMethod,
    couponCode: couponCode.trim() || null,
    birdFeeAmount: calculatedBirdFee ? calculatedBirdFee.feeAmount : null,
  };

  const requestPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission denied", "Location access is needed to use this feature.");
      return false;
    }
    return true;
  };

  useEffect(() => {
    async function fetchServices() {
      try {
        await apiService.init();
        const category = isOnSite ? "HOUSEHOLD" : "FREELANCE";
        const nextServices = await apiService.getServicesByCategory(category);
        setServices(nextServices);
      } catch (error) {
        console.error("Error fetching services:", error);
        Alert.alert("Error", "Failed to fetch services. Please try again.");
      }
    }
    fetchServices();
  }, [isOnSite]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const category = isOnSite ? "HOUSEHOLD" : "FREELANCE";
      const nextServices = await apiService.getServicesByCategory(category);
      setServices(nextServices);
      await fetchWalletData();
    } catch (error) {
      console.error("Error refreshing data:", error);
      Alert.alert("Error", "Failed to refresh data. Please try again.");
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
        setMapRegion({
          latitude: result.latitude,
          longitude: result.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        setTempLocation({ latitude: result.latitude, longitude: result.longitude });
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
      const { latitude: lat, longitude: lng } = location.coords;
      setLatitude(parseFloat(lat));
      setLongitude(parseFloat(lng));
      const newRegion = {
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setMapRegion(newRegion);
      setTempLocation({ latitude: lat, longitude: lng });

      const addressResponse = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });
      if (addressResponse.length > 0) {
        const address = addressResponse[0];
        setJobLocation(
          `${address.street || ""} ${address.city || ""} ${address.region || ""} ${address.country || ""}`.trim()
        );
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
    setTempLocation(event.nativeEvent.coordinate);
  };

  const confirmLocationFromMap = async () => {
    setLocationLoading(true);
    try {
      const { latitude: lat, longitude: lng } = tempLocation;
      setLatitude(parseFloat(lat));
      setLongitude(parseFloat(lng));
      const addressResponse = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });
      if (addressResponse.length > 0) {
        const address = addressResponse[0];
        setJobLocation(
          `${address.street || ""} ${address.city || ""} ${address.region || ""} ${address.country || ""}`.trim()
        );
      } else {
        setJobLocation(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      }
      setShowMapModal(false);
    } catch (error) {
      Alert.alert("Error", `Failed to get address: ${error.message}`);
      setLatitude(parseFloat(tempLocation.latitude));
      setLongitude(parseFloat(tempLocation.longitude));
      setJobLocation(
        `${tempLocation.latitude.toFixed(6)}, ${tempLocation.longitude.toFixed(6)}`
      );
      setShowMapModal(false);
    } finally {
      setLocationLoading(false);
    }
  };

  const addSkills = () => setSkills([...skills, ""]);

  const onChangeDate = (event, selectedDate) => {
    const mode = datePickerMode;
    setDatePickerMode(null);
    if (event?.type === "dismissed" || !selectedDate) return;
    if (mode === "start") {
      setStartDate(selectedDate);
      if (deadline && selectedDate > deadline) setDeadline(null);
    } else if (mode === "end") {
      setDeadline(selectedDate);
    }
  };

  const pickAttachments = async () => {
    Alert.alert("Add Attachment", "Choose a file type", [
      {
        text: "Images",
        onPress: async () => {
          try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permissionResult.granted) {
              Alert.alert("Permission required", "Please allow access to your media library.");
              return;
            }
            const pickerResult = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: false,
              quality: 1,
              allowsMultipleSelection: true,
            });
            if (!pickerResult.canceled) {
              const selected = pickerResult.assets || [];
              const next = [...portfolioImages, ...selected].slice(0, 5);
              setPortfolioImages(next);
            }
          } catch (error) {
            Alert.alert("Error", `Failed to pick images: ${error.message}`);
          }
        },
      },
      {
        text: "Documents",
        onPress: async () => {
          try {
            const result = await DocumentPicker.getDocumentAsync({
              type: ["application/pdf", "image/*"],
              multiple: true,
              copyToCacheDirectory: true,
            });
            if (result.canceled) return;
            const files = (result.assets || []).map((file) => ({
              uri: file.uri,
              name: file.name,
              mimeType: file.mimeType,
              type: file.mimeType,
              isDocument: true,
            }));
            setPortfolioImages([...portfolioImages, ...files].slice(0, 5));
          } catch (error) {
            Alert.alert("Error", `Failed to pick documents: ${error.message}`);
          }
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const removeImage = (index) => {
    setPortfolioImages(portfolioImages.filter((_, i) => i !== index));
  };

  const applyCoupon = () => {
    const code = couponCode.trim();
    if (!code) {
      setCouponMessage("Enter a coupon code first.");
      return;
    }
    setCouponMessage(`Coupon "${code.toUpperCase()}" will be verified on submit.`);
  };

  const handleVoiceInput = () => {
    Alert.alert(
      "Voice input",
      "Voice-to-text will be available in a future update. Please type your description for now."
    );
  };

  const validateForm = () => {
    if (!jobTitle) {
      Alert.alert("Validation Error", "Please enter a job title.");
      return false;
    }
    if (!freelancerType || !serviceId) {
      Alert.alert("Validation Error", "Please select a freelancer type.");
      return false;
    }
    if (!jobType) {
      Alert.alert("Validation Error", "Please select a job type.");
      return false;
    }
    if (!deadline) {
      Alert.alert("Validation Error", "Please select an end date.");
      return false;
    }
    if (deadline < new Date()) {
      Alert.alert("Validation Error", "Deadline must be a future date.");
      return false;
    }
    if (startDate && deadline < startDate) {
      Alert.alert("Validation Error", "End date must be after the start date.");
      return false;
    }
    if (!validateBudget(budget)) {
      Alert.alert(
        "Budget Validation Error",
        budgetError || "Please enter a valid budget amount."
      );
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
    if (jobDes.length < 20) {
      Alert.alert("Validation Error", "Job description must be at least 20 characters.");
      return false;
    }
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

  const handleSaveDraft = async () => {
    try {
      await AsyncStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          ...formData,
          portfolioImages: [],
        })
      );
      Alert.alert("Draft saved", "Your job details were saved as a draft.");
    } catch (error) {
      Alert.alert("Error", `Failed to save draft: ${error.message}`);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (jobType === "On-site") {
      if (latitude && longitude) {
        await AsyncStorage.removeItem(DRAFT_KEY);
        navigation.navigate("JobDetails", { formData });
      } else {
        Alert.alert("Validation Error", "Please set the job location coordinates.");
      }
    } else {
      const updatedFormData = {
        ...formData,
        paymentMethod,
        jobLocation: "Remote Work",
        latitude: 0,
        longitude: 0,
      };
      await AsyncStorage.removeItem(DRAFT_KEY);
      navigation.navigate("JobDetails", { formData: updatedFormData });
    }
  };

  const hasCoordinates = !!(latitude && longitude && latitude !== 0 && longitude !== 0);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color={currentTheme.text || "#000"} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Job Requirements</Text>
          <Text style={styles.headerSubtitle}>Fill in the details to post your job.</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[PURPLE]}
            tintColor={PURPLE}
            progressBackgroundColor={currentTheme.cardBackground || "#fff"}
          />
        }
      >
        {/* Remote / On-site toggle */}
        <View style={styles.segment}>
          <TouchableOpacity
            style={[styles.segmentItem, !isOnSite && styles.segmentItemActive]}
            onPress={() => setJobMode(false)}
            activeOpacity={0.88}
          >
            <Laptop size={18} color={!isOnSite ? "#fff" : accent} weight={!isOnSite ? "fill" : "regular"} />
            <Text style={[styles.segmentText, !isOnSite && styles.segmentTextActive]}>Remote</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentItem, isOnSite && styles.segmentItemActive]}
            onPress={() => setJobMode(true)}
            activeOpacity={0.88}
          >
            <MapPin size={18} color={isOnSite ? "#fff" : accent} weight={isOnSite ? "fill" : "regular"} />
            <Text style={[styles.segmentText, isOnSite && styles.segmentTextActive]}>On-site</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.selectionBanner}>
          <Briefcase size={20} color={accent} weight="fill" />
          <View style={styles.selectionBannerText}>
            <Text style={styles.selectionTitle}>
              Selected: {jobType} {isOnSite ? "🏢" : "💻"}
            </Text>
            <Text style={styles.selectionSubtitle}>
              Services: {isOnSite ? "Household Services" : "Freelance Services"}
            </Text>
          </View>
        </View>

        {/* On-site location */}
        {isOnSite && (
          <View style={styles.section}>
            <Text style={styles.label}>Job Location</Text>
            <View style={styles.inputRow}>
              <MapPin size={18} color={accent} />
              <TextInput
                style={styles.inputFlex}
                placeholder="Enter job address (e.g., 123 Main St, City, State)"
                placeholderTextColor={styles.placeholder.color}
                value={jobLocation}
                onChangeText={setJobLocation}
                multiline
              />
              <TouchableOpacity onPress={getCurrentLocation} disabled={locationLoading}>
                <Ionicons name="locate-outline" size={22} color={accent} />
              </TouchableOpacity>
            </View>

            <View style={styles.locationButtonsRow}>
              <TouchableOpacity
                style={[styles.primaryLocationBtn, locationLoading && styles.disabledBtn]}
                onPress={getCurrentLocation}
                disabled={locationLoading}
              >
                <PaperPlaneTilt size={16} color="#fff" weight="fill" />
                <Text style={styles.primaryLocationBtnText}>
                  {locationLoading ? "Getting..." : "Use Current Location"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.secondaryLocationBtn,
                  (locationLoading || !jobLocation.trim()) && styles.disabledBtn,
                ]}
                onPress={fetchCoordinates}
                disabled={locationLoading || !jobLocation.trim()}
              >
                <Ionicons name="map-outline" size={16} color={PURPLE} />
                <Text style={styles.secondaryLocationBtnText}>
                  {locationLoading ? "Loading..." : "Get Coordinates"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.mapPreview}>
              {hasCoordinates ? (
                <MapView
                  style={StyleSheet.absoluteFill}
                  region={{
                    latitude,
                    longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                  pointerEvents="none"
                  provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
                >
                  <Marker coordinate={{ latitude, longitude }} />
                </MapView>
              ) : (
                <View style={styles.mapPlaceholder}>
                  <MapPin size={28} color={accent} />
                  <Text style={styles.mapPlaceholderText}>Map preview appears after coordinates are set</Text>
                </View>
              )}
              <TouchableOpacity
                style={[styles.mapOverlayBtn, !hasCoordinates && styles.disabledBtn]}
                onPress={openMapModal}
                disabled={!hasCoordinates}
              >
                <Ionicons name="scan-outline" size={16} color={PURPLE} />
                <Text style={styles.mapOverlayBtnText}>View & Adjust on Map</Text>
              </TouchableOpacity>
            </View>

            {hasCoordinates && (
              <Text style={styles.coordsText}>
                📍 {latitude.toFixed(6)}, {longitude.toFixed(6)}
              </Text>
            )}
            <View style={styles.tipBox}>
              <Text style={styles.tipText}>
                💡 Tip: Use "Current Location" for your current position, or enter an address and tap "Get Coordinates".
              </Text>
            </View>
          </View>
        )}

        {/* Freelancer type */}
        <View style={styles.section}>
          <Text style={styles.label}>Freelancer Type</Text>
          {Array.isArray(services) ? (
            <View style={styles.pickerWrap}>
              <View style={styles.pickerIcon}>
                <User size={18} color={accent} />
              </View>
              <CustomPicker
                items={services.map((service) => ({
                  label: service.name || service.role || service.title,
                  value: service.id,
                }))}
                value={serviceId}
                onValueChange={(itemValue) => {
                  setServiceId(itemValue);
                  const selected = services.find((s) => s.id === itemValue);
                  setFrelancerType(
                    selected ? selected.name || selected.role || selected.title : ""
                  );
                }}
                placeholder="Select Freelancer Type"
                style={styles.pickerOuter}
                innerStyle={styles.pickerInner}
                textStyle={{ color: serviceId ? currentTheme.text : styles.placeholder.color }}
              />
            </View>
          ) : (
            <Text style={styles.helperText}>Loading services...</Text>
          )}
        </View>

        {/* Payment method */}
        <View style={styles.section}>
          <Text style={styles.label}>Payment Method</Text>
          <View style={styles.paymentRow}>
            <TouchableOpacity
              style={[
                styles.paymentCard,
                paymentMethod === "PLATFORM" && styles.paymentCardActive,
              ]}
              onPress={() => setPaymentMethod("PLATFORM")}
              activeOpacity={0.88}
            >
              <View style={styles.paymentCardTop}>
                <View
                  style={[
                    styles.radio,
                    paymentMethod === "PLATFORM" && styles.radioActive,
                  ]}
                >
                  {paymentMethod === "PLATFORM" && <View style={styles.radioDot} />}
                </View>
                <ShieldCheck
                  size={22}
                  color={paymentMethod === "PLATFORM" ? accent : currentTheme.subText}
                  weight="fill"
                />
              </View>
              <Text style={styles.paymentTitle}>Platform Payment</Text>
              <Text style={styles.paymentSub}>Pay through BirdEarner</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentCard,
                paymentMethod === "CASH" && styles.paymentCardActive,
              ]}
              onPress={() => setPaymentMethod("CASH")}
              activeOpacity={0.88}
            >
              <View style={styles.paymentCardTop}>
                <View
                  style={[styles.radio, paymentMethod === "CASH" && styles.radioActive]}
                >
                  {paymentMethod === "CASH" && <View style={styles.radioDot} />}
                </View>
                <Wallet
                  size={22}
                  color={paymentMethod === "CASH" ? accent : currentTheme.subText}
                  weight="fill"
                />
              </View>
              <Text style={styles.paymentTitle}>Cash Payment</Text>
              <Text style={styles.paymentSub}>Pay directly in cash</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <CalendarBlank size={16} color={accent} />
            <Text style={[styles.label, styles.labelInline]}>Timeline (Deadline)</Text>
          </View>
          <View style={styles.timelineRow}>
            <TouchableOpacity
              style={styles.dateField}
              onPress={() => setDatePickerMode("start")}
            >
              <Text style={styles.dateLabel}>Start Date</Text>
              <View style={styles.dateValueRow}>
                <CalendarBlank size={16} color={accent} />
                <Text style={styles.dateValue} numberOfLines={1}>
                  {formatDisplayDate(startDate)}
                </Text>
              </View>
            </TouchableOpacity>

            <Ionicons name="arrow-forward" size={18} color={accent} style={styles.timelineArrow} />

            <TouchableOpacity
              style={styles.dateField}
              onPress={() => setDatePickerMode("end")}
            >
              <Text style={styles.dateLabel}>End Date</Text>
              <View style={styles.dateValueRow}>
                <CalendarBlank size={16} color={accent} />
                <Text
                  style={[styles.dateValue, !deadline && styles.placeholder]}
                  numberOfLines={1}
                >
                  {deadline ? formatDisplayDate(deadline) : "Select end date"}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
          {datePickerMode && (
            <DateTimePicker
              value={
                datePickerMode === "start"
                  ? startDate || new Date()
                  : deadline || startDate || new Date()
              }
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              minimumDate={datePickerMode === "end" ? startDate || new Date() : new Date()}
              onChange={onChangeDate}
            />
          )}
        </View>

        {/* Budget */}
        <View style={styles.section}>
          <View style={styles.budgetHeader}>
            <Text style={[styles.label, styles.labelInline]}>Budget</Text>
            <TouchableOpacity
              style={styles.walletLink}
              onPress={() => setShowWalletInfo(!showWalletInfo)}
            >
              <Wallet size={16} color={accent} weight="fill" />
              <Text style={styles.walletLinkText}>
                {walletLoading ? "Loading..." : "Wallet Info"}
              </Text>
            </TouchableOpacity>
          </View>

          {showWalletInfo && walletData && (
            <View style={styles.walletCard}>
              <View style={styles.walletRow}>
                <Text style={styles.walletLabel}>Available Balance</Text>
                <Text style={styles.walletAmount}>
                  ₹{walletData.availableBalance?.toFixed(2) || "0.00"}
                </Text>
              </View>
              {walletData.reservedAmount > 0 && (
                <View style={styles.walletRow}>
                  <Text style={styles.walletLabel}>Reserved</Text>
                  <Text style={styles.walletReserved}>
                    ₹{walletData.reservedAmount?.toFixed(2)}
                  </Text>
                </View>
              )}
              <View style={styles.walletRow}>
                <Text style={styles.walletLabel}>Total Balance</Text>
                <Text style={styles.walletTotal}>
                  ₹{walletData.totalBalance?.toFixed(2) || "0.00"}
                </Text>
              </View>
            </View>
          )}

          <View style={[styles.inputRow, budgetError ? styles.inputRowError : null]}>
            <Text style={styles.currencyPrefix}>₹</Text>
            <TextInput
              style={styles.inputFlex}
              placeholder="Enter budget amount"
              placeholderTextColor={styles.placeholder.color}
              keyboardType="numeric"
              value={budget}
              onChangeText={handleBudgetChange}
            />
          </View>
          {budgetError ? (
            <View style={styles.errorBlock}>
              <Text style={styles.errorText}>{budgetError}</Text>
              {budgetError.includes("Insufficient balance") && (
                <TouchableOpacity onPress={navigateToWallet} style={styles.addMoneyBtn}>
                  <Ionicons name="add-circle-outline" size={16} color={PURPLE} />
                  <Text style={styles.addMoneyText}>Add Money</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : budgetValidating ? (
            <Text style={styles.validatingText}>Validating budget...</Text>
          ) : (
            budget &&
            walletData &&
            paymentMethod === "PLATFORM" && (
              <Text style={styles.validText}>
                Valid amount. Remaining: ₹
                {(walletData.availableBalance - parseFloat(budget || 0)).toFixed(2)}
              </Text>
            )
          )}
        </View>

        {/* Job title */}
        <View style={styles.section}>
          <Text style={styles.label}>Job Title</Text>
          <View style={styles.inputRow}>
            <Ionicons name="document-text-outline" size={18} color={accent} />
            <TextInput
              style={styles.inputFlex}
              placeholder={
                isOnSite
                  ? "e.g., Need a professional cleaner for home"
                  : "e.g., Looking for a skilled graphic designer"
              }
              placeholderTextColor={styles.placeholder.color}
              value={jobTitle}
              onChangeText={setJobTitle}
            />
          </View>
        </View>

        {/* Skills */}
        <View style={styles.section}>
          <Text style={styles.label}>Skills Required</Text>
          {skills.map((skill, index) => (
            <View key={`skill-${index}`} style={styles.inputRow}>
              <Tag size={18} color={accent} />
              <TextInput
                style={styles.inputFlex}
                placeholder="Add the required skills"
                placeholderTextColor={styles.placeholder.color}
                value={skill}
                onChangeText={(text) => {
                  const updated = [...skills];
                  updated[index] = text;
                  setSkills(updated);
                }}
              />
              {index === skills.length - 1 && (
                <TouchableOpacity onPress={addSkills}>
                  <Text style={styles.addSkillsLink}>+ Add more skills</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Job Description</Text>
          <View style={styles.textAreaWrap}>
            <View style={styles.textAreaTop}>
              <Ionicons name="document-text-outline" size={18} color={accent} />
              <TextInput
                style={styles.textArea}
                placeholder="Describe your job in detail..."
                placeholderTextColor={styles.placeholder.color}
                value={jobDes}
                multiline
                onChangeText={setJobDes}
              />
            </View>
            <TouchableOpacity style={styles.micButton} onPress={handleVoiceInput}>
              <Microphone size={18} color="#fff" weight="fill" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Attachments */}
        <View style={styles.section}>
          <Text style={styles.label}>Attachments (Optional)</Text>
          <Text style={styles.helperText}>
            Add files that help freelancers understand your job better.
          </Text>
          <TouchableOpacity style={styles.uploadCard} onPress={pickAttachments}>
            <CloudArrowUp size={28} color={accent} />
            <View style={styles.uploadTextWrap}>
              <Text style={styles.uploadTitle}>Add Images or Documents</Text>
              <Text style={styles.uploadSub}>JPG, PNG, PDF (Max 5 files, 10MB each)</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={accent} />
          </TouchableOpacity>
          {portfolioImages.length > 0 && (
            <View style={styles.uploadedImages}>
              {portfolioImages.map((image, index) => (
                <View key={`file-${index}`} style={styles.imagePreviewContainer}>
                  {image.isDocument ? (
                    <View style={styles.docPreview}>
                      <Ionicons name="document-outline" size={28} color={accent} />
                      <Text style={styles.docName} numberOfLines={2}>
                        {image.name || "Document"}
                      </Text>
                    </View>
                  ) : (
                    <Image
                      source={{ uri: apiService.loadImageURI(image.uri) }}
                      style={styles.uploadedImage}
                    />
                  )}
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeImage(index)}
                  >
                    <Text style={styles.removeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Coupon */}
        <View style={styles.section}>
          <Text style={styles.label}>Coupon Code (Optional)</Text>
          <View style={styles.couponRow}>
            <View style={[styles.inputRow, styles.couponInput]}>
              <Percent size={18} color={accent} />
              <TextInput
                style={styles.inputFlex}
                placeholder="Enter coupon code"
                placeholderTextColor={styles.placeholder.color}
                value={couponCode}
                autoCapitalize="characters"
                onChangeText={(text) => {
                  setCouponCode(text);
                  setCouponMessage("");
                }}
              />
            </View>
            <TouchableOpacity style={styles.applyBtn} onPress={applyCoupon}>
              <Text style={styles.applyBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
          {!!couponMessage && <Text style={styles.couponMessage}>{couponMessage}</Text>}
        </View>

        {/* Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.draftBtn} onPress={handleSaveDraft}>
            <FloppyDisk size={18} color={currentTheme.text} />
            <Text style={styles.draftBtnText}>Save Draft</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <PaperPlaneTilt size={18} color="#fff" weight="fill" />
            <Text style={styles.submitBtnText}>Review & Submit</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Map Modal */}
      <Modal visible={showMapModal} animationType="slide" presentationStyle="pageSheet">
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
              {locationLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.mapModalConfirmText}>Confirm</Text>
              )}
            </TouchableOpacity>
          </View>

          <MapView
            style={styles.map}
            region={mapRegion}
            provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
            onPress={handleMapPress}
            showsUserLocation
            showsMyLocationButton
          >
            <Marker
              coordinate={tempLocation}
              draggable
              onDragEnd={(e) => setTempLocation(e.nativeEvent.coordinate)}
              title="Job Location"
              description="Drag to adjust the exact location"
            />
          </MapView>

          <View style={styles.mapModalFooter}>
            <Text style={styles.mapHelpText}>
              📍 Tap anywhere on the map or drag the pin to set the exact job location
            </Text>
            <Text style={styles.coordsText}>
              Coordinates: {tempLocation.latitude.toFixed(6)},{" "}
              {tempLocation.longitude.toFixed(6)}
            </Text>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const getStyles = (currentTheme, isDark) => {
  const surface = currentTheme.background || "#FFFFFF";
  const card = currentTheme.cardBackground || (isDark ? "#1A1A1A" : "#FFFFFF");
  const text = currentTheme.text || "#101114";
  const muted = currentTheme.subText || "#656B7A";
  const border = currentTheme.border || "#E7E1EF";
  const soft = isDark ? "#2A2034" : "#F5ECFF";
  const inputBg = isDark ? currentTheme.background3 || "#2A2A2A" : "#FAFAFC";
  const accentSoft = isDark ? "#2A2034" : "#F7F2FF";

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: surface,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingTop: 4,
      paddingBottom: 8,
    },
    backButton: {
      width: 40,
      height: 40,
      justifyContent: "center",
    },
    headerCenter: {
      flex: 1,
      alignItems: "center",
    },
    headerTitle: {
      color: text,
      fontSize: 22,
      fontWeight: "900",
    },
    headerSubtitle: {
      color: muted,
      fontSize: 13,
      marginTop: 2,
      textAlign: "center",
    },
    headerSpacer: {
      width: 40,
    },
    scrollContent: {
      paddingHorizontal: 18,
      paddingBottom: 40,
    },
    segment: {
      flexDirection: "row",
      backgroundColor: isDark ? "#1B1B1B" : "#F3F0F7",
      borderRadius: 14,
      padding: 4,
      marginTop: 8,
      borderWidth: 1,
      borderColor: border,
    },
    segmentItem: {
      flex: 1,
      minHeight: 46,
      borderRadius: 11,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    segmentItemActive: {
      backgroundColor: PURPLE,
    },
    segmentText: {
      color: text,
      fontSize: 15,
      fontWeight: "800",
    },
    segmentTextActive: {
      color: "#FFFFFF",
    },
    selectionBanner: {
      marginTop: 14,
      borderRadius: 14,
      padding: 14,
      backgroundColor: soft,
      borderWidth: 1,
      borderColor: isDark ? "#3A2A55" : "#E8D9FF",
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    selectionBannerText: {
      flex: 1,
    },
    selectionTitle: {
      color: text,
      fontSize: 15,
      fontWeight: "800",
    },
    selectionSubtitle: {
      color: muted,
      fontSize: 13,
      marginTop: 2,
      fontWeight: "600",
    },
    section: {
      marginTop: 18,
    },
    label: {
      color: text,
      fontSize: 15,
      fontWeight: "800",
      marginBottom: 8,
    },
    labelInline: {
      marginBottom: 0,
    },
    labelRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 8,
    },
    inputRow: {
      minHeight: 50,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: border,
      backgroundColor: inputBg,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 10,
    },
    inputRowError: {
      borderColor: "#DC2626",
      backgroundColor: isDark ? "rgba(220,38,38,0.12)" : "#FEF2F2",
    },
    inputFlex: {
      flex: 1,
      color: text,
      fontSize: 14,
      fontWeight: "600",
      paddingVertical: 10,
    },
    placeholder: {
      color: muted,
    },
    pickerWrap: {
      position: "relative",
      justifyContent: "center",
    },
    pickerIcon: {
      position: "absolute",
      left: 14,
      zIndex: 2,
      top: 16,
    },
    pickerOuter: {
      marginBottom: 0,
    },
    pickerInner: {
      backgroundColor: inputBg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: border,
      minHeight: 50,
      paddingLeft: 36,
    },
    helperText: {
      color: muted,
      fontSize: 13,
      marginBottom: 10,
      lineHeight: 18,
    },
    paymentRow: {
      flexDirection: "row",
      gap: 10,
    },
    paymentCard: {
      flex: 1,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: border,
      backgroundColor: card,
      padding: 14,
      minHeight: 118,
    },
    paymentCardActive: {
      borderColor: PURPLE,
      backgroundColor: soft,
    },
    paymentCardTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    radio: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: border,
      alignItems: "center",
      justifyContent: "center",
    },
    radioActive: {
      borderColor: PURPLE,
    },
    radioDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: PURPLE,
    },
    paymentTitle: {
      color: text,
      fontSize: 14,
      fontWeight: "800",
    },
    paymentSub: {
      color: muted,
      fontSize: 12,
      marginTop: 4,
      fontWeight: "600",
    },
    timelineRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    dateField: {
      flex: 1,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: border,
      backgroundColor: inputBg,
      padding: 12,
    },
    dateLabel: {
      color: muted,
      fontSize: 11,
      fontWeight: "700",
      marginBottom: 6,
    },
    dateValueRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    dateValue: {
      flex: 1,
      color: text,
      fontSize: 12,
      fontWeight: "700",
    },
    timelineArrow: {
      marginTop: 12,
    },
    budgetHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    walletLink: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    walletLinkText: {
      color: PURPLE,
      fontSize: 13,
      fontWeight: "800",
    },
    walletCard: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: border,
      backgroundColor: card,
      padding: 12,
      marginBottom: 10,
      gap: 8,
    },
    walletRow: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    walletLabel: {
      color: muted,
      fontSize: 13,
      fontWeight: "600",
    },
    walletAmount: {
      color: "#22C55E",
      fontSize: 13,
      fontWeight: "800",
    },
    walletReserved: {
      color: "#F59E0B",
      fontSize: 13,
      fontWeight: "800",
    },
    walletTotal: {
      color: text,
      fontSize: 13,
      fontWeight: "800",
    },
    currencyPrefix: {
      color: text,
      fontSize: 16,
      fontWeight: "900",
    },
    errorBlock: {
      marginTop: -2,
      marginBottom: 4,
    },
    errorText: {
      color: "#DC2626",
      fontSize: 12,
      fontWeight: "700",
    },
    addMoneyBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 6,
      alignSelf: "flex-start",
      backgroundColor: accentSoft,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
    },
    addMoneyText: {
      color: PURPLE,
      fontSize: 12,
      fontWeight: "800",
    },
    validatingText: {
      color: PURPLE,
      fontSize: 12,
      fontWeight: "700",
    },
    validText: {
      color: "#22C55E",
      fontSize: 12,
      fontWeight: "700",
    },
    addSkillsLink: {
      color: PURPLE,
      fontSize: 12,
      fontWeight: "800",
    },
    textAreaWrap: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: border,
      backgroundColor: inputBg,
      minHeight: 150,
      padding: 12,
      position: "relative",
    },
    textAreaTop: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      flex: 1,
    },
    textArea: {
      flex: 1,
      minHeight: 120,
      color: text,
      fontSize: 14,
      fontWeight: "600",
      textAlignVertical: "top",
      paddingRight: 44,
    },
    micButton: {
      position: "absolute",
      right: 12,
      bottom: 12,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: PURPLE,
      alignItems: "center",
      justifyContent: "center",
    },
    uploadCard: {
      borderRadius: 14,
      borderWidth: 1.5,
      borderStyle: "dashed",
      borderColor: PURPLE,
      backgroundColor: soft,
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    uploadTextWrap: {
      flex: 1,
    },
    uploadTitle: {
      color: text,
      fontSize: 14,
      fontWeight: "800",
    },
    uploadSub: {
      color: muted,
      fontSize: 12,
      marginTop: 3,
      fontWeight: "600",
    },
    uploadedImages: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginTop: 12,
      gap: 8,
    },
    imagePreviewContainer: {
      width: 88,
      height: 88,
      borderRadius: 12,
      overflow: "hidden",
      position: "relative",
      backgroundColor: accentSoft,
    },
    uploadedImage: {
      width: "100%",
      height: "100%",
    },
    docPreview: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 8,
    },
    docName: {
      color: muted,
      fontSize: 10,
      textAlign: "center",
      marginTop: 4,
    },
    removeButton: {
      position: "absolute",
      top: 4,
      right: 4,
      backgroundColor: "#3b006b",
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
    },
    removeButtonText: {
      color: "#fff",
      fontSize: 10,
      fontWeight: "700",
    },
    couponRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    couponInput: {
      flex: 1,
      marginBottom: 0,
    },
    applyBtn: {
      minHeight: 50,
      paddingHorizontal: 18,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: PURPLE,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: card,
    },
    applyBtnText: {
      color: PURPLE,
      fontSize: 14,
      fontWeight: "900",
    },
    couponMessage: {
      color: muted,
      fontSize: 12,
      marginTop: 8,
      fontWeight: "600",
    },
    actionRow: {
      flexDirection: "row",
      gap: 10,
      marginTop: 24,
      marginBottom: 20,
    },
    draftBtn: {
      flex: 1,
      minHeight: 52,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: border,
      backgroundColor: card,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    draftBtnText: {
      color: text,
      fontSize: 14,
      fontWeight: "800",
    },
    submitBtn: {
      flex: 1.35,
      minHeight: 52,
      borderRadius: 14,
      backgroundColor: PURPLE,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    submitBtnText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "900",
    },
    locationButtonsRow: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 12,
    },
    primaryLocationBtn: {
      flex: 1.2,
      minHeight: 46,
      borderRadius: 12,
      backgroundColor: PURPLE,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingHorizontal: 8,
    },
    primaryLocationBtnText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "800",
    },
    secondaryLocationBtn: {
      flex: 1,
      minHeight: 46,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: PURPLE,
      backgroundColor: card,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingHorizontal: 8,
    },
    secondaryLocationBtnText: {
      color: PURPLE,
      fontSize: 12,
      fontWeight: "800",
    },
    disabledBtn: {
      opacity: 0.5,
    },
    mapPreview: {
      height: 150,
      borderRadius: 14,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: border,
      backgroundColor: isDark ? "#1F1F1F" : "#EEF2F7",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 10,
    },
    mapPlaceholder: {
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
      gap: 8,
    },
    mapPlaceholderText: {
      color: muted,
      fontSize: 12,
      textAlign: "center",
      fontWeight: "600",
    },
    mapOverlayBtn: {
      position: "absolute",
      alignSelf: "center",
      backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF",
      borderWidth: 1.5,
      borderColor: PURPLE,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    mapOverlayBtnText: {
      color: PURPLE,
      fontSize: 13,
      fontWeight: "800",
    },
    tipBox: {
      backgroundColor: isDark ? "rgba(245,158,11,0.15)" : "#FFF8E7",
      borderRadius: 10,
      padding: 10,
      marginTop: 4,
    },
    tipText: {
      color: isDark ? "#FBBF24" : "#92400E",
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "600",
    },
    coordsText: {
      color: muted,
      fontSize: 12,
      fontWeight: "700",
      textAlign: "center",
      marginBottom: 6,
    },
    mapModalContainer: {
      flex: 1,
      backgroundColor: surface,
    },
    mapModalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: PURPLE,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    mapModalCloseButton: {
      padding: 4,
    },
    mapModalTitle: {
      color: "#fff",
      fontSize: 17,
      fontWeight: "800",
    },
    mapModalConfirmButton: {
      backgroundColor: "#22C55E",
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 8,
      minWidth: 78,
      alignItems: "center",
    },
    mapModalConfirmText: {
      color: "#fff",
      fontWeight: "800",
    },
    map: {
      flex: 1,
    },
    mapModalFooter: {
      backgroundColor: card,
      padding: 14,
      borderTopWidth: 1,
      borderTopColor: border,
    },
    mapHelpText: {
      color: muted,
      fontSize: 13,
      textAlign: "center",
      marginBottom: 6,
    },
  });
};

export default JobRequirementsScreen;
