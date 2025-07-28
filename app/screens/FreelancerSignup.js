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
} from "react-native";
import Checkbox from "expo-checkbox";
import Toast from "react-native-toast-message";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { z } from "zod";
import apiService from "../lib/apiService";
import { useAuth } from "../context/NewAuthContext";
import PickerModal from "../components/CustomPicker";

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
  { label: "Andhra Pradesh", value: "Andhra Pradesh" },
  { label: "Arunachal Pradesh", value: "Arunachal Pradesh" },
  { label: "Assam", value: "Assam" },
  { label: "Bihar", value: "Bihar" },
  { label: "Chhattisgarh", value: "Chhattisgarh" },
  { label: "Goa", value: "Goa" },
  { label: "Gujarat", value: "Gujarat" },
  { label: "Haryana", value: "Haryana" },
  { label: "Himachal Pradesh", value: "Himachal Pradesh" },
  { label: "Jharkhand", value: "Jharkhand" },
  { label: "Karnataka", value: "Karnataka" },
  { label: "Kerala", value: "Kerala" },
  { label: "Madhya Pradesh", value: "Madhya Pradesh" },
  { label: "Maharashtra", value: "Maharashtra" },
  { label: "Manipur", value: "Manipur" },
  { label: "Meghalaya", value: "Meghalaya" },
  { label: "Mizoram", value: "Mizoram" },
  { label: "Nagaland", value: "Nagaland" },
  { label: "Odisha", value: "Odisha" },
  { label: "Punjab", value: "Punjab" },
  { label: "Rajasthan", value: "Rajasthan" },
  { label: "Sikkim", value: "Sikkim" },
  { label: "Tamil Nadu", value: "Tamil Nadu" },
  { label: "Telangana", value: "Telangana" },
  { label: "Tripura", value: "Tripura" },
  { label: "Uttar Pradesh", value: "Uttar Pradesh" },
  { label: "Uttarakhand", value: "Uttarakhand" },
  { label: "West Bengal", value: "West Bengal" },
  {
    label: "Andaman and Nicobar Islands",
    value: "Andaman and Nicobar Islands",
  },
  { label: "Chandigarh", value: "Chandigarh" },
  {
    label: "Dadra and Nagar Haveli and Daman and Diu",
    value: "Dadra and Nagar Haveli and Daman and Diu",
  },
  { label: "Delhi", value: "Delhi" },
  { label: "Lakshadweep", value: "Lakshadweep" },
  { label: "Puducherry", value: "Puducherry" },
];

const assetSchema = z.any();

const schema = z
  .object({
    full_name: z.string().min(1, "Full name is required"),
    email: z.string().email("Valid email is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm password is required"),
    termsAccepted: z.boolean().refine((val) => val === true, {
      message: "You must accept the Terms and Conditions.",
    }),
    selectedServices: z
      .array(z.string())
      .min(1, "You must select at least one service"),
    // Make optional fields truly optional
    qualification: z.string().optional(),
    experience: z.string().optional(),
    heading: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
    bio: z.string().optional(),
    gender: z.string().optional(),
    dob: z.date().optional(),
    certifications: z.array(z.string()).optional(),
    socialLinks: z.array(z.string()).optional(),
    profileImage: z.any().optional(),
    coverImage: z.any().optional(),
    portfolioImages: z.array(assetSchema).optional(),
    agreePortfolioTerms: z.boolean().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const FreelancerSignup = ({ navigation, route }) => {
  const { register } = useAuth(); // Get register function from AuthContext
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [emailChecked, setEmailChecked] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const { email: initialEmail } = route.params || {};

  const [uploadingPortfolioImages, setUploadingPortfolioImages] =
    useState(false);

  // Services state
  const [availableServices, setAvailableServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredServices, setFilteredServices] = useState([]);

  const [form, setForm] = useState({
    full_name: "",
    email: initialEmail || "",
    password: "",
    confirmPassword: "",
    termsAccepted: false,
    qualification: "",
    experience: "",
    heading: "",
    city: "",
    state: "",
    zipCode: "",
    country: "India",
    bio: "",
    gender: "",
    dob: new Date(),
    certifications: [""],
    socialLinks: [""],
    profileImage: null,
    coverImage: null,
    portfolioImages: [],
    agreePortfolioTerms: false,
    selectedServices: [], // Add selectedServices to form state
  });

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
        setForm({
          ...form,
          [type === "profile" ? "profileImage" : "coverImage"]:
            pickerResult.assets[0],
        });
      }
    } catch (error) {
      showToast("error", "Error", "Image Picker encountered an issue.");
    }
  };

  // Portfolio image upload
  const uploadPortfolioImages = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        showToast("error", "Permission Denied", "Grant access to photos.");
        return;
      }
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        allowsMultipleSelection: true,
      });
      if (!pickerResult.canceled) {
        const newImages = pickerResult.assets;
        setForm({
          ...form,
          portfolioImages: [...form.portfolioImages, ...newImages],
        });
      }
    } catch (error) {
      showToast("error", "Error", `Failed to pick images: ${error.message}`);
    }
  };

  const removePortfolioImage = (index) => {
    setForm({
      ...form,
      portfolioImages: form.portfolioImages.filter((_, i) => i !== index),
    });
  };

  // Social/certification links
  const addSocialLink = () =>
    setForm({ ...form, socialLinks: [...form.socialLinks, ""] });
  const addCertification = () =>
    setForm({ ...form, certifications: [...form.certifications, ""] });

  // Load available services on component mount
  useEffect(() => {
    const loadServices = async () => {
      try {
        setServicesLoading(true);
        await apiService.init();
        const services = await apiService.getServicesByCategory("freelance");
        setAvailableServices(services);
        setFilteredServices([]); // Start with empty filtered services
      } catch (error) {
        console.error("Error loading services:", error);
        showToast("error", "Error", "Failed to load services");
      } finally {
        setServicesLoading(false);
      }
    };

    loadServices();
  }, []);

  // Filter services based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredServices([]);
    } else {
      const filtered = availableServices.filter(
        (service) =>
          service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (service.description &&
            service.description
              .toLowerCase()
              .includes(searchQuery.toLowerCase()))
      );
      setFilteredServices(filtered);
    }
  }, [searchQuery, availableServices]);

  // Service selection handlers
  const toggleServiceSelection = (service) => {
    const serviceId = service.id;
    const currentlySelected = selectedServices.includes(serviceId);

    if (currentlySelected) {
      // Remove service
      const newSelected = selectedServices.filter((id) => id !== serviceId);
      setSelectedServices(newSelected);
      setForm({ ...form, selectedServices: newSelected });
    } else {
      // Add service (max 5)
      if (selectedServices.length < 5) {
        const newSelected = [...selectedServices, serviceId];
        setSelectedServices(newSelected);
        setForm({ ...form, selectedServices: newSelected });
      } else {
        showToast("info", "Limit Reached", "You can select maximum 5 services");
      }
    }
  };

  // Get service name by ID for display
  const getServiceNameById = (serviceId) => {
    const service = availableServices.find((s) => s.id === serviceId);
    return service ? service.name : "Unknown Service";
  };

  // Step navigation
  const nextStep = async () => {
    if (step === 1) {
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
    } else if (step === 2) {
      // Validate service selection
      if (selectedServices.length === 0) {
        showToast(
          "error",
          "Services Required",
          "Please select at least one service you want to offer"
        );
        return;
      }
      setStep(step + 1);
    } else {
      setStep(step + 1);
    }
  };
  const prevStep = () => setStep(step - 1);

  // Final API call
  const handleSubmit = async () => {
    console.log("Triggered handleSubmit");

    setIsLoading(true);
    console.log("Submitting form:", form);

    // Validate with Zod
    const result = schema.safeParse(form);
    console.log({ result });
    if (!result.success) {
      setIsLoading(false);
      console.log("Validation failed:", result.error.errors);
      showToast("error", "Validation Error", result.error.errors[0].message);
      return;
    }

    console.log("Form data is valid:", form);

    // Clean up the form data - remove empty strings and arrays
    const cleanedForm = {
      ...form,
      certifications: form.certifications.filter((cert) => cert.trim() !== ""),
      socialLinks: form.socialLinks.filter((link) => link.trim() !== ""),
    };

    console.log("Cleaned form data:", cleanedForm);

    // upload profile photo
    if (cleanedForm.profileImage && cleanedForm.profileImage.uri) {
      const result = await apiService.uploadImage(
        cleanedForm.profileImage,
        "freelancer_profile_photos"
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

    // upload cover photo
    if (cleanedForm.coverImage && cleanedForm.coverImage.uri) {
      const result = await apiService.uploadImage(
        cleanedForm.coverImage,
        "freelancer_cover_photos"
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

    // upload portfolio images
    if (cleanedForm.portfolioImages && cleanedForm.portfolioImages.length > 0) {
      let uploadedImages = [];
      for (let i = 0; i < cleanedForm.portfolioImages.length; i++) {
        const result = await apiService.uploadImage(
          cleanedForm.portfolioImages[i],
          "freelancer_portfolios"
        );
        console.log("Portfolio image uploaded:", result);
        if (result.success) {
          uploadedImages.push(result.url);
        } else {
          showToast("error", "Error Uploading Portfolio Image", result.message);
          setIsLoading(false);
          return;
        }
      }
      cleanedForm.portfolioImages = uploadedImages;
    }

    try {
      console.log("About to call register function from AuthContext");

      // Use the register function from AuthContext which handles both signup and login
      const userData = await register({
        ...cleanedForm,
        role: "FREELANCER",
      });

      console.log("Registration successful:", userData);

      if (userData) {
        showToast("success", "Signup Complete", "Welcome to BirdEarner!");
        // The AuthContext will automatically handle navigation by setting user state
        // This will cause the app to re-render with the authenticated stack
        navigation.replace("MainTabs");
      } else {
        showToast(
          "error",
          "Signup Failed",
          "Registration failed. Please try again."
        );
      }
    } catch (error) {
      console.log("Registration error caught:", error);
      console.log("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      showToast(
        "error",
        "Signup Failed",
        error.message || "Registration failed"
      );
    } finally {
      console.log("Setting loading to false");
      setIsLoading(false);
    }
  };

  // UI for each step
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#4B0082" }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>Freelancer Signup</Text>
        {/* Step 1: Basic Signup Info */}
        {step === 1 && (
          <View style={styles.card}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              placeholderTextColor="#c4c4c4"
              style={styles.input}
              placeholder="Enter your full name"
              value={form.full_name}
              onChangeText={(v) => setForm({ ...form, full_name: v })}
              autoCapitalize="words"
            />
            <Text style={styles.label}>Email</Text>
            <TextInput
              placeholderTextColor="#c4c4c4"
              style={styles.input}
              placeholder="Enter your email"
              value={form.email}
              onChangeText={(v) => setForm({ ...form, email: v })}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!initialEmail}
            />
            <Text style={styles.label}>Password</Text>
            <TextInput
              placeholderTextColor="#c4c4c4"
              style={styles.input}
              placeholder="Enter your password"
              value={form.password}
              onChangeText={(v) => setForm({ ...form, password: v })}
              secureTextEntry
            />
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              placeholderTextColor="#c4c4c4"
              style={styles.input}
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
        {/* Step 2: Service Selection */}
        {step === 2 && (
          <View style={styles.card}>
            <Text style={styles.cardHeading}>Select Your Services</Text>
            <Text style={styles.label}>
              Choose up to 5 services you want to offer (minimum 1 required):
            </Text>

            {/* Search Input */}
            <View style={styles.searchContainer}>
              <TextInput
                placeholderTextColor="#c4c4c4"
                style={styles.searchInput}
                placeholder="Search for services (e.g., graphic design, web developer)..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Show selected services summary */}
            {selectedServices.length > 0 && (
              <View style={styles.selectedServicesInfo}>
                <Text style={styles.selectedCount}>
                  Selected: {selectedServices.length}/5
                </Text>
                <View style={styles.selectedServicesList}>
                  {selectedServices.map((serviceId) => (
                    <View key={serviceId} style={styles.selectedServiceTag}>
                      <Text style={styles.selectedServiceText}>
                        {getServiceNameById(serviceId)}
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          const service = availableServices.find(
                            (s) => s.id === serviceId
                          );
                          if (service) toggleServiceSelection(service);
                        }}
                        style={styles.removeServiceButton}
                      >
                        <Text style={styles.removeServiceText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {servicesLoading ? (
              <ActivityIndicator
                size="large"
                color="#6A0DAD"
                style={{ marginVertical: 20 }}
              />
            ) : (
              <ScrollView
                style={styles.servicesContainer}
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
              >
                {searchQuery.trim() === "" ? (
                  <View style={styles.searchPrompt}>
                    <Text style={styles.searchPromptText}>
                      💡 Start typing to search for services you want to offer
                    </Text>
                    <Text style={styles.searchHintText}>
                      Try: "graphic", "web", "writer", "designer", "marketing"
                    </Text>
                  </View>
                ) : (
                  <>
                    {filteredServices.length === 0 ? (
                      <View style={styles.noResultsContainer}>
                        <Text style={styles.noResultsText}>
                          No services found for "{searchQuery}"
                        </Text>
                        <Text style={styles.noResultsHint}>
                          Try different keywords or check spelling
                        </Text>
                      </View>
                    ) : (
                      <>
                        <Text style={styles.searchResultsHeader}>
                          Found {filteredServices.length} service
                          {filteredServices.length !== 1 ? "s" : ""}:
                        </Text>
                        {filteredServices.map((service) => (
                          <TouchableOpacity
                            key={service.id}
                            style={[
                              styles.serviceItem,
                              selectedServices.includes(service.id) &&
                                styles.serviceItemSelected,
                            ]}
                            onPress={() => toggleServiceSelection(service)}
                            activeOpacity={0.7}
                          >
                            <View style={styles.serviceContent}>
                              <Text
                                style={[
                                  styles.serviceName,
                                  selectedServices.includes(service.id) &&
                                    styles.serviceNameSelected,
                                ]}
                              >
                                {service.name}
                              </Text>
                              {service.description && (
                                <Text
                                  style={[
                                    styles.serviceDescription,
                                    selectedServices.includes(service.id) &&
                                      styles.serviceDescriptionSelected,
                                  ]}
                                >
                                  {service.description}
                                </Text>
                              )}
                            </View>
                            <View
                              style={[
                                styles.serviceCheckbox,
                                selectedServices.includes(service.id) &&
                                  styles.serviceCheckboxSelected,
                              ]}
                            >
                              {selectedServices.includes(service.id) && (
                                <Text style={styles.checkmark}>✓</Text>
                              )}
                            </View>
                          </TouchableOpacity>
                        ))}
                      </>
                    )}
                  </>
                )}
              </ScrollView>
            )}

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.backButton} onPress={prevStep}>
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.nextButton,
                  selectedServices.length === 0 && styles.disabledButton,
                ]}
                onPress={nextStep}
                disabled={selectedServices.length === 0}
              >
                <Text style={styles.nextButtonText}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Step 3: Freelancer Details */}
        {step === 3 && (
          <View style={styles.card}>
            <Text style={styles.label}>Highest Qualification</Text>
            <TextInput
              placeholderTextColor="#c4c4c4"
              style={styles.input}
              placeholder="E.g. Bachelor's Degree"
              value={form.qualification}
              onChangeText={(v) => setForm({ ...form, qualification: v })}
            />
            <Text style={styles.label}>Experience (In months)</Text>
            <TextInput
              placeholderTextColor="#c4c4c4"
              style={styles.input}
              keyboardType="numeric"
              placeholder="E.g. 24"
              value={form.experience}
              onChangeText={(v) => setForm({ ...form, experience: v })}
            />
            <Text style={styles.label}>Heading on your profile</Text>
            <TextInput
              placeholderTextColor="#c4c4c4"
              style={styles.input}
              placeholder="E.g. I am a designer"
              value={form.heading}
              onChangeText={(v) => setForm({ ...form, heading: v })}
            />
            <View style={styles.row}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>City</Text>
                <TextInput
                  placeholderTextColor="#c4c4c4"
                  placeholder="Pune"
                  style={styles.input}
                  value={form.city}
                  onChangeText={(v) => setForm({ ...form, city: v })}
                />
              </View>
              <View style={styles.dropdownContainer}>
                <Text style={styles.label}>State</Text>
                <PickerModal
                  items={indianStates}
                  value={form.state}
                  onValueChange={(v) => setForm({ ...form, state: v })}
                  placeholder="Select State"
                  innerStyle={{ backgroundColor: "#f5f5f5" }}
                  style={{ marginVertical: 0 }}
                />
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Zip Code</Text>
                <TextInput
                  placeholderTextColor="#c4c4c4"
                  placeholder="123456"
                  style={styles.input}
                  keyboardType="numeric"
                  maxLength={6}
                  value={form.zipCode}
                  onChangeText={(v) => setForm({ ...form, zipCode: v })}
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
                />
              </View>
            </View>
            <Text style={styles.label}>Describe yourself</Text>
            <TextInput
              placeholderTextColor="#c4c4c4"
              style={styles.textArea}
              placeholder="Describe yourself"
              value={form.bio}
              multiline
              onChangeText={(v) =>
                v.length <= 255 && setForm({ ...form, bio: v })
              }
            />
            <Text style={styles.charCount}>{form.bio.length}/255</Text>
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
        {/* Step 4: Personal Details */}
        {step === 4 && (
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
            <Text style={styles.label}>Certifications</Text>
            {form.certifications.map((cert, i) => (
              <View key={i} style={styles.socialRow}>
                <TextInput
                  placeholderTextColor="#c4c4c4"
                  style={styles.input}
                  placeholder="Certification"
                  value={cert}
                  onChangeText={(v) =>
                    setForm({
                      ...form,
                      certifications: form.certifications.map((c, idx) =>
                        idx === i ? v : c
                      ),
                    })
                  }
                />
              </View>
            ))}
            <TouchableOpacity onPress={addCertification}>
              <Text style={styles.addMore}>+ Add more certifications</Text>
            </TouchableOpacity>
            <Text style={styles.label}>Your Social Media Links</Text>
            {form.socialLinks.map((link, i) => (
              <View key={i} style={styles.socialRow}>
                <TextInput
                  placeholderTextColor="#c4c4c4"
                  style={styles.input}
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
              <Text style={styles.addMore}>+ Add more social media links</Text>
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
                <Image
                  source={{ uri: form.profileImage.uri }}
                  style={styles.profileImage}
                />
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
                <Image
                  source={{ uri: form.coverImage.uri }}
                  style={styles.coverImage}
                />
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
        {/* Step 5: Portfolio Upload */}
        {step === 5 && (
          <View style={styles.card}>
            <Text style={styles.cardHeading}>Portfolio</Text>
            <TouchableOpacity
              style={styles.imageUploadButton}
              onPress={uploadPortfolioImages}
            >
              <Text style={styles.imageUploadButtonText}>
                Upload Portfolio Images
              </Text>
            </TouchableOpacity>
            <View style={styles.uploadedImages}>
              {form.portfolioImages.map((image, i) => (
                <View key={i} style={styles.imagePreviewContainer}>
                  <Image
                    source={{ uri: apiService.loadImageURI(image.uri) }}
                    style={styles.uploadedImage}
                  />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removePortfolioImage(i)}
                  >
                    <Text style={styles.removeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            <View style={styles.checkboxContainer}>
              <Checkbox
                value={form.agreePortfolioTerms}
                onValueChange={(v) =>
                  setForm({ ...form, agreePortfolioTerms: v })
                }
                color={form.agreePortfolioTerms ? "#ff9800" : undefined}
              />
              <Text style={styles.checkboxLabel}>
                I accept that all the work uploaded on BirdEARNER by me is
                authentic and belongs to me.
              </Text>
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[
                  styles.backButton,
                  form.portfolioImages.length > 0 && !form.agreePortfolioTerms
                    ? styles.disabledButton
                    : styles.enabledButton,
                ]}
                onPress={prevStep}
                disabled={
                  form.portfolioImages.length > 0 && !form.agreePortfolioTerms
                }
              >
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.nextButton,
                  form.portfolioImages.length > 0 && !form.agreePortfolioTerms
                    ? styles.disabledButton
                    : styles.enabledButton,
                ]}
                onPress={nextStep}
                disabled={
                  form.portfolioImages.length > 0 && !form.agreePortfolioTerms
                }
              >
                <Text style={styles.nextButtonText}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        {/* Step 6: Review & Submit */}
        {step === 6 && (
          <View style={styles.card}>
            <Text style={styles.cardHeading}>Review & Submit</Text>
            <Text style={styles.label}>
              Please review your details before submitting.
            </Text>
            {/* Show summary here if desired */}
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.backButton} onPress={prevStep}>
                <Text style={styles.backButtonText}>Back</Text>
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
      </ScrollView>
      <Toast />
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
    color: "#000",
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
    marginBottom: 10,
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
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginLeft: 20,
  },
  coverImage: {
    width: 150,
    height: 90,
    borderRadius: 0,
    marginLeft: 20,
  },
  imageUploadButton: {
    backgroundColor: "#ff9800",
    paddingHorizontal: 10,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 25,
  },
  imageUploadButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 18,
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
    borderRadius: 8,
  },
  removeButtonText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "600",
  },
  // Service selection styles
  searchContainer: {
    marginVertical: 15,
  },
  searchInput: {
    width: "100%",
    height: 50,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    paddingHorizontal: 20,
    fontSize: 16,
    borderWidth: 2,
    borderColor: "#e9ecef",
  },
  searchPrompt: {
    padding: 20,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 10,
  },
  searchPromptText: {
    fontSize: 16,
    color: "#6A0DAD",
    textAlign: "center",
    marginBottom: 8,
    fontWeight: "500",
  },
  searchHintText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  searchResultsHeader: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4B0082",
    marginBottom: 15,
  },
  noResultsContainer: {
    padding: 20,
    alignItems: "center",
  },
  noResultsText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
    textAlign: "center",
  },
  noResultsHint: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  servicesContainer: {
    marginVertical: 10,
    maxHeight: 400, // Limit height for scrolling
  },
  serviceItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "#e0e0e0",
  },
  serviceItemSelected: {
    backgroundColor: "#e8d5ff",
    borderColor: "#6A0DAD",
  },
  serviceContent: {
    flex: 1,
    marginRight: 10,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  serviceNameSelected: {
    color: "#6A0DAD",
  },
  serviceDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  serviceDescriptionSelected: {
    color: "#8A2BE2",
  },
  serviceCheckbox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#e0e0e0",
    alignItems: "center",
    justifyContent: "center",
  },
  serviceCheckboxSelected: {
    backgroundColor: "#6A0DAD",
    borderColor: "#6A0DAD",
  },
  checkmark: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  selectedServicesInfo: {
    marginVertical: 15,
    padding: 15,
    backgroundColor: "#e8f4f8",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#bee5eb",
  },
  selectedCount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0c5460",
    marginBottom: 10,
  },
  selectedServicesList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  selectedServiceTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6A0DAD",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedServiceText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "500",
    marginRight: 6,
  },
  removeServiceButton: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  removeServiceText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    lineHeight: 18,
  },
  selectedServiceItem: {
    fontSize: 14,
    color: "#333",
    marginBottom: 5,
  },
  disabledButton: {
    backgroundColor: "#ccc",
    opacity: 0.5,
  },
  coverImage: {
    width: 100,
    height: 67,
  },
});

export default FreelancerSignup;
