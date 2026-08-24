import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
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
import SafeSpinner from "../components/SafeSpinner";
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
  PaperPlaneTilt,
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
import { useAuth } from "../context/NewAuthContext";
import { useDeliveryAddress } from "../hooks/useDeliveryAddress";
import AddressPickerModal from "../components/AddressPickerModal";
import { formatAddressLine, formatShortAddress } from "../lib/addressStorage";
import { getJobFormValidationError, JOB_VALIDATION } from "../lib/jobValidation";

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
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
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
  const [addressPickerOpen, setAddressPickerOpen] = useState(false);
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState(null);
  const [couponInput, setCouponInput] = useState("");

  const { userData } = useAuth();
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const isDark = theme === "dark";
  const styles = useMemo(() => getStyles(currentTheme, isDark), [currentTheme, isDark]);
  const accent = isDark ? "#B794FF" : PURPLE;

  const {
    addresses,
    selectedAddress,
    coords,
    locating,
    selectAddress,
    addAddress,
    removeAddress,
    useCurrentLocationAsAddress,
  } = useDeliveryAddress(userData?.id, userData?.client);

  const applySavedAddress = useCallback(
    async (address, { markUsed = false } = {}) => {
      if (!address) return;
      const fullLine = formatAddressLine(address) || formatShortAddress(address);
      setJobLocation(fullLine);
      setSelectedSavedAddressId(address.id);

      if (address.latitude != null && address.longitude != null) {
        const lat = Number(address.latitude);
        const lng = Number(address.longitude);
        if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
          setLatitude(lat);
          setLongitude(lng);
          setMapRegion({
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
          setTempLocation({ latitude: lat, longitude: lng });
        }
      }

      if (markUsed && address.id) {
        await selectAddress(address.id);
      }
    },
    [selectAddress]
  );

  // Stable chip order so selecting an address doesn't reshuffle the row
  const addressChips = useMemo(() => {
    return [...addresses]
      .sort((a, b) => {
        const aTime = Number(a.createdAt) || 0;
        const bTime = Number(b.createdAt) || 0;
        if (aTime !== bTime) return aTime - bTime;
        return String(a.id).localeCompare(String(b.id));
      })
      .slice(0, 6);
  }, [addresses]);

  useEffect(() => {
    validateBudget(budget);
    return () => setBudgetError("");
  }, [paymentMethod]);

  useFocusEffect(
    useCallback(() => {
      const loadPrefills = async () => {
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

          const prefillRaw = await AsyncStorage.getItem("jobRequirementsPrefill");
          if (prefillRaw) {
            const prefill = JSON.parse(prefillRaw);
            if (prefill.jobTitle) setJobTitle(prefill.jobTitle);
            if (prefill.jobDes) setJobDes(prefill.jobDes);
            if (prefill.budget) setBudget(String(prefill.budget));
            if (Array.isArray(prefill.skills) && prefill.skills.length) {
              setSkills(prefill.skills);
            }
            if (prefill.paymentMethod === "PLATFORM" || prefill.paymentMethod === "CASH") {
              setPaymentMethod(prefill.paymentMethod);
            }
            if (prefill.jobType === "Remote" || prefill.jobType === "On-site") {
              setJobType(prefill.jobType);
              setIsOnSite(prefill.jobType === "On-site");
            }
            if (prefill.serviceId) setServiceId(prefill.serviceId);
            if (prefill.freelancerType) setFrelancerType(prefill.freelancerType);
            await AsyncStorage.removeItem("jobRequirementsPrefill");
          }
        } catch (err) {
          console.error("Failed to load job prefill:", err);
        }
      };
      loadPrefills();
    }, [])
  );

  useEffect(() => {
    fetchWalletData();
    loadDraft();
    fetchAvailableCoupons();

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


  const fetchAvailableCoupons = async () => {
    try {
      const response = await apiService.getOffersData();
      setAvailableCoupons(response.discoveredOffers || []);
    } catch (error) {
      console.error("Error fetching coupons:", error);
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
      if (draft.startDate) setStartDate(new Date(draft.startDate));
      if (draft.deadline) setDeadline(new Date(draft.deadline));
      if (draft.selectedSavedAddressId) {
        setSelectedSavedAddressId(draft.selectedSavedAddressId);
      }
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
      const minBudget = birdFee?.minimumBudget != null ? birdFee.minimumBudget : 0;
      const maxBudget = birdFee?.maximumBudget > 0 ? birdFee.maximumBudget : Infinity;

      if (budgetNum < minBudget || budgetNum > maxBudget) {
        const rangeMessage =
          maxBudget === Infinity
            ? `Budget must be at least ₹${minBudget}`
            : minBudget === 0
            ? `Budget must be ₹${maxBudget} or less`
            : `Budget must be between ₹${minBudget} and ₹${maxBudget}`;

        setBudgetError(rangeMessage);
        return false;
      }

      if (birdFee && birdFee.feeStructure && birdFee.feeStructure.length > 0) {
        const feeResult = calculateBirdFee(budgetNum, birdFee);
        if (!feeResult.isValid) {
          setBudgetError(feeResult.error);
          setCalculatedBirdFee(null);
          return false;
        }
        setCalculatedBirdFee(feeResult);
      } else {
        setCalculatedBirdFee(null);
      }
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
      // Prefer the same default address used on Client Home
      if (selectedAddress) {
        applySavedAddress(selectedAddress, { markUsed: false });
      } else {
        setJobLocation("");
        setLatitude(null);
        setLongitude(null);
        setSelectedSavedAddressId(null);
      }
    } else {
      setJobType("Remote");
      setJobLocation("Remote Work");
      setLatitude(0);
      setLongitude(0);
      setSelectedSavedAddressId(null);
    }
  };

  // When addresses finish loading and user is already on-site with empty location, auto-fill
  useEffect(() => {
    if (!isOnSite || !selectedAddress) return;
    if (jobLocation && jobLocation.trim() && jobLocation !== "Remote Work") return;
    applySavedAddress(selectedAddress, { markUsed: false });
  }, [isOnSite, selectedAddress?.id]);

  const formData = {
    jobLocation,
    startDate: startDate?.toISOString?.() || new Date().toISOString(),
    deadline: deadline ? deadline.toISOString() : null,
    budget,
    skills: skills.map((s) => String(s || "").trim()).filter(Boolean),
    jobDes: jobDes.trim(),
    portfolioImages,
    jobTitle: jobTitle.trim(),
    freelancerType,
    jobType,
    latitude,
    longitude,
    serviceId,
    paymentMethod,
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

  /** One action: geocode typed address, or use GPS if the field is empty. */
  const detectLocation = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return null;
    setLocationLoading(true);
    try {
      const trimmed = jobLocation.trim();

      if (trimmed) {
        const [result] = await Location.geocodeAsync(trimmed);
        if (!result) {
          Alert.alert(
            "Address not found",
            "Could not locate that address. Clear the field to use GPS, or edit the text and try again."
          );
          return null;
        }
        const coords = {
          latitude: parseFloat(result.latitude),
          longitude: parseFloat(result.longitude),
        };
        setLatitude(coords.latitude);
        setLongitude(coords.longitude);
        setMapRegion({
          ...coords,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        setTempLocation(coords);
        return coords;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const coords = {
        latitude: parseFloat(location.coords.latitude),
        longitude: parseFloat(location.coords.longitude),
      };
      setLatitude(coords.latitude);
      setLongitude(coords.longitude);
      setMapRegion({
        ...coords,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      setTempLocation(coords);

      const addressResponse = await Location.reverseGeocodeAsync(coords);
      if (addressResponse.length > 0) {
        const address = addressResponse[0];
        setJobLocation(
          `${address.street || ""} ${address.city || ""} ${address.region || ""} ${address.country || ""}`.trim()
        );
      }
      return coords;
    } catch (error) {
      Alert.alert("Error", `Failed to detect location: ${error.message}`);
      return null;
    } finally {
      setLocationLoading(false);
    }
  };

  const openMapModal = async () => {
    let lat = latitude;
    let lng = longitude;
    if (!(lat && lng) && jobLocation.trim()) {
      const coords = await detectLocation();
      if (!coords) return;
      lat = coords.latitude;
      lng = coords.longitude;
    }
    if (lat && lng) {
      const newRegion = {
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setMapRegion(newRegion);
      setTempLocation({ latitude: lat, longitude: lng });
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
        setJobLocation("Selected map location");
      }
      setShowMapModal(false);
    } catch (error) {
      Alert.alert("Error", `Failed to get address: ${error.message}`);
      setLatitude(parseFloat(tempLocation.latitude));
      setLongitude(parseFloat(tempLocation.longitude));
      setJobLocation("Selected map location");
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

  const validateForm = () => {
    const error = getJobFormValidationError({
      jobTitle,
      jobDes,
      freelancerType,
      serviceId,
      jobType,
      deadline,
      startDate,
      budget,
      budgetError,
      skills,
      jobLocation,
      latitude,
      longitude,
      validateBudget,
    });
    if (error) {
      Alert.alert("Validation Error", error);
      return false;
    }
    return true;
  };

  const handleSaveDraft = async () => {
    try {
      const hasAttachments = portfolioImages.length > 0;
      await AsyncStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          ...formData,
          selectedSavedAddressId,
          // Local file URIs are not reliable across app restarts
          portfolioImages: [],
        })
      );
      Alert.alert(
        "Draft saved",
        hasAttachments
          ? "Your job details were saved. Attachments are not stored in drafts — re-add them before submit if needed."
          : "Your job details were saved as a draft."
      );
    } catch (error) {
      Alert.alert("Error", `Failed to save draft: ${error.message}`);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (jobType === "On-site") {
      if (latitude && longitude) {
        await AsyncStorage.removeItem(DRAFT_KEY);
        navigation.navigate("JobDetails", { formData: { ...formData, selectedCoupon } });
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
        selectedCoupon,
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
          <Ionicons name="arrow-back" size={24} color={currentTheme.text || "#000"} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Job Requirements</Text>
          <Text style={styles.headerSubtitle}>Fill in the details to post your job</Text>
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
            <Laptop size={20} color={!isOnSite ? "#fff" : accent} weight={!isOnSite ? "fill" : "regular"} />
            <Text style={[styles.segmentText, !isOnSite && styles.segmentTextActive]}>Remote</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentItem, isOnSite && styles.segmentItemActive]}
            onPress={() => setJobMode(true)}
            activeOpacity={0.88}
          >
            <MapPin size={20} color={isOnSite ? "#fff" : accent} weight={isOnSite ? "fill" : "regular"} />
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
            <View style={styles.locationHeaderRow}>
              <Text style={[styles.label, styles.labelInline]}>Job Location</Text>
              <TouchableOpacity onPress={() => setAddressPickerOpen(true)}>
                <Text style={styles.savedAddressLink}>Saved addresses</Text>
              </TouchableOpacity>
            </View>

            {addressChips.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.savedAddressChips}
              >
                {addressChips.map((address) => {
                  const active = selectedSavedAddressId === address.id;
                  return (
                    <TouchableOpacity
                      key={address.id}
                      style={[
                        styles.savedAddressChip,
                        active && styles.savedAddressChipActive,
                      ]}
                      onPress={() => applySavedAddress(address)}
                      activeOpacity={0.85}
                    >
                      <MapPin
                        size={14}
                        color={active ? "#FFFFFF" : accent}
                        weight="fill"
                      />
                      <View style={styles.savedAddressChipText}>
                        <Text
                          style={[
                            styles.savedAddressChipLabel,
                            active && styles.savedAddressChipLabelActive,
                          ]}
                          numberOfLines={1}
                        >
                          {address.label || "Address"}
                        </Text>
                        <Text
                          style={[
                            styles.savedAddressChipSub,
                            active && styles.savedAddressChipSubActive,
                          ]}
                          numberOfLines={1}
                        >
                          {formatShortAddress(address)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
                <TouchableOpacity
                  style={styles.addAddressChip}
                  onPress={() => setAddressPickerOpen(true)}
                >
                  <Ionicons name="add" size={18} color={PURPLE} />
                  <Text style={styles.addAddressChipText}>Add / manage</Text>
                </TouchableOpacity>
              </ScrollView>
            )}

            <View style={styles.inputRow}>
              <MapPin size={20} color={accent} />
              <TextInput
                style={styles.inputFlex}
                placeholder="Enter job address (e.g., 123 Main St, City, State)"
                placeholderTextColor={styles.placeholder.color}
                value={jobLocation}
                onChangeText={(text) => {
                  setJobLocation(text);
                  setSelectedSavedAddressId(null);
                }}
                multiline
              />
              <TouchableOpacity onPress={detectLocation} disabled={locationLoading}>
                <Ionicons name="locate-outline" size={20} color={accent} />
              </TouchableOpacity>
            </View>

            <View style={styles.locationBtnsRow}>
              <TouchableOpacity
                style={[styles.primaryLocationBtn, locationLoading && styles.disabledBtn]}
                onPress={detectLocation}
                disabled={locationLoading}
              >
                <PaperPlaneTilt size={18} color="#fff" weight="fill" />
                <Text style={styles.primaryLocationBtnText}>
                  {locationLoading ? "Detecting..." : "Use Current Location"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.secondaryLocationBtn, locationLoading && styles.disabledBtn]}
                onPress={detectLocation}
                disabled={locationLoading}
              >
                <Ionicons name="map-outline" size={18} color={PURPLE} />
                <Text style={styles.secondaryLocationBtnText}>Get Coordinates</Text>
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
                style={[
                  styles.mapOverlayBtn,
                  !hasCoordinates && !jobLocation.trim() && styles.disabledBtn,
                ]}
                onPress={openMapModal}
                disabled={!hasCoordinates && !jobLocation.trim()}
              >
                <Ionicons name="scan-outline" size={16} color={PURPLE} />
                <Text style={styles.mapOverlayBtnText}>View & Adjust on Map</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tipBox}>
              <Text style={styles.tipText}>
                Tip: Pick a saved address, tap Use current location, or type an address and tap Locate address.
              </Text>
            </View>
          </View>
        )}

        {/* Freelancer type */}
        <View style={styles.section}>
          <Text style={styles.label}>Freelancer Type</Text>
          {Array.isArray(services) ? (
            <View style={styles.pickerWrap}>
              <User size={20} color={accent} />
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
            <CalendarBlank size={18} color={accent} />
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
          ) : null}

          {budget && parseFloat(budget) > 0 && availableCoupons.length > 0 && (
            <View style={styles.couponSection}>
              <Text style={styles.couponTitle}>Available Coupons</Text>
              {availableCoupons.map((coupon) => {
                const budgetNum = parseFloat(budget);
                const isEligible = budgetNum >= coupon.minBooking;
                const discountText = coupon.amountType === "LUMPSUM"
                  ? `₹${coupon.amount} OFF`
                  : `${coupon.amount}% OFF (max ₹${coupon.maxDiscount})`;
                return (
                  <TouchableOpacity
                    key={coupon.id}
                    style={[
                      styles.couponCard,
                      !isEligible && styles.couponCardDisabled,
                      selectedCoupon?.id === coupon.id && styles.couponCardSelected,
                    ]}
                    onPress={() => {
                      if (isEligible) {
                        setSelectedCoupon(selectedCoupon?.id === coupon.id ? null : coupon);
                      }
                    }}
                    disabled={!isEligible}
                  >
                    <View style={styles.couponLeft}>
                      <Text style={[styles.couponDiscount, !isEligible && styles.couponTextDisabled]}>
                        {discountText}
                      </Text>
                      <Text style={[styles.couponMinBooking, !isEligible && styles.couponTextDisabled]}>
                        Min booking ₹{coupon.minBooking}+
                      </Text>
                    </View>
                    {isEligible && (
                      <View style={styles.couponRadio}>
                        {selectedCoupon?.id === coupon.id && <View style={styles.couponRadioDot} />}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
              {selectedCoupon && (
                <View style={styles.couponSummary}>
                  <Text style={styles.couponSummaryText}>
                    Coupon applied: You pay ₹{(parseFloat(budget) - (selectedCoupon.amountType === "LUMPSUM" ? selectedCoupon.amount : Math.min((parseFloat(budget) * selectedCoupon.amount) / 100, selectedCoupon.maxDiscount || Infinity))).toFixed(2)} | BirdEarner pays ₹{selectedCoupon.amountType === "LUMPSUM" ? selectedCoupon.amount : Math.min((parseFloat(budget) * selectedCoupon.amount) / 100, selectedCoupon.maxDiscount || Infinity)}
                  </Text>
                </View>
              )}
            </View>
          )}

          {budget &&
            walletData &&
            paymentMethod === "PLATFORM" && (
              <Text style={styles.validText}>
                Valid amount. Remaining: ₹
                {(walletData.availableBalance - parseFloat(budget || 0)).toFixed(2)}
              </Text>
          )}
        </View>

        {/* Job title */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Job Title{" "}
            <Text style={styles.helperInline}>
              (min {JOB_VALIDATION.jobTitleMin} characters)
            </Text>
          </Text>
          <View style={styles.inputRow}>
            <Ionicons name="document-text-outline" size={20} color={accent} />
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
              <Tag size={20} color={accent} />
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
          <Text style={styles.label}>
            Job Description{" "}
            <Text style={styles.helperInline}>
              (min {JOB_VALIDATION.jobDescriptionMin} characters)
            </Text>
          </Text>
          <View style={styles.textAreaWrap}>
            <View style={styles.textAreaIcon}>
              <Ionicons name="document-text-outline" size={20} color={accent} />
            </View>
            <TextInput
              style={styles.textArea}
              placeholder="Describe your job in detail..."
              placeholderTextColor={styles.placeholder.color}
              value={jobDes}
              multiline
              onChangeText={setJobDes}
            />
            <TouchableOpacity style={styles.micBtn}>
              <Ionicons name="mic-outline" size={20} color={PURPLE} />
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
            <CloudArrowUp size={24} color={accent} />
            <View style={styles.uploadTextWrap}>
              <Text style={styles.uploadTitle}>Add Images or Documents</Text>
              <Text style={styles.uploadSub}>JPG, PNG, PDF (Max 5 files, 10MB each)</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={accent} />
          </TouchableOpacity>
          {portfolioImages.length > 0 && (
            <View style={styles.uploadedImages}>
              {portfolioImages.map((image, index) => (
                <View key={`file-${index}`} style={styles.imagePreviewContainer}>
                  {image.isDocument ? (
                    <View style={styles.docPreview}>
                      <Ionicons name="document-outline" size={24} color={accent} />
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

        {/* Coupon Code */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Coupon Code <Text style={styles.helperInline}>(Optional)</Text>
          </Text>
          <View style={styles.couponInputRow}>
            <View style={styles.couponInputWrap}>
              <Ionicons name="pricetag-outline" size={20} color={accent} />
              <TextInput
                style={styles.inputFlex}
                placeholder="Enter coupon code"
                placeholderTextColor={styles.placeholder.color}
                value={couponInput}
                onChangeText={setCouponInput}
                autoCapitalize="characters"
              />
            </View>
            <TouchableOpacity
              style={styles.applyCouponBtn}
              onPress={() => {
                if (!couponInput.trim()) return;
                const found = availableCoupons.find(
                  (c) =>
                    c.code?.toLowerCase() === couponInput.trim().toLowerCase() ||
                    c.id === couponInput.trim()
                );
                if (found) {
                  setSelectedCoupon(found);
                  Alert.alert("Success", "Coupon applied!");
                } else {
                  Alert.alert("Coupon", `Code "${couponInput}" applied.`);
                }
              }}
            >
              <Text style={styles.applyCouponBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.draftBtn} onPress={handleSaveDraft}>
            <FloppyDisk size={20} color={currentTheme.text} />
            <Text style={styles.draftBtnText}>Save Draft</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <PaperPlaneTilt size={20} color="#fff" weight="fill" />
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
                <SafeSpinner color="#fff" size={18} />
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
              Tap anywhere on the map or drag the pin to set the exact job location
            </Text>
          </View>
        </SafeAreaView>
      </Modal>

      <AddressPickerModal
        visible={addressPickerOpen}
        onClose={() => setAddressPickerOpen(false)}
        addresses={addresses}
        selectedAddress={
          addresses.find((a) => a.id === selectedSavedAddressId) || selectedAddress
        }
        coords={coords}
        locating={locating}
        onSelect={async (id) => {
          const address = addresses.find((item) => item.id === id);
          if (address) await applySavedAddress(address);
          else await selectAddress(id);
        }}
        onAdd={async (address) => {
          const saved = await addAddress(address);
          if (saved) await applySavedAddress(saved, { markUsed: false });
          return saved;
        }}
        onUseCurrentLocation={async () => {
          const saved = await useCurrentLocationAsAddress();
          if (saved) await applySavedAddress(saved, { markUsed: false });
          return saved;
        }}
        onDelete={removeAddress}
      />
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
      paddingTop: Platform.OS === "android" ? 12 : 4,
      paddingBottom: 8,
      minHeight: 52,
    },
    backButton: {
      width: 36,
      height: 36,
      justifyContent: "center",
    },
    headerCenter: {
      flex: 1,
      alignItems: "center",
    },
    headerTitle: {
      color: text,
      fontSize: 18,
      fontWeight: "700",
    },
    headerSubtitle: {
      color: muted,
      fontSize: 13,
      marginTop: 2,
      textAlign: "center",
      lineHeight: 18,
    },
    headerSpacer: {
      width: 36,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: Platform.OS === "ios" ? 120 : 100,
    },
    segment: {
      flexDirection: "row",
      backgroundColor: isDark ? "#1B1B1B" : "#F3F0F7",
      borderRadius: 12,
      padding: 4,
      marginTop: 8,
      borderWidth: 1,
      borderColor: border,
    },
    segmentItem: {
      flex: 1,
      minHeight: 40,
      borderRadius: 10,
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
      fontSize: 14,
      fontWeight: "700",
    },
    segmentTextActive: {
      color: "#FFFFFF",
    },
    selectionBanner: {
      marginTop: 12,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
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
      fontSize: 14,
      fontWeight: "700",
    },
    selectionSubtitle: {
      color: muted,
      fontSize: 13,
      marginTop: 2,
      fontWeight: "500",
    },
    section: {
      marginTop: 18,
    },
    locationHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    savedAddressLink: {
      color: PURPLE,
      fontSize: 13,
      fontWeight: "700",
    },
    savedAddressChips: {
      gap: 8,
      paddingBottom: 8,
    },
    savedAddressChip: {
      maxWidth: 200,
      minWidth: 130,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: border,
      backgroundColor: card,
      paddingHorizontal: 12,
      paddingVertical: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginRight: 6,
    },
    savedAddressChipActive: {
      backgroundColor: PURPLE,
      borderColor: PURPLE,
    },
    savedAddressChipText: {
      flex: 1,
      minWidth: 0,
    },
    savedAddressChipLabel: {
      color: text,
      fontSize: 14,
      fontWeight: "700",
    },
    savedAddressChipLabelActive: {
      color: "#FFFFFF",
    },
    savedAddressChipSub: {
      color: muted,
      fontSize: 12,
      fontWeight: "500",
      marginTop: 1,
    },
    savedAddressChipSubActive: {
      color: "rgba(255,255,255,0.85)",
    },
    addAddressChip: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: PURPLE,
      borderStyle: "dashed",
      backgroundColor: soft,
      paddingHorizontal: 12,
      paddingVertical: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    addAddressChipText: {
      color: PURPLE,
      fontSize: 13,
      fontWeight: "700",
    },
    label: {
      color: text,
      fontSize: 14,
      fontWeight: "700",
      marginBottom: 8,
      marginLeft: 4,
    },
    helperInline: {
      color: muted,
      fontSize: 13,
      fontWeight: "500",
    },
    labelInline: {
      marginBottom: 0,
    },
    labelRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 8,
      marginLeft: 4,
    },
    inputRow: {
      minHeight: 48,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: border,
      backgroundColor: card,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
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
      fontWeight: "500",
      paddingVertical: 10,
    },
    placeholder: {
      color: muted,
    },
    pickerWrap: {
      minHeight: 48,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: border,
      backgroundColor: card,
      paddingLeft: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      overflow: "hidden",
    },
    pickerOuter: {
      flex: 1,
      marginBottom: 0,
      marginVertical: 0,
    },
    pickerInner: {
      backgroundColor: "transparent",
      borderRadius: 0,
      borderWidth: 0,
      minHeight: 48,
      paddingLeft: 0,
      paddingRight: 16,
    },
    helperText: {
      color: muted,
      fontSize: 13,
      marginBottom: 8,
      marginLeft: 4,
      lineHeight: 18,
    },
    paymentRow: {
      flexDirection: "row",
      gap: 10,
    },
    paymentCard: {
      flex: 1,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: border,
      backgroundColor: card,
      paddingHorizontal: 16,
      paddingVertical: 14,
      minHeight: 80,
    },
    paymentCardActive: {
      borderColor: PURPLE,
      backgroundColor: soft,
    },
    paymentCardTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8,
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
      fontWeight: "700",
    },
    paymentSub: {
      color: muted,
      fontSize: 13,
      marginTop: 2,
      fontWeight: "500",
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
      backgroundColor: card,
      paddingHorizontal: 14,
      paddingVertical: 8,
      height: 48,
    },
    dateLabel: {
      color: muted,
      fontSize: 12,
      fontWeight: "600",
      marginBottom: 2,
    },
    dateValueRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    dateValue: {
      flex: 1,
      color: text,
      fontSize: 14,
      fontWeight: "500",
    },
    timelineArrow: {
      marginTop: 8,
    },
    budgetHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 6,
    },
    walletLink: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    walletLinkText: {
      color: PURPLE,
      fontSize: 13,
      fontWeight: "700",
    },
    walletCard: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: border,
      backgroundColor: card,
      padding: 12,
      marginBottom: 8,
      gap: 6,
    },
    walletRow: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    walletLabel: {
      color: muted,
      fontSize: 13,
      fontWeight: "500",
    },
    walletAmount: {
      color: "#22C55E",
      fontSize: 13,
      fontWeight: "700",
    },
    walletReserved: {
      color: "#F59E0B",
      fontSize: 13,
      fontWeight: "700",
    },
    walletTotal: {
      color: text,
      fontSize: 13,
      fontWeight: "700",
    },
    currencyPrefix: {
      color: text,
      fontSize: 16,
      fontWeight: "700",
    },
    errorBlock: {
      marginTop: -2,
      marginBottom: 4,
    },
    errorText: {
      color: "#DC2626",
      fontSize: 12,
      fontWeight: "600",
    },
    addMoneyBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 4,
      alignSelf: "flex-start",
      backgroundColor: accentSoft,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
    },
    addMoneyText: {
      color: PURPLE,
      fontSize: 12,
      fontWeight: "700",
    },
    validatingText: {
      color: PURPLE,
      fontSize: 12,
      fontWeight: "600",
    },
    validText: {
      color: "#22C55E",
      fontSize: 12,
      fontWeight: "600",
    },
    addSkillsLink: {
      color: PURPLE,
      fontSize: 13,
      fontWeight: "700",
    },
    textAreaWrap: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: border,
      backgroundColor: card,
      minHeight: 120,
      paddingHorizontal: 16,
      paddingVertical: 14,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      position: "relative",
    },
    textAreaIcon: {
      height: 22,
      justifyContent: "center",
      marginTop: Platform.OS === "ios" ? 1 : 3,
    },
    textArea: {
      flex: 1,
      minHeight: 92,
      color: text,
      fontSize: 14,
      fontWeight: "500",
      lineHeight: 20,
      paddingTop: 0,
      paddingBottom: 0,
      textAlignVertical: "top",
    },
    micBtn: {
      position: "absolute",
      bottom: 10,
      right: 10,
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: isDark ? "#3A2A55" : "#E8D9FF",
      backgroundColor: soft,
      alignItems: "center",
      justifyContent: "center",
    },
    uploadCard: {
      borderRadius: 12,
      borderWidth: 1.5,
      borderStyle: "dashed",
      borderColor: PURPLE,
      backgroundColor: soft,
      paddingHorizontal: 16,
      paddingVertical: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    uploadTextWrap: {
      flex: 1,
    },
    uploadTitle: {
      color: PURPLE,
      fontSize: 14,
      fontWeight: "700",
    },
    uploadSub: {
      color: muted,
      fontSize: 13,
      marginTop: 2,
      fontWeight: "500",
    },
    uploadedImages: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginTop: 10,
      gap: 8,
    },
    imagePreviewContainer: {
      width: 80,
      height: 80,
      borderRadius: 10,
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
      padding: 6,
    },
    docName: {
      color: muted,
      fontSize: 9,
      textAlign: "center",
      marginTop: 2,
    },
    removeButton: {
      position: "absolute",
      top: 4,
      right: 4,
      backgroundColor: "#3b006b",
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    removeButtonText: {
      color: "#fff",
      fontSize: 10,
      fontWeight: "700",
    },
    couponInputRow: {
      flexDirection: "row",
      gap: 10,
      alignItems: "center",
    },
    couponInputWrap: {
      flex: 1,
      minHeight: 48,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: border,
      backgroundColor: card,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    applyCouponBtn: {
      height: 48,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: PURPLE,
      backgroundColor: card,
      paddingHorizontal: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    applyCouponBtnText: {
      color: PURPLE,
      fontSize: 14,
      fontWeight: "700",
    },
    actionRow: {
      flexDirection: "row",
      gap: 10,
      marginTop: 20,
      marginBottom: Platform.OS === "ios" ? 40 : 30,
    },
    draftBtn: {
      flex: 1,
      height: 48,
      borderRadius: 12,
      borderWidth: 1,
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
      fontWeight: "700",
    },
    submitBtn: {
      flex: 1.25,
      height: 48,
      borderRadius: 12,
      backgroundColor: PURPLE,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    submitBtnText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "700",
    },
    locationBtnsRow: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 10,
    },
    primaryLocationBtn: {
      flex: 1,
      height: 48,
      borderRadius: 12,
      backgroundColor: PURPLE,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingHorizontal: 12,
    },
    primaryLocationBtnText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "600",
    },
    secondaryLocationBtn: {
      flex: 1,
      height: 48,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: PURPLE,
      backgroundColor: "transparent",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingHorizontal: 12,
    },
    secondaryLocationBtnText: {
      color: PURPLE,
      fontSize: 14,
      fontWeight: "600",
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
      fontSize: 14,
      fontWeight: "600",
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
      lineHeight: 18,
      fontWeight: "500",
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
      fontSize: 18,
      fontWeight: "700",
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
      fontSize: 14,
      fontWeight: "700",
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
    couponSection: {
      marginTop: 14,
    },
    couponTitle: {
      color: text,
      fontSize: 14,
      fontWeight: "700",
      marginBottom: 8,
      marginLeft: 4,
    },
    couponCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderWidth: 1,
      borderColor: border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 8,
      backgroundColor: card,
    },
    couponCardDisabled: {
      opacity: 0.5,
    },
    couponCardSelected: {
      borderColor: PURPLE,
      backgroundColor: soft,
    },
    couponLeft: {
      flex: 1,
    },
    couponDiscount: {
      color: PURPLE,
      fontSize: 14,
      fontWeight: "700",
    },
    couponMinBooking: {
      color: muted,
      fontSize: 13,
      marginTop: 2,
      fontWeight: "500",
    },
    couponTextDisabled: {
      color: muted,
    },
    couponRadio: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: PURPLE,
      alignItems: "center",
      justifyContent: "center",
    },
    couponRadioDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: PURPLE,
    },
    couponSummary: {
      backgroundColor: soft,
      borderRadius: 10,
      padding: 12,
      marginTop: 4,
    },
    couponSummaryText: {
      color: PURPLE,
      fontSize: 13,
      fontWeight: "600",
    },
  });
};

export default JobRequirementsScreen;
