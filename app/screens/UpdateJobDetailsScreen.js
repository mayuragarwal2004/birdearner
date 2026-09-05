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
import { SafeAreaView } from "react-native-safe-area-context";
import SafeSpinner from "../components/SafeSpinner";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import ImageViewer from "react-native-image-zoom-viewer";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTheme } from "../context/ThemeContext";
import * as ImagePicker from "expo-image-picker";
import apiService from "../lib/apiService";

const UpdateJobDetailsScreen = ({ route, navigation }) => {
  const [deadline, setDeadline] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { jobId } = route.params;
  const [modalVisible, setModalVisible] = useState(false);
  const [images, setImages] = useState([]);
  const [job, setJob] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [updatedJob, setUpdatedJob] = useState({});
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [portfolioImages, setPortfolioImages] = useState([]);
  
  // Budget and wallet management
  const [walletData, setWalletData] = useState(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [budgetError, setBudgetError] = useState("");
  const [showWalletInfo, setShowWalletInfo] = useState(false);
  const [budgetValidating, setBudgetValidating] = useState(false);
  
  // Skills management
  const [skillsArray, setSkillsArray] = useState([""]);

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
      await apiService.init(); // Initialize the API service with token
      const response = await apiService.getJobById(jobId);
      const jobDoc = response; // API service returns the job data directly
      
      // Map database field names to frontend field names
      const mappedJob = {
        ...jobDoc,
        title: jobDoc.jobTitle,
        description: jobDoc.jobDescription,
        budget: jobDoc.budgetAmount?.toString() || '',
        skills: jobDoc.skillsRequired,
        deadline: jobDoc.deadlineDate,
        attached_files: jobDoc.attachedFiles || [],
      };
      
      setJob(mappedJob);
      setUpdatedJob({ ...mappedJob }); // Clone the job details for editing
      setDeadline(new Date(jobDoc.deadlineDate || new Date()));
      
      // Set skills array for proper editing
      if (mappedJob.skills && Array.isArray(mappedJob.skills)) {
        setSkillsArray(mappedJob.skills.length > 0 ? mappedJob.skills : [""]);
      }
      
    } catch (error) {
      Alert.alert("Error", `Failed to fetch job details: ${error.message}`);
    }
  };

  const fetchWalletData = async () => {
    try {
      setWalletLoading(true);
      await apiService.init();
      const response = await apiService.getClientWalletInfo();
      console.log("Wallet data fetched:", response);
      if (response.success) {
                setWalletData(response.data);
      }
    } catch (error) {
      console.error("Error fetching wallet data:", error);
      setWalletData(null);
    } finally {
      setWalletLoading(false);
    }
  };

  const validateBudget = (budgetValue) => {
    const budgetNum = parseFloat(budgetValue);
    setBudgetError("");
    setBudgetValidating(false);

    if (!budgetValue || isNaN(budgetNum) || budgetNum <= 0) {
      setBudgetError("Please enter a valid budget amount");
      return false;
    }

    if (!walletData || !job) {
      setBudgetError("Unable to verify wallet balance. Please try again.");
      return false;
    }

    // Calculate max allowed budget: available balance + current job budget
    const currentJobBudget = parseFloat(job.budget) || 0;
    const maxAllowedBudget = walletData.availableBalance + currentJobBudget;

    if (budgetNum > maxAllowedBudget) {
      setBudgetError(
        `Maximum budget allowed: ₹${maxAllowedBudget.toFixed(2)} (Available: ₹${walletData.availableBalance?.toFixed(2)} + Current: ₹${currentJobBudget.toFixed(2)})`
      );
      return false;
    }

    return true;
  };

  const handleBudgetChange = (value) => {
    setUpdatedJob({ ...updatedJob, budget: value });
    if (value && walletData) {
      setBudgetValidating(true);
      // Add a slight delay to show loading state
      setTimeout(() => {
        validateBudget(value);
      }, 300);
    } else {
      setBudgetError("");
      setBudgetValidating(false);
    }
  };

  const addSkill = () => {
    setSkillsArray([...skillsArray, ""]);
  };

  const removeSkill = (index) => {
    if (skillsArray.length > 1) {
      const newSkills = skillsArray.filter((_, i) => i !== index);
      setSkillsArray(newSkills);
      setUpdatedJob({ ...updatedJob, skills: newSkills });
    }
  };

  const updateSkill = (index, value) => {
    const newSkills = [...skillsArray];
    newSkills[index] = value;
    setSkillsArray(newSkills);
    setUpdatedJob({ ...updatedJob, skills: newSkills });
  };
  
  useEffect(() => {
    fetchJobDetails();
    fetchWalletData();
  }, [jobId]);

  useEffect(() => {
    if (isEditing) {
      fetchWalletData();
    }
  }, [isEditing]);

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

    // Validate skills
    if (skillsArray.some((skill) => skill.trim() === "")) {
      Alert.alert("Error", "Please enter all required skills or remove empty skill fields.");
      return;
    }

    // Validate budget
    if (!validateBudget(updatedJob.budget)) {
      return;
    }

    try {
      await apiService.init(); // Ensure API service has token
      
      const uploadedImageURLs = await Promise.all(
        portfolioImages.map(async (imageUri) => {
          try {
            // Extract filename from URI or generate one
            const filename = imageUri.split('/').pop() || `image_${Date.now()}.jpg`;
            const fileUrl = await apiService.uploadFile(imageUri, filename, 'jpg');
            return fileUrl; // API service returns the URL directly
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
        jobTitle: updatedJob.title,
        jobDescription: updatedJob.description,
        budgetAmount: parseFloat(updatedJob.budget),
        skillsRequired: skillsArray.filter(skill => skill.trim() !== ""),
        deadlineDate: deadline.toISOString(),
        attachedFiles: allImageUrls,
      };

      const response = await apiService.updateJob(jobId, payload);
      const updatedJobData = response.data; // Extract data from response
      
      // Map database field names to frontend field names for display
      const mappedUpdatedJob = {
        ...updatedJobData,
        title: updatedJobData.jobTitle,
        description: updatedJobData.jobDescription,
        budget: updatedJobData.budgetAmount?.toString() || '',
        skills: updatedJobData.skillsRequired,
        deadline: updatedJobData.deadlineDate,
        attached_files: allImageUrls,
      };

      setJob(mappedUpdatedJob);
      setPortfolioImages([]);
      setIsEditing(false);
      setBudgetError("");
      
      // Show success message with wallet update info if present
      let successMessage = "Job updated successfully!";
      if (response.walletUpdate) {
        const { budgetDifference, newAvailableBalance } = response.walletUpdate;
        if (budgetDifference > 0) {
          successMessage += `\n\nBudget increased by ₹${budgetDifference.toFixed(2)}`;
        } else if (budgetDifference < 0) {
          successMessage += `\n\nBudget decreased by ₹${Math.abs(budgetDifference).toFixed(2)}`;
        }
        successMessage += `\nNew available balance: ₹${newAvailableBalance.toFixed(2)}`;
      }
      
      Alert.alert("Success", successMessage);
      
      // Refresh wallet data to reflect changes
      fetchWalletData();
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
      <View style={styles.budgetSection}>
        <View style={styles.budgetHeader}>
          <Text style={styles.label1}>Budget</Text>
          <TouchableOpacity
            onPress={() => setShowWalletInfo(!showWalletInfo)}
            style={styles.walletToggle}
          >
            <Ionicons
              name={showWalletInfo ? "wallet" : "wallet-outline"}
              size={18}
              color="#6A0DAD"
            />
            <Text style={styles.walletToggleText}>
              {walletLoading ? "Loading..." : "Wallet Info"}
            </Text>
          </TouchableOpacity>
        </View>

        {showWalletInfo && walletData && (
          <View style={styles.walletInfoContainer}>
            <View style={styles.walletInfoRow}>
              <Text style={styles.walletInfoLabel}>Available Balance:</Text>
              <Text style={styles.walletInfoAmount}>
                ₹{walletData.availableBalance?.toFixed(2) || "0.00"}
              </Text>
            </View>
            {walletData.reservedAmount > 0 && (
              <View style={styles.walletInfoRow}>
                <Text style={styles.walletInfoLabel}>Reserved:</Text>
                <Text style={styles.walletInfoReserved}>
                  ₹{walletData.reservedAmount?.toFixed(2)}
                </Text>
              </View>
            )}
            <View style={styles.walletInfoRow}>
              <Text style={styles.walletInfoLabel}>Total Balance:</Text>
              <Text style={styles.walletInfoTotal}>
                ₹{walletData.totalBalance?.toFixed(2) || "0.00"}
              </Text>
            </View>
          </View>
        )}

        <TextInput
          style={[styles.input1, budgetError ? styles.inputError : null]}
          placeholder={
            walletData && job
              ? `Max: ₹${(walletData.availableBalance + parseFloat(job.budget || 0)).toFixed(2)}`
              : "Enter budget amount"
          }
          keyboardType="numeric"
          value={updatedJob.budget?.toString()}
          onChangeText={handleBudgetChange}
        />

        {budgetValidating && (
          <View style={styles.budgetValidationContainer}>
            <View style={styles.budgetValidationRow}>
              <SafeSpinner size={18} color="#6A0DAD" />
              <Text style={styles.budgetValidationText}>Validating budget...</Text>
            </View>
          </View>
        )}

        {budgetError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{budgetError}</Text>
            {walletData && job && parseFloat(updatedJob.budget || 0) > (walletData.availableBalance + parseFloat(job.budget || 0)) && (
              <TouchableOpacity
                style={styles.addMoneyButton}
                onPress={() => navigation.navigate('Wallet')}
              >
                <Ionicons name="add-circle-outline" size={16} color="#6A0DAD" />
                <Text style={styles.addMoneyText}>Add Money to Wallet</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : null}
      </View>

      {/* Skills */}
      <View style={styles.skillsSection}>
        <Text style={styles.label1}>Skills Required</Text>
        {skillsArray.map((skill, index) => (
          <View key={index} style={styles.skillInputContainer}>
            <TextInput
              style={[styles.input1, styles.skillInput]}
              placeholder="Add required skill"
              value={skill}
              onChangeText={(text) => updateSkill(index, text)}
            />
            {skillsArray.length > 1 && (
              <TouchableOpacity
                style={styles.removeSkillButton}
                onPress={() => removeSkill(index)}
              >
                <FontAwesome name="minus-circle" size={20} color="#B64928" />
              </TouchableOpacity>
            )}
          </View>
        ))}
        <TouchableOpacity onPress={addSkill} style={styles.addSkillButton}>
          <FontAwesome name="plus-circle" size={16} color="#6A0DAD" />
          <Text style={styles.addSkillText}>+ Add more skills</Text>
        </TouchableOpacity>
      </View>

      {/* Deadline */}
      <View style={styles.deadlineSection}>
        <Text style={styles.label1}>Deadline</Text>
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => setShowDatePicker(true)}
        >
          <View style={styles.datePickerContent}>
            <FontAwesome name="calendar" size={20} color="#6A0DAD" />
            <Text style={styles.datePickerText}>
              {deadline ? deadline.toDateString() : "Select Deadline"}
            </Text>
            <FontAwesome name="chevron-down" size={16} color="#999" />
          </View>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={deadline}
            mode="date"
            display="default"
            minimumDate={new Date()}
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
    <SafeAreaView style={{flex: 1}}>
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
    </SafeAreaView>
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
    
    // Budget section styles
    budgetSection: {
      marginBottom: 20,
    },
    budgetHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    walletToggle: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 4,
      paddingHorizontal: 8,
      backgroundColor: "#f0f0f0",
      borderRadius: 12,
      gap: 4,
    },
    walletToggleText: {
      fontSize: 12,
      color: "#6A0DAD",
      fontWeight: "500",
    },
    walletInfoContainer: {
      backgroundColor: "#f8f9fa",
      padding: 12,
      borderRadius: 8,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: "#e9ecef",
    },
    walletInfoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 6,
    },
    walletInfoLabel: {
      fontSize: 14,
      color: "#6c757d",
      fontWeight: "500",
    },
    walletInfoAmount: {
      fontSize: 14,
      color: "#28A745",
      fontWeight: "600",
    },
    walletInfoReserved: {
      fontSize: 14,
      color: "#FFC107",
      fontWeight: "600",
    },
    walletInfoTotal: {
      fontSize: 14,
      color: "#343a40",
      fontWeight: "600",
    },
    inputError: {
      borderColor: "#DC3545",
      borderWidth: 1.5,
      backgroundColor: "#fef2f2",
    },
    errorContainer: {
      marginTop: 5,
      paddingHorizontal: 5,
    },
    errorText: {
      fontSize: 12,
      color: "#DC3545",
      marginBottom: 5,
    },
    addMoneyButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 6,
      paddingHorizontal: 12,
      backgroundColor: "#f8f9ff",
      borderRadius: 12,
      alignSelf: "flex-start",
      gap: 4,
    },
    addMoneyText: {
      fontSize: 12,
      color: "#6A0DAD",
      fontWeight: "600",
    },
    budgetValidationContainer: {
      marginTop: 5,
      paddingHorizontal: 5,
    },
    budgetValidationRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    budgetValidationText: {
      fontSize: 12,
      color: "#28A745",
      fontWeight: "500",
    },
    
    // Skills section styles
    skillsSection: {
      marginBottom: 20,
    },
    skillInputContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
    },
    skillInput: {
      flex: 1,
      marginBottom: 0,
    },
    removeSkillButton: {
      marginLeft: 10,
      padding: 5,
    },
    addSkillButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 8,
      paddingHorizontal: 12,
      gap: 8,
    },
    addSkillText: {
      fontSize: 14,
      color: "#6A0DAD",
      fontWeight: "600",
    },
    
    // Deadline section styles
    deadlineSection: {
      marginBottom: 20,
    },
    datePickerButton: {
      borderWidth: 1,
      borderColor: "#ccc",
      borderRadius: 8,
      paddingHorizontal: 15,
      paddingVertical: 12,
      backgroundColor: "#fff",
    },
    datePickerContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    datePickerText: {
      flex: 1,
      marginLeft: 12,
      fontSize: 16,
      color: "#333",
    },
  });

export default UpdateJobDetailsScreen;
