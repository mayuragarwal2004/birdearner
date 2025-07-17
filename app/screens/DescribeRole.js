import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import Toast from "react-native-toast-message";
import { Picker } from "@react-native-picker/picker";
// import { ID, Query } from "react-native-appwrite";
import { useAuth } from "../context/NewAuthContext";
// import { useAppwrite } from "../context/AppwriteContext";
import apiService from "../lib/apiService";
import { updateRoleProfileStatus } from "../lib/profileStatusStorage";
import { freelance_service, household_service } from "../lib/roleData";

const DescribeRole = ({ navigation, route }) => {
  // const { account, appwriteConfig, databases } = useAppwrite();
  let {
    // fullName = "",
    // email = "",
    // role = "",
    // password = "",
  } = route.params || {};
  const { user, refreshUserData } = useAuth(); // Added refreshUserData
  const { role, fullName, email } = user;
  console.log(`[mayur-data-role] 
    role: ${role}
    fullName: ${fullName}
    email: ${email}
    `);

  const [formData, setFormData] = useState({
    qualification: "",
    experience: "",
    heading: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    designation: "",
    bio: "",
    designations: [],
  });
  const [services, setServices] = useState([]);
  const [serviceObjects, setServiceObjects] = useState([]); // Store full service objects with imageUrl
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [servicesError, setServicesError] = useState(null);
  
  // States for existing profile data
  const [existingProfile, setExistingProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  
  // Skip functionality states
  const [showSkipOption, setShowSkipOption] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [glitchCount, setGlitchCount] = useState(0);

  // useEffect(() => {
  //   checkUserSession();
  // }, []);

  // List of Indian states
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

  const showToast = (type, message) => {
    Toast.show({
      type,
      text1: type === "success" ? "Success" : "Error",
      text2: message,
    });
  };
  console.log({ user });

  // Helper function to get full service details by name (for future image display)
  const getServiceByName = (serviceName) => {
    return serviceObjects.find(service => service.name === serviceName);
  };

  // Skip functionality methods
  const handleSkipPhase = async () => {
    try {
      setIsSkipping(true);
      
      // Record the skip using the new profile status storage
      await updateRoleProfileStatus(role, { phase1skipped: true });
      
      showToast("info", "Phase 1 skipped. You can complete it later from your profile.");
      
      // Navigate to next phase or main app
      setTimeout(() => {
        setIsNavigating(true);
        navigation.replace("TellUsAboutYou", { role, skipped: true });
      }, 1500);
      
    } catch (error) {
      console.error('Error handling skip:', error);
      showToast("error", "Failed to skip. Please try again.");
    } finally {
      setIsSkipping(false);
    }
  };

  const handleGlitchRecovery = async (errorMessage) => {
    try {
      setGlitchCount(glitchCount + 1);
      
      // Show skip option if multiple glitches detected
      if (glitchCount >= 2 && !showSkipOption) {
        setShowSkipOption(true);
        Alert.alert(
          "Having trouble?",
          "It seems you're experiencing some technical difficulties. Would you like to skip this step for now and complete it later?",
          [
            { text: "Keep Trying", style: "cancel" },
            { text: "Skip for Now", onPress: () => handleSkipPhase() }
          ]
        );
      }
    } catch (error) {
      console.error('Error in glitch recovery:', error);
    }
  };

  const confirmSkip = () => {
    Alert.alert(
      "Skip Profile Setup?",
      "You can complete your profile later from the settings. This will help other users find and connect with you better.",
      [
        { text: "Complete Now", style: "cancel" },
        { text: "Skip for Now", onPress: handleSkipPhase, style: "destructive" }
      ]
    );
  };

  // Fetch existing profile data for the user and role
  const fetchExistingProfile = async () => {
    try {
      setIsLoadingProfile(true);
      console.log(`Fetching existing ${role} profile for user:`, user.id);
      
      await apiService.init();
      
      let profileData = null;
      if (role === "CLIENT") {
        profileData = await apiService.getClientProfile(user.id);
      } else if (role === "FREELANCER") {
        profileData = await apiService.getFreelancerProfile(user.id);
      }
      
      if (profileData) {
        console.log("Existing profile found:", profileData);
        setExistingProfile(profileData);
        setIsUpdating(true);
        
        // Auto-fill form with existing data
        setFormData({
          qualification: profileData.highestQualification || "",
          experience: profileData.experience ? profileData.experience.toString() : "",
          heading: profileData.profileHeading || profileData.companyName || "",
          city: profileData.city || "",
          state: profileData.state || "",
          zipCode: profileData.zipcode ? profileData.zipcode.toString() : "",
          country: profileData.country || "",
          designation: role === "CLIENT" ? profileData.organizationType || "" : "",
          bio: profileData.profileDescription || "",
          designations: Array.isArray(profileData.roleDesignation) ? profileData.roleDesignation : [],
        });
        
        showToast("info", `Existing ${role.toLowerCase()} profile loaded`);
      } else {
        console.log("No existing profile found, creating new profile");
        setIsUpdating(false);
      }
    } catch (error) {
      console.log("No existing profile found or error:", error.message);
      setExistingProfile(null);
      setIsUpdating(false);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleInputChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    // addRole();
  };

  const addRole = () => {
    if (formData?.designation) {
      setFormData((prev) => ({
        ...prev,
        designations: [...prev.designations, prev.designation],
        designation: "",
      }));
    } else {
      showToast("info", "Please select a designation to add.");
    }
  };

  const validateForm = () => {
    const requiredFields =
      role === "CLIENT"
        ? ["designation", "city", "state", "zipCode", "country", "bio"]
        : [
            "designations",
            "qualification",
            "experience",
            "heading",
            "city",
            "state",
            "zipCode",
            "country",
          ];

    for (const field of requiredFields) {
      console.log(formData[field]);

      if (
        !formData[field] ||
        (Array.isArray(formData[field]) && !formData[field].length)
      ) {
        showToast("info", `All fields are required. Problem with ${field}`);
        return false;
      }
    }
    return true;
  };

  const saveDetails = async () => {
    if (!validateForm()) return;

    try {
      // Get current user from context
      if (!user || !user.id) {
        showToast("error", "User not authenticated");
        return;
      }

      // Prepare payload for create vs update
      const basePayload = role === "CLIENT"
        ? {
            organizationType: formData.designation,
            companyName: formData.heading,
            city: formData.city,
            state: formData.state,
            zipcode: parseInt(formData.zipCode) || 0,
            country: formData.country,
            profileDescription: formData.bio,
          }
        : {
            roleDesignation: formData.designations,
            highestQualification: formData.qualification,
            experience: parseInt(formData.experience) || 0,
            profileHeading: formData.heading,
            city: formData.city,
            state: formData.state,
            zipcode: parseInt(formData.zipCode) || 0,
            country: formData.country,
            profileDescription: formData.bio,
          };

      // For create operations, include userId, fullName, email
      // For update operations, exclude them as they shouldn't change
      const payload = isUpdating && existingProfile
        ? basePayload
        : {
            ...basePayload,
            userId: user.id,
            fullName: fullName,
            email: email,
          };

      console.log(`${isUpdating ? 'Updating' : 'Creating'} profile for:`, role, payload);

      let response;
      if (isUpdating && existingProfile) {
        // Update existing profile
        if (role === "CLIENT") {
          response = await apiService.updateClientProfile(existingProfile.id, payload);
        } else {
          response = await apiService.updateFreelancerProfile(existingProfile.id, payload);
        }
        console.log("Profile updated successfully:", response);
        showToast("success", `${role} profile updated successfully!`);
      } else {
        // Create new profile
        if (role === "CLIENT") {
          response = await apiService.createClientProfile(payload);
        } else {
          response = await apiService.createFreelancerProfile(payload);
        }
        console.log("Profile created successfully:", response);
        showToast("success", `${role} profile created successfully!`);
      }

      // Add a small delay to ensure toast is shown, then navigate
      setIsNavigating(true);
      console.log("About to refresh user data and navigate...");
      
      // Update profile status to mark phase 1 as complete
      await updateRoleProfileStatus(role, { phase1profileComplete: true });
      
      // Refresh user data to update context BEFORE navigation
      await refreshUserData();
      console.log("User data refreshed, navigating in 1.5 seconds...");
      
      setTimeout(() => {
        console.log("Executing navigation to TellUsAboutYou...");
        navigation.replace("TellUsAboutYou", { role });
      }, 1500);
    } catch (error) {
      console.error(`Error ${isUpdating ? 'updating' : 'creating'} profile:`, error);
      
      // Record potential glitch for skip tracking
      await handleGlitchRecovery(error.message);
      
      showToast("error", `Error saving details: ${error.message}`);
    }
  };

  // Load services data for role selection from backend
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setIsLoadingServices(true);
        setServicesError(null);

        console.log("Fetching services from backend...");

        // Initialize API service
        await apiService.init();

        // Fetch both freelance and household services from backend
        const [freelanceResponse, householdResponse] = await Promise.all([
          apiService.getServicesByCategory("FREELANCE"),
          apiService.getServicesByCategory("HOUSEHOLD"),
        ]);
      
        // Log the response data
        // console.log('Freelance Services Response:', JSON.stringify(freelanceResponse, null, 2));
        // console.log('Household Services Response:', JSON.stringify(householdResponse, null, 2));

        // Extract service data from response
        const freelanceServices = freelanceResponse || [];
        const householdServices = householdResponse || [];

        // Store full service objects for future use (like images)
        const allServices = [...freelanceServices, ...householdServices];
        
        // For now, we'll use just the names for the picker, but we have the full objects available
        const allServiceNames = allServices.map((service) => service.name);

        setServices(allServiceNames);
        setServiceObjects(allServices); // Store full objects for future image usage
        console.log(
          "Services loaded from backend:",
          allServiceNames.length,
          "services"
        );
        console.log("Sample service with imageUrl:", allServices[0]); // Log to see the structure
        showToast(
          "success",
          `Loaded ${allServiceNames.length} services from server`
        );
      } catch (error) {
        console.error("Error fetching services from backend:", error);
        setServicesError(error.message);

        // Fallback to local data if backend fails
        const allServices = [...freelance_service, ...household_service];
        setServices(allServices);
        showToast(
          "error",
          "Failed to load services from server. Using offline data."
        );
      } finally {
        setIsLoadingServices(false);
      }
    };

    fetchServices();
  }, []);

  // Fetch existing profile data on component mount
  useEffect(() => {
    if (user && user.id && role && !isNavigating) {
      fetchExistingProfile();
    }
  }, [user, role, isNavigating]);

  // User should already be authenticated from signup flow
  // useEffect(() => {
  //   if (!user) {
  //     login(email, password);
  //   }
  // }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>
        {role === "CLIENT" ? "Tell us about yourself" : "Describe Your Role"}
      </Text>
      <Text style={styles.heading}>for role: {role}</Text>
      
      {/* Show loading state while fetching profile */}
      {isLoadingProfile && (
        <Text style={styles.loadingText}>Loading existing profile...</Text>
      )}
      
      {/* Show update/create indicator */}
      {/* {!isLoadingProfile && (
        <Text style={styles.modeText}>
          {isUpdating ? "✏️ Updating existing profile" : "➕ Creating new profile"}
        </Text>
      )} */}

      {/* Role/Designation */}
      <Text style={styles.label}>
        {role === "CLIENT" ? "Type of your organisation" : "Role/Designation"}
      </Text>
      {role === "CLIENT" ? (
        <View style={styles.dropdown}>
          <Picker
            selectedValue={formData.designation}
            onValueChange={(itemValue) =>
              handleInputChange("designation", itemValue)
            }
          >
            <Picker.Item label="Select Organization Type" value="" />
            <Picker.Item label="Individual" value="Individual" />
            <Picker.Item label="Business" value="Business" />
            <Picker.Item
              label="Non-Profit Organization"
              value="Non-Profit Organization"
            />
            <Picker.Item
              label="Educational Institution"
              value="Educational Institution"
            />
            <Picker.Item label="Government Agency" value="Government Agency" />
            <Picker.Item label="Other" value="Other" />
          </Picker>
        </View>
      ) : (
        <>
          <View style={styles.dropdown}>
            <Picker
              selectedValue={formData.designation}
              onValueChange={(itemValue) =>
                handleInputChange("designation", itemValue)
              }
              enabled={!isLoadingServices}
            >
              <Picker.Item
                label={
                  isLoadingServices ? "Loading services..." : "Select Role"
                }
                value=""
              />
              {!isLoadingServices &&
                services.map((service, id) => (
                  <Picker.Item key={id} label={service} value={service} />
                ))}
            </Picker>
          </View>

          {isLoadingServices && (
            <Text style={styles.loadingText}>
              Loading services from server...
            </Text>
          )}

          {servicesError && (
            <Text style={styles.errorText}>
              Error loading services: {servicesError}
            </Text>
          )}

          {formData.designations.length > 0 &&
            formData.designations.map((r, index) => (
              <Text key={index} style={styles.addedRole}>
                + {r}
              </Text>
            ))}
          <TouchableOpacity onPress={addRole}>
            <Text style={styles.addMoreRole}>+ Add 1 more role</Text>
          </TouchableOpacity>
        </>
      )}

      {role === "FREELANCER" && (
        <>
          {/* Qualification */}
          <Text style={styles.label}>Highest Qualification</Text>
          <View style={styles.dropdown}>
            <Picker
              selectedValue={formData.qualification}
              onValueChange={(itemValue) =>
                handleInputChange("qualification", itemValue)
              }
            >
              <Picker.Item label="Select Qualification" value="" />
              <Picker.Item
                label="Bachelor's Degree"
                value="Bachelor's Degree"
              />
              <Picker.Item label="Master's Degree" value="Master's Degree" />
              <Picker.Item label="PhD" value="PhD" />
            </Picker>
          </View>

          {/* Experience */}
          <Text style={styles.label}>Experience (In months)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="E.g. 24"
            value={formData.experience}
            onChangeText={(text) => handleInputChange("experience", text)}
          />
        </>
      )}

      {/* Profile Heading */}
      <Text style={styles.label}>
        {role === "CLIENT"
          ? "Company Name (Optional)"
          : "Heading on your profile"}
      </Text>
      <TextInput
        style={styles.input}
        placeholder={
          role === "CLIENT" ? "Company name" : "E.g. I am a designer"
        }
        value={formData.heading}
        onChangeText={(text) => handleInputChange("heading", text)}
      />

      {/* City and State */}
      <View style={styles.row}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>City</Text>
          <TextInput
            style={styles.input}
            value={formData.city}
            onChangeText={(text) => handleInputChange("city", text)}
          />
        </View>
        <View style={styles.dropdownContainer}>
          <Text style={styles.label}>State</Text>
          <View style={styles.dropdown}>
            <Picker
              selectedValue={formData.state}
              onValueChange={(itemValue) =>
                handleInputChange("state", itemValue)
              }
            >
              <Picker.Item label="Select State" value="" />
              {indianStates.map((state, index) => (
                <Picker.Item key={index} label={state} value={state} />
              ))}
            </Picker>
          </View>
        </View>
      </View>

      {/* Zip Code and Country */}
      <View style={styles.row}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Zip Code</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            maxLength={6}
            value={formData.zipCode}
            onChangeText={(text) => handleInputChange("zipCode", text)}
          />
        </View>
        <View style={styles.dropdownContainer}>
          <Text style={styles.label}>Country</Text>
          <View style={styles.dropdown}>
            <Picker
              selectedValue={formData.country}
              onValueChange={(itemValue) =>
                handleInputChange("country", itemValue)
              }
            >
              <Picker.Item label="Select Country" value="" />
              <Picker.Item label="India" value="India" />
            </Picker>
          </View>
        </View>
      </View>

      {/* Description (Bio) Section */}
      {role === "CLIENT" && (
        <>
          <Text style={styles.label}>Describe yourself</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Describe yourself"
            value={formData.bio}
            multiline
            onChangeText={(text) => {
              if (text.length <= 255) {
                handleInputChange("bio", text);
              }
            }}
          />
          <Text style={styles.charCount}>{formData.bio.length}/255</Text>
        </>
      )}

      {/* Next Button and Skip Option */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.nextButton, isLoadingProfile && styles.disabledButton]} 
          onPress={saveDetails}
          disabled={isLoadingProfile || isSkipping}
        >
          <Text style={styles.nextButtonText}>
            {isLoadingProfile ? "Loading..." : isUpdating ? "Update" : "Next"}
          </Text>
        </TouchableOpacity>

        {/* Skip Button */}
        <TouchableOpacity 
          style={styles.skipButton} 
          onPress={confirmSkip}
          disabled={isLoadingProfile || isSkipping}
        >
          <Text style={styles.skipButtonText}>
            {isSkipping ? "Skipping..." : "Skip for Now"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Glitch Detection Info */}
      {showSkipOption && (
        <View style={styles.helpContainer}>
          <Text style={styles.helpText}>
            💡 Having trouble? You can complete this later from your profile settings.
          </Text>
        </View>
      )}

      <Toast />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#4B0082",
  },
  title: {
    fontSize: 28,
    textAlign: "center",
    color: "#f0f0f0",
    marginBottom: 20,
    // marginTop: 20,
  },
  label: {
    color: "#f0f0f0",
    marginBottom: 10,
  },
  textArea: {
    height: 120,
    borderColor: "#fff",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
    color: "#000",
    textAlignVertical: "top",
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 20,
    height: 44,
  },
  dropdown: {
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 20,
    height: 44,
  },
  addedRole: {
    color: "#fff",
    marginBottom: 10,
  },
  charCount: {
    color: "#fff",
    marginTop: 2,
    left: "auto",
  },
  addMoreRole: {
    color: "#fff",
    marginBottom: 20,
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
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
  },
  nextButton: {
    width: "48%",
    height: 40,
    backgroundColor: "#fff",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  nextButtonText: {
    color: "#6A0DAD",
    fontWeight: "bold",
    fontSize: 18,
  },
  skipButton: {
    width: "48%",
    height: 40,
    backgroundColor: "transparent",
    borderColor: "#fff",
    borderWidth: 1,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  skipButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  helpContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
  },
  helpText: {
    color: "#fff",
    fontSize: 14,
    textAlign: "center",
    fontStyle: "italic",
  },
  loadingText: {
    color: "#fff",
    fontStyle: "italic",
    marginBottom: 10,
    textAlign: "center",
  },
  modeText: {
    color: "#90EE90",
    fontSize: 14,
    marginBottom: 15,
    textAlign: "center",
    fontWeight: "bold",
  },
  errorText: {
    color: "#ffcccc",
    fontSize: 12,
    marginBottom: 10,
    textAlign: "center",
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default DescribeRole;
