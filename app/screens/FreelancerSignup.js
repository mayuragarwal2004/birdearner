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
import Toast from "react-native-toast-message";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { z } from "zod";
import {
  User,
  UserCheck,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Calendar,
  MapPin,
  Building,
  Map,
  Globe,
  FileText,
  Edit3,
  Camera,
  Trash2,
  Plus,
  ArrowLeft,
  ArrowRight,
  Check,
  Search,
  Award,
  BookOpen,
  Briefcase,
  Bookmark,
  Sparkles,
  Laptop,
  Info,
  ShieldCheck,
  X,
  Link as LinkIcon,
  GraduationCap,
  Clock,
  ChevronDown,
} from "lucide-react-native";
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

const FREELANCER_TYPE_OPTIONS = [
  { label: "Select your freelancer type", value: "" },
  { label: "Individual Freelancer", value: "Individual" },
  { label: "Agency / Team", value: "Agency" },
  { label: "Consultant / Advisor", value: "Consultant" },
];

const PROFICIENCY_LEVELS = [
  { label: "Select level", value: "" },
  { label: "Native", value: "Native" },
  { label: "Fluent", value: "Fluent" },
  { label: "Conversational", value: "Conversational" },
  { label: "Basic", value: "Basic" },
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
    qualification: z.string().optional(),
    experience: z.string().optional(),
    heading: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
    bio: z.string().optional(),
    gender: z.string().optional(),
    dob: z.union([z.date(), z.string()]).optional().nullable(),
    certifications: z.array(z.string()).optional(),
    socialLinks: z.array(z.string()).optional(),
    profileImage: z.any().optional(),
    coverImage: z.any().optional(),
    portfolioImages: z.array(assetSchema).optional(),
    agreePortfolioTerms: z.boolean().optional(),
    termsAndConditions: z.boolean().refine((val) => val === true, {
      message: "You must accept the Terms and Conditions.",
    }),
  };

  if (mode === "signup") {
    return z
      .object({
        full_name: z.string().min(1, "Full name is required"),
        email: z.string().email("Valid email is required"),
        password: z.string().min(6, "Password must be at least 6 characters"),
        confirmPassword: z.string().min(6, "Confirm password is required"),
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

const FreelancerSignup = ({ navigation, route }) => {
  const { register, user, refreshUserData } = useAuth();
  const [step, setStep] = useState(2);
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Extract route params
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

  const [availableServices, setAvailableServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState(
    user?.freelancer?.selectedServices || []
  );
  const [servicesLoading, setServicesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredServices, setFilteredServices] = useState([]);

  // Languages & Freelancer mode state extensions
  const [workType, setWorkType] = useState("remote"); // 'remote' or 'onsite'
  const [freelancerCategory, setFreelancerCategory] = useState("");
  const [languageInput, setLanguageInput] = useState("");
  const [selectedProficiency, setSelectedProficiency] = useState("");
  const [languageList, setLanguageList] = useState([
    { name: "English", level: "Fluent" },
    { name: "Hindi", level: "Native" },
  ]);

  const [form, setForm] = useState({
    full_name: user?.fullName || "",
    mobile: initialMobile || "",
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
    autoFilledLocation: false,
    gender: user?.freelancer?.gender || "",
    dob: user?.freelancer?.dob ? new Date(user.freelancer.dob) : null,
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
    termsAndConditions: false,
    selectedServices: user?.freelancer?.selectedServices || [],
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
        dob: dataSource.dob ? new Date(dataSource.dob) : prevForm.dob,
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
        agreePortfolioTerms:
          dataSource.termsAccepted || prevForm.agreePortfolioTerms,
        selectedServices:
          dataSource.selectedServices || prevForm.selectedServices,
      }));

      if (dataSource.selectedServices) {
        setSelectedServices(dataSource.selectedServices);
      }
    }
  }, [mode, user?.id, profileData]);

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
      if (!pickerResult.canceled && pickerResult.assets?.length > 0) {
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
      if (!pickerResult.canceled && pickerResult.assets?.length > 0) {
        const newImages = pickerResult.assets.map((asset) => ({
          ...asset,
          isExisting: false,
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
    if (imageToRemove && imageToRemove.isExisting && mode === "update") {
      setDeletedImages([...deletedImages, imageToRemove.uri]);
    }

    setForm({
      ...form,
      portfolioImages: form.portfolioImages.filter((_, i) => i !== index),
    });
  };

  const addSocialLink = () =>
    setForm({ ...form, socialLinks: [...form.socialLinks, ""] });
  const addCertification = () =>
    setForm({ ...form, certifications: [...form.certifications, ""] });

  const addLanguage = () => {
    if (!languageInput.trim()) {
      showToast("error", "Language Required", "Please enter a language");
      return;
    }
    setLanguageList([
      ...languageList,
      { name: languageInput.trim(), level: selectedProficiency || "Fluent" },
    ]);
    setLanguageInput("");
    setSelectedProficiency("");
  };

  const removeLanguage = (index) => {
    setLanguageList(languageList.filter((_, i) => i !== index));
  };

  useEffect(() => {
    const loadServices = async () => {
      try {
        setServicesLoading(true);
        await apiService.init();
        const services = await apiService.getAllServices();
        setAvailableServices(services);
        setFilteredServices([]);
      } catch (error) {
        showToast("error", "Error", "Failed to load services");
      } finally {
        setServicesLoading(false);
      }
    };
    loadServices();
  }, []);

  useEffect(() => {
    if (mode === "update" && user?.freelancer?.selectedServices) {
      setSelectedServices(user.freelancer.selectedServices);
    }
  }, [mode, user?.freelancer?.selectedServices]);

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

  const toggleServiceSelection = (service) => {
    const serviceId = service.id;
    const currentlySelected = selectedServices.includes(serviceId);

    if (currentlySelected) {
      const newSelected = selectedServices.filter((id) => id !== serviceId);
      setSelectedServices(newSelected);
      setForm({ ...form, selectedServices: newSelected });
    } else {
      if (selectedServices.length < 5) {
        const newSelected = [...selectedServices, serviceId];
        setSelectedServices(newSelected);
        setForm({ ...form, selectedServices: newSelected });
      } else {
        showToast("info", "Limit Reached", "You can select maximum 5 services");
      }
    }
  };

  const getServiceNameById = (serviceId) => {
    const service = availableServices.find((s) => s.id === serviceId);
    return service ? service.name : "Unknown Service";
  };

  const formatDateOfBirth = (dob) => {
    if (!dob) return "DD / MM / YYYY";
    try {
      const dateObj =
        typeof dob === "object" && dob instanceof Date ? dob : new Date(dob);
      if (isNaN(dateObj.getTime())) return "DD / MM / YYYY";
      return dateObj.toLocaleDateString("en-GB");
    } catch (e) {
      return "DD / MM / YYYY";
    }
  };

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
        showToast("error", "Weak Password", "Password must be at least 6 characters.");
        return;
      }
      if (!form.confirmPassword) {
        showToast("error", "Confirm Password Required", "Please confirm your password.");
        return;
      }
      if (form.password !== form.confirmPassword) {
        showToast("error", "Password Mismatch", "Passwords do not match.");
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
        showToast("error", "Check Failed", error.message || "Unable to verify email");
        setIsLoading(false);
        return;
      }
    } else if (step === 2) {
      if (selectedServices.length === 0) {
        showToast(
          "error",
          "Services Required",
          "Please select at least one service you want to offer"
        );
        return;
      }
      setStep(3);
    } else if (step === 3) {
      setStep(5);
    } else {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step === 2 && (mode === "create" || mode === "update")) {
      navigation.goBack();
    } else if (step === 5) {
      setStep(3);
    } else if (step > 1) {
      setStep(step - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    const result = schema.safeParse(form);
    if (!result.success) {
      setIsLoading(false);
      showToast("error", "Validation Error", result.error.errors[0].message);
      return;
    }

    const cleanedForm = {
      ...form,
      certifications: form.certifications.filter((cert) => cert.trim() !== ""),
      socialLinks: form.socialLinks.filter((link) => link.trim() !== ""),
    };

    if (cleanedForm.profileImage && cleanedForm.profileImage.uri) {
      if (cleanedForm.profileImage.isExisting) {
        cleanedForm.profileImage = cleanedForm.profileImage.uri;
      } else if (!cleanedForm.profileImage.uri.startsWith("http")) {
        const result = await apiService.uploadImage(
          cleanedForm.profileImage,
          "freelancer_profile_photos"
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

    if (cleanedForm.coverImage && cleanedForm.coverImage.uri) {
      if (cleanedForm.coverImage.isExisting) {
        cleanedForm.coverImage = cleanedForm.coverImage.uri;
      } else if (!cleanedForm.coverImage.uri.startsWith("http")) {
        const result = await apiService.uploadImage(
          cleanedForm.coverImage,
          "freelancer_cover_photos"
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

    if (cleanedForm.portfolioImages && cleanedForm.portfolioImages.length > 0) {
      let uploadedImages = [];
      for (let i = 0; i < cleanedForm.portfolioImages.length; i++) {
        const portfolioImage = cleanedForm.portfolioImages[i];

        if (portfolioImage.isExisting) {
          uploadedImages.push(portfolioImage.uri);
        } else if (
          portfolioImage.uri &&
          !portfolioImage.uri.startsWith("http") &&
          !portfolioImage.uri.startsWith("/uploads")
        ) {
          const result = await apiService.uploadImage(
            portfolioImage,
            "freelancer_portfolios"
          );
          if (result.success) {
            uploadedImages.push(result.url);
          } else {
            showToast("error", "Error Uploading Portfolio Image", result.message);
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
        result = await register({
          ...cleanedForm,
          mobile: form.mobile,
          role: "FREELANCER",
        });

        if (result) {
          showToast("success", "Signup Complete", "Welcome to BirdEarner!");
          navigation.replace("MainTabs");
        } else {
          showToast("error", "Signup Failed", "Registration failed. Please try again.");
        }
      } else if (mode === "create") {
        const freelancerCreateData = {
          userId: user?.id,
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
          termsAccepted: cleanedForm.termsAndConditions,
          fullName: cleanedForm.full_name,
        };

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

        if (refreshUserData) {
          await refreshUserData();
        }

        showToast("success", "Profile Created", "Freelancer profile created successfully!");
        navigation.goBack();
      } else if (mode === "update") {
        const freelancerUpdateData = {
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
          termsAccepted: cleanedForm.termsAndConditions,
          fullName: cleanedForm.full_name,
          deletedImages: deletedImages,
        };

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

        if (refreshUserData) {
          await refreshUserData();
        }

        showToast("success", "Profile Updated", "Freelancer profile updated successfully!");
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

  const getHeading = () => {
    if (step === 1 && mode === "signup") return "Complete Your Profile";
    if (step === 2) return "Add Your Services";
    if (step === 3) return "Complete Your Freelancer Profile";
    if (step === 4) return "Personal & Work Details";
    if (step === 5) return "Add Your Portfolio";
    if (step === 6) return "Review & Submit";
    return title || "Freelancer Profile";
  };

  const getHeaderSubtitle = () => {
    if (step === 1) return "Please fill in the details below to get started";
    if (step === 2) return "Add up to 20 services (minimum 1 required)";
    if (step === 3) return "Tell us more about yourself and your work";
    if (step === 4) return "Add your skills, languages, and qualifications";
    if (step === 5) return "Upload images of your work to showcase your skills and experience to clients";
    if (step === 6) return "Review your details before submitting";
    return "Fill in your profile details below";
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#2E0854" }}>
      <LinearGradient
        colors={["#2B0855", "#3B0A75", "#160233"]}
        style={{ flex: 1 }}
      >
        {/* Background Dot Matrix Decorative Elements */}
        <View style={styles.dotMatrixLeft} pointerEvents="none">
          {[...Array(15)].map((_, i) => (
            <View key={i} style={styles.dotItem} />
          ))}
        </View>
        <View style={styles.dotMatrixRight} pointerEvents="none">
          {[...Array(15)].map((_, i) => (
            <View key={i} style={styles.dotItem} />
          ))}
        </View>

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
                <Text style={styles.headerTitle}>{getHeading()}</Text>
                <Text style={styles.headerSubtitle}>{getHeaderSubtitle()}</Text>
              </View>
            )}

            {/* Header for Steps >= 2 (Screen 2 / Profile Reference) */}
            {(step >= 2 || mode !== "signup") && (
              <View style={styles.headerNavSection}>
                <TouchableOpacity
                  style={styles.backIconButton}
                  onPress={prevStep}
                  activeOpacity={0.7}
                >
                  <ArrowLeft size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{getHeading()}</Text>
                <Text style={styles.headerSubtitle}>{getHeaderSubtitle()}</Text>
              </View>
            )}

            {/* Step 1: Basic Signup Account Info (Image 3/4 Reference) */}
            {step === 1 && mode === "signup" && (
              <View style={styles.card}>
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

                <Text style={styles.fieldLabel}>Mobile Number</Text>
                <View style={styles.inputContainer}>
                  <View style={styles.iconBox}>
                    <Phone size={20} color="#7C3AED" />
                  </View>
                  <View style={styles.countryCodeBox}>
                    <Text style={styles.countryFlag}>🇮🇳</Text>
                    <Text style={styles.countryCodeText}>+91</Text>
                    <ChevronDown size={14} color="#7C3AED" style={{ marginLeft: 2 }} />
                  </View>
                  <TextInput
                    style={styles.textInput}
                    placeholderTextColor="#A098AE"
                    placeholder="Enter your mobile number"
                    value={form.mobile}
                    editable={false}
                  />
                </View>

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

                <View style={styles.securityBanner}>
                  <ShieldCheck size={18} color="#BDB4FE" style={{ marginRight: 8 }} />
                  <Text style={styles.securityBannerText}>
                    Your information is safe and secure with us.
                  </Text>
                </View>
              </View>
            )}

            {/* Step 2: Add Your Services */}
            {step === 2 && (
              <View style={styles.card}>
                <Text style={styles.subFieldLabel}>
                  Choose up to 5 services you want to offer (minimum 1 required):
                </Text>

                <View style={styles.inputContainer}>
                  <View style={styles.iconBox}>
                    <Search size={20} color="#7C3AED" />
                  </View>
                  <TextInput
                    placeholderTextColor="#A098AE"
                    style={styles.textInput}
                    placeholder="Search services (e.g. Graphic Design, Web Dev)..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCapitalize="none"
                  />
                </View>

                {selectedServices.length > 0 && (
                  <View style={styles.selectedServicesContainer}>
                    <Text style={styles.selectedServicesTitle}>
                      Selected Services ({selectedServices.length}/5)
                    </Text>
                    <View style={styles.tagsWrapper}>
                      {selectedServices.map((serviceId) => (
                        <View key={serviceId} style={styles.purpleTagBadge}>
                          <Text style={styles.purpleTagText}>
                            {getServiceNameById(serviceId)}
                          </Text>
                          <TouchableOpacity
                            onPress={() => {
                              const service = availableServices.find(
                                (s) => s.id === serviceId
                              );
                              if (service) toggleServiceSelection(service);
                            }}
                            style={styles.tagRemoveBtn}
                          >
                            <X size={12} color="#FFFFFF" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {servicesLoading ? (
                  <ActivityIndicator
                    size="medium"
                    color="#6D28D9"
                    style={{ marginVertical: 20 }}
                  />
                ) : (
                  <ScrollView
                    style={{ maxHeight: 320, marginVertical: 10 }}
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={true}
                  >
                    {searchQuery.trim() === "" ? (
                      <View style={styles.infoBannerBox}>
                        <Info size={18} color="#7C3AED" style={{ marginRight: 8 }} />
                        <Text style={styles.infoBannerText}>
                          Type keywords to search and add services to your profile.
                        </Text>
                      </View>
                    ) : (
                      <>
                        {filteredServices.length === 0 ? (
                          <View style={styles.noResultsBox}>
                            <Text style={styles.noResultsTitle}>
                              No services found for "{searchQuery}"
                            </Text>
                          </View>
                        ) : (
                          filteredServices.map((service) => {
                            const isSelected = selectedServices.includes(service.id);
                            return (
                              <TouchableOpacity
                                key={service.id}
                                style={[
                                  styles.serviceCardItem,
                                  isSelected && styles.serviceCardItemSelected,
                                ]}
                                onPress={() => toggleServiceSelection(service)}
                                activeOpacity={0.7}
                              >
                                <View style={{ flex: 1, marginRight: 10 }}>
                                  <Text
                                    style={[
                                      styles.serviceItemName,
                                      isSelected && styles.purpleTextBold,
                                    ]}
                                  >
                                    {service.name}
                                  </Text>
                                  {service.description && (
                                    <Text
                                      style={styles.serviceItemDesc}
                                      numberOfLines={2}
                                    >
                                      {service.description}
                                    </Text>
                                  )}
                                </View>
                                <View
                                  style={[
                                    styles.checkboxCircle,
                                    isSelected && styles.checkboxCircleSelected,
                                  ]}
                                >
                                  {isSelected && <Check size={14} color="#FFFFFF" />}
                                </View>
                              </TouchableOpacity>
                            );
                          })
                        )}
                      </>
                    )}
                  </ScrollView>
                )}

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.secondaryHalfButton}
                    onPress={prevStep}
                    disabled={mode === "signup"}
                  >
                    <ArrowLeft size={18} color="#6D28D9" style={{ marginRight: 6 }} />
                    <Text style={styles.secondaryHalfButtonText}>Back</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.primaryHalfButton,
                      selectedServices.length === 0 && styles.disabledButton,
                    ]}
                    onPress={nextStep}
                    disabled={selectedServices.length === 0}
                  >
                    <Text style={styles.primaryHalfButtonText}>Next</Text>
                    <ArrowRight size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Step 3: Complete Your Freelancer Profile (Exact Match to Image 2 Reference) */}
            {step === 3 && (
              <View style={styles.card}>
                {/* 1. Add Your Profile Picture */}
                <Text style={styles.sectionNumberTitle}>1. Add Your Profile</Text>
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
                      <User size={38} color="#5B21B6" />
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

                {/* 2. Choose Freelancer Type */}
                <Text style={styles.sectionNumberTitle}>2. Choose Freelancer Type</Text>
                <View style={styles.gridRow}>
                  <TouchableOpacity
                    style={[
                      styles.freelancerTypeCard,
                      workType === "remote" && styles.freelancerTypeCardSelected,
                    ]}
                    onPress={() => setWorkType("remote")}
                    activeOpacity={0.8}
                  >
                    <View style={styles.typeIconBox}>
                      <Laptop size={20} color="#7C3AED" />
                    </View>
                    <View style={{ flex: 1, paddingRight: 4 }}>
                      <Text style={styles.typeCardTitle}>Remote</Text>
                      <Text style={styles.typeCardSubtext}>Work from anywhere</Text>
                    </View>
                    <View
                      style={[
                        styles.radioCircle,
                        workType === "remote" && styles.radioCircleSelected,
                      ]}
                    >
                      {workType === "remote" && <View style={styles.radioInnerDot} />}
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.freelancerTypeCard,
                      workType === "onsite" && styles.freelancerTypeCardSelected,
                    ]}
                    onPress={() => setWorkType("onsite")}
                    activeOpacity={0.8}
                  >
                    <View style={styles.typeIconBox}>
                      <MapPin size={20} color="#7C3AED" />
                    </View>
                    <View style={{ flex: 1, paddingRight: 4 }}>
                      <Text style={styles.typeCardTitle}>On-site</Text>
                      <Text style={styles.typeCardSubtext}>Work at a specific location</Text>
                    </View>
                    <View
                      style={[
                        styles.radioCircle,
                        workType === "onsite" && styles.radioCircleSelected,
                      ]}
                    >
                      {workType === "onsite" && <View style={styles.radioInnerDot} />}
                    </View>
                  </TouchableOpacity>
                </View>

                {/* 3. Select Your Freelancer Type */}
                <Text style={styles.sectionNumberTitle}>
                  3. Select Your Freelancer Type
                </Text>
                <PickerModal
                  items={FREELANCER_TYPE_OPTIONS}
                  value={freelancerCategory}
                  onValueChange={(v) => setFreelancerCategory(v)}
                  placeholder="Select your freelancer type"
                  leftIcon={<Briefcase size={20} color="#7C3AED" />}
                  style={{ marginVertical: 4, marginBottom: 4 }}
                />
                <Text style={styles.fieldHelperText}>
                  Options will change based on your freelancer type selection.
                </Text>

                {/* 4. Write About Yourself */}
                <Text style={styles.sectionNumberTitle}>4. Write About Yourself</Text>
                <View style={styles.textareaContainer}>
                  <TextInput
                    style={styles.textareaInput}
                    placeholderTextColor="#A098AE"
                    placeholder="Write a short bio about yourself, your background and what you do..."
                    value={form.bio}
                    multiline
                    maxLength={500}
                    onChangeText={(v) => setForm({ ...form, bio: v })}
                  />
                  <Text style={styles.textareaCharCounter}>
                    {form.bio ? form.bio.length : 0} / 500
                  </Text>
                </View>

                {/* 5. Date of Birth (Optional) */}
                <Text style={styles.sectionNumberTitle}>
                  5. Date of Birth <Text style={styles.optionalText}>(Optional)</Text>
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

                {/* 6. Gender */}
                <Text style={styles.sectionNumberTitle}>6. Gender</Text>
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

                {/* 7. Experience (in months) */}
                <Text style={styles.sectionNumberTitle}>7. Experience (in months)</Text>
                <View style={styles.inputContainer}>
                  <View style={styles.iconBox}>
                    <Calendar size={20} color="#7C3AED" />
                  </View>
                  <TextInput
                    style={styles.textInput}
                    placeholderTextColor="#A098AE"
                    placeholder="Enter your total experience in months"
                    keyboardType="numeric"
                    value={form.experience}
                    onChangeText={(v) => setForm({ ...form, experience: v })}
                  />
                </View>

                {/* 8. Your Location */}
                <Text style={styles.sectionNumberTitle}>8. Your Location</Text>
                <View style={styles.gridRow}>
                  <View style={styles.gridCol}>
                    <View style={styles.inputContainer}>
                      <View style={styles.iconBox}>
                        <MapPin size={20} color="#7C3AED" />
                      </View>
                      <TextInput
                        style={styles.textInput}
                        placeholderTextColor="#A098AE"
                        placeholder="Enter your city"
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
                        placeholder="Enter your state"
                        value={form.state}
                        onChangeText={(v) =>
                          setForm({ ...form, state: v, autoFilledLocation: false })
                        }
                      />
                    </View>
                  </View>
                </View>

                {/* 9. Languages You Speak */}
                <Text style={styles.sectionNumberTitle}>9. Languages You Speak</Text>
                <View style={styles.langInputCardContainer}>
                  <View style={styles.gridRow}>
                    <View style={[styles.gridCol, { flex: 1.3 }]}>
                      <View style={styles.inputContainer}>
                        <TextInput
                          style={styles.textInput}
                          placeholderTextColor="#A098AE"
                          placeholder="Enter a language (e.g. English)"
                          value={languageInput}
                          onChangeText={setLanguageInput}
                        />
                      </View>
                    </View>
                    <View style={[styles.gridCol, { flex: 1.1 }]}>
                      <PickerModal
                        items={PROFICIENCY_LEVELS}
                        value={selectedProficiency}
                        onValueChange={(v) => setSelectedProficiency(v)}
                        placeholder="Select level"
                        style={{ marginVertical: 0 }}
                      />
                    </View>
                    <TouchableOpacity
                      style={styles.smallAddButton}
                      onPress={addLanguage}
                      activeOpacity={0.85}
                    >
                      <Plus size={16} color="#FFFFFF" />
                      <Text style={styles.smallAddButtonText}>Add</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Added Languages Label & Pills */}
                  <Text style={styles.addedLanguagesLabel}>Added Languages</Text>
                  <View style={styles.tagsWrapper}>
                    {languageList.map((lang, idx) => (
                      <View key={idx} style={styles.langTagBadge}>
                        <Text style={styles.langTagTitle}>{lang.name}</Text>
                        <View style={styles.langTagLevelBox}>
                          <Text style={styles.langTagLevelText}>{lang.level}</Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => removeLanguage(idx)}
                          style={styles.tagRemoveBtn}
                        >
                          <X size={12} color="#6D28D9" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>

                {/* 10. Skills */}
                <Text style={styles.sectionNumberTitle}>10. Skills</Text>
                <View style={styles.inputContainer}>
                  <View style={styles.iconBox}>
                    <Search size={20} color="#7C3AED" />
                  </View>
                  <TextInput
                    style={styles.textInput}
                    placeholderTextColor="#A098AE"
                    placeholder="Search or add your skills"
                  />
                </View>
                <Text style={styles.fieldHelperText}>
                  Add multiple skills that describe your expertise.
                </Text>

                {/* 11. Certifications */}
                <Text style={styles.sectionNumberTitle}>11. Certifications</Text>
                {form.certifications.map((cert, i) => (
                  <View key={i} style={styles.certRow}>
                    <View style={[styles.gridCol, { flex: 1 }]}>
                      <View style={styles.inputContainer}>
                        <View style={styles.iconBox}>
                          <Award size={20} color="#7C3AED" />
                        </View>
                        <TextInput
                          placeholderTextColor="#A098AE"
                          style={styles.textInput}
                          placeholder="Certificate name"
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
                    </View>

                    <View style={[styles.gridCol, { flex: 1 }]}>
                      <View style={styles.inputContainer}>
                        <View style={styles.iconBox}>
                          <Building size={20} color="#7C3AED" />
                        </View>
                        <TextInput
                          placeholderTextColor="#A098AE"
                          style={styles.textInput}
                          placeholder="University / Institute"
                        />
                      </View>
                    </View>

                    <View style={[styles.gridCol, { flex: 0.8 }]}>
                      <View style={styles.inputContainer}>
                        <View style={styles.iconBox}>
                          <Calendar size={20} color="#7C3AED" />
                        </View>
                        <TextInput
                          placeholderTextColor="#A098AE"
                          style={styles.textInput}
                          placeholder="Year"
                          keyboardType="numeric"
                        />
                      </View>
                    </View>

                    {form.certifications.length > 1 && (
                      <TouchableOpacity
                        style={styles.trashIconButton}
                        onPress={() => {
                          setForm({
                            ...form,
                            certifications: form.certifications.filter(
                              (_, idx) => idx !== i
                            ),
                          });
                        }}
                      >
                        <Trash2 size={18} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}

                <TouchableOpacity
                  style={styles.addDashedButton}
                  onPress={addCertification}
                  activeOpacity={0.8}
                >
                  <Plus size={18} color="#6D28D9" style={{ marginRight: 6 }} />
                  <Text style={styles.addDashedButtonText}>
                    Add Another Certificate
                  </Text>
                </TouchableOpacity>

                {/* Footer Action Buttons */}
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.secondaryHalfButton}
                    onPress={prevStep}
                  >
                    <ArrowLeft size={18} color="#6D28D9" style={{ marginRight: 6 }} />
                    <Text style={styles.secondaryHalfButtonText}>Back</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.saveDraftButton}
                    onPress={handleSubmit}
                    disabled={isLoading}
                  >
                    <Bookmark size={18} color="#6D28D9" style={{ marginRight: 6 }} />
                    <Text style={styles.saveDraftButtonText}>Save</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.primaryHalfButton}
                    onPress={nextStep}
                  >
                    <Text style={styles.primaryHalfButtonText}>Next</Text>
                    <ArrowRight size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Step 5: Add Your Portfolio (Exact Match to Image 5 Reference) */}
            {step === 5 && (
              <View style={styles.card}>
                <View style={styles.portfolioGridContainer}>
                  {/* Top Row: Left big upload box + Right 2 stacked small upload boxes */}
                  <View style={styles.portfolioGridWrapper}>
                    <TouchableOpacity
                      style={styles.portfolioBigUploadBox}
                      onPress={uploadPortfolioImages}
                      activeOpacity={0.8}
                    >
                      <Plus size={26} color="#7C3AED" />
                      <Text style={styles.portfolioUploadBoxTitle}>
                        Upload Image
                      </Text>
                      <Text style={styles.portfolioUploadBoxSubtext}>
                        (Optional)
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.portfolioRightCol}>
                      <TouchableOpacity
                        style={styles.portfolioSmallUploadBox}
                        onPress={uploadPortfolioImages}
                        activeOpacity={0.8}
                      >
                        <Plus size={18} color="#7C3AED" />
                        <Text style={styles.portfolioSmallBoxTitle}>
                          Upload Image
                        </Text>
                        <Text style={styles.portfolioUploadBoxSubtext}>
                          (Optional)
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.portfolioSmallUploadBox}
                        onPress={uploadPortfolioImages}
                        activeOpacity={0.8}
                      >
                        <Plus size={18} color="#7C3AED" />
                        <Text style={styles.portfolioSmallBoxTitle}>
                          Upload Image
                        </Text>
                        <Text style={styles.portfolioUploadBoxSubtext}>
                          (Optional)
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Row 2: 3 Equal Boxes */}
                  <View style={styles.portfolioRowThree}>
                    {[1, 2, 3].map((idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.portfolioRowBox}
                        onPress={uploadPortfolioImages}
                        activeOpacity={0.8}
                      >
                        <Plus size={18} color="#7C3AED" />
                        <Text style={styles.portfolioSmallBoxTitle}>Upload Image</Text>
                        <Text style={styles.portfolioUploadBoxSubtext}>(Optional)</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Row 3: 3 Equal Boxes */}
                  <View style={styles.portfolioRowThree}>
                    {[4, 5, 6].map((idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.portfolioRowBox}
                        onPress={uploadPortfolioImages}
                        activeOpacity={0.8}
                      >
                        <Plus size={18} color="#7C3AED" />
                        <Text style={styles.portfolioSmallBoxTitle}>Upload Image</Text>
                        <Text style={styles.portfolioUploadBoxSubtext}>(Optional)</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Row 4: 1 Full Width Box */}
                  <TouchableOpacity
                    style={styles.portfolioFullWidthBox}
                    onPress={uploadPortfolioImages}
                    activeOpacity={0.8}
                  >
                    <Plus size={20} color="#7C3AED" />
                    <Text style={styles.portfolioUploadBoxTitle}>Upload Image</Text>
                    <Text style={styles.portfolioUploadBoxSubtext}>(Optional)</Text>
                  </TouchableOpacity>
                </View>

                {/* Uploaded Portfolio Previews */}
                {form.portfolioImages.length > 0 && (
                  <View style={styles.uploadedImagesGrid}>
                    {form.portfolioImages.map((image, i) => (
                      <View key={i} style={styles.portfolioPreviewBox}>
                        <Image
                          source={{ uri: apiService.loadImageURI(image.uri) }}
                          style={styles.portfolioPreviewImg}
                        />
                        {image.isExisting && mode === "update" && (
                          <View style={styles.existingImageTag}>
                            <Text style={styles.existingImageTagText}>
                              Existing
                            </Text>
                          </View>
                        )}
                        <TouchableOpacity
                          style={styles.removeImageBadge}
                          onPress={() => removePortfolioImage(i)}
                        >
                          <Trash2 size={14} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                {/* Info Banner matching Image 5 */}
                <View style={styles.infoBannerBox}>
                  <View style={styles.infoIconBadge}>
                    <Info size={16} color="#7C3AED" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.infoBannerTitle}>
                      You can upload up to 10 images.
                    </Text>
                    <Text style={styles.infoBannerText}>
                      Supported formats: JPG, PNG, WebP (Max 5MB each)
                    </Text>
                  </View>
                </View>

                {/* Terms and Conditions Checkbox */}
                <View style={styles.checkboxRow}>
                  <Checkbox
                    value={form.termsAndConditions}
                    onValueChange={(v) =>
                      setForm({ ...form, termsAndConditions: v })
                    }
                    color={form.termsAndConditions ? "#6D28D9" : undefined}
                    style={styles.checkboxBox}
                  />
                  <Text style={styles.checkboxText}>
                    I agree to the{" "}
                    <Text style={styles.purpleLinkText}>Terms and Conditions</Text> and{" "}
                    <Text style={styles.purpleLinkText}>Privacy Policy</Text>
                  </Text>
                </View>

                {/* Portfolio Terms Checkbox */}
                <View style={styles.checkboxRow}>
                  <Checkbox
                    value={form.agreePortfolioTerms}
                    onValueChange={(v) =>
                      setForm({ ...form, agreePortfolioTerms: v })
                    }
                    color={form.agreePortfolioTerms ? "#6D28D9" : undefined}
                    style={styles.checkboxBox}
                  />
                  <Text style={styles.checkboxText}>
                    I accept that all the work uploaded on BirdEARNER by me is
                    authentic and belongs to me.
                  </Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.secondaryHalfButton}
                    onPress={prevStep}
                  >
                    <ArrowLeft size={18} color="#6D28D9" style={{ marginRight: 6 }} />
                    <Text style={styles.secondaryHalfButtonText}>Back</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.saveDraftButton}
                    onPress={handleSubmit}
                    disabled={isLoading}
                  >
                    <Bookmark size={18} color="#6D28D9" style={{ marginRight: 6 }} />
                    <Text style={styles.saveDraftButtonText}>Save</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.primaryHalfButton,
                      isLoading && styles.disabledButton,
                    ]}
                    onPress={handleSubmit}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <>
                        <Text style={styles.primaryHalfButtonText}>Finish</Text>
                        <ArrowRight
                          size={18}
                          color="#FFFFFF"
                          style={{ marginLeft: 6 }}
                        />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Step 6: Review & Submit */}
            {step === 6 && (
              <View style={styles.card}>
                <Text style={styles.subFieldLabel}>
                  Please review your details before final submission.
                </Text>

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.secondaryHalfButton}
                    disabled={isLoading}
                    onPress={prevStep}
                  >
                    <ArrowLeft size={18} color="#6D28D9" style={{ marginRight: 6 }} />
                    <Text style={styles.secondaryHalfButtonText}>Back</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.primaryHalfButton, isLoading && styles.disabledButton]}
                    onPress={handleSubmit}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <>
                        <Text style={styles.primaryHalfButtonText}>Submit</Text>
                        <ArrowRight size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
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
  dotMatrixLeft: {
    position: "absolute",
    left: 8,
    top: 80,
    width: 36,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    opacity: 0.18,
    zIndex: 0,
  },
  dotMatrixRight: {
    position: "absolute",
    right: 8,
    top: 260,
    width: 36,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    opacity: 0.18,
    zIndex: 0,
  },
  dotItem: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#FFFFFF",
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
    zIndex: 10,
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
  fieldHelperText: {
    fontSize: 12,
    color: "#8E8EA9",
    marginTop: 4,
    marginBottom: 12,
  },
  optionalText: {
    fontSize: 12,
    color: "#8E8EA9",
    fontWeight: "400",
  },
  sectionNumberTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F1D2B",
    marginTop: 16,
    marginBottom: 12,
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
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
  },
  checkboxBox: {
    borderRadius: 6,
    width: 20,
    height: 20,
    marginRight: 10,
  },
  checkboxText: {
    fontSize: 13,
    color: "#6E6B7B",
    flex: 1,
    lineHeight: 18,
  },
  purpleLinkText: {
    color: "#6D28D9",
    fontWeight: "600",
  },
  avatarSection: {
    alignItems: "center",
    marginVertical: 12,
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1.5,
    borderColor: "#8B5CF6",
    borderStyle: "dashed",
    backgroundColor: "#F5F0FF",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    marginBottom: 8,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 45,
  },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#6D28D9",
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  avatarSubtext: {
    fontSize: 12,
    color: "#8E8EA9",
  },
  removeImageLink: {
    marginTop: 6,
  },
  removeImageLinkText: {
    fontSize: 12,
    color: "#EF4444",
    fontWeight: "600",
  },
  gridRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  gridCol: {
    flex: 1,
  },
  freelancerTypeCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAFAFC",
    borderWidth: 1.5,
    borderColor: "#E9E3F4",
    borderRadius: 16,
    padding: 12,
    minHeight: 70,
  },
  freelancerTypeCardSelected: {
    borderColor: "#6D28D9",
    backgroundColor: "#F5F0FF",
  },
  typeIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F3E8FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  typeCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F1D2B",
  },
  typeCardSubtext: {
    fontSize: 11,
    color: "#8E8EA9",
  },
  radioGroupRow: {
    flexDirection: "row",
    gap: 16,
    marginVertical: 8,
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
    borderColor: "#D4C5ED",
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
  textareaContainer: {
    backgroundColor: "#FAFAFC",
    borderWidth: 1,
    borderColor: "#E9E3F4",
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  textareaHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  textareaHeaderLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#7C3AED",
  },
  textareaInput: {
    minHeight: 90,
    textAlignVertical: "top",
    fontSize: 14,
    color: "#1F1D2B",
  },
  textareaCharCounter: {
    fontSize: 12,
    color: "#A098AE",
    textAlign: "right",
    marginTop: 4,
  },
  langInputCardContainer: {
    backgroundColor: "#FAFAFC",
    borderWidth: 1,
    borderColor: "#E9E3F4",
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  addedLanguagesLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1F1D2B",
    marginTop: 8,
    marginBottom: 6,
  },
  smallAddButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6D28D9",
    paddingHorizontal: 14,
    borderRadius: 14,
    height: 52,
    justifyContent: "center",
  },
  smallAddButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
  tagsWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginVertical: 4,
  },
  langTagBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3E8FF",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E9E3F4",
  },
  langTagTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1F1D2B",
    marginRight: 6,
  },
  langTagLevelBox: {
    backgroundColor: "#E9D5FF",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 6,
  },
  langTagLevelText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#5B21B6",
  },
  tagRemoveBtn: {
    padding: 2,
  },
  certRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  trashIconButton: {
    width: 44,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  addDashedButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#6D28D9",
    borderStyle: "dashed",
    backgroundColor: "#FAFAFC",
    borderRadius: 14,
    height: 48,
    marginVertical: 8,
    marginBottom: 16,
  },
  addDashedButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6D28D9",
  },
  addLinkRowButton: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
    marginBottom: 16,
  },
  addLinkRowButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6D28D9",
  },
  portfolioGridContainer: {
    gap: 10,
    marginBottom: 16,
  },
  portfolioGridWrapper: {
    flexDirection: "row",
    gap: 10,
  },
  portfolioBigUploadBox: {
    flex: 1.5,
    height: 160,
    borderWidth: 1.5,
    borderColor: "#C4B5FD",
    borderStyle: "dashed",
    backgroundColor: "#FAFAFC",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  portfolioUploadBoxTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6D28D9",
    marginTop: 4,
  },
  portfolioUploadBoxSubtext: {
    fontSize: 11,
    color: "#8E8EA9",
  },
  portfolioRightCol: {
    flex: 1,
    gap: 10,
  },
  portfolioSmallUploadBox: {
    height: 75,
    borderWidth: 1.5,
    borderColor: "#C4B5FD",
    borderStyle: "dashed",
    backgroundColor: "#FAFAFC",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  portfolioSmallBoxTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6D28D9",
    marginTop: 2,
  },
  portfolioRowThree: {
    flexDirection: "row",
    gap: 10,
  },
  portfolioRowBox: {
    flex: 1,
    height: 80,
    borderWidth: 1.5,
    borderColor: "#C4B5FD",
    borderStyle: "dashed",
    backgroundColor: "#FAFAFC",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  portfolioFullWidthBox: {
    height: 70,
    borderWidth: 1.5,
    borderColor: "#C4B5FD",
    borderStyle: "dashed",
    backgroundColor: "#FAFAFC",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadedImagesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  portfolioPreviewBox: {
    width: 90,
    height: 90,
    borderRadius: 12,
    position: "relative",
  },
  portfolioPreviewImg: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  existingImageTag: {
    position: "absolute",
    bottom: 4,
    left: 4,
    backgroundColor: "#10B981",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  existingImageTagText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
  },
  removeImageBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#EF4444",
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  infoBannerBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3E8FF",
    borderRadius: 14,
    padding: 14,
    marginVertical: 12,
  },
  infoIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: "#7C3AED",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  infoBannerTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#5B21B6",
  },
  infoBannerText: {
    fontSize: 12,
    color: "#6D28D9",
    marginTop: 2,
  },
  selectedServicesContainer: {
    marginVertical: 10,
  },
  selectedServicesTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1F1D2B",
    marginBottom: 6,
  },
  purpleTagBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6D28D9",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  purpleTagText: {
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "500",
    marginRight: 6,
  },
  serviceCardItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAFAFC",
    borderWidth: 1,
    borderColor: "#E9E3F4",
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  serviceCardItemSelected: {
    borderColor: "#6D28D9",
    backgroundColor: "#F5F0FF",
  },
  serviceItemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F1D2B",
  },
  purpleTextBold: {
    color: "#6D28D9",
    fontWeight: "700",
  },
  serviceItemDesc: {
    fontSize: 12,
    color: "#8E8EA9",
    marginTop: 2,
  },
  checkboxCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "#D4C5ED",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxCircleSelected: {
    backgroundColor: "#6D28D9",
    borderColor: "#6D28D9",
  },
  noResultsBox: {
    padding: 20,
    alignItems: "center",
  },
  noResultsTitle: {
    fontSize: 14,
    color: "#8E8EA9",
  },
  primaryButton: {
    height: 52,
    backgroundColor: "#6D28D9",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
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
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  primaryHalfButton: {
    flex: 1,
    height: 52,
    backgroundColor: "#6D28D9",
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6D28D9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryHalfButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  secondaryHalfButton: {
    flex: 1,
    height: 52,
    borderWidth: 1.5,
    borderColor: "#6D28D9",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryHalfButtonText: {
    color: "#6D28D9",
    fontSize: 15,
    fontWeight: "600",
  },
  saveDraftButton: {
    flex: 1,
    height: 52,
    borderWidth: 1.5,
    borderColor: "#6D28D9",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  saveDraftButtonText: {
    color: "#6D28D9",
    fontSize: 15,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.6,
  },
  securityBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  securityBannerText: {
    fontSize: 12,
    color: "#D4C5ED",
  },
});

export default FreelancerSignup;
