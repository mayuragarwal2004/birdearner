import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";
import Toast from "react-native-toast-message";
import { useAuth } from "../context/NewAuthContext";
import { useNavigation } from "@react-navigation/native";
import { updateRoleProfileStatus } from "../lib/profileStatusStorage";
import apiService from "../lib/apiService";

const TellUsAboutYouScreen = ({ route }) => {
  // console.log(`[NAVIGATION] TellUsAboutYouScreen rendered with role: ${route?.params?.role}`);
  // console.log("[NAVIGATION] Route params:", route?.params);
  
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [certifications, setCertifications] = useState([""]);
  const [socialLinks, setSocialLinks] = useState([""]);
  const [bio, setBio] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user, checkUserSession, userProfile } = useAuth();
  const { role } = user;
  const navigation = useNavigation();
  
  // Skip functionality states
  const [isSkipping, setIsSkipping] = useState(false);

  useEffect(() => {
    if (!user) {
      console.error("User not found. Redirecting to login.");
      navigation.replace("Login");
      return;
    }
  }, []);

  const handleError = (message) => {
    Toast.show({
      type: "error",
      text1: "Error",
      text2: message,
    });
  };

  const handleSuccess = (message) => {
    Toast.show({
      type: "success",
      text1: "Success",
      text2: message,
    });
  };

  // Skip functionality methods
  const handleSkipPhase = async () => {
    try {
      setIsSkipping(true);
      
      // Record the skip using the new profile status storage
      await updateRoleProfileStatus(role, { phase2skipped: true });
      
      handleSuccess("Phase 2 skipped. You can complete it later from your profile.");
      
      // Navigate based on role
      setTimeout(() => {
        if (role === "FREELANCER") {
          // Freelancers go to Portfolio screen next
          navigation.navigate("Portfolio", { role });
        } else if (role === "CLIENT") {
          // Clients go directly to main app (no portfolio phase)
          navigation.replace("MainTabs");
        }
      }, 1500);
      
    } catch (error) {
      console.error('Error handling skip:', error);
      handleError("Failed to skip. Please try again.");
    } finally {
      setIsSkipping(false);
    }
  };

  const confirmSkip = () => {
    Alert.alert(
      "Skip Additional Details?",
      "You can add photos, certifications, and other details later from your profile settings to make your profile more attractive to potential clients.",
      [
        { text: "Complete Now", style: "cancel" },
        { text: "Skip for Now", onPress: handleSkipPhase, style: "destructive" }
      ]
    );
  };

  const addCertification = () => setCertifications([...certifications, ""]);

  const addSocialLink = () => setSocialLinks([...socialLinks, ""]);

  const handleImageUpload = async (setImage, aspectRatio = [1, 1]) => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        return handleError(
          "You need to grant camera roll permissions to upload an image."
        );
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: aspectRatio, // Set fixed ratio for cropping (1:1 ratio)
        quality: 1,
      });

      if (!pickerResult.canceled) {
        setImage(pickerResult.assets[0]);
      }
    } catch (error) {
      handleError("Image Picker encountered an issue.");
    }
  };

  const handleProfileUpload = () => handleImageUpload(setProfileImage, [1, 1]);

  const handleCoverUpload = () => handleImageUpload(setCoverImage, [3, 2]);

  const onChangeDob = (event, selectedDate) => {
    setShowDatePicker(false);
    setDob(selectedDate || dob);
  };

  const isValidURL = (string) => /^(ftp|http|https):\/\/[^ "]+$/.test(string);

  const saveDetails = async () => {
    try {
      setIsLoading(true);
      
      // Check if gender is selected
      if (!gender) return handleError("Gender is required.");

      // Validate Date of Birth (must be at least 12 years ago)
      const today = new Date();
      const minDob = new Date(
        today.getFullYear() - 12,
        today.getMonth(),
        today.getDate()
      );
      if (dob > minDob)
        return handleError("Date of Birth must be at least 12 years ago.");

      const socialMediaLinks = socialLinks.filter((link) => link.trim() !== "");

      if (socialMediaLinks.length > 0) {
        for (const link of socialMediaLinks) {
          if (link && !isValidURL(link)) {
            return handleError(
              "Please enter valid URLs for your social media links."
            );
          }
        }
      }

      // Role-specific validation
      if (role === "FREELANCER") {
        // Check if certifications and bio are filled for freelancers
        if (certifications.some((cert) => !cert)) {
          return handleError("Please fill in all certification fields.");
        }
        if (bio.length === 0) {
          return handleError("Bio is required.");
        }
        // Validate cover art upload for freelancers
        if (!coverImage) return handleError("Cover art is required.");
      } else if (role === "CLIENT") {
        // For clients, bio is optional, cover image is not required
        // Only profile image is required
      }

      // Validate profile image upload (required for both roles)
      if (!profileImage) return handleError("Profile image is required.");

      console.log("Saving details for user:", user);

      // Upload profile image
      let profileImageUrl = null;
      if (profileImage) {
        try {
          profileImageUrl = await apiService.uploadFile(
            profileImage.uri,
            `profile_${user.id}_${Date.now()}.jpg`,
            'image'
          );
        } catch (error) {
          console.error("Profile image upload failed:", error);
          return handleError("Failed to upload profile image. Please try again.");
        }
      }

      // Upload cover image (only for freelancers)
      let coverImageUrl = null;
      if (role === "FREELANCER" && coverImage) {
        try {
          coverImageUrl = await apiService.uploadFile(
            coverImage.uri,
            `cover_${user.id}_${Date.now()}.jpg`,
            'image'
          );
        } catch (error) {
          console.error("Cover image upload failed:", error);
          return handleError("Failed to upload cover image. Please try again.");
        }
      }

      // Prepare update data based on role
      const updateData = {
        phase2Completed: true,
      };

      // Add role-specific fields
      if (role === "FREELANCER") {
        // Freelancer-specific fields
        updateData.gender = gender;
        updateData.dob = dob.toISOString();
        updateData.socialMediaLinks = socialMediaLinks.length > 0 ? socialMediaLinks : null;
        updateData.profilePhoto = profileImageUrl;
        updateData.coverPhoto = coverImageUrl;
        updateData.certifications = certifications.filter(cert => cert.trim() !== "");
        updateData.profileDescription = bio;
      } else if (role === "CLIENT") {
        // Client-specific fields (limited to what's available in schema)
        updateData.profileDescription = bio || `${gender} client born on ${dob.toDateString()}`;
        updateData.profilePhoto = profileImageUrl;
        // Note: Client model doesn't have gender, dob, socialMediaLinks, coverPhoto fields
        // These are stored in the profileDescription for now
      }

      // Update profile based on role
      if (role === "FREELANCER") {
        if (!userProfile?.id) {
          return handleError("Freelancer profile not found. Please contact support.");
        }
        await apiService.updateFreelancerPhase2(userProfile.id, updateData);
      } else if (role === "CLIENT") {
        if (!userProfile?.id) {
          return handleError("Client profile not found. Please contact support.");
        }
        // await apiService.updateClientPhase2(userProfile.id, updateData);
      }

      handleSuccess("Your details have been updated successfully.");
      
      // Update profile status to mark phase 2 as complete
      await updateRoleProfileStatus(role, { phase2profileComplete: true });
      
      // Navigate based on role
      if (role === "FREELANCER") {
        // Freelancers go to Portfolio screen next
        navigation.navigate("Portfolio", { role });
      } else if (role === "CLIENT") {
        // Clients go directly to main app (no portfolio phase)
        navigation.replace("MainTabs");
      }
      
    } catch (error) {
      console.error("Error saving details:", error);
      handleError(`Failed to update details: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Skip the current screen
  const skipScreen = async () => {
    try {
      await checkUserSession();
      // Navigate based on role
      if (role === "FREELANCER") {
        // Freelancers go to Portfolio screen next
        navigation.navigate("Portfolio", { role });
      } else if (role === "CLIENT") {
        // Clients go directly to main app (no portfolio phase)
        navigation.replace("MainTabs");
      }
    } catch (error) {
      Alert.alert("Error during session check");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Tell us about you</Text>
      <Text style={styles.heading}>for role: {role}</Text>

      <TouchableOpacity style={styles.skipButton} onPress={skipScreen}>
        <Text style={styles.skipButtonText}>Skip</Text>
      </TouchableOpacity>

      <View style={styles.row}>
        <View style={styles.dropdownContainer}>
          <Text style={styles.label}>Gender cd</Text>
          <View style={styles.dropdown}>
            <Picker selectedValue={gender} onValueChange={setGender}>
              <Picker.Item label="Select Gender" value="" />
              <Picker.Item label="Male" value="Male" />
              <Picker.Item label="Female" value="Female" />
              <Picker.Item label="Others" value="Others" />
            </Picker>
          </View>
        </View>

        <View>
          <Text style={styles.label}>Date of Birth</Text>
          <TouchableOpacity
            style={styles.dob}
            onPress={() => setShowDatePicker(true)}
          >
            <Text>{dob ? dob.toDateString() : "DOB"}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={dob}
              mode="date"
              display="default"
              onChange={onChangeDob}
              maximumDate={new Date()}
            />
          )}
        </View>
      </View>

      {role === "FREELANCER" && (
        <>
          <Text style={styles.label}>Certifications</Text>
          {certifications.map((cert, index) => (
            <TextInput
              key={index}
              style={styles.input}
              placeholder="Certification"
              value={cert}
              onChangeText={(text) =>
                setCertifications(
                  certifications.map((c, i) => (i === index ? text : c))
                )
              }
            />
          ))}
          <TouchableOpacity onPress={addCertification}>
            <Text style={styles.addMore}>+ Add more certifications</Text>
          </TouchableOpacity>
        </>
      )}

      <Text style={styles.label}>Your Social Media Links</Text>
      {socialLinks.map((link, index) => (
        <View key={index} style={styles.socialRow}>
          <TextInput
            style={styles.input}
            placeholder="www.instagram.com/xyz"
            value={link}
            onChangeText={(text) =>
              setSocialLinks(
                socialLinks.map((l, i) => (i === index ? text : l))
              )
            }
          />
        </View>
      ))}
      <TouchableOpacity onPress={addSocialLink}>
        <Text style={styles.addMore}>+ Add more social media links</Text>
      </TouchableOpacity>

      {role === "FREELANCER" && (
        <>
          <Text style={styles.label}>Describe yourself</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Describe yourself"
            value={bio}
            multiline
            onChangeText={(text) => text.length <= 255 && setBio(text)}
          />
          <Text style={styles.charCount}>{bio.length}/255</Text>
        </>
      )}

      {role === "CLIENT" && (
        <>
          <Text style={styles.label}>Describe your business (optional)</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Tell us about your business or organization"
            value={bio}
            multiline
            onChangeText={(text) => text.length <= 255 && setBio(text)}
          />
          <Text style={styles.charCount}>{bio.length}/255</Text>
        </>
      )}

      <Text style={styles.label}>Add your profile picture</Text>
      <View style={styles.profileUploadContainer}>
        <TouchableOpacity
          onPress={handleProfileUpload}
          style={styles.uploadButton}
        >
          <Text>Click here to upload</Text>
        </TouchableOpacity>
        {profileImage && (
          <Image
            source={{ uri: profileImage?.uri }}
            style={styles.profileImage}
          />
        )}
      </View>

      {role === "FREELANCER" && (
        <>
          <Text style={styles.label}>Add your cover art</Text>
          <View style={styles.profileUploadContainer}>
            <TouchableOpacity
              onPress={handleCoverUpload}
              style={styles.uploadButton}
            >
              <Text>Click here to upload</Text>
            </TouchableOpacity>
            {coverImage && (
              <Image source={{ uri: coverImage?.uri }} style={styles.coverImage} />
            )}
          </View>
        </>
      )}

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={() => navigation.goBack()}
          disabled={isLoading}
        >
          <Text style={styles.nextButtonText}>Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.nextButton, isLoading && styles.disabledButton]} 
          onPress={saveDetails}
          disabled={isLoading}
        >
          <Text style={styles.nextButtonText}>
            {isLoading ? "Saving..." : "Next"}
          </Text>
        </TouchableOpacity>
      </View>

      <Toast />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#4B0082", // Deep purple background
    justifyContent: "center",
    paddingVertical: 40,
  },
  title: {
    fontSize: 24,
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    gap: 20,
  },
  skipButton: {
    position: "absolute",
    top: 40,
    right: 20,
    padding: 10,
    borderRadius: 8,
  },
  charCount: {
    color: "#fff",
    marginTop: 2,
    left: "auto",
  },
  skipButtonText: {
    color: "#ffffff",
    fontWeight: "350",
    fontSize: 20,
  },
  smallInput: {
    width: "48%",
    height: 50,
    borderColor: "#fff",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
    justifyContent: "center",
  },
  dob: {
    width: "100%",
    height: 44,
    borderColor: "#fff",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
    justifyContent: "center",
  },
  label: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 10,
    marginTop: 15,
  },
  input: {
    height: 48,
    borderColor: "#fff",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: "#fff",
    color: "#000",
  },
  addMore: {
    color: "#ADD8E6",
    marginBottom: 10,
  },
  socialRow: {
    // flexDirection: "row",
    // justifyContent: "space-between",
    // alignItems: "center",
    // marginBottom: 15,
  },
  textArea: {
    height: 100,
    borderColor: "#fff",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
    color: "#000",
    textAlignVertical: "top",
  },
  profileUploadContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  uploadButton: {
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 5,
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
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
  },
  nextButton: {
    width: "32%",
    height: 40,
    backgroundColor: "#fff", // Dark purple for button
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    backgroundColor: "#ccc",
    opacity: 0.6,
  },
  nextButtonText: {
    color: "#6A0DAD",
    fontWeight: "bold",
    fontSize: 20,
  },
  dropdownContainer: {
    flex: 1,
  },
  dropdown: {
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 20,
    height: 44,
  },
});

export default TellUsAboutYouScreen;
