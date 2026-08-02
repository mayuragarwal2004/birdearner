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
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import Checkbox from "expo-checkbox";
import DateTimePicker from "@react-native-community/datetimepicker";
import Toast from "react-native-toast-message";
import * as ImagePicker from "expo-image-picker";
import { z } from "zod";
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
    // Make optional fields truly optional
    designation: z.string().optional(),
    heading: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
    bio: z.string().optional(),
    gender: z.string().optional(),
    dob: z.date().optional(),
    socialLinks: z.array(z.string()).optional(),
    profileImage: z.any().optional(),
    coverImage: z.any().optional(),
  };

  if (mode === "signup") {
    return z
      .object({
        full_name: z.string().min(1, "Full name is required"),
        email: z.string().email("Valid email is required"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        confirmPassword: z.string().min(8, "Confirm password is required"),
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
    // For profile creation and update modes, we don't need password/email/terms
    return z.object(baseSchema);
  }
};

const ClientSignup = ({ navigation, route }) => {
  const { register, user, userProfile, refreshUserData } = useAuth(); // Get auth functions from AuthContext
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);

  // Function to validate Indian pincode
  const isValidIndianPincode = (pincode) => {
    // Indian pincodes are 6 digits and start with numbers 1-9
    const indianPincodeRegex = /^[1-9][0-9]{5}$/;
    return indianPincodeRegex.test(pincode);
  };

  // Function to fetch location details from pincode
  const fetchLocationFromPincode = async (pincode) => {
    if (!pincode || pincode.length !== 6) return;

    if (!isValidIndianPincode(pincode)) {
      showToast("error", "Invalid Pincode", "Please enter a valid Indian pincode");
      setForm(prev => ({
        ...prev,
        zipCode: "",
        city: "",
        state: "",
        autoFilledLocation: false
      }));
      return;
    }

    try {
      setFetchingLocation(true);
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await response.json();

      if (data[0].Status === "Success" && data[0].PostOffice && data[0].PostOffice.length > 0) {
        const location = data[0].PostOffice[0];
        setForm(prev => ({
          ...prev,
          city: location.District,
          state: location.State,
          autoFilledLocation: true
        }));
      } else {
        showToast("error", "Invalid Pincode", "This pincode is not valid for India");
        setForm(prev => ({
          ...prev,
          zipCode: "",
          city: "",
          state: "",
          autoFilledLocation: false
        }));
      }
    } catch (error) {
      console.error('Error fetching location:', error);
      showToast("error", "Error", "Could not fetch location details");
    } finally {
      setFetchingLocation(false);
    }
  };

  // Extract route params to determine mode and data
  const {
    email: initialEmail,
    mode = "signup", // 'signup', 'create', 'update'
    profileData,
    title,
  } = route.params || {};

  // Determine the schema and initial step based on mode
  const schema = createSchema(mode);

  useEffect(() => {
    const initialStep = mode === "signup" ? 1 : 2; // Skip login step for profile creation/update
    setStep(initialStep);
  }, [mode]); // Use mode as dependency instead of initialStep

  const [form, setForm] = useState({
    full_name: user?.fullName || "",
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
    gender: "", // Not available in client object
    dob: new Date(), // Not available in client object
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

  // Track deleted images for update mode
  const [deletedImages, setDeletedImages] = useState([]);

  // Only update form data when user data actually changes and we're in update mode
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
  }, [mode, user?.id, profileData]); // Trigger when mode, profileData or user ID changes

  console.log({ form, mode, user });

  // Toast helper
  const showToast = (type, text1, text2) => {
    Toast.show({ type, text1, text2, position: "top" });
  };

  // Image upload
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

        // If replacing an existing image in update mode, track it for deletion
        if (existingImage && existingImage.isExisting && mode === "update") {
          setDeletedImages([...deletedImages, existingImage.uri]);
        }

        setForm({
          ...form,
          [fieldName]: {
            ...pickerResult.assets[0],
            isExisting: false, // Mark new image as not existing
          },
        });
      }
    } catch (error) {
      showToast("error", "Error", "Image Picker encountered an issue.");
    }
  };

  // Social links
  const addSocialLink = () =>
    setForm({ ...form, socialLinks: [...form.socialLinks, ""] });

  // Step navigation with email check (only for signup mode)
  const nextStep = async () => {
    if (step === 1 && mode === "signup") {
      // Check email before proceeding
      if (!form.email) {
        showToast("error", "Email Required", "Please enter your email");
        return;
      }

      if (!form.password) {
        showToast("error", "Password Required", "Please enter your password");
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

      if (!form.termsAccepted) {
        showToast(
          "error",
          "Terms Required",
          "You must accept the Terms and Conditions."
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
        showToast("success", "Email Available", "You can proceed with signup");
        setIsLoading(false);
        setStep(step + 1);
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
    // If we're on step 2 and in create/update mode, go back to previous screen
    // since step 1 (login) is skipped for these modes
    if (step === 2 && (mode === "create" || mode === "update")) {
      navigation.goBack();
    } else {
      setStep(step - 1);
    }
  };

  // Final API call - handles signup, profile creation, and profile update
  const handleSubmit = async () => {
    console.log("Triggered handleSubmit with mode:", mode);

    setIsLoading(true);
    console.log("Submitting form:", form);

    try {
      // Validate with Zod
      const result = schema.safeParse(form);
      if (!result.success) {
        console.log("Validation failed:", result?.error?.errors);
        showToast(
          "error",
          "Validation Error",
          result?.error?.errors[0]?.message
        );
        setIsLoading(false);
        return;
      }
    } catch (error) {
      console.log("Validation failed:", error);
      showToast("error", "Validation Error");
      setIsLoading(false);
    }

    console.log("Form data is valid:", form);

    // Clean up the form data - remove empty strings and arrays
    const cleanedForm = {
      ...form,
      socialLinks: form.socialLinks.filter((link) => link.trim() !== ""),
    };

    console.log("Cleaned form data:", cleanedForm);

    // upload profile photo (only if it's a new image, not an existing URL)
    if (cleanedForm?.profileImage && cleanedForm?.profileImage?.uri) {
      if (cleanedForm.profileImage.isExisting) {
        // Keep existing image URL as is
        cleanedForm.profileImage = cleanedForm.profileImage.uri;
      } else if (!cleanedForm.profileImage.uri.startsWith("http")) {
        // Upload new image
        const result = await apiService.uploadImage(
          cleanedForm.profileImage,
          "client_profile_photos"
        );
        console.log("Profile photo uploaded:", result);
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

    // upload cover photo (only if it's a new image, not an existing URL)
    if (cleanedForm?.coverImage && cleanedForm?.coverImage?.uri) {
      if (cleanedForm.coverImage.isExisting) {
        // Keep existing image URL as is
        cleanedForm.coverImage = cleanedForm.coverImage.uri;
      } else if (!cleanedForm.coverImage.uri.startsWith("http")) {
        // Upload new image
        const result = await apiService.uploadImage(
          cleanedForm.coverImage,
          "client_cover_photos"
        );
        console.log("Cover photo uploaded:", result);
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
        console.log("About to call register function from AuthContext");
        // Use the register function from AuthContext which handles both signup and login
        result = await register({
          ...cleanedForm,
          role: "CLIENT",
        });

        console.log("Registration successful:", result);

        if (result) {
          showToast("success", "Signup Complete", "Welcome to BirdEarner!");
          // The AuthContext will automatically handle navigation by setting user state
          navigation.replace("MainTabs");
        } else {
          showToast(
            "error",
            "Signup Failed",
            "Registration failed. Please try again."
          );
        }
      } else if (mode === "create") {
        // Create additional client profile for existing user
        console.log("Creating client profile for existing user");

        // Filter and map form data to client model fields only
        const clientCreateData = {
          userId: user?.id,
          // Map form fields to client model fields
          organizationType: cleanedForm.designation,
          companyName: cleanedForm.heading,
          city: cleanedForm.city,
          state: cleanedForm.state,
          zipcode: cleanedForm.zipCode ? parseInt(cleanedForm.zipCode) : null,
          country: cleanedForm.country,
          profileDescription: cleanedForm.bio,
          profilePhoto: cleanedForm.profileImage,
          coverPhoto: cleanedForm.coverImage,
          // Handle fullName separately for user table update
          fullName: cleanedForm.full_name,
        };

        // Remove null/undefined/empty values
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

        console.log("Client profile created:", result);

        // Refresh user profile data
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
        // Update existing client profile
        console.log("Updating client profile:", user?.client?.id);

        // Filter and map form data to client model fields only
        const clientUpdateData = {
          // Map form fields to client model fields
          organizationType: cleanedForm.designation,
          companyName: cleanedForm.heading,
          city: cleanedForm.city,
          state: cleanedForm.state,
          zipcode: cleanedForm.zipCode ? parseInt(cleanedForm.zipCode) : null,
          country: cleanedForm.country,
          profileDescription: cleanedForm.bio,
          profilePhoto: cleanedForm.profileImage,
          coverPhoto: cleanedForm.coverImage,
          // Handle fullName separately for user table update
          fullName: cleanedForm.full_name,
          // Include deleted images information for backend processing
          deletedImages: deletedImages, // Send list of deleted image URLs
        };

        // Remove null/undefined/empty values
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

        console.log("Client profile updated:", result);

        // Refresh user profile data
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
      console.log("Operation error caught:", error);
      console.log("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });

      const errorMessages = {
        signup: "Registration failed",
        create: "Profile creation failed",
        update: "Profile update failed",
      };

      showToast(
        "error",
        `${mode.charAt(0).toUpperCase() + mode.slice(1)} Failed`,
        error.message || errorMessages[mode]
      );
    } finally {
      console.log("Setting loading to false");
      setIsLoading(false);
    }
  };

  // Determine heading based on mode
  const getHeading = () => {
    switch (mode) {
      case "signup":
        return "Client Signup";
      case "create":
        return title || "Create Client Profile";
      case "update":
        return title || "Update Client Profile";
      default:
        return "Client Profile";
    }
  };

  // UI for each step
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#4B0082" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.heading}>{getHeading()}</Text>
          {/* Step 1: Basic Signup Info with Email Check (only for signup mode) */}
          {step === 1 && mode === "signup" && (
            <View style={styles.card}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholderTextColor="#c4c4c4"
                placeholder="Enter your full name"
                value={form.full_name}
                onChangeText={(v) => setForm({ ...form, full_name: v })}
                autoCapitalize="words"
              />
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholderTextColor="#c4c4c4"
                placeholder="Enter your email"
                value={form.email}
                onChangeText={(v) => setForm({ ...form, email: v })}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!initialEmail}
              />
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholderTextColor="#c4c4c4"
                placeholder="Enter your password"
                value={form.password}
                onChangeText={(v) => setForm({ ...form, password: v })}
                secureTextEntry
              />
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                placeholderTextColor="#c4c4c4"
                placeholder="Confirm your password"
                value={form.confirmPassword}
                onChangeText={(v) => setForm({ ...form, confirmPassword: v })}
                secureTextEntry
              />
              <View style={styles.checkboxContainer}>
                <Checkbox
                  value={form.termsAccepted}
                  onValueChange={(v) => setForm({ ...form, termsAccepted: v })}
                  color={form.termsAccepted ? "#6A0DAD" : undefined}
                />
                <Text style={styles.checkboxLabel}>
                  I agree to the{" "}
                  <Text style={styles.link}>Terms and Conditions</Text> and{" "}
                  <Text style={styles.link}>Privacy Policy</Text>
                </Text>
              </View>
              <TouchableOpacity
                style={styles.nextButton}
                onPress={nextStep}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.nextButtonText}>Continue</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
          {/* Step 2: Client Details */}
          {step === 2 && (
            <View style={styles.card}>
              <Text style={styles.label}>Type of your organisation</Text>
              <PickerModal
                items={DESIGNATION_OPTIONS}
                value={form.designation}
                onValueChange={(v) => setForm({ ...form, designation: v })}
                placeholder="Select Organization Type"
                innerStyle={{ backgroundColor: "#f5f5f5" }}
              />
              <Text style={styles.label}>Company Name (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholderTextColor="#c4c4c4"
                placeholder="Company name"
                value={form.heading}
                onChangeText={(v) => setForm({ ...form, heading: v })}
              />
              <View style={styles.row}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Zip Code</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    maxLength={6}
                    value={form.zipCode}
                    onChangeText={(text) => {
                      setForm({ ...form, zipCode: text });
                      if (text.length === 6) {
                        fetchLocationFromPincode(text);
                      }
                    }}
                    placeholder="Enter 6-digit Indian pincode"
                    placeholderTextColor="#c4c4c4"
                  />
                </View>
                <View style={styles.dropdownContainer}>
                  <Text style={styles.label}>Country</Text>
                  <PickerModal
                    items={COUNTRY_OPTIONS}
                    value={form.country}
                    onValueChange={(v) => setForm({ ...form, country: v })}
                    placeholder="Select Country"
                    innerStyle={{ backgroundColor: "#f5f5f5" }}
                    style={{ marginVertical: 0 }}
                    disabled={true}
                  />
                </View>
              </View>
              <View style={styles.row}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>City</Text>
                  <TextInput
                    style={[styles.input, fetchingLocation && { backgroundColor: '#f0f0f0' }]}
                    value={form.city}
                    onChangeText={(text) => setForm({ ...form, city: text, autoFilledLocation: false })}
                    placeholder={fetchingLocation ? "Fetching city..." : "Enter city"}
                    placeholderTextColor="#c4c4c4"
                    editable={!fetchingLocation}
                  />
                </View>
                <View style={styles.dropdownContainer}>
                  <Text style={styles.label}>State</Text>
                  <PickerModal
                    items={indianStates}
                    value={form.state}
                    onValueChange={(value) => setForm({ ...form, state: value, autoFilledLocation: false })}
                    placeholder={fetchingLocation ? "Fetching state..." : "Select State"}
                    innerStyle={{ backgroundColor: "#f5f5f5" }}
                    style={{ marginVertical: 0 }}
                    disabled={fetchingLocation}
                  />
                </View>
              </View>
              <Text style={styles.label}>Describe yourself</Text>
              <TextInput
                style={styles.textArea}
                placeholderTextColor="#c4c4c4"
                placeholder="Describe yourself"
                value={form.bio}
                multiline
                onChangeText={(v) =>
                  v.length <= 255 && setForm({ ...form, bio: v })
                }
              />
              <Text style={styles.charCount}>{form.bio.length}/255</Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={prevStep}
                  disabled={mode === "signup"}
                >
                  <Text
                    style={[
                      styles.backButtonText,
                      mode === "signup" && styles.disabledText,
                    ]}
                  >
                    Back
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.nextButton} onPress={nextStep}>
                  <Text style={styles.nextButtonText}>Next</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          {/* Step 3: Personal Details */}
          {step === 3 && (
            <View style={styles.card}>
              <Text style={styles.label}>Gender</Text>
              <PickerModal
                items={GENDER_OPTIONS}
                value={form.gender}
                onValueChange={(v) => setForm({ ...form, gender: v })}
                placeholder="Select Gender"
                innerStyle={{ backgroundColor: "#f5f5f5" }}
                style={{ marginVertical: 0, marginBottom: 20 }}
              />
              <Text style={styles.label}>Date of Birth</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowDatePicker(true)}
              >
                <Text
                  style={{ color: form.dob ? "#000" : "#999", paddingTop: 12 }}
                >
                  {form.dob ? form.dob.toDateString() : "Select Date of Birth"}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={form.dob || new Date()}
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
              <Text style={styles.label}>Your Social Media Links</Text>
              {form.socialLinks.map((link, i) => (
                <View key={i} style={styles.socialRow}>
                  <TextInput
                    style={[styles.input, styles.socialInput]}
                    placeholderTextColor="#c4c4c4"
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
              <TouchableOpacity onPress={addSocialLink}>
                <Text style={styles.addMore}>
                  + Add more social media links
                </Text>
              </TouchableOpacity>
              <Text style={styles.label}>Add your profile picture</Text>
              <View style={styles.profileUploadContainer}>
                <TouchableOpacity
                  onPress={() => handleImageUpload("profile")}
                  style={styles.uploadButton}
                >
                  <Text style={{ color: "#fff" }}>Click here to upload</Text>
                </TouchableOpacity>
                {form.profileImage && (
                  <View style={styles.imagePreviewContainer}>
                    <Image
                      source={{ uri: form.profileImage.uri }}
                      style={styles.profileImage}
                    />
                    {form.profileImage.isExisting && mode === "update" && (
                      <View
                        style={[styles.existingImageBadge, { top: 2, left: 2 }]}
                      >
                        <Text style={styles.existingImageText}>Existing</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={[styles.removeButton, { top: 2, right: 2 }]}
                      onPress={() => {
                        if (form.profileImage.isExisting && mode === "update") {
                          setDeletedImages([
                            ...deletedImages,
                            form.profileImage.uri,
                          ]);
                        }
                        setForm({ ...form, profileImage: null });
                      }}
                    >
                      <Text style={styles.removeButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              <Text style={styles.label}>Add your cover picture</Text>
              <View style={styles.profileUploadContainer}>
                <TouchableOpacity
                  onPress={() => handleImageUpload("cover")}
                  style={styles.uploadButton}
                >
                  <Text style={{ color: "#fff" }}>Click here to upload</Text>
                </TouchableOpacity>
                {form.coverImage && (
                  <View style={styles.imagePreviewContainer}>
                    <Image
                      source={{ uri: form.coverImage.uri }}
                      style={styles.coverImage}
                    />
                    {form.coverImage.isExisting && mode === "update" && (
                      <View
                        style={[styles.existingImageBadge, { top: 2, left: 2 }]}
                      >
                        <Text style={styles.existingImageText}>Existing</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={[styles.removeButton, { top: 2, right: 2 }]}
                      onPress={() => {
                        if (form.coverImage.isExisting && mode === "update") {
                          setDeletedImages([
                            ...deletedImages,
                            form.coverImage.uri,
                          ]);
                        }
                        setForm({ ...form, coverImage: null });
                      }}
                    >
                      <Text style={styles.removeButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.backButton} onPress={prevStep}>
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.nextButton} onPress={nextStep}>
                  <Text style={styles.nextButtonText}>Next</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          {/* Step 4: Review & Submit */}
          {step === 4 && (
            <View style={styles.card}>
              <Text style={styles.cardHeading}>Review & Submit</Text>
              <Text style={styles.label}>
                Please review your details before submitting.
              </Text>
              {/* Show summary here if desired */}
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={prevStep}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={styles.backButtonText}>Back</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.nextButton}
                  onPress={handleSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={styles.nextButtonText}>Submit</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
          <Toast />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#4B0082",
    justifyContent: "center",
  },
  heading: {
    fontSize: 28,
    color: "white",
    marginBottom: 32,
    textAlign: "center",
    fontWeight: "bold",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeading: {
    fontSize: 24,
    color: "#4B0082",
    marginBottom: 16,
    fontWeight: "bold",
  },
  label: {
    fontSize: 18,
    color: "#4B0082",
    marginBottom: 8,
    fontWeight: "bold",
  },
  input: {
    width: "100%",
    height: 44,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    paddingHorizontal: 20,
    marginBottom: 20,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    color: "black",
  },
  socialInput: {
    marginTop: 1,
    marginBottom: 1,
  },
  textArea: {
    height: 100,
    borderColor: "#e0e0e0",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 20,
    backgroundColor: "#f5f5f5",
    color: "#000",
    textAlignVertical: "top",
    marginBottom: 10,
  },
  charCount: {
    color: "#4B0082",
    marginBottom: 10,
    textAlign: "right",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  checkboxLabel: {
    color: "#4B0082",
    marginLeft: 10,
    fontSize: 16,
  },
  link: {
    color: "#aa42f5",
    textDecorationLine: "underline",
  },
  dropdown: {
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    marginBottom: 20,
    height: 44,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    justifyContent: "center",
    color: "black",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  inputContainer: {
    flex: 1,
    marginRight: 10,
  },
  dropdownContainer: {
    flex: 1,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  nextButton: {
    width: "48%",
    height: 50,
    backgroundColor: "#6A0DAD",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  nextButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  backButton: {
    width: "48%",
    height: 50,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  backButtonText: {
    color: "#333",
    fontSize: 18,
    fontWeight: "bold",
  },
  addMore: {
    color: "#6A0DAD",
    marginBottom: 20,
    fontWeight: "bold",
  },
  socialRow: {
    marginBottom: 10,
  },
  profileUploadContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginBottom: 10,
  },
  uploadButton: {
    padding: 15,
    backgroundColor: "#6A0DAD",
    borderRadius: 10,
    color: "#fff",
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginLeft: 20,
  },
  coverImage: {
    width: 100,
    height: 67,
  },
  imagePreviewContainer: {
    position: "relative",
    marginLeft: 20,
  },
  existingImageBadge: {
    position: "absolute",
    top: 2,
    left: 2,
    backgroundColor: "#28a745",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 1,
  },
  existingImageText: {
    color: "#ffffff",
    fontSize: 8,
    fontWeight: "600",
  },
  removeButton: {
    position: "absolute",
    backgroundColor: "#3b006b",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  removeButtonText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "600",
  },
  disabledText: {
    color: "#888",
  },
});

export default ClientSignup;
