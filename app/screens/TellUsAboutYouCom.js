import React, { useState } from "react";
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
import { useAppwrite } from "../context/AppwriteContext";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";
import { ID, Query } from "react-native-appwrite";
import Toast from "react-native-toast-message";
import { useAuth } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";

const TellUsAboutYouScreen = ({ route }) => {
  const { account, databases, appwriteConfig, uploadFile } = useAppwrite();
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [certifications, setCertifications] = useState([""]);
  const [socialLinks, setSocialLinks] = useState([""]);
  const [bio, setBio] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const { role } = route.params;
  const { checkUserSession } = useAuth();
  const navigation = useNavigation();

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

  const addCertification = () => setCertifications([...certifications, ""]);

  const addSocialLink = () => setSocialLinks([...socialLinks, ""]);

  const handleImageUpload = async (setImage) => {
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
        quality: 1,
      });

      if (!pickerResult.canceled) {
        setImage(pickerResult.assets[0]);
      }
    } catch (error) {
      handleError("Image Picker encountered an issue.");
    }
  };

  const handleProfileUpload = () => handleImageUpload(setProfileImage);

  const handleCoverUpload = () => handleImageUpload(setCoverImage);

  const onChangeDob = (event, selectedDate) => {
    setShowDatePicker(false);
    setDob(selectedDate || dob);
  };

  const isValidURL = (string) => /^(ftp|http|https):\/\/[^ "]+$/.test(string);

  const saveDetails = async () => {
    try {
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

      // Validate social media links
      let emptySocialLinks = socialLinks.filter((link) => link.trim() === "");
      if (emptySocialLinks.length > 0)
        return handleError("Please fill in all social media links.");

      for (const link of socialLinks) {
        if (link && !isValidURL(link)) {
          return handleError(
            "Please enter valid URLs for your social media links."
          );
        }
      }

      // Check if certifications and bio are filled for freelancers
      if (role === "freelancer") {
        if (certifications.some((cert) => !cert)) {
          return handleError("Please fill in all certification fields.");
        }
        if (bio.length === 0) {
          return handleError("Bio is required.");
        }
      }

      // Validate profile image upload
      if (!profileImage) return handleError("Profile image is required.");

      // Validate cover art upload
      if (!coverImage) return handleError("Cover art is required.");

      const user = await account.get();
      const userCollection =
        role === "client"
          ? appwriteConfig.clientCollectionId
          : appwriteConfig.freelancerCollectionId;

      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        userCollection,
        [Query.equal("email", user.email)]
      );
      if (response.documents.length === 0)
        return handleError("No user document found with the provided email.");

      const userDocumentId = response.documents[0].$id;

      let profileImageFileURL = profileImage
        ? await uploadFile(profileImage, "image")
        : null;
      let coverImageFileURL = coverImage
        ? await uploadFile(coverImage, "image")
        : null;

      const updatedDetails = {
        gender,
        dob: dob.toISOString(),
        ...(role === "freelancer" && {
          certifications,
          profile_description: bio,
          social_media_links: socialLinks,
        }),
        ...(profileImageFileURL && { profile_photo: profileImageFileURL }),
        ...(coverImageFileURL && { cover_photo: coverImageFileURL }),
        updated_at: new Date().toISOString(),
      };

      await databases.updateDocument(
        appwriteConfig.databaseId,
        userCollection,
        userDocumentId,
        updatedDetails
      );

      handleSuccess("Your details have been updated successfully.");
      navigation.navigate("PortfolioCom", { role });
    } catch (error) {
      handleError(`Failed to update details: ${error.message}`);
    }
  };

  // Skip the current screen
  const skipScreen = async () => {
    try {
      await checkUserSession();
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error during session check");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Tell us about you</Text>

      <TouchableOpacity style={styles.skipButton} onPress={skipScreen}>
        <Text style={styles.skipButtonText}>Skip</Text>
      </TouchableOpacity>

      <View style={styles.row}>
        <View style={styles.dropdownContainer}>
          <Text style={styles.label}>Gender</Text>
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

      {role === "freelancer" && (
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

      {role === "freelancer" && (
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

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.nextButtonText}>Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={saveDetails}>
          <Text style={styles.nextButtonText}>Next</Text>
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
    borderRadius: 24,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
    justifyContent: "center",
  },
  dob: {
    width: "100%",
    height: 44,
    borderColor: "#fff",
    borderWidth: 1,
    borderRadius: 20,
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
    borderRadius: 24,
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
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
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
    borderRadius: 20,
    marginBottom: 20,
    height: 44,
  },
});

export default TellUsAboutYouScreen;
