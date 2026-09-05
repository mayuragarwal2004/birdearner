import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Checkbox from "expo-checkbox";
import Toast from "react-native-toast-message";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { MaterialIcons } from "@expo/vector-icons";
import SafeSpinner from "../components/SafeSpinner";
import { z } from "zod";
import * as LucideIcons from "lucide-react-native";

const getIcon = (name) => LucideIcons[name]?.default || LucideIcons[name];
const User = getIcon("User");
const UserCheck = getIcon("UserCheck");
const Phone = getIcon("Phone");
const Mail = getIcon("Mail");
const Lock = getIcon("Lock");
const Eye = getIcon("Eye");
const EyeOff = getIcon("EyeOff");
const Calendar = getIcon("Calendar");
const MapPin = getIcon("MapPin");
const Building = getIcon("Building");
const Map = getIcon("Map");
const Globe = getIcon("Globe");
const FileText = getIcon("FileText");
const Edit3 = getIcon("Edit3");
const Camera = getIcon("Camera");
const Trash2 = getIcon("Trash2");
const Plus = getIcon("Plus");
const ArrowLeft = getIcon("ArrowLeft");
const ArrowRight = getIcon("ArrowRight");
const Check = getIcon("Check");
const Search = getIcon("Search");
const Award = getIcon("Award");
const BookOpen = getIcon("BookOpen");
const Briefcase = getIcon("Briefcase");
const Bookmark = getIcon("Bookmark");
const Sparkles = getIcon("Sparkles");
const Laptop = getIcon("Laptop");
const Info = getIcon("Info");
const ShieldCheck = getIcon("ShieldCheck");
const X = getIcon("X");
const LinkIcon = getIcon("Link");
const GraduationCap = getIcon("GraduationCap");
const Clock = getIcon("Clock");
const ChevronDown = getIcon("ChevronDown");
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

const parseJsonField = (value, fallback) => {
  if (value === null || value === undefined) return fallback;
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
};

const normalizeFreelancerData = (data) => {
  if (!data) return data;
  return {
    ...data,
    selectedServices: parseJsonField(data.selectedServices, []),
    certifications: parseJsonField(data.certifications, []),
    socialMediaLinks: parseJsonField(data.socialMediaLinks, []),
    portfolioImages: parseJsonField(data.portfolioImages, []),
    skills: parseJsonField(data.skills, []),
    languages: parseJsonField(data.languages, []),
  };
};

const assetSchema = z.any();

// Create conditional schema based on mode
const createSchema = (mode) => {
  const baseSchema = {
    selectedServices: z.array(z.string()).optional(),
    suggestedService: z.any().optional().nullable(),
    qualification: z.string().optional(),
    experience: z.string().min(1, "Experience is required"),
    heading: z.string().optional(),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
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
    freelancerCategory: z.string().min(1, "Freelancer type is required"),
    skills: z.array(z.string()).min(1, "At least one skill is required"),
  };

  const validateServicesConstraint = (data) => {
    const totalCount = (data.selectedServices?.length || 0) + (data.suggestedService ? 1 : 0);
    return totalCount >= 1 && totalCount <= 5;
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
      })
      .refine((data) => validateServicesConstraint(data), {
        message: "Please select at least 1 service or suggest a service (maximum 5 total).",
        path: ["selectedServices"],
      });
  } else {
    return z.object(baseSchema).refine((data) => validateServicesConstraint(data), {
      message: "Please select at least 1 service or suggest a service (maximum 5 total).",
      path: ["selectedServices"],
    });
  }
};

const FreelancerSignup = ({ navigation, route }) => {
  const { register, user, userData, userProfile, refreshUserData } = useAuth();

  // Extract route params
  const {
    mobile: initialMobile,
    email: initialEmail,
    mode = "signup", // 'signup', 'create', 'update'
    profileData,
    title,
  } = route.params || {};

  const schema = createSchema(mode);
  const [step, setStep] = useState(mode === "signup" ? 1 : 2);
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const initialFreelancer = normalizeFreelancerData(profileData || userProfile || userData?.freelancer);

  const [availableServices, setAvailableServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState(
    initialFreelancer?.selectedServices || []
  );
  const [servicesLoading, setServicesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredServices, setFilteredServices] = useState([]);

  // Suggested Service State
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [suggestedServiceForm, setSuggestedServiceForm] = useState({
    serviceName: "",
    description: "",
    images: [],
  });
  const [suggestedService, setSuggestedService] = useState(null);

  // Languages & Freelancer mode state extensions
  const [workType, setWorkType] = useState("remote"); // 'remote' or 'onsite'
  const [freelancerCategory, setFreelancerCategory] = useState(initialFreelancer?.freelancerCategory || "");
  const [languageInput, setLanguageInput] = useState("");
  const [selectedProficiency, setSelectedProficiency] = useState("");
  const [languageList, setLanguageList] = useState(
    (initialFreelancer?.languages?.length ? initialFreelancer.languages : null) || [
      { name: "English", level: "Fluent" },
      { name: "Hindi", level: "Native" },
    ]
  );
  const [skillInput, setSkillInput] = useState("");
  const [skillsList, setSkillsList] = useState(initialFreelancer?.skills || []);

  const [form, setForm] = useState({
    full_name: userData?.fullName || user?.fullName || "",
    mobile: initialMobile || "",
    email: initialEmail || userData?.email || user?.email || "",
    password: "",
    confirmPassword: "",
    termsAccepted: false,
    qualification: initialFreelancer?.highestQualification || "",
    experience: initialFreelancer?.experience
      ? initialFreelancer.experience.toString()
      : "",
    heading: initialFreelancer?.profileHeading || "",
    zipCode: initialFreelancer?.zipcode
      ? initialFreelancer.zipcode.toString()
      : "",
    city: initialFreelancer?.city || "",
    state: initialFreelancer?.state || "",
    country: initialFreelancer?.country || "India",
    bio: initialFreelancer?.profileDescription || "",
    autoFilledLocation: false,
    gender: initialFreelancer?.gender || "",
    dob: initialFreelancer?.dob ? new Date(initialFreelancer.dob) : null,
    certifications: (() => {
      const raw = initialFreelancer?.certifications;
      if (!raw || (Array.isArray(raw) && raw.length === 0)) return [{ name: "", university: "", year: "" }];
      const parsed = Array.isArray(raw) ? raw : [];
      return parsed.map((c) => {
        if (typeof c === "string") return { name: c, university: "", year: "" };
        if (typeof c === "object" && c !== null) return { name: c.name || c.certification || "", university: c.university || "", year: c.year || "" };
        return { name: "", university: "", year: "" };
      });
    })(),
    socialLinks: initialFreelancer?.socialMediaLinks?.length
      ? initialFreelancer.socialMediaLinks
      : [""],
    profileImage: initialFreelancer?.profilePhoto
      ? { uri: initialFreelancer.profilePhoto, isExisting: true }
      : null,
    coverImage: initialFreelancer?.coverPhoto
      ? { uri: initialFreelancer.coverPhoto, isExisting: true }
      : null,
    portfolioImages: initialFreelancer?.portfolioImages?.length
      ? initialFreelancer.portfolioImages.map((item) => {
          const uri = typeof item === "string" ? item : item?.uri || item?.url || "";
          const isPdf = uri.toLowerCase().endsWith(".pdf") ||
            (typeof item === "object" && item?.mimeType === "application/pdf");
          return {
            uri,
            isExisting: true,
            fileType: isPdf ? "pdf" : "image",
            fileName: typeof item === "object" ? item?.fileName : uri.split("/").pop(),
            mimeType: isPdf ? "application/pdf" : undefined,
          };
        })
      : [],
    agreePortfolioTerms: initialFreelancer?.termsAccepted || false,
    termsAndConditions: mode === "update" ? (initialFreelancer?.termsAccepted || false) : false,
    selectedServices: initialFreelancer?.selectedServices || [],
    suggestedService: null,
    freelancerCategory: initialFreelancer?.freelancerCategory || "",
    skills: initialFreelancer?.skills || [],
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
    const dataSource = normalizeFreelancerData(profileData || userProfile || userData?.freelancer);
    if (mode === "update" && dataSource) {
      setForm((prevForm) => ({
        ...prevForm,
        full_name: userData?.fullName || user?.fullName || prevForm.full_name,
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
          ? dataSource.certifications.map((c) => {
              if (typeof c === "string") return { name: c, university: "", year: "" };
              if (typeof c === "object" && c !== null) return { name: c.name || c.certification || "", university: c.university || "", year: c.year || "" };
              return { name: "", university: "", year: "" };
            })
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
          ? dataSource.portfolioImages.map((item) => {
              const uri = typeof item === "string" ? item : item?.uri || item?.url || "";
              const isPdf = uri.toLowerCase().endsWith(".pdf") ||
                (typeof item === "object" && item?.mimeType === "application/pdf");
              return {
                uri,
                isExisting: true,
                fileType: isPdf ? "pdf" : "image",
                fileName: typeof item === "object" ? item?.fileName : uri.split("/").pop(),
                mimeType: isPdf ? "application/pdf" : undefined,
              };
            })
          : prevForm.portfolioImages,
        agreePortfolioTerms:
          dataSource.termsAccepted || prevForm.agreePortfolioTerms,
        termsAndConditions:
          dataSource.termsAccepted !== undefined ? dataSource.termsAccepted : prevForm.termsAndConditions,
      }));

      if (dataSource.selectedServices) {
        let parsedServices = dataSource.selectedServices;
        if (typeof parsedServices === "string") {
          try {
            parsedServices = JSON.parse(parsedServices);
          } catch (e) {
            parsedServices = [parsedServices];
          }
        }
        if (Array.isArray(parsedServices)) {
          setSelectedServices(parsedServices);
          setForm((prevForm) => ({ ...prevForm, selectedServices: parsedServices }));
        }
      }

      if (dataSource.freelancerCategory) {
        setFreelancerCategory(dataSource.freelancerCategory);
        setForm((prevForm) => ({ ...prevForm, freelancerCategory: dataSource.freelancerCategory }));
      }

      if (dataSource.skills && Array.isArray(dataSource.skills) && dataSource.skills.length > 0) {
        setSkillsList(dataSource.skills);
        setForm((prevForm) => ({ ...prevForm, skills: dataSource.skills }));
      }

      if (dataSource.languages && Array.isArray(dataSource.languages) && dataSource.languages.length > 0) {
        setLanguageList(dataSource.languages);
      }
    }
  }, [mode, user?.id, userProfile, userData, profileData]);

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

  const MAX_PORTFOLIO_SIZE = 10 * 1024 * 1024; // 10MB

  const isPdfFile = (asset) => {
    const uri = asset?.uri || "";
    const mime = asset?.mimeType || asset?.type || "";
    return (
      uri.toLowerCase().endsWith(".pdf") ||
      mime === "application/pdf"
    );
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const uploadPortfolioImages = async () => {
    try {
      Alert.alert(
        "Add Portfolio",
        "Choose upload type",
        [
          {
            text: "Images",
            onPress: async () => {
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
                const validAssets = [];
                for (const asset of pickerResult.assets) {
                  if (asset.fileSize && asset.fileSize > MAX_PORTFOLIO_SIZE) {
                    showToast(
                      "error",
                      "File Too Large",
                      `${asset.fileName || "Image"} exceeds 10MB (${formatFileSize(asset.fileSize)})`
                    );
                    continue;
                  }
                  validAssets.push({ ...asset, isExisting: false, fileType: "image" });
                }
                if (validAssets.length > 0) {
                  setForm({
                    ...form,
                    portfolioImages: [...form.portfolioImages, ...validAssets],
                  });
                }
              }
            },
          },
          {
            text: "PDF",
            onPress: async () => {
              const docResult = await DocumentPicker.getDocumentAsync({
                type: "application/pdf",
                multiple: true,
                copyToCacheDirectory: true,
              });
              if (!docResult.canceled && docResult.assets?.length > 0) {
                const validAssets = [];
                for (const asset of docResult.assets) {
                  if (asset.size && asset.size > MAX_PORTFOLIO_SIZE) {
                    showToast(
                      "error",
                      "File Too Large",
                      `${asset.name || "PDF"} exceeds 10MB (${formatFileSize(asset.size)})`
                    );
                    continue;
                  }
                  validAssets.push({
                    uri: asset.uri,
                    fileName: asset.name || "document.pdf",
                    mimeType: "application/pdf",
                    fileSize: asset.size,
                    isExisting: false,
                    fileType: "pdf",
                  });
                }
                if (validAssets.length > 0) {
                  setForm({
                    ...form,
                    portfolioImages: [...form.portfolioImages, ...validAssets],
                  });
                }
              }
            },
          },
          { text: "Cancel", style: "cancel" },
        ]
      );
    } catch (error) {
      showToast("error", "Error", `Failed to pick file: ${error.message}`);
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
    setForm({ ...form, certifications: [...form.certifications, { name: "", university: "", year: "" }] });

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

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed) {
      showToast("error", "Skill Required", "Please enter a skill name");
      return;
    }
    if (skillsList.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      showToast("info", "Duplicate Skill", "This skill is already added");
      return;
    }
    if (skillsList.length >= 10) {
      showToast("info", "Limit Reached", "You can add up to 10 skills");
      return;
    }
    setSkillsList([...skillsList, trimmed]);
    setSkillInput("");
  };

  const removeSkill = (index) => {
    setSkillsList(skillsList.filter((_, i) => i !== index));
  };

  const handlePickSuggestedImage = async () => {
    if ((suggestedServiceForm.images || []).length >= 3) {
      showToast("info", "Limit Reached", "You can upload up to 3 images for a suggested service");
      return;
    }
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        showToast("error", "Permission Denied", "Grant access to photos.");
        return;
      }
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsMultipleSelection: false,
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (!pickerResult.canceled && pickerResult.assets?.length > 0) {
        setSuggestedServiceForm((prev) => ({
          ...prev,
          images: [...(prev.images || []), pickerResult.assets[0]],
        }));
      }
    } catch (e) {
      showToast("error", "Error", "Failed to pick image");
    }
  };

  const handleRemoveSuggestedImage = (index) => {
    setSuggestedServiceForm((prev) => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== index),
    }));
  };

  const handleRemoveSuggestedService = () => {
    setSuggestedService(null);
    setForm((prev) => ({ ...prev, suggestedService: null }));
  };

  const handleSubmitSuggestionModal = () => {
    if (!suggestedServiceForm.serviceName.trim()) {
      showToast("error", "Service Name Required", "Please enter a service name");
      return;
    }
    const currentCount = selectedServices.length;
    if (currentCount >= 5) {
      showToast("info", "Limit Reached", "You can select/suggest maximum 5 services total");
      return;
    }

    const suggestionObj = {
      serviceName: suggestedServiceForm.serviceName.trim(),
      description: suggestedServiceForm.description.trim(),
      images: suggestedServiceForm.images || [],
    };

    setSuggestedService(suggestionObj);
    setForm((prev) => ({ ...prev, suggestedService: suggestionObj }));
    setShowSuggestModal(false);
    showToast("success", "Service Suggested", "Your service suggestion has been added!");
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
    const dataSource = normalizeFreelancerData(profileData || userProfile || userData?.freelancer);
    if (mode === "update" && dataSource?.selectedServices) {
      setSelectedServices(dataSource.selectedServices);
    }
  }, [mode, profileData, userProfile, userData]);

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
      const totalCount = selectedServices.length + (suggestedService ? 1 : 0);
      if (totalCount < 5) {
        const newSelected = [...selectedServices, serviceId];
        setSelectedServices(newSelected);
        setForm({ ...form, selectedServices: newSelected });
      } else {
        showToast("info", "Limit Reached", "You can select maximum 5 services total");
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
      const totalCount = selectedServices.length + (suggestedService ? 1 : 0);
      if (totalCount === 0) {
        showToast(
          "error",
          "Services Required",
          "Please select at least one service or suggest a service you want to offer"
        );
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!freelancerCategory) {
        showToast("error", "Freelancer Type Required", "Please select your freelancer type");
        return;
      }
      if (!form.experience || form.experience.trim() === "") {
        showToast("error", "Experience Required", "Please enter your experience in months");
        return;
      }
      if (!form.city || form.city.trim() === "") {
        showToast("error", "City Required", "Please enter your city");
        return;
      }
      if (!form.state || form.state.trim() === "") {
        showToast("error", "State Required", "Please enter your state");
        return;
      }
      if (skillsList.length === 0) {
        showToast("error", "Skills Required", "Please add at least one skill");
        return;
      }
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

    if (mode !== "update") {
      const formToValidate = {
        ...form,
        freelancerCategory,
        skills: skillsList,
      };
      const result = schema.safeParse(formToValidate);
      if (!result.success) {
        setIsLoading(false);
        showToast("error", "Validation Error", result.error.errors[0].message);
        return;
      }
    }

    const cleanedForm = {
      ...form,
      freelancerCategory,
      skills: skillsList,
      languages: languageList,
      certifications: form.certifications.filter((cert) => cert.name?.trim() !== "" || cert.university?.trim() !== ""),
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
      let uploadedFiles = [];
      for (let i = 0; i < cleanedForm.portfolioImages.length; i++) {
        const portfolioItem = cleanedForm.portfolioImages[i];

        if (portfolioItem.isExisting) {
          uploadedFiles.push(portfolioItem.uri);
        } else if (
          portfolioItem.uri &&
          !portfolioItem.uri.startsWith("http") &&
          !portfolioItem.uri.startsWith("/uploads")
        ) {
          const formData = new FormData();
          const isPdf = portfolioItem.fileType === "pdf" || isPdfFile(portfolioItem);
          const fileName = portfolioItem.fileName || (isPdf ? `portfolio_${Date.now()}.pdf` : `portfolio_${Date.now()}.jpg`);
          const mimeType = portfolioItem.mimeType || (isPdf ? "application/pdf" : "image/jpeg");

          formData.append("file", {
            uri: portfolioItem.uri,
            type: mimeType,
            name: fileName,
          });
          formData.append("category", "freelancer_portfolios");

          try {
            const response = await fetch(
              `${apiService.baseURL}/upload?category=freelancer_portfolios`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${apiService.token}`,
                  Accept: "application/json",
                },
                body: formData,
              }
            );
            const data = await response.json();
            if (response.ok && data.data?.url) {
              uploadedFiles.push(data.data.url);
            } else {
              showToast("error", "Upload Failed", data.message || `Failed to upload ${fileName}`);
              setIsLoading(false);
              return;
            }
          } catch (uploadError) {
            showToast("error", "Upload Failed", uploadError.message);
            setIsLoading(false);
            return;
          }
        }
      }
      cleanedForm.portfolioImages = uploadedFiles;
    } else {
      cleanedForm.portfolioImages = [];
    }

    try {
      let result;

      const activeSuggested = form.suggestedService || suggestedService;
      let uploadedSuggestedImages = [];
      if (activeSuggested && activeSuggested.images && activeSuggested.images.length > 0) {
        for (const img of activeSuggested.images) {
          if (typeof img === "object" && img.uri && !img.uri.startsWith("http")) {
            const uploadRes = await apiService.uploadImage(img, "freelancer_portfolios");
            if (uploadRes.success) {
              uploadedSuggestedImages.push(uploadRes.url);
            }
          } else if (typeof img === "string") {
            uploadedSuggestedImages.push(img);
          }
        }
      }

      const suggestedServicePayload = activeSuggested ? {
        serviceName: activeSuggested.serviceName,
        description: activeSuggested.description || "",
        images: uploadedSuggestedImages,
      } : null;

      if (mode === "signup") {
        result = await register({
          ...cleanedForm,
          mobile: form.mobile,
          suggestedService: suggestedServicePayload,
          termsAccepted: form.termsAndConditions !== undefined ? form.termsAndConditions : (form.termsAccepted !== undefined ? form.termsAccepted : true),
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
          suggestedService: suggestedServicePayload,
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
          freelancerCategory: cleanedForm.freelancerCategory,
          skills: cleanedForm.skills,
          languages: cleanedForm.languages,
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
          suggestedService: suggestedServicePayload,
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
          freelancerCategory: cleanedForm.freelancerCategory,
          skills: cleanedForm.skills,
          languages: cleanedForm.languages,
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

        const freelancerIdToUpdate = profileData?.id || userProfile?.id || userData?.freelancer?.id;
        result = await apiService.updateFreelancerProfile(
          freelancerIdToUpdate,
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
                    onChangeText={(v) => setForm({ ...form, mobile: v })}
                    keyboardType="phone-pad"
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
                    <SafeSpinner color="white" size="small" />
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
                  <SafeSpinner
                    size="large"
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

                {suggestedService && (
                  <View style={styles.suggestedBadgeCard}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Sparkles size={14} color="#6D28D9" />
                        <Text style={styles.suggestedBadgeTitle}>
                          Suggested: {suggestedService.serviceName}
                        </Text>
                      </View>
                      <Text style={styles.suggestedBadgeSubtitle}>
                        Pending Super Admin Approval
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={handleRemoveSuggestedService}
                      style={styles.tagRemoveBtn}
                    >
                      <X size={12} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.suggestServiceTriggerBtn}
                  onPress={() => setShowSuggestModal(true)}
                  activeOpacity={0.8}
                >
                  <Sparkles size={16} color="#6D28D9" style={{ marginRight: 6 }} />
                  <Text style={styles.suggestServiceTriggerText}>
                    Can't find your service? Suggest a Service
                  </Text>
                </TouchableOpacity>

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
                      (selectedServices.length === 0 && !suggestedService) && styles.disabledButton,
                    ]}
                    onPress={nextStep}
                    disabled={selectedServices.length === 0 && !suggestedService}
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
                <Text style={styles.sectionNumberTitle}>2. Choose Freelancer Type <Text style={styles.requiredText}>*</Text></Text>
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
                  3. Select Your Freelancer Type <Text style={styles.requiredText}>*</Text>
                </Text>
                <PickerModal
                  items={FREELANCER_TYPE_OPTIONS}
                  value={freelancerCategory}
                  onValueChange={(v) => {
                    setFreelancerCategory(v);
                    setForm({ ...form, freelancerCategory: v });
                  }}
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
                <Text style={styles.sectionNumberTitle}>7. Experience (in months) <Text style={styles.requiredText}>*</Text></Text>
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
                <Text style={styles.sectionNumberTitle}>8. Your Location <Text style={styles.requiredText}>*</Text></Text>
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
                <Text style={styles.sectionNumberTitle}>10. Skills <Text style={styles.requiredText}>*</Text></Text>
                <View style={styles.gridRow}>
                  <View style={[styles.gridCol, { flex: 1.3 }]}>
                    <View style={styles.inputContainer}>
                      <View style={styles.iconBox}>
                        <Search size={20} color="#7C3AED" />
                      </View>
                      <TextInput
                        style={styles.textInput}
                        placeholderTextColor="#A098AE"
                        placeholder="Search or add your skills"
                        value={skillInput}
                        onChangeText={setSkillInput}
                        onSubmitEditing={addSkill}
                      />
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.smallAddButton}
                    onPress={addSkill}
                    activeOpacity={0.85}
                  >
                    <Plus size={16} color="#FFFFFF" />
                    <Text style={styles.smallAddButtonText}>Add</Text>
                  </TouchableOpacity>
                </View>
                {skillsList.length > 0 && (
                  <View style={styles.tagsWrapper}>
                    {skillsList.map((skill, idx) => (
                      <View key={idx} style={styles.langTagBadge}>
                        <Text style={styles.langTagTitle}>{skill}</Text>
                        <TouchableOpacity
                          onPress={() => removeSkill(idx)}
                          style={styles.tagRemoveBtn}
                        >
                          <X size={12} color="#6D28D9" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
                <Text style={styles.fieldHelperText}>
                  Add multiple skills that describe your expertise.
                </Text>

                {/* 11. Certifications */}
                <Text style={styles.sectionNumberTitle}>11. Certifications</Text>
                {form.certifications.map((cert, i) => (
                  <View key={i} style={styles.certBlock}>
                    <View style={styles.certTopRow}>
                      <View style={[styles.gridCol, { flex: 1 }]}>
                        <View style={styles.inputContainer}>
                          <View style={styles.iconBox}>
                            <Award size={20} color="#7C3AED" />
                          </View>
                          <TextInput
                            placeholderTextColor="#A098AE"
                            style={styles.textInput}
                            placeholder="Certificate name"
                            value={cert.name || ""}
                            onChangeText={(v) =>
                              setForm({
                                ...form,
                                certifications: form.certifications.map((c, idx) =>
                                  idx === i ? { ...c, name: v } : c
                                ),
                              })
                            }
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

                    <View style={styles.certBottomRow}>
                      <View style={[styles.gridCol, { flex: 1 }]}>
                        <View style={styles.inputContainer}>
                          <View style={styles.iconBox}>
                            <Building size={20} color="#7C3AED" />
                          </View>
                          <TextInput
                            placeholderTextColor="#A098AE"
                            style={styles.textInput}
                            placeholder="University / Institute"
                            value={cert.university || ""}
                            onChangeText={(v) =>
                              setForm({
                                ...form,
                                certifications: form.certifications.map((c, idx) =>
                                  idx === i ? { ...c, university: v } : c
                                ),
                              })
                            }
                          />
                        </View>
                      </View>

                      <View style={[styles.gridCol, { flex: 0.5 }]}>
                        <View style={styles.inputContainer}>
                          <View style={styles.iconBox}>
                            <Calendar size={20} color="#7C3AED" />
                          </View>
                          <TextInput
                            placeholderTextColor="#A098AE"
                            style={styles.textInput}
                            placeholder="Year"
                            keyboardType="numeric"
                            value={cert.year || ""}
                            onChangeText={(v) =>
                              setForm({
                                ...form,
                                certifications: form.certifications.map((c, idx) =>
                                  idx === i ? { ...c, year: v } : c
                                ),
                              })
                            }
                          />
                        </View>
                      </View>
                    </View>
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

                  {mode !== "signup" && (
                    <TouchableOpacity
                      style={styles.saveDraftButton}
                      onPress={handleSubmit}
                      disabled={isLoading}
                    >
                      <Bookmark size={18} color="#6D28D9" style={{ marginRight: 6 }} />
                      <Text style={styles.saveDraftButtonText}>Save</Text>
                    </TouchableOpacity>
                  )}

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

            {/* Step 5: Add Your Portfolio */}
            {step === 5 && (
              <View style={styles.card}>
                <View style={styles.portfolioGridContainer}>
                  {/* Helper: render a box that shows preview or empty state */}
                  {(() => {
                    const files = form.portfolioImages || [];
                    const renderBox = (file, style, titleStyle) => {
                      if (file) {
                        const isPdf = file.fileType === "pdf";
                        return (
                          <View style={[style, { borderWidth: 0, backgroundColor: "#F5F0FF", overflow: "hidden" }]}>
                            {isPdf ? (
                              <View style={{ alignItems: "center", justifyContent: "center", flex: 1, width: "100%", paddingHorizontal: 4 }}>
                                <MaterialIcons name="picture-as-pdf" size={28} color="#EF4444" />
                                <Text style={[styles.portfolioSmallBoxTitle, { marginTop: 4, textAlign: "center" }]} numberOfLines={2}>
                                  {file.fileName || "PDF"}
                                </Text>
                              </View>
                            ) : (
                              <Image
                                source={{ uri: apiService.loadImageURI(file.uri) }}
                                style={{ width: "100%", height: "100%", borderRadius: 14 }}
                                resizeMode="cover"
                              />
                            )}
                            {file.isExisting && mode === "update" && (
                              <View style={styles.existingImageTag}>
                                <Text style={styles.existingImageTagText}>Existing</Text>
                              </View>
                            )}
                            <TouchableOpacity
                              style={styles.removeImageBadge}
                              onPress={() => {
                                const idx = files.indexOf(file);
                                if (idx !== -1) removePortfolioImage(idx);
                              }}
                            >
                              <Trash2 size={14} color="#FFFFFF" />
                            </TouchableOpacity>
                          </View>
                        );
                      }
                      return (
                        <TouchableOpacity style={style} onPress={uploadPortfolioImages} activeOpacity={0.8}>
                          <Plus size={titleStyle === styles.portfolioUploadBoxTitle ? 26 : 18} color="#7C3AED" />
                          <Text style={titleStyle}>Upload File</Text>
                          <Text style={styles.portfolioUploadBoxSubtext}>Image or PDF</Text>
                        </TouchableOpacity>
                      );
                    };

                    const bigBoxFile = files[0] || null;
                    const smallBox1File = files[1] || null;
                    const smallBox2File = files[2] || null;
                    const row2Files = [files[3] || null, files[4] || null, files[5] || null];
                    const row3Files = [files[6] || null, files[7] || null, files[8] || null];
                    const fullWidthFile = files[9] || null;

                    return (
                      <>
                        {/* Top Row: Left big box + Right 2 stacked small boxes */}
                        <View style={styles.portfolioGridWrapper}>
                          {renderBox(bigBoxFile, styles.portfolioBigUploadBox, styles.portfolioUploadBoxTitle)}
                          <View style={styles.portfolioRightCol}>
                            {renderBox(smallBox1File, styles.portfolioSmallUploadBox, styles.portfolioSmallBoxTitle)}
                            {renderBox(smallBox2File, styles.portfolioSmallUploadBox, styles.portfolioSmallBoxTitle)}
                          </View>
                        </View>

                        {/* Row 2: 3 Equal Boxes */}
                        <View style={styles.portfolioRowThree}>
                          {row2Files.map((f, i) => (
                            <React.Fragment key={`row2-${i}`}>
                              {renderBox(f, styles.portfolioRowBox, styles.portfolioSmallBoxTitle)}
                            </React.Fragment>
                          ))}
                        </View>

                        {/* Row 3: 3 Equal Boxes */}
                        <View style={styles.portfolioRowThree}>
                          {row3Files.map((f, i) => (
                            <React.Fragment key={`row3-${i}`}>
                              {renderBox(f, styles.portfolioRowBox, styles.portfolioSmallBoxTitle)}
                            </React.Fragment>
                          ))}
                        </View>

                        {/* Row 4: 1 Full Width Box */}
                        {renderBox(fullWidthFile, styles.portfolioFullWidthBox, styles.portfolioUploadBoxTitle)}

                        {/* Additional upload buttons if more than 10 files */}
                        {files.length > 10 && (
                          <View style={styles.portfolioRowThree}>
                            {files.slice(10).map((f, i) => (
                              <React.Fragment key={`extra-${i}`}>
                                {renderBox(f, styles.portfolioRowBox, styles.portfolioSmallBoxTitle)}
                              </React.Fragment>
                            ))}
                          </View>
                        )}
                      </>
                    );
                  })()}
                </View>

                {/* Info Banner */}
                <View style={styles.infoBannerBox}>
                  <View style={styles.infoIconBadge}>
                    <Info size={16} color="#7C3AED" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.infoBannerTitle}>
                      Upload images or PDF documents.
                    </Text>
                    <Text style={styles.infoBannerText}>
                      Supported: JPG, PNG, WebP, PDF (Max 10MB each)
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

                  {mode === "signup" ? (
                    <TouchableOpacity
                      style={[
                        styles.primaryHalfButton,
                        isLoading && styles.disabledButton,
                      ]}
                      onPress={handleSubmit}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <SafeSpinner color="white" size="small" />
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
                  ) : (
                    <TouchableOpacity
                      style={styles.saveDraftButton}
                      onPress={handleSubmit}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <SafeSpinner color="#6D28D9" size="small" />
                      ) : (
                        <>
                          <Bookmark size={18} color="#6D28D9" style={{ marginRight: 6 }} />
                          <Text style={styles.saveDraftButtonText}>Save</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
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
                      <SafeSpinner color="white" size="small" />
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

      {/* Suggest Service Modal */}
      <Modal
        visible={showSuggestModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSuggestModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Sparkles size={20} color="#6D28D9" />
                <Text style={styles.modalTitle}>Suggest a New Service</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowSuggestModal(false)}
                style={styles.modalCloseBtn}
              >
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalInputLabel}>Service Name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. AI Prompt Engineering, Video Editing..."
                placeholderTextColor="#A098AE"
                value={suggestedServiceForm.serviceName}
                onChangeText={(text) =>
                  setSuggestedServiceForm((prev) => ({ ...prev, serviceName: text }))
                }
              />

              <Text style={styles.modalInputLabel}>Description (Optional)</Text>
              <TextInput
                style={[styles.modalInput, { height: 80, textAlignVertical: "top" }]}
                placeholder="Briefly describe what this service involves..."
                placeholderTextColor="#A098AE"
                multiline={true}
                numberOfLines={3}
                value={suggestedServiceForm.description}
                onChangeText={(text) =>
                  setSuggestedServiceForm((prev) => ({ ...prev, description: text }))
                }
              />

              <Text style={styles.modalInputLabel}>Images / Samples (Up to 3)</Text>
              <View style={styles.suggestImagesRow}>
                {(suggestedServiceForm.images || []).map((img, idx) => (
                  <View key={idx} style={styles.suggestImageThumbWrapper}>
                    <Image source={{ uri: img.uri }} style={styles.suggestImageThumb} />
                    <TouchableOpacity
                      style={styles.suggestImageRemoveBtn}
                      onPress={() => handleRemoveSuggestedImage(idx)}
                    >
                      <X size={12} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}
                {(suggestedServiceForm.images || []).length < 3 && (
                  <TouchableOpacity
                    style={styles.suggestImageAddBtn}
                    onPress={handlePickSuggestedImage}
                  >
                    <Plus size={20} color="#6D28D9" />
                    <Text style={{ fontSize: 11, color: "#6D28D9", marginTop: 2 }}>Add</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowSuggestModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSubmitSuggestionModal}
              >
                <Text style={styles.modalSubmitText}>Submit Suggestion</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 16,
    marginTop: Platform.OS === "android" ? (StatusBar.currentHeight || 24) + 8 : 16,
  },
  headerNavSection: {
    alignItems: "center",
    marginBottom: 16,
    marginTop: Platform.OS === "android" ? (StatusBar.currentHeight || 24) + 8 : 16,
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
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#D4C5ED",
    textAlign: "center",
    lineHeight: 18,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1F1D2B",
    marginBottom: 5,
  },
  subFieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1F1D2B",
    marginTop: 6,
    marginBottom: 6,
  },
  fieldHelperText: {
    fontSize: 11.5,
    color: "#8E8EA9",
    marginTop: 3,
    marginBottom: 10,
  },
  optionalText: {
    fontSize: 12,
    color: "#8E8EA9",
    fontWeight: "400",
  },
  sectionNumberTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#1F1D2B",
    marginTop: 12,
    marginBottom: 10,
  },
  requiredText: {
    color: "#EF4444",
    fontSize: 13.5,
    fontWeight: "700",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAFAFC",
    borderWidth: 1,
    borderColor: "#E9E3F4",
    borderRadius: 12,
    paddingHorizontal: 8,
    minHeight: 48,
    marginBottom: 14,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F3E8FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  countryCodeBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 6,
    marginRight: 6,
    borderRightWidth: 1,
    borderRightColor: "#E9E3F4",
  },
  countryFlag: {
    fontSize: 15,
    marginRight: 4,
  },
  countryCodeText: {
    fontSize: 13.5,
    fontWeight: "600",
    color: "#1F1D2B",
  },
  textInput: {
    flex: 1,
    fontSize: 13.5,
    color: "#1F1D2B",
    paddingVertical: 8,
  },
  eyeIconButton: {
    padding: 6,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  checkboxBox: {
    borderRadius: 5,
    width: 18,
    height: 18,
    marginRight: 8,
  },
  checkboxText: {
    fontSize: 12.5,
    color: "#6E6B7B",
    flex: 1,
    lineHeight: 17,
  },
  purpleLinkText: {
    color: "#6D28D9",
    fontWeight: "600",
  },
  avatarSection: {
    alignItems: "center",
    marginVertical: 10,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    borderColor: "#8B5CF6",
    borderStyle: "dashed",
    backgroundColor: "#F5F0FF",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    marginBottom: 6,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 40,
  },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#6D28D9",
    width: 24,
    height: 24,
    borderRadius: 12,
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
    flexWrap: "wrap",
    gap: 14,
    marginVertical: 6,
    marginBottom: 14,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
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
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#6D28D9",
  },
  radioLabelText: {
    fontSize: 13,
    color: "#1F1D2B",
    fontWeight: "500",
    flexShrink: 1,
  },
  textareaContainer: {
    backgroundColor: "#FAFAFC",
    borderWidth: 1,
    borderColor: "#E9E3F4",
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
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
  certBlock: {
    marginBottom: 8,
  },
  certTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  certBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
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
    overflow: "hidden",
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
    overflow: "hidden",
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
    overflow: "hidden",
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
    overflow: "hidden",
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
    overflow: "hidden",
    backgroundColor: "#F5F0FF",
  },
  portfolioPreviewImg: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  pdfPreviewContainer: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    justifyContent: "center",
    alignItems: "center",
    padding: 4,
  },
  pdfPreviewName: {
    fontSize: 9,
    color: "#EF4444",
    fontWeight: "600",
    textAlign: "center",
    marginTop: 2,
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
    height: 48,
    backgroundColor: "#6D28D9",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
    shadowColor: "#6D28D9",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14.5,
    fontWeight: "600",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  primaryHalfButton: {
    flex: 1,
    height: 48,
    backgroundColor: "#6D28D9",
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6D28D9",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryHalfButtonText: {
    color: "#FFFFFF",
    fontSize: 14.5,
    fontWeight: "600",
  },
  secondaryHalfButton: {
    flex: 1,
    height: 48,
    borderWidth: 1.5,
    borderColor: "#6D28D9",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryHalfButtonText: {
    color: "#6D28D9",
    fontSize: 14.5,
    fontWeight: "600",
  },
  saveDraftButton: {
    flex: 1,
    height: 48,
    borderWidth: 1.5,
    borderColor: "#6D28D9",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  saveDraftButtonText: {
    color: "#6D28D9",
    fontSize: 14.5,
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
  suggestedBadgeCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F3E8FF",
    borderWidth: 1,
    borderColor: "#C084FC",
    borderRadius: 12,
    padding: 12,
    marginVertical: 10,
  },
  suggestedBadgeTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6D28D9",
  },
  suggestedBadgeSubtitle: {
    fontSize: 12,
    color: "#7E22CE",
    marginTop: 2,
  },
  suggestServiceTriggerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#DDD6FE",
    borderStyle: "dashed",
    backgroundColor: "#FAF5FF",
    marginVertical: 10,
  },
  suggestServiceTriggerText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6D28D9",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    maxHeight: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
  },
  modalInputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
    marginTop: 12,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1E293B",
  },
  suggestImagesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 6,
    marginBottom: 14,
  },
  suggestImageThumbWrapper: {
    position: "relative",
    width: 64,
    height: 64,
    borderRadius: 10,
    overflow: "hidden",
  },
  suggestImageThumb: {
    width: "100%",
    height: "100%",
  },
  suggestImageRemoveBtn: {
    position: "absolute",
    top: 3,
    right: 3,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  suggestImageAddBtn: {
    width: 64,
    height: 64,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#DDD6FE",
    borderStyle: "dashed",
    backgroundColor: "#FAF5FF",
    alignItems: "center",
    justifyContent: "center",
  },
  modalFooter: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  modalCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  modalSubmitBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#6D28D9",
    alignItems: "center",
    justifyContent: "center",
  },
  modalSubmitText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

export default FreelancerSignup;
