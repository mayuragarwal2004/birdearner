import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  TextInput,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useAppwrite } from "../context/AppwriteContext";
import ImageViewer from "react-native-image-zoom-viewer";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTheme } from "../context/ThemeContext";
import * as ImagePicker from "expo-image-picker";

const UpdateJobDetailsScreen = ({ route, navigation }) => {
  const { appwriteConfig, databases, uploadFile } = useAppwrite();
  const [deadline, setDeadline] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { projectId } = route.params;
  const [modalVisible, setModalVisible] = useState(false);
  const [images, setImages] = useState([]);
  const [job, setJob] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [updatedJob, setUpdatedJob] = useState({});
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [portfolioImages, setPortfolioImages] = useState([]);

  const onChangeDeadline = (event, selectedDate) => {
    const currentDate = selectedDate || deadline;
    setShowDatePicker(false);
    setDeadline(currentDate);
  };

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];

  const styles = getStyles(currentTheme);

  const fetchJobDetails = async () => {
    try {
      const jobDoc = await databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.jobCollectionID,
        projectId
      );
      setJob(jobDoc);
      setUpdatedJob({ ...jobDoc }); // Clone the job details for editing
      setDeadline(new Date(jobDoc.deadline));
    } catch (error) {
      Alert.alert("Error", `Failed to fetch job details: ${error.message}`);
    }
  };
  
  useEffect(() => {
    fetchJobDetails();
  }, [projectId]);

  const handleDateConfirm = (date) => {
    setUpdatedJob((prev) => ({ ...prev, deadline: date.toISOString() }));
    setIsDatePickerVisible(false);
  };

  const handleDeleteFile = (index) => {
    const updatedFiles = updatedJob.attached_files.filter(
      (_, i) => i !== index
    );
    setUpdatedJob((prev) => ({ ...prev, attached_files: updatedFiles }));
  };

  const handleUpdateJob = async () => {
    if (!updatedJob.title || !updatedJob.description || !updatedJob.budget) {
      Alert.alert("Error", "Please fill out all required fields.");
      return;
    }

    try {
      const uploadedImageURLs = await Promise.all(
        portfolioImages.map(async (imageUri) => {
          try {
            const fileResponse = await uploadFile({ uri: imageUri }, "image");
            return fileResponse.url; // Assuming fileResponse contains a URL
          } catch (err) {
            console.error(`Failed to upload: ${err.message}`);
            return null;
          }
        })
      );

      const filteredURLs = uploadedImageURLs.filter((url) => url !== null);
      const allImageUrls = [
        ...(updatedJob.attached_files || []),
        ...filteredURLs,
      ];

      const payload = {
        title: updatedJob.title,
        description: updatedJob.description,
        budget: parseInt(updatedJob.budget, 10),
        skills: updatedJob.skills,
        deadline: deadline.toISOString(),
        attached_files: allImageUrls,
        updated_at: new Date().toISOString(),
      };

      await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.jobCollectionID,
        projectId,
        payload
      );

      setJob({ ...updatedJob, attached_files: allImageUrls });
      setPortfolioImages([]);
      setIsEditing(false);
      Alert.alert("Success", "Job updated successfully!");
      fetchJobDetails();
    } catch (error) {
      console.error("Error updating job:", error);
      Alert.alert("Error", `Failed to update job: ${error.message}`);
    }
  };

  const openImageModal = (imageUri) => {
    setImages([{ url: imageUri }]);
    setModalVisible(true);
  };

  const handleFileUpload = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Permission Denied", "Please grant access to your photos.");
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        allowsMultipleSelection: true,
      });

      if (pickerResult.assets && pickerResult.assets.length > 0) {
        const newImages = pickerResult.assets.map((asset) => asset.uri);
        setPortfolioImages((prev) => [...prev, ...newImages]);
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      Alert.alert("Error", "An error occurred while uploading files.");
    }
  };

  const removeImage = (index) => {
    setPortfolioImages((prev) => prev.filter((_, i) => i !== index));
  };

  const renderEditForm = () => (
    <ScrollView style={styles.editForm1}>
      <Modal
        visible={modalVisible}
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <ImageViewer
          imageUrls={images}
          enableSwipeDown={true}
          onSwipeDown={() => setModalVisible(false)}
          renderIndicator={() => null}
          renderHeader={() => (
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={{
                position: "absolute",
                top: 30,
                left: 20,
                zIndex: 10,
                backgroundColor: "rgba(0,0,0,0.5)",
                borderRadius: 20,
                padding: 10,
              }}
            >
              <FontAwesome name="arrow-left" size={24} color="#fff" />
            </TouchableOpacity>
          )}
        />
      </Modal>
      {/* Title */}
      <Text style={styles.label1}>Title</Text>
      <TextInput
        style={styles.input1}
        value={updatedJob.title}
        onChangeText={(text) => setUpdatedJob({ ...updatedJob, title: text })}
      />

      {/* Description */}
      <Text style={styles.label1}>Description</Text>
      <TextInput
        style={styles.textArea1}
        value={updatedJob.description}
        multiline
        onChangeText={(text) =>
          setUpdatedJob({ ...updatedJob, description: text })
        }
      />

      {/* Budget */}
      <Text style={styles.label1}>Budget</Text>
      <TextInput
        style={styles.input1}
        value={String(updatedJob.budget)}
        keyboardType="numeric"
        onChangeText={(text) =>
          setUpdatedJob({ ...updatedJob, budget: parseInt(text, 10) })
        }
      />

      {/* Skills */}
      <Text style={styles.label1}>Skills</Text>
      <TextInput
        style={styles.input1}
        value={updatedJob.skills?.join(", ")}
        onChangeText={(text) =>
          setUpdatedJob({
            ...updatedJob,
            skills: text.split(",").map((skill) => skill.trim()),
          })
        }
      />

      <View>
        <Text style={styles.label}>Deadline</Text>
        <TouchableOpacity
          style={styles.dob}
          onPress={() => setShowDatePicker(true)}
        >
          <Text>{deadline ? deadline.toDateString() : "Deadline"}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={deadline}
            mode="date"
            display="default"
            onChange={onChangeDeadline}
          />
        )}
      </View>

      {/* Attached Files */}
      <View style={styles.attachedFilesContainer1}>
        <Text style={styles.attachedFilesTitle1}>Attached Files</Text>
        <View style={styles.filePreviewContainer1}>
          {updatedJob?.attached_files &&
            updatedJob?.attached_files?.map((image, index) => (
              <View key={index} style={styles.filePreviewWrapper1}>
                <TouchableOpacity onPress={() => openImageModal(image)}>
                  <Image source={{ uri: image }} style={styles.filePreview1} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteFile(index)}
                  style={styles.deleteButton1}
                >
                  <FontAwesome name="trash" size={20} color="#B64928" />
                </TouchableOpacity>
              </View>
            ))}

          {portfolioImages &&
            portfolioImages.map((image, index) => (
              <View key={index} style={styles.filePreviewWrapper1}>
                <TouchableOpacity onPress={() => openImageModal(image)}>
                  <Image source={{ uri: image }} style={styles.filePreview1} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => removeImage(index)}
                  style={styles.deleteButton1}
                >
                  <FontAwesome name="trash" size={20} color="#B64928" />
                </TouchableOpacity>
              </View>
            ))}
        </View>
        <TouchableOpacity onPress={handleFileUpload}>
          <Text style={styles.uploadButton1}>Upload Files</Text>
        </TouchableOpacity>
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer1}>
        <TouchableOpacity onPress={handleUpdateJob} style={styles.buttonSave}>
          <Text style={{ color: "#fff", fontSize: 16 }}>Save Changes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setIsEditing(false)}
          style={styles.buttoncancel}
        >
          <Text style={{ color: "#fff", fontSize: 16 }}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container1}>
      {isEditing ? (
        renderEditForm()
      ) : (
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <Modal
            visible={modalVisible}
            transparent={true}
            onRequestClose={() => setModalVisible(false)}
          >
            <ImageViewer
              imageUrls={images}
              enableSwipeDown={true}
              onSwipeDown={() => setModalVisible(false)}
              renderIndicator={() => null}
              renderHeader={() => (
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={{
                    position: "absolute",
                    top: 30,
                    left: 20,
                    zIndex: 10,
                    backgroundColor: "rgba(0,0,0,0.5)",
                    borderRadius: 20,
                    padding: 10,
                  }}
                >
                  <FontAwesome name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>
              )}
            />
          </Modal>

          <ScrollView style={styles.scrollContent}>
            {/* Job Header */}
            <View style={styles.jobHeader}>
              <View style={styles.jobInfo}>
                <View style={styles.jobTitlebar}>
                  <Text style={styles.jobTitle}>
                    {job?.title || "Job Heading missing"}
                  </Text>
                  <Text style={styles.detailText}>
                    <Text style={styles.boldText}>Budget </Text> Rs.{" "}
                    {job?.budget}/-
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setIsEditing(true)}>
                  <FontAwesome name="edit" size={24} color="#4e2587" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Job Description */}
            <Text style={styles.desText}>Description</Text>
            <View style={styles.jobDescription}>
              <Text style={styles.descriptionText}>{job?.description}</Text>
            </View>

            <Text style={styles.desText}>Skills Required</Text>
            <Text style={styles.skillText}>{job?.skills.join(", ")}</Text>

            <Text style={styles.desText}>Deadline</Text>
            <Text style={styles.detailText}>
              {new Date(job?.deadline).toLocaleDateString()}
            </Text>

            <Text style={styles.desText}>Location</Text>
            <Text style={styles.detailText}>{job?.location || "N/A"}</Text>

            {/* Attached Files */}
            <View style={styles.attachedFilesContainer}>
              <Text style={styles.attachedFilesTitle}>Attached Files</Text>
              <View style={styles.filePreviewContainer}>
                {job?.attached_files.map((image, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => openImageModal(image)}
                  >
                    <Image source={{ uri: image }} style={styles.filePreview} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </ScrollView>
      )}
    </View>
  );
};

const getStyles = (currentTheme) =>
  StyleSheet.create({
    container1: {
      flex: 1,
      backgroundColor: currentTheme.background || "#fff",
      padding: 10,
      // paddingTop: 40,
    },
    container: {
      flex: 1,
      backgroundColor: currentTheme.background || "#fff",
      padding: 20,
      paddingTop: 40,
    },
    scrollContent: {
      padding: 20,
      marginBottom: 30,
    },
    jobHeader: {
      flexDirection: "row",
      marginBottom: 20,
    },
    jobTitlebar: {
      flex: 1,
      gap: 10,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      marginRight: 20,
    },
    jobInfo: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    jobTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: currentTheme.primary || "#4e2587",
      flex: 1,
    },
    flagIcon: {
      marginLeft: 10,
    },
    jobDetails: {
      backgroundColor: currentTheme.subText || "#f9f9f9",
      padding: 10,
      borderRadius: 10,
      marginBottom: 20,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 5,
      shadowOffset: { width: 0, height: 2 },
      elevation: 3,
    },
    detailText: {
      fontSize: 14,
      color: "#4e2587",
      marginBottom: 10,
    },
    boldText: {
      fontWeight: "bold",
    },
    jobDescription: {
      marginBottom: 20,
    },
    descriptionText: {
      fontSize: 14,
      color: "#555",
      lineHeight: 22,
      marginBottom: 10,
    },
    attachedFilesContainer: {
      marginBottom: 30,
    },
    attachedFilesTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: "#4e2587",
      marginBottom: 10,
    },
    filePreviewContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 20,
      justifyContent: "center",
    },
    filePreview: {
      width: 80,
      height: 80,
      backgroundColor: "#ccc",
      borderRadius: 5,
      marginRight: 10,
      marginBottom: 10,
    },
    applyButton: {
      backgroundColor: "#4e2587",
      // paddingHorizontal: 15,
      borderRadius: 25,
      alignItems: "center",
      marginBottom: 20,
      paddingVertical: 8,
    },
    applyButtonText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 24,
    },
    alreadyapplyButtonText: {
      color: "#36454F",
      fontWeight: "bold",
      fontSize: 24,
      backgroundColor: "#c2c2c2",
      borderRadius: 25,
      alignItems: "center",
      marginBottom: 20,
      paddingVertical: 10,
      textAlign: "center",
    },
    reportText: {
      color: "#555",
      textAlign: "center",
      textDecorationLine: "underline",
      fontSize: 14,
    },
    detailText: {
      fontSize: 14,
      color: "#595858",
      marginBottom: 10,
    },
    skillText: {
      fontSize: 14,
      color: currentTheme.subText || "#595858",
      marginBottom: 10,
    },
    detailText: {
      color: currentTheme.subText,
    },
    boldText: {
      fontWeight: "bold",
    },
    desText: {
      fontWeight: "bold",
      fontSize: 16,
      marginBottom: 3,
      color: currentTheme.text,
    },
    jobDescription: {
      marginBottom: 20,
    },
    descriptionText: {
      fontSize: 14,
      color: "#555",
      lineHeight: 22,
      marginBottom: 10,
    },
    attachedFilesContainer: {
      marginBottom: 30,
    },
    attachedFilesTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: "#4e2587",
      marginBottom: 10,
    },
    filePreviewContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 20,
      justifyContent: "center",
    },
    filePreview: {
      width: 80,
      height: 80,
      backgroundColor: "#ccc",
      borderRadius: 5,
      marginRight: 10,
      marginBottom: 10,
    },
    applyButtoncon: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "center",
      gap: 15,
      shadowColor: "#000000",
      shadowOffset: {
        width: 0,
        height: 3,
      },
      shadowOpacity: 0.17,
      shadowRadius: 3.05,
      elevation: 4,
    },
    applyButtonText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 20,
    },
    conColor: {
      backgroundColor: "#00871E",
      paddingHorizontal: 20,
      borderRadius: 12,
      alignItems: "center",
      marginBottom: 20,
      paddingVertical: 10,
      shadowColor: "#000000",
      shadowOffset: {
        width: 0,
        height: 3,
      },
      shadowOpacity: 0.17,
      shadowRadius: 3.05,
      elevation: 4,
    },
    repColor: {
      backgroundColor: "#B64928",
      paddingHorizontal: 20,
      borderRadius: 12,
      alignItems: "center",
      marginBottom: 20,
      paddingVertical: 10,
      shadowColor: "#000000",
      shadowOffset: {
        width: 0,
        height: 3,
      },
      shadowOpacity: 0.17,
      shadowRadius: 3.05,
      elevation: 4,
    },
    reportText: {
      color: "#555",
      textAlign: "center",
      textDecorationLine: "underline",
      fontSize: 14,
    },

    editForm1: {
      padding: 20,
      backgroundColor: "#fff",
    },
    label1: {
      fontSize: 16,
      fontWeight: "bold",
      marginVertical: 10,
    },
    input1: {
      borderWidth: 1,
      borderColor: "#ccc",
      borderRadius: 5,
      padding: 10,
      fontSize: 14,
      marginBottom: 15,
    },
    textArea1: {
      borderWidth: 1,
      borderColor: "#ccc",
      borderRadius: 5,
      padding: 10,
      fontSize: 14,
      height: 100,
      textAlignVertical: "top",
      marginBottom: 15,
    },
    attachedFilesContainer1: {
      marginTop: 20,
    },
    attachedFilesTitle1: {
      fontSize: 16,
      fontWeight: "bold",
    },
    filePreviewContainer1: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginTop: 10,
      justifyContent: "center",
    },
    filePreviewWrapper1: {
      position: "relative",
      margin: 5,
    },
    filePreview1: {
      width: 100,
      height: 100,
      borderRadius: 5,
    },
    deleteButton1: {
      position: "absolute",
      top: 0,
      right: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      borderRadius: 50,
      padding: 5,
    },
    uploadButton1: {
      fontSize: 14,
      color: "#4e2587",
      marginTop: 10,
      textDecorationLine: "underline",
    },
    buttonContainer1: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 40,
      marginBottom: 40,
    },
    buttonSave: {
      backgroundColor: "#4e2587",
      paddingHorizontal: 30,
      paddingVertical: 12,
      borderRadius: 12,
    },
    buttoncancel: {
      backgroundColor: "#B64928",
      paddingVertical: 12,
      paddingHorizontal: 30,
      borderRadius: 12,
    },
  });

export default UpdateJobDetailsScreen;
