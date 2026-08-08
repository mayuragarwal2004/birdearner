import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Checkbox from "expo-checkbox";
import DateTimePicker from "@react-native-community/datetimepicker";
import Toast from "react-native-toast-message";
import * as ImagePicker from "expo-image-picker";
import { z } from "zod";
import {
  User,
  UserCheck,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Calendar,
  MapPin,
  Building,
  Globe,
  FileText,
  Map,
  Edit3,
  Camera,
  ArrowLeft,
  Plus,
  Trash2,
  Briefcase,
  Link,
  ChevronDown,
} from "lucide-react-native";
import apiService from "../lib/apiService";
import { useAuth } from "../context/NewAuthContext";
import PickerModal from "../components/CustomPicker";

const DESIGNATION_OPTIONS = [
  { label: "Select Organization Type", value: "" },
  { label: "Individual", value: "Individual" },
  { label: "Business", value: "Business" },
  { label: "Non-Profit Organization", value: "Non-Profit Organization" },
  { label: "Educational Institution", value: "Educational Institution" },
  { label: "Government Agency", value: "Government Agency" },
  { label: "Other", value: "Other" },
];

const GENDER_OPTIONS = [
  { label: "Select Gender", value: "" },
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
  { label: "Other", value: "Other" },
];

const COUNTRY_OPTIONS = [
  { label: "Select Country", value: "" },
  { label: "India", value: "India" },
];

const indianStates = [
  { label: "Select State", value: "" },
  { label: "Andaman & Nicobar", value: "Andaman & Nicobar" },
  { label: "Andhra Pradesh", value: "Andhra Pradesh" },
  { label: "Arunachal Pradesh", value: "Arunachal Pradesh" },
  { label: "Assam", value: "Assam" },
  { label: "Bihar", value: "Bihar" },
  { label: "Chandigarh", value: "Chandigarh" },
  { label: "Chattisgarh", value: "Chattisgarh" },
  { label: "Dadra & Nagar Haveli", value: "Dadra & Nagar Haveli" },
  { label: "Daman & Diu", value: "Daman & Diu" },
  { label: "Delhi", value: "Delhi" },
  { label: "Goa", value: "Goa" },
  { label: "Gujarat", value: "Gujarat" },
  { label: "Haryana", value: "Haryana" },
  { label: "Himachal Pradesh", value: "Himachal Pradesh" },
  { label: "Jammu & Kashmir", value: "Jammu & Kashmir" },
  { label: "Jharkhand", value: "Jharkhand" },
  { label: "Karnataka", value: "Karnataka" },
  { label: "Kerala", value: "Kerala" },
  { label: "Lakshadweep", value: "Lakshadweep" },
  { label: "Madhya Pradesh", value: "Madhya Pradesh" },
  { label: "Maharashtra", value: "Maharashtra" },
  { label: "Manipur", value: "Manipur" },
  { label: "Meghalaya", value: "Meghalaya" },
  { label: "Mizoram", value: "Mizoram" },
  { label: "Nagaland", value: "Nagaland" },
  { label: "Odisha", value: "Odisha" },
  { label: "Pondicherry", value: "Pondicherry" },
  { label: "Punjab", value: "Punjab" },
  { label: "Rajasthan", value: "Rajasthan" },
  { label: "Sikkim", value: "Sikkim" },
  { label: "Tamil Nadu", value: "Tamil Nadu" },
  { label: "Telangana", value: "Telangana" },
  { label: "Tripura", value: "Tripura" },
  { label: "Uttar Pradesh", value: "Uttar Pradesh" },
  { label: "Uttarakhand", value: "Uttarakhand" },
  { label: "West Bengal", value: "West Bengal" },
];

// Create conditional schema based on mode
const createSchema = (mode) => {
  const baseSchema = {
    designation: z.string().optional(),
    heading: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
    bio: z.string().optional(),
    gender: z.string().optional(),
    dob: z.union([z.date(), z.string()]).optional().nullable(),
    socialLinks: z.array(z.string()).optional(),
    profileImage: z.any().optional(),
    coverImage: z.any().optional(),
  };

  if (mode === "signup") {
    return z
      .object({
        full_name: z.string().min(1, "Full name is required"),
        email: z.string().email("Valid email is required"),
        password: z.string().min(6, "Password must be at least 6 characters"),
        confirmPassword: z.string().min(6, "Confirm password is required"),
        termsAccepted: z.boolean().refine((val) => val === true, {
          message: "You must accept the Terms and Conditions.",
        }),
        ...baseSchema,
      })
      .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
      });
  } else {
    return z.object(baseSchema);
  }
};

const ClientSignup = ({ navigation, route }) => {
  const { register, user, refreshUserData } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Extract route params to determine mode and data
  const {
    mobile: initialMobile,
    email: initialEmail,
    mode = "signup", // 'signup', 'create', 'update'
    profileData,
    title,
  } = route.params || {};

  const schema = createSchema(mode);

  useEffect(() => {
    const initialStep = mode === "signup" ? 1 : 2;
    setStep(initialStep);
  }, [mode]);

  const [form, setForm] = useState({
    full_name: user?.fullName || "",
    mobile: initialMobile || "",
    email: initialEmail || user?.email || "",
    password: "",
    confirmPassword: "",
    termsAccepted: false,
    designation: user?.client?.organizationType || "",
    heading: user?.client?.companyName || "",
    zipCode: user?.client?.zipcode ? user.client.zipcode.toString() : "",
    city: user?.client?.city || "",
    state: user?.client?.state || "",
    country: user?.client?.country || "India",
    bio: user?.client?.profileDescription || "",
    autoFilledLocation: false,
    gender: "",
    dob: null,
    socialLinks: user?.client?.socialMediaLinks?.length
      ? user.client.socialMediaLinks
      : [""],
    profileImage: user?.client?.profilePhoto
      ? { uri: user.client.profilePhoto, isExisting: true }
      : null,
    coverImage: user?.client?.coverPhoto
      ? { uri: user.client.coverPhoto, isExisting: true }
      : null,
  });

  const [deletedImages, setDeletedImages] = useState([]);

  useEffect(() => {
    if (initialMobile || initialEmail) {
      setForm((prev) => ({
        ...prev,
        mobile: initialMobile || prev.mobile,
        email: initialEmail || prev.email,
      }));
    }
  }, [initialMobile, initialEmail]);

  useEffect(() => {
    const dataSource = profileData || user?.client;
    if (mode === "update" && dataSource) {
      setForm((prevForm) => ({
        ...prevForm,
        full_name: user?.fullName || prevForm.full_name,
        designation: dataSource.organizationType || prevForm.designation,
        heading: dataSource.companyName || prevForm.heading,
        city: dataSource.city || prevForm.city,
        state: dataSource.state || prevForm.state,
        zipCode: dataSource.zipcode
          ? dataSource.zipcode.toString()
          : prevForm.zipCode,
        country: dataSource.country || prevForm.country,
        bio: dataSource.profileDescription || prevForm.bio,
        socialLinks: dataSource.socialMediaLinks?.length
          ? dataSource.socialMediaLinks
          : prevForm.socialLinks,
        profileImage: dataSource.profilePhoto
          ? { uri: dataSource.profilePhoto, isExisting: true }
          : prevForm.profileImage,
        coverImage: dataSource.coverPhoto
          ? { uri: dataSource.coverPhoto, isExisting: true }
          : prevForm.coverImage,
      }));
    }
  }, [mode, user?.id, profileData]);

  const formatDateOfBirth = (dob) => {
    if (!dob) return "DD / MM / YYYY";
    try {
      const dateObj = typeof dob === "object" && dob instanceof Date ? dob : new Date(dob);
      if (isNaN(dateObj.getTime())) return "DD / MM / YYYY";
      return dateObj.toLocaleDateString("en-GB");
    } catch (e) {
      return "DD / MM / YYYY";
    }
  };

  const isValidIndianPincode = (pincode) => {
    const indianPincodeRegex = /^[1-9][0-9]{5}$/;
    return indianPincodeRegex.test(pincode);
  };

  const fetchLocationFromPincode = async (pincode) => {
    if (!pincode || pincode.length !== 6) return;

    if (!isValidIndianPincode(pincode)) {
      showToast("error", "Invalid Pincode", "Please enter a valid Indian pincode");
      setForm((prev) => ({
        ...prev,
        zipCode: "",
        city: "",
        state: "",
        autoFilledLocation: false,
      }));
      return;
    }

    try {
      setFetchingLocation(true);
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await response.json();

      if (data[0].Status === "Success" && data[0].PostOffice && data[0].PostOffice.length > 0) {
        const location = data[0].PostOffice[0];
        setForm((prev) => ({
          ...prev,
          city: location.District,
          state: location.State,
          autoFilledLocation: true,
        }));
      } else {
        showToast("error", "Invalid Pincode", "This pincode is not valid for India");
        setForm((prev) => ({
          ...prev,
          zipCode: "",
          city: "",
          state: "",
          autoFilledLocation: false,
        }));
      }
    } catch (error) {
      console.error("Error fetching location:", error);
      showToast("error", "Error", "Could not fetch location details");
    } finally {
      setFetchingLocation(false);
    }
  };

  const showToast = (type, text1, text2) => {
    Toast.show({ type, text1, text2, position: "top" });
  };

  const handleImageUpload = async (type) => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        showToast("error", "Permission Denied", "Grant access to photos.");
        return;
      }
      const aspect = type === "profile" ? [1, 1] : [3, 2];
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect,
        quality: 1,
      });
      if (!pickerResult.canceled) {
        const fieldName = type === "profile" ? "profileImage" : "coverImage";
        const existingImage = form[fieldName];

        if (existingImage && existingImage.isExisting && mode === "update") {
          setDeletedImages([...deletedImages, existingImage.uri]);
        }

        setForm({
          ...form,
          [fieldName]: {
            ...pickerResult.assets[0],
            isExisting: false,
          },
        });
      }
    } catch (error) {
      showToast("error", "Error", "Image Picker encountered an issue.");
    }
  };

  const addSocialLink = () =>
    setForm({ ...form, socialLinks: [...form.socialLinks, ""] });

  const nextStep = async () => {
    if (step === 1 && mode === "signup") {
      if (!form.full_name) {
        showToast("error", "Full Name Required", "Please enter your full name");
        return;
      }
      if (!form.email) {
        showToast("error", "Email Required", "Please enter your email");
        return;
      }
      if (!form.password) {
        showToast("error", "Password Required", "Please enter your password");
        return;
      }
      if (form.password.length < 6) {
        showToast(
          "error",
          "Weak Password",
          "Password must be at least 6 characters."
        );
        return;
      }
      if (!form.confirmPassword) {
        showToast(
          "error",
          "Confirm Password Required",
          "Please confirm your password."
        );
        return;
      }
      if (form.password !== form.confirmPassword) {
        showToast(
          "error",
          "Password Mismatch",
          "Passwords do not match. Please try again."
        );
        return;
      }

      setIsLoading(true);
      try {
        const response = await apiService.checkEmail(form.email);
        if (response.exists) {
          showToast(
            "error",
            "Email Already Exists",
            "This email is already registered. Please use a different email."
          );
          setIsLoading(false);
          return;
        }
        setIsLoading(false);
        setStep(2);
        return;
      } catch (error) {
        showToast(
          "error",
          "Check Failed",
          error.message || "Unable to verify email"
        );
        setIsLoading(false);
        return;
      }
    } else {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step === 2 && (mode === "create" || mode === "update")) {
      navigation.goBack();
    } else if (step > 1) {
      setStep(step - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleSubmit = async () => {
    console.log("Triggered handleSubmit with mode:", mode);
    setIsLoading(true);

    if (mode === "signup" && !form.termsAccepted) {
      showToast(
        "error",
        "Terms Required",
        "You must confirm and accept the Terms and Conditions."
      );
      setIsLoading(false);
      return;
    }

    try {
      const result = schema.safeParse(form);
      if (!result.success) {
        showToast(
          "error",
          "Validation Error",
          result?.error?.errors[0]?.message
        );
        setIsLoading(false);
        return;
      }
    } catch (error) {
      showToast("error", "Validation Error");
      setIsLoading(false);
      return;
    }

    const cleanedForm = {
      ...form,
      socialLinks: form.socialLinks.filter((link) => link.trim() !== ""),
      dob: form.dob
        ? typeof form.dob === "object" && form.dob?.toISOString
          ? form.dob.toISOString()
          : form.dob
        : null,
    };

    if (cleanedForm?.profileImage && cleanedForm?.profileImage?.uri) {
      if (cleanedForm.profileImage.isExisting) {
        cleanedForm.profileImage = cleanedForm.profileImage.uri;
      } else if (!cleanedForm.profileImage.uri.startsWith("http")) {
        const result = await apiService.uploadImage(
          cleanedForm.profileImage,
          "client_profile_photos"
        );
        if (result.success) {
          cleanedForm.profileImage = result.url;
        } else {
          showToast("error", "Error Uploading Profile Photo", result.message);
          setIsLoading(false);
          return;
        }
      }
    } else {
      cleanedForm.profileImage = null;
    }

    if (cleanedForm?.coverImage && cleanedForm?.coverImage?.uri) {
      if (cleanedForm.coverImage.isExisting) {
        cleanedForm.coverImage = cleanedForm.coverImage.uri;
      } else if (!cleanedForm.coverImage.uri.startsWith("http")) {
        const result = await apiService.uploadImage(
          cleanedForm.coverImage,
          "client_cover_photos"
        );
        if (result.success) {
          cleanedForm.coverImage = result.url;
        } else {
          showToast("error", "Error Uploading Cover Photo", result.message);
          setIsLoading(false);
          return;
        }
      }
    } else {
      cleanedForm.coverImage = null;
    }

    try {
      let result;

      if (mode === "signup") {
        result = await register({
          ...cleanedForm,
          mobile: form.mobile,
          role: "CLIENT",
        });

        if (result) {
          showToast("success", "Signup Complete", "Welcome to BirdEarner!");
          navigation.replace("MainTabs");
        } else {
          showToast(
            "error",
            "Signup Failed",
            "Registration failed. Please try again."
          );
        }
      } else if (mode === "create") {
        const clientCreateData = {
          userId: user?.id,
          email: user?.email,
          organizationType: cleanedForm.designation,
          companyName: cleanedForm.heading,
          city: cleanedForm.city,
          state: cleanedForm.state,
          zipcode: cleanedForm.zipCode ? parseInt(cleanedForm.zipCode) : null,
          country: cleanedForm.country,
          profileDescription: cleanedForm.bio,
          profilePhoto: cleanedForm.profileImage,
          coverPhoto: cleanedForm.coverImage,
          fullName: cleanedForm.full_name,
        };

        Object.keys(clientCreateData).forEach((key) => {
          if (
            clientCreateData[key] === null ||
            clientCreateData[key] === undefined ||
            clientCreateData[key] === ""
          ) {
            delete clientCreateData[key];
          }
        });

        result = await apiService.createClientProfile(clientCreateData);

        if (refreshUserData) {
          await refreshUserData();
        }

        showToast(
          "success",
          "Profile Created",
          "Client profile created successfully!"
        );
        navigation.goBack();
      } else if (mode === "update") {
        const clientUpdateData = {
          organizationType: cleanedForm.designation,
          companyName: cleanedForm.heading,
          city: cleanedForm.city,
          state: cleanedForm.state,
          zipcode: cleanedForm.zipCode ? parseInt(cleanedForm.zipCode) : null,
          country: cleanedForm.country,
          profileDescription: cleanedForm.bio,
          profilePhoto: cleanedForm.profileImage,
          coverPhoto: cleanedForm.coverImage,
          fullName: cleanedForm.full_name,
          deletedImages: deletedImages,
        };

        Object.keys(clientUpdateData).forEach((key) => {
          if (
            clientUpdateData[key] === null ||
            clientUpdateData[key] === undefined ||
            clientUpdateData[key] === ""
          ) {
            delete clientUpdateData[key];
          }
        });

        result = await apiService.updateClientProfile(
          user?.client?.id,
          clientUpdateData
        );

        if (refreshUserData) {
          await refreshUserData();
        }

        showToast(
          "success",
          "Profile Updated",
          "Client profile updated successfully!"
        );
        navigation.goBack();
      }
    } catch (error) {
      showToast(
        "error",
        `${mode.charAt(0).toUpperCase() + mode.slice(1)} Failed`,
        error.message || "An error occurred during submission."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#2E0854" }}>
      <LinearGradient
        colors={["#2E0854", "#3E0A70", "#1C0338"]}
        style={{ flex: 1 }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header for Step 1 (Screen 1 Reference) */}
            {step === 1 && mode === "signup" && (
              <View style={styles.headerSection}>
                <View style={styles.avatarHeaderBadge}>
                  <UserCheck size={36} color="#6D28D9" />
                </View>
                <Text style={styles.headerTitle}>Complete Your Profile</Text>
                <Text style={styles.headerSubtitle}>
                  Please fill in the details below to get started
                </Text>
              </View>
            )}

            {/* Header for Step 2 / Profile Mode (Screen 2 Reference) */}
            {(step >= 2 || mode !== "signup") && (
              <View style={styles.headerNavSection}>
                <TouchableOpacity
                  style={styles.backIconButton}
                  onPress={prevStep}
                >
                  <ArrowLeft size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                  {mode === "update"
                    ? title || "Update Your Profile"
                    : "Complete Your Profile"}
                </Text>
                <Text style={styles.headerSubtitle}>
                  Tell us a bit more about yourself
                </Text>
              </View>
            )}

            {/* Step 1: Basic Account Info (Screen 1 Reference) */}
            {step === 1 && mode === "signup" && (
              <View style={styles.card}>
                {/* Full Name */}
                <Text style={styles.fieldLabel}>Full Name</Text>
                <View style={styles.inputContainer}>
                  <View style={styles.iconBox}>
                    <User size={20} color="#7C3AED" />
                  </View>
                  <TextInput
                    style={styles.textInput}
                    placeholderTextColor="#A098AE"
                    placeholder="Enter your full name"
                    value={form.full_name}
                    onChangeText={(v) => setForm({ ...form, full_name: v })}
                    autoCapitalize="words"
                  />
                </View>

                {/* Mobile Number */}
                <Text style={styles.fieldLabel}>Mobile Number</Text>
                <View style={styles.inputContainer}>
                  <View style={styles.iconBox}>
                    <Phone size={20} color="#7C3AED" />
                  </View>
                  <View style={styles.countryCodeBox}>
                    <Text style={styles.countryFlag}>🇮🇳</Text>
                    <Text style={styles.countryCodeText}>+91</Text>
                  </View>
                  <TextInput
                    style={styles.textInput}
                    placeholderTextColor="#A098AE"
                    placeholder="Mobile number verified via OTP"
                    value={form.mobile}
                    editable={false}
                  />
                </View>

                {/* Email ID */}
                <Text style={styles.fieldLabel}>Email ID</Text>
                <View style={styles.inputContainer}>
                  <View style={styles.iconBox}>
                    <Mail size={20} color="#7C3AED" />
                  </View>
                  <TextInput
                    style={styles.textInput}
                    placeholderTextColor="#A098AE"
                    placeholder="Enter your email address"
                    value={form.email}
                    onChangeText={(v) => setForm({ ...form, email: v })}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                {/* Password */}
                <Text style={styles.fieldLabel}>Create a Password</Text>
                <View style={styles.inputContainer}>
                  <View style={styles.iconBox}>
                    <Lock size={20} color="#7C3AED" />
                  </View>
                  <TextInput
                    style={styles.textInput}
                    placeholderTextColor="#A098AE"
                    placeholder="Enter your password"
                    value={form.password}
                    onChangeText={(v) => setForm({ ...form, password: v })}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIconButton}
                  >
                    {showPassword ? (
                      <EyeOff size={20} color="#A098AE" />
                    ) : (
                      <Eye size={20} color="#A098AE" />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Confirm Password */}
                <Text style={styles.fieldLabel}>Confirm Password</Text>
                <View style={styles.inputContainer}>
                  <View style={styles.iconBox}>
                    <Lock size={20} color="#7C3AED" />
                  </View>
                  <TextInput
                    style={styles.textInput}
                    placeholderTextColor="#A098AE"
                    placeholder="Confirm your password"
                    value={form.confirmPassword}
                    onChangeText={(v) => setForm({ ...form, confirmPassword: v })}
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeIconButton}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} color="#A098AE" />
                    ) : (
                      <Eye size={20} color="#A098AE" />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Next Button */}
                <TouchableOpacity
                  style={[styles.primaryButton, isLoading && styles.disabledButton]}
                  onPress={nextStep}
                  disabled={isLoading}
                  activeOpacity={0.85}
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Next</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Step 2: Personal & Details Info (Screen 2 Reference) */}
            {step >= 2 && (
              <View style={styles.card}>
                {/* 1. Add Your Profile Picture */}
                <Text style={styles.sectionNumberTitle}>
                  1. Add Your Profile Picture
                </Text>
                <View style={styles.avatarSection}>
                  <TouchableOpacity
                    style={styles.avatarCircle}
                    onPress={() => handleImageUpload("profile")}
                    activeOpacity={0.8}
                  >
                    {form.profileImage && form.profileImage.uri ? (
                      <Image
                        source={{ uri: form.profileImage.uri }}
                        style={styles.avatarImage}
                      />
                    ) : (
                      <User size={36} color="#8B5CF6" />
                    )}
                    <View style={styles.cameraBadge}>
                      <Camera size={14} color="#FFFFFF" />
                    </View>
                  </TouchableOpacity>
                  <Text style={styles.avatarSubtext}>JPG, PNG up to 5MB</Text>
                  {form.profileImage && (
                    <TouchableOpacity
                      style={styles.removeImageLink}
                      onPress={() => {
                        if (form.profileImage.isExisting && mode === "update") {
                          setDeletedImages([...deletedImages, form.profileImage.uri]);
                        }
                        setForm({ ...form, profileImage: null });
                      }}
                    >
                      <Text style={styles.removeImageLinkText}>
                        Remove profile photo
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* 2. Date of Birth */}
                <Text style={styles.sectionNumberTitle}>
                  2. Date of Birth <Text style={styles.optionalText}>(Optional)</Text>
                </Text>
                <TouchableOpacity
                  style={styles.inputContainer}
                  onPress={() => setShowDatePicker(true)}
                  activeOpacity={0.8}
                >
                  <View style={styles.iconBox}>
                    <Calendar size={20} color="#7C3AED" />
                  </View>
                  <Text
                    style={[
                      styles.textInput,
                      !form.dob && { color: "#A098AE" },
                      { paddingTop: 14 },
                    ]}
                  >
                    {formatDateOfBirth(form.dob)}
                  </Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={
                      form.dob
                        ? typeof form.dob === "object" && form.dob instanceof Date
                          ? form.dob
                          : isNaN(new Date(form.dob).getTime())
                            ? new Date()
                            : new Date(form.dob)
                        : new Date()
                    }
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) {
                        setForm({ ...form, dob: selectedDate });
                      }
                    }}
                    maximumDate={new Date()}
                  />
                )}

                {/* 3. Gender */}
                <Text style={styles.sectionNumberTitle}>3. Gender</Text>
                <View style={styles.radioGroupRow}>
                  {["Male", "Female", "Other"].map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={styles.radioOption}
                      onPress={() => setForm({ ...form, gender: g })}
                      activeOpacity={0.8}
                    >
                      <View
                        style={[
                          styles.radioCircle,
                          form.gender === g && styles.radioCircleSelected,
                        ]}
                      >
                        {form.gender === g && (
                          <View style={styles.radioInnerDot} />
                        )}
                      </View>
                      <Text style={styles.radioLabelText}>{g}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* 4. Full Address */}
                <Text style={styles.sectionNumberTitle}>4. Full Address</Text>
                <View style={styles.gridRow}>
                  <View style={styles.gridCol}>
                    <View style={styles.inputContainer}>
                      <View style={styles.iconBox}>
                        <MapPin size={20} color="#7C3AED" />
                      </View>
                      <TextInput
                        style={styles.textInput}
                        placeholderTextColor="#A098AE"
                        placeholder="Address"
                        value={form.city}
                        onChangeText={(v) =>
                          setForm({ ...form, city: v, autoFilledLocation: false })
                        }
                      />
                    </View>
                  </View>
                  <View style={styles.gridCol}>
                    <View style={styles.inputContainer}>
                      <View style={styles.iconBox}>
                        <Building size={20} color="#7C3AED" />
                      </View>
                      <TextInput
                        style={styles.textInput}
                        placeholderTextColor="#A098AE"
                        placeholder="Address Line 2 / Company"
                        value={form.heading}
                        onChangeText={(v) => setForm({ ...form, heading: v })}
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.gridRow}>
                  <View style={styles.gridCol}>
                    <View style={styles.inputContainer}>
                      <View style={styles.iconBox}>
                        <FileText size={20} color="#7C3AED" />
                      </View>
                      <TextInput
                        style={styles.textInput}
                        keyboardType="numeric"
                        maxLength={6}
                        value={form.zipCode}
                        onChangeText={(text) => {
                          setForm({ ...form, zipCode: text });
                          if (text.length === 6) {
                            fetchLocationFromPincode(text);
                          }
                        }}
                        placeholder="Pin Code"
                        placeholderTextColor="#A098AE"
                      />
                    </View>
                  </View>
                  <View style={styles.gridCol}>
                    <PickerModal
                      items={indianStates}
                      value={form.state}
                      onValueChange={(value) =>
                        setForm({ ...form, state: value, autoFilledLocation: false })
                      }
                      placeholder={
                        fetchingLocation ? "Fetching..." : "State"
                      }
                      leftIcon={<Map size={20} color="#7C3AED" />}
                      disabled={fetchingLocation}
                      style={{ marginVertical: 0 }}
                    />
                  </View>
                </View>

                {/* Country Dropdown */}
                <PickerModal
                  items={COUNTRY_OPTIONS}
                  value={form.country}
                  onValueChange={(v) => setForm({ ...form, country: v })}
                  placeholder="Country"
                  leftIcon={<Globe size={20} color="#7C3AED" />}
                  disabled={true}
                  style={{ marginVertical: 4, marginBottom: 16 }}
                />

                {/* 5. Write Something about Yourself */}
                <Text style={styles.sectionNumberTitle}>
                  5. Write Something about Yourself
                </Text>
                <View style={styles.textAreaContainer}>
                  <View style={styles.textAreaIconBox}>
                    <Edit3 size={20} color="#7C3AED" />
                  </View>
                  <TextInput
                    style={styles.textAreaInput}
                    placeholderTextColor="#A098AE"
                    placeholder="Tell us something about yourself..."
                    value={form.bio}
                    multiline
                    onChangeText={(v) =>
                      v.length <= 255 && setForm({ ...form, bio: v })
                    }
                  />
                  <Text style={styles.charCountText}>
                    {form.bio ? form.bio.length : 0} / 255
                  </Text>
                </View>

                {/* Social Links */}
                <Text style={styles.subFieldLabel}>Social Media Links</Text>
                {form.socialLinks.map((link, i) => (
                  <View key={i} style={styles.inputContainer}>
                    <View style={styles.iconBox}>
                      <Link size={20} color="#7C3AED" />
                    </View>
                    <TextInput
                      style={styles.textInput}
                      placeholderTextColor="#A098AE"
                      placeholder="www.instagram.com/xyz"
                      value={link}
                      onChangeText={(v) =>
                        setForm({
                          ...form,
                          socialLinks: form.socialLinks.map((l, idx) =>
                            idx === i ? v : l
                          ),
                        })
                      }
                    />
                  </View>
                ))}
                <TouchableOpacity
                  onPress={addSocialLink}
                  style={styles.addSocialButton}
                >
                  <Plus size={16} color="#6D28D9" style={{ marginRight: 6 }} />
                  <Text style={styles.addSocialText}>
                    Add more social media links
                  </Text>
                </TouchableOpacity>

                {/* Terms Checkbox (Signup mode) */}
                {mode === "signup" && (
                  <View style={styles.checkboxContainer}>
                    <Checkbox
                      value={form.termsAccepted}
                      onValueChange={(v) => setForm({ ...form, termsAccepted: v })}
                      color={form.termsAccepted ? "#6D28D9" : undefined}
                      style={styles.checkbox}
                    />
                    <Text style={styles.checkboxLabel}>
                      I confirm that the information provided is true and filled by
                      me. I have read and agree to the{" "}
                      <Text style={styles.linkText}>terms & conditions</Text> and{" "}
                      <Text style={styles.linkText}>policies</Text>.
                    </Text>
                  </View>
                )}

                {/* Action Buttons: Back & Submit */}
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.outlinedButton}
                    onPress={prevStep}
                    disabled={isLoading}
                    activeOpacity={0.85}
                  >
                    <ArrowLeft size={18} color="#6D28D9" style={{ marginRight: 6 }} />
                    <Text style={styles.outlinedButtonText}>Back</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.primaryHalfButton, isLoading && styles.disabledButton]}
                    onPress={handleSubmit}
                    disabled={isLoading}
                    activeOpacity={0.85}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Text style={styles.primaryButtonText}>Submit</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Bottom Security Banner */}
            {step === 1 && mode === "signup" && (
              <View style={styles.securityBanner}>
                <ShieldCheck size={18} color="#BDB4FE" style={{ marginRight: 8 }} />
                <Text style={styles.securityText}>
                  Your information is safe and secure with us.
                </Text>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 20,
    marginTop: Platform.OS === "android" ? (StatusBar.currentHeight || 24) + 16 : 24,
  },
  headerNavSection: {
    alignItems: "center",
    marginBottom: 20,
    marginTop: Platform.OS === "android" ? (StatusBar.currentHeight || 24) + 16 : 24,
    position: "relative",
    paddingHorizontal: 36,
  },
  backIconButton: {
    position: "absolute",
    left: 0,
    top: 2,
    padding: 6,
  },
  avatarHeaderBadge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#D4C5ED",
    textAlign: "center",
    lineHeight: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1F1D2B",
    marginBottom: 6,
  },
  subFieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1F1D2B",
    marginTop: 8,
    marginBottom: 8,
  },
  optionalText: {
    fontSize: 12,
    fontWeight: "400",
    color: "#8E8EA9",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAFAFC",
    borderWidth: 1,
    borderColor: "#E9E3F4",
    borderRadius: 14,
    paddingHorizontal: 8,
    minHeight: 52,
    marginBottom: 16,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#F3E8FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  countryCodeBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 8,
    marginRight: 8,
    borderRightWidth: 1,
    borderRightColor: "#E9E3F4",
  },
  countryFlag: {
    fontSize: 16,
    marginRight: 4,
  },
  countryCodeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F1D2B",
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: "#1F1D2B",
    paddingVertical: 10,
  },
  eyeIconButton: {
    padding: 8,
  },
  primaryButton: {
    height: 52,
    backgroundColor: "#6D28D9",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#6D28D9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.6,
  },
  sectionNumberTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F1D2B",
    marginTop: 12,
    marginBottom: 12,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 16,
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderStyle: "dashed",
    borderWidth: 1.5,
    borderColor: "#8B5CF6",
    backgroundColor: "#F5F0FF",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  avatarImage: {
    width: 86,
    height: 86,
    borderRadius: 43,
  },
  cameraBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#6D28D9",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  avatarSubtext: {
    fontSize: 12,
    color: "#8E8EA9",
    marginTop: 8,
  },
  removeImageLink: {
    marginTop: 4,
    paddingVertical: 4,
  },
  removeImageLinkText: {
    fontSize: 12,
    color: "#DC2626",
    fontWeight: "500",
  },
  coverSection: {
    marginBottom: 16,
  },
  coverUploadBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E9E3F4",
    borderStyle: "dashed",
    backgroundColor: "#FAFAFC",
    gap: 8,
  },
  coverUploadText: {
    fontSize: 13,
    color: "#6D28D9",
    fontWeight: "600",
  },
  coverPreviewContainer: {
    position: "relative",
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 4,
  },
  coverPreviewImage: {
    width: "100%",
    height: 100,
    borderRadius: 14,
  },
  removeCoverBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: 6,
    borderRadius: 12,
  },
  radioGroupRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginBottom: 16,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#C4B5FD",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },
  radioCircleSelected: {
    borderColor: "#6D28D9",
  },
  radioInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#6D28D9",
  },
  radioLabelText: {
    fontSize: 14,
    color: "#1F1D2B",
    fontWeight: "500",
  },
  gridRow: {
    flexDirection: "row",
    gap: 12,
  },
  gridCol: {
    flex: 1,
  },
  textAreaContainer: {
    backgroundColor: "#FAFAFC",
    borderWidth: 1,
    borderColor: "#E9E3F4",
    borderRadius: 14,
    padding: 12,
    minHeight: 110,
    position: "relative",
    marginBottom: 16,
  },
  textAreaIconBox: {
    position: "absolute",
    top: 12,
    left: 12,
    zIndex: 1,
  },
  textAreaInput: {
    fontSize: 14,
    color: "#1F1D2B",
    paddingLeft: 30,
    paddingTop: 0,
    height: 70,
    textAlignVertical: "top",
  },
  charCountText: {
    fontSize: 11,
    color: "#8E8EA9",
    textAlign: "right",
    marginTop: 4,
  },
  addSocialButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 2,
  },
  addSocialText: {
    fontSize: 13,
    color: "#6D28D9",
    fontWeight: "600",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
    marginTop: 4,
  },
  checkbox: {
    borderRadius: 4,
    marginTop: 2,
    marginRight: 10,
    width: 18,
    height: 18,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 12,
    color: "#6E6B7B",
    lineHeight: 18,
  },
  linkText: {
    color: "#6D28D9",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 8,
  },
  outlinedButton: {
    flex: 1,
    height: 52,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#6D28D9",
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  outlinedButtonText: {
    color: "#6D28D9",
    fontSize: 15,
    fontWeight: "600",
  },
  primaryHalfButton: {
    flex: 1,
    height: 52,
    backgroundColor: "#6D28D9",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6D28D9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  securityBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    marginBottom: 10,
  },
  securityText: {
    fontSize: 12,
    color: "#D4C5ED",
    fontWeight: "500",
  },
});

export default ClientSignup;

