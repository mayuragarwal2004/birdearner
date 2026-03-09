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
} from "react-native";
import Checkbox from "expo-checkbox";
import Toast from "react-native-toast-message";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { z } from "zod";
import { X } from "lucide-react-native";
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

const assetSchema = z.any();

// Create conditional schema based on mode
const createSchema = (mode) => {
  const baseSchema = {
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

const FreelancerSignup = ({ navigation, route }) => {
  const { register, user, userProfile, refreshUserData } = useAuth(); // Get auth functions from AuthContext
  const [step, setStep] = useState(2);
  const [isLoading, setIsLoading] = useState(false);
  const [emailChecked, setEmailChecked] = useState(false);
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
      showToast(
        "error",
        "Invalid Pincode",
        "Please enter a valid Indian pincode"
      );
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
      const response = await fetch(
        `https://api.postalpincode.in/pincode/${pincode}`
      );
      const data = await response.json();

      if (
        data[0].Status === "Success" &&
        data[0].PostOffice &&
        data[0].PostOffice.length > 0
      ) {
        const location = data[0].PostOffice[0];
        console.log({ location });

        setForm((prev) => ({
          ...prev,
          city: location.District,
          state: location.State,
          autoFilledLocation: true,
        }));
      } else {
        showToast(
          "error",
          "Invalid Pincode",
          "This pincode is not valid for India"
        );
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

  const [uploadingPortfolioImages, setUploadingPortfolioImages] =
    useState(false);

  // Services state
  const [availableServices, setAvailableServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState(
    user?.freelancer?.selectedServices || []
  );
  const [servicesLoading, setServicesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredServices, setFilteredServices] = useState([]);

  const [form, setForm] = useState({
    full_name: user?.fullName || "",
    email: initialEmail || user?.email || "",
    password: "",
    confirmPassword: "",
    termsAccepted: false,
    qualification: user?.freelancer?.highestQualification || "",
    experience: user?.freelancer?.experience
      ? user.freelancer.experience.toString()
      : "",
    heading: user?.freelancer?.profileHeading || "",
    zipCode: user?.freelancer?.zipcode
      ? user.freelancer.zipcode.toString()
      : "",
    city: user?.freelancer?.city || "",
    state: user?.freelancer?.state || "",
    country: user?.freelancer?.country || "India",
    bio: user?.freelancer?.profileDescription || "",

    // Track if city/state were auto-filled
    autoFilledLocation: false,
    gender: user?.freelancer?.gender || "",
    dob: user?.freelancer?.dob ? new Date(user.freelancer.dob) : new Date(),
    certifications: user?.freelancer?.certifications?.length
      ? user.freelancer.certifications
      : [""],
    socialLinks: user?.freelancer?.socialMediaLinks?.length
      ? user.freelancer.socialMediaLinks
      : [""],
    profileImage: user?.freelancer?.profilePhoto
      ? { uri: user.freelancer.profilePhoto, isExisting: true }
      : null,
    coverImage: user?.freelancer?.coverPhoto
      ? { uri: user.freelancer.coverPhoto, isExisting: true }
      : null,
    portfolioImages: user?.freelancer?.portfolioImages?.length
      ? user.freelancer.portfolioImages.map((img) => ({
        uri: img,
        isExisting: true,
      }))
      : [],
    agreePortfolioTerms: user?.freelancer?.termsAccepted || false,
    selectedServices: user?.freelancer?.selectedServices || [], // Add selectedServices to form state
  });

  // Track deleted images for update mode
  const [deletedImages, setDeletedImages] = useState([]);

  // Only update form data when user data actually changes and we're in update mode
  useEffect(() => {
    const dataSource = profileData || user?.freelancer;
    if (mode === "update" && dataSource) {
      setForm((prevForm) => ({
        ...prevForm,
        full_name: user?.fullName || prevForm.full_name,
        qualification: dataSource.highestQualification || prevForm.qualification,
        experience: dataSource.experience
          ? dataSource.experience.toString()
          : prevForm.experience,
        heading: dataSource.profileHeading || prevForm.heading,
        city: dataSource.city || prevForm.city,
        state: dataSource.state || prevForm.state,
        zipCode: dataSource.zipcode
          ? dataSource.zipcode.toString()
          : prevForm.zipCode,
        country: dataSource.country || prevForm.country,
        bio: dataSource.profileDescription || prevForm.bio,
        gender: dataSource.gender || prevForm.gender,
        dob: dataSource.dob
          ? new Date(dataSource.dob)
          : prevForm.dob,
        certifications: dataSource.certifications?.length
          ? dataSource.certifications
          : prevForm.certifications,
        socialLinks: dataSource.socialMediaLinks?.length
          ? dataSource.socialMediaLinks
          : prevForm.socialLinks,
        profileImage: dataSource.profilePhoto
          ? { uri: dataSource.profilePhoto, isExisting: true }
          : prevForm.profileImage,
        coverImage: dataSource.coverPhoto
          ? { uri: dataSource.coverPhoto, isExisting: true }
          : prevForm.coverImage,
        portfolioImages: dataSource.portfolioImages?.length
          ? dataSource.portfolioImages.map((img) => ({
            uri: img,
            isExisting: true,
          }))
          : prevForm.portfolioImages,
        agreePortfolioTerms: dataSource.termsAccepted || prevForm.agreePortfolioTerms,
        selectedServices: dataSource.selectedServices || prevForm.selectedServices,
      }));

      // Keep selectedServices local state in sync
      if (dataSource.selectedServices) {
        setSelectedServices(dataSource.selectedServices);
      }
    }
  }, [mode, user?.id, profileData]); // Trigger when mode, explicit profile data, or user ID changes

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
        const newImages = pickerResult.assets.map((asset) => ({
          ...asset,
          isExisting: false, // Mark new images as not existing
        }));
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
    const imageToRemove = form.portfolioImages[index];

    // If it's an existing image (from server), track it for deletion
    if (imageToRemove.isExisting && mode === "update") {
      setDeletedImages([...deletedImages, imageToRemove.uri]);
    }

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
        const services = await apiService.getAllServices();
        console.log(JSON.stringify(services, null, 2));

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

  // Initialize selected services from user data in update mode
  useEffect(() => {
    if (mode === "update" && user?.freelancer?.selectedServices) {
      setSelectedServices(user.freelancer.selectedServices);
    }
  }, [mode, user?.freelancer?.selectedServices]); // Use specific property instead of entire user object

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
    if (step === 1 && mode === "signup") {
      // Check email before proceeding (only for signup mode)
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

    // upload profile photo (only if it's a new image, not an existing URL)
    if (cleanedForm.profileImage && cleanedForm.profileImage.uri) {
      if (cleanedForm.profileImage.isExisting) {
        // Keep existing image URL as is
        cleanedForm.profileImage = cleanedForm.profileImage.uri;
      } else if (!cleanedForm.profileImage.uri.startsWith("http")) {
        // Upload new image
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
    } else {
      cleanedForm.profileImage = null;
    }

    // upload cover photo (only if it's a new image, not an existing URL)
    if (cleanedForm.coverImage && cleanedForm.coverImage.uri) {
      if (cleanedForm.coverImage.isExisting) {
        // Keep existing image URL as is
        cleanedForm.coverImage = cleanedForm.coverImage.uri;
      } else if (!cleanedForm.coverImage.uri.startsWith("http")) {
        // Upload new image
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
    } else {
      cleanedForm.coverImage = null;
    }

    // upload portfolio images (handle both new and existing images)
    if (cleanedForm.portfolioImages && cleanedForm.portfolioImages.length > 0) {
      let uploadedImages = [];
      for (let i = 0; i < cleanedForm.portfolioImages.length; i++) {
        const portfolioImage = cleanedForm.portfolioImages[i];

        if (portfolioImage.isExisting) {
          // Keep existing images as is (whether they're full URLs or relative paths)
          uploadedImages.push(portfolioImage.uri);
        } else if (
          portfolioImage.uri &&
          !portfolioImage.uri.startsWith("http") &&
          !portfolioImage.uri.startsWith("/uploads")
        ) {
          // Upload new images (exclude existing images with relative paths)
          const result = await apiService.uploadImage(
            portfolioImage,
            "freelancer_portfolios"
          );
          console.log("Portfolio image uploaded:", result);
          if (result.success) {
            uploadedImages.push(result.url);
          } else {
            showToast(
              "error",
              "Error Uploading Portfolio Image",
              result.message
            );
            setIsLoading(false);
            return;
          }
        }
      }
      cleanedForm.portfolioImages = uploadedImages;
    } else {
      cleanedForm.portfolioImages = [];
    }

    try {
      let result;

      if (mode === "signup") {
        console.log("About to call register function from AuthContext");
        // Use the register function from AuthContext which handles both signup and login
        result = await register({
          ...cleanedForm,
          role: "FREELANCER",
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
        // Create additional freelancer profile for existing user
        console.log("Creating freelancer profile for existing user");

        // Filter and map form data to freelancer model fields only
        const freelancerCreateData = {
          // Map form fields to freelancer model fields
          selectedServices: cleanedForm.selectedServices,
          highestQualification: cleanedForm.qualification,
          experience: cleanedForm.experience
            ? parseInt(cleanedForm.experience)
            : null,
          profileHeading: cleanedForm.heading,
          city: cleanedForm.city,
          state: cleanedForm.state,
          zipcode: cleanedForm.zipCode ? parseInt(cleanedForm.zipCode) : null,
          country: cleanedForm.country,
          gender: cleanedForm.gender,
          dob: cleanedForm.dob,
          certifications: cleanedForm.certifications,
          socialMediaLinks: cleanedForm.socialLinks,
          profileDescription: cleanedForm.bio,
          profilePhoto: cleanedForm.profileImage,
          coverPhoto: cleanedForm.coverImage,
          portfolioImages: cleanedForm.portfolioImages,
          termsAccepted: cleanedForm.agreePortfolioTerms,
          // Handle fullName separately for user table update
          fullName: cleanedForm.full_name,
        };

        // Remove null/undefined/empty values
        Object.keys(freelancerCreateData).forEach((key) => {
          if (
            freelancerCreateData[key] === null ||
            freelancerCreateData[key] === undefined ||
            freelancerCreateData[key] === ""
          ) {
            delete freelancerCreateData[key];
          }
        });

        result = await apiService.createFreelancerProfile(freelancerCreateData);

        console.log("Freelancer profile created:", result);

        // Refresh user profile data
        if (refreshUserData) {
          await refreshUserData();
        }

        showToast(
          "success",
          "Profile Created",
          "Freelancer profile created successfully!"
        );
        navigation.goBack();
      } else if (mode === "update") {
        // Update existing freelancer profile
        console.log("Updating freelancer profile:", user?.freelancer?.id);

        // Filter and map form data to freelancer model fields only
        const freelancerUpdateData = {
          // Map form fields to freelancer model fields
          selectedServices: cleanedForm.selectedServices,
          highestQualification: cleanedForm.qualification,
          experience: cleanedForm.experience
            ? parseInt(cleanedForm.experience)
            : null,
          profileHeading: cleanedForm.heading,
          city: cleanedForm.city,
          state: cleanedForm.state,
          zipcode: cleanedForm.zipCode ? parseInt(cleanedForm.zipCode) : null,
          country: cleanedForm.country,
          gender: cleanedForm.gender,
          dob: cleanedForm.dob,
          certifications: cleanedForm.certifications,
          socialMediaLinks: cleanedForm.socialLinks,
          profileDescription: cleanedForm.bio,
          profilePhoto: cleanedForm.profileImage,
          coverPhoto: cleanedForm.coverImage,
          portfolioImages: cleanedForm.portfolioImages,
          termsAccepted: cleanedForm.agreePortfolioTerms,
          // Handle fullName separately for user table update
          fullName: cleanedForm.full_name,
          // Include deleted images information for backend processing
          deletedImages: deletedImages, // Send list of deleted image URLs
        };

        // Remove null/undefined/empty values
        Object.keys(freelancerUpdateData).forEach((key) => {
          if (
            freelancerUpdateData[key] === null ||
            freelancerUpdateData[key] === undefined ||
            freelancerUpdateData[key] === ""
          ) {
            delete freelancerUpdateData[key];
          }
        });

        result = await apiService.updateFreelancerProfile(
          user?.freelancer?.id,
          freelancerUpdateData
        );

        console.log("Freelancer profile updated:", result);

        // Refresh user profile data
        if (refreshUserData) {
          await refreshUserData();
        }

        showToast(
          "success",
          "Profile Updated",
          "Freelancer profile updated successfully!"
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
        return "Freelancer Signup";
      case "create":
        return title || "Create Freelancer Profile";
      case "update":
        return title || "Update Freelancer Profile";
      default:
        return "Freelancer Profile";
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
          {/* Step 1: Basic Signup Info (only for signup mode) */}
          {step === 1 && mode === "signup" && (
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
                  <Text style={styles.label}>Zip Code</Text>
                  <TextInput
                    placeholderTextColor="#c4c4c4"
                    placeholder="Enter 6-digit Indian pincode"
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
                    placeholderTextColor="#c4c4c4"
                    placeholder={
                      fetchingLocation ? "Fetching city..." : "Enter city"
                    }
                    style={[
                      styles.input,
                      fetchingLocation && { backgroundColor: "#f0f0f0" },
                    ]}
                    value={form.city}
                    onChangeText={(text) =>
                      setForm({
                        ...form,
                        city: text,
                        autoFilledLocation: false,
                      })
                    }
                    editable={!fetchingLocation}
                  />
                </View>
                <View style={styles.dropdownContainer}>
                  <Text style={styles.label}>State</Text>
                  <PickerModal
                    items={indianStates}
                    value={form.state}
                    onValueChange={(value) =>
                      setForm({
                        ...form,
                        state: value,
                        autoFilledLocation: false,
                      })
                    }
                    placeholder={
                      fetchingLocation ? "Fetching state..." : "Select State"
                    }
                    innerStyle={{ backgroundColor: "#f5f5f5" }}
                    style={{ marginVertical: 0 }}
                    disabled={fetchingLocation}
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
                    style={[styles.input, styles.socialRowInput]}
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
                  {form.certifications.length > 1 && (
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => {
                        setForm({
                          ...form,
                          certifications: form.certifications.filter(
                            (_, idx) => idx !== i
                          ),
                        });
                      }}
                    >
                      <X size={18} color="#fff" strokeWidth={2.5} />
                    </TouchableOpacity>
                  )}
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
                    style={[styles.input, styles.socialRowInput]}
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
                  {form.socialLinks.length > 1 && (
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => {
                        setForm({
                          ...form,
                          socialLinks: form.socialLinks.filter(
                            (_, idx) => idx !== i
                          ),
                        });
                      }}
                    >
                      <X size={18} color="#fff" strokeWidth={2.5} />
                    </TouchableOpacity>
                  )}
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
                    {image.isExisting && mode === "update" && (
                      <View style={styles.existingImageBadge}>
                        <Text style={styles.existingImageText}>Existing</Text>
                      </View>
                    )}
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
                <TouchableOpacity
                  style={styles.backButton}
                  disabled={isLoading}
                  onPress={prevStep}
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
        </ScrollView>
        <Toast />
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
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  socialRowInput: {
    flex: 1,
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
  existingImageBadge: {
    position: "absolute",
    top: 5,
    left: 5,
    backgroundColor: "#28a745",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  existingImageText: {
    color: "#ffffff",
    fontSize: 8,
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
  disabledText: {
    color: "#888",
  },
  deleteButton: {
    marginLeft: 12,
    backgroundColor: "#ff4757",
    borderRadius: 20,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#ff4757",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#ff3742",
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    lineHeight: 20,
  },
});

export default FreelancerSignup;
