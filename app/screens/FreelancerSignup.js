import React, { useState } from "react";
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
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import Checkbox from "expo-checkbox";
import Toast from "react-native-toast-message";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { z } from "zod";
import apiService from "../lib/apiService";
import { useAuth } from "../context/NewAuthContext";

const indianStates = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Lakshadweep",
  "Puducherry",
];

const schema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Confirm password is required"),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the Terms and Conditions.",
  }),
  // Make optional fields truly optional
  qualification: z.string().optional(),
  experience: z.string().optional(),
  heading: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  designation: z.string().optional(),
  bio: z.string().optional(),
  gender: z.string().optional(),
  dob: z.date().optional(),
  certifications: z.array(z.string()).optional(),
  socialLinks: z.array(z.string()).optional(),
  profileImage: z.any().optional(),
  coverImage: z.any().optional(),
  portfolioImages: z.array(z.string()).optional(),
  agreePortfolioTerms: z.boolean().optional(),
}).refine((data) => data.password === data.confirmPassword, {
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
    designation: "",
    bio: "",
    gender: "",
    dob: new Date(),
    certifications: [""],
    socialLinks: [""],
    profileImage: null,
    coverImage: null,
    portfolioImages: [],
    agreePortfolioTerms: false,
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
        const newImages = pickerResult.assets.map((asset) => asset.uri);
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
    } else {
      setStep(step + 1);
    }
  };
  const prevStep = () => setStep(step - 1);

  // Skip prompt
  const confirmSkip = () => {
    Alert.alert(
      "Skip Additional Details?",
      "You can add photos, certifications, and other details later from your profile settings.",
      [
        { text: "Complete Now", style: "cancel" },
        {
          text: "Skip for Now",
          onPress: () => setStep(5),
          style: "destructive",
        },
      ]
    );
  };

  // Final API call
  const handleSubmit = async () => {
    console.log("Triggered handleSubmit");
    
    setIsLoading(true);
    console.log("Submitting form:", form);

    // Validate with Zod
    const result = schema.safeParse(form);
    if (!result.success) {
      console.log("Validation failed:", result.error.errors);
      showToast("error", "Validation Error", result.error.errors[0].message);
      setIsLoading(false);
      return;
    }

    console.log("Form data is valid:", form);

    // Clean up the form data - remove empty strings and arrays
    const cleanedForm = {
      ...form,
      certifications: form.certifications.filter(cert => cert.trim() !== ""),
      socialLinks: form.socialLinks.filter(link => link.trim() !== ""),
    };

    console.log("Cleaned form data:", cleanedForm);

    try {
      console.log("About to call register function from AuthContext");
      
      // Use the register function from AuthContext which handles both signup and login
      const userData = await register({
        ...cleanedForm,
        role: 'FREELANCER'
      });
      
      console.log("Registration successful:", userData);
      
      if (userData) {
        showToast("success", "Signup Complete", "Welcome to BirdEarner!");
        // The AuthContext will automatically handle navigation by setting user state
        // This will cause the app to re-render with the authenticated stack
        navigation.replace("MainTabs");
      } else {
        showToast("error", "Signup Failed", "Registration failed. Please try again.");
      }
    } catch (error) {
      console.log("Registration error caught:", error);
      console.log("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      showToast("error", "Signup Failed", error.message || "Registration failed");
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
              style={styles.input}
              placeholder="Enter your full name"
              value={form.full_name}
              onChangeText={(v) => setForm({ ...form, full_name: v })}
              autoCapitalize="words"
            />
            <Text style={styles.label}>Email</Text>
            <TextInput
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
              style={styles.input}
              placeholder="Enter your password"
              value={form.password}
              onChangeText={(v) => setForm({ ...form, password: v })}
              secureTextEntry
            />
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
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
        {/* Step 2: Freelancer Details */}
        {step === 2 && (
          <View style={styles.card}>
            <Text style={styles.label}>Role/Designation</Text>
            <TextInput
              style={styles.input}
              placeholder="E.g. Designer"
              value={form.designation}
              onChangeText={(v) => setForm({ ...form, designation: v })}
            />
            <Text style={styles.label}>Highest Qualification</Text>
            <TextInput
              style={styles.input}
              placeholder="E.g. Bachelor's Degree"
              value={form.qualification}
              onChangeText={(v) => setForm({ ...form, qualification: v })}
            />
            <Text style={styles.label}>Experience (In months)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="E.g. 24"
              value={form.experience}
              onChangeText={(v) => setForm({ ...form, experience: v })}
            />
            <Text style={styles.label}>Heading on your profile</Text>
            <TextInput
              style={styles.input}
              placeholder="E.g. I am a designer"
              value={form.heading}
              onChangeText={(v) => setForm({ ...form, heading: v })}
            />
            <View style={styles.row}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>City</Text>
                <TextInput
                  style={styles.input}
                  value={form.city}
                  onChangeText={(v) => setForm({ ...form, city: v })}
                />
              </View>
              <View style={styles.dropdownContainer}>
                <Text style={styles.label}>State</Text>
                <View style={styles.dropdown}>
                  <Picker
                    selectedValue={form.state}
                    onValueChange={(v) => setForm({ ...form, state: v })}
                  >
                    <Picker.Item label="Select State" value="" />
                    {indianStates.map((state, i) => (
                      <Picker.Item key={i} label={state} value={state} />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Zip Code</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  maxLength={6}
                  value={form.zipCode}
                  onChangeText={(v) => setForm({ ...form, zipCode: v })}
                />
              </View>
              <View style={styles.dropdownContainer}>
                <Text style={styles.label}>Country</Text>
                <View style={styles.dropdown}>
                  <Picker
                    selectedValue={form.country}
                    onValueChange={(v) => setForm({ ...form, country: v })}
                  >
                    <Picker.Item label="Select Country" value="" />
                    <Picker.Item label="India" value="India" />
                  </Picker>
                </View>
              </View>
            </View>
            <Text style={styles.label}>Describe yourself</Text>
            <TextInput
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
              <TouchableOpacity style={styles.skipButton} onPress={confirmSkip}>
                <Text style={styles.skipButtonText}>Skip for Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        {/* Step 3: Personal Details */}
        {step === 3 && (
          <View style={styles.card}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.dropdown}>
              <Picker
                selectedValue={form.gender}
                onValueChange={(v) => setForm({ ...form, gender: v })}
              >
                <Picker.Item label="Select Gender" value="" />
                <Picker.Item label="Male" value="Male" />
                <Picker.Item label="Female" value="Female" />
                <Picker.Item label="Others" value="Others" />
              </Picker>
            </View>
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
                <Text>Click here to upload</Text>
              </TouchableOpacity>
              {form.profileImage && (
                <Image
                  source={{ uri: form.profileImage.uri }}
                  style={styles.profileImage}
                />
              )}
            </View>
            <Text style={styles.label}>Add your cover art</Text>
            <View style={styles.profileUploadContainer}>
              <TouchableOpacity
                onPress={() => handleImageUpload("cover")}
                style={styles.uploadButton}
              >
                <Text>Click here to upload</Text>
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
              <TouchableOpacity style={styles.skipButton} onPress={confirmSkip}>
                <Text style={styles.skipButtonText}>Skip for Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        {/* Step 4: Portfolio Upload */}
        {step === 4 && (
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
                  <Image source={{ uri: image }} style={styles.uploadedImage} />
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
              <TouchableOpacity style={styles.backButton} onPress={prevStep}>
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.nextButton} onPress={nextStep}>
                <Text style={styles.nextButtonText}>Next</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.skipButton} onPress={confirmSkip}>
                <Text style={styles.skipButtonText}>Skip for Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        {/* Step 5: Review & Submit */}
        {step === 5 && (
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
        <Toast />
      </ScrollView>
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
  skipButton: {
    width: "48%",
    height: 50,
    backgroundColor: "#9E9E9E",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  skipButtonText: {
    color: "white",
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
});

export default FreelancerSignup;
