import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  Image,
  Alert,
  Linking,
} from "react-native";
import { useAppwrite } from "../context/AppwriteContext";
import ImageViewer from "react-native-image-zoom-viewer";
import { FontAwesome } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

const SubmitSolutionScreen = ({ route, navigation }) => {
  const { appwriteConfig, databases, uploadFile } = useAppwrite();
  const { projectId } = route.params;
  const [files, setFiles] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [images, setImages] = useState([]);

  useEffect(() => {
    const getJobdetails = async () => {
      const jobDoc = await databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.jobCollectionID,
        projectId
      );

      setFiles(jobDoc.solutions);
    };

    getJobdetails();
  }, []);

  const handleSubmit = async () => {
    if (files.length === 0) {
      Alert.alert(
        "No files",
        "Please upload at least one file before submitting."
      );
      return;
    }

    try {
      const jobDoc = await databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.jobCollectionID,
        projectId
      );

      const uploadedURLs = await Promise.all(
        files.map(async (uri) => {
          try {
            const fileResponse = await uploadFile({ uri: uri }, "image");
            return fileResponse;
          } catch (err) {
            Alert.alert(
              "error",
              "Upload Error",
              `Failed to upload: ${err.message}`
            );
            return null;
          }
        })
      );

      const updatedSolutions = jobDoc?.solutions
        ? [...jobDoc.solutions, ...uploadedURLs]
        : uploadedURLs;

      await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.jobCollectionID,
        projectId,
        { solutions: updatedSolutions }
      );

      Alert.alert("Success", "Your solutions have been submitted.");
      navigation.goBack();
    } catch (err) {
      console.log(err);

      Alert.alert("Error", "Failed to submit solutions. Please try again.");
    }
  };

  // const renderPreview = (file) => {
  //     const fileType = file.name.split(".").pop().toLowerCase();

  //     switch (fileType) {
  //         case "jpg":
  //         case "jpeg":
  //         case "png":
  //         case "gif":
  //             return <Image source={{ uri: file.uri }} style={styles.previewImage} />;
  //         case "pdf":
  //             return (
  //                 <TouchableOpacity
  //                     style={styles.openFileButton}
  //                     onPress={() => Linking.openURL(file.uri)}
  //                 >
  //                     <Text style={styles.openFileButtonText}>
  //                         Open PDF in Native Viewer
  //                     </Text>
  //                 </TouchableOpacity>
  //             );
  //         default:
  //             return (
  //                 <Text style={styles.unsupportedText}>
  //                     Preview not available for this file type.
  //                 </Text>
  //             );
  //     }
  // };

  const handleUpload = async () => {
    try {
      // Request permission for image picker
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Permission Denied", "Please grant access to your photos.");
        return;
      }

      // Launch image picker with proper configuration
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 1,
        allowsMultipleSelection: true,
      });

      if (pickerResult.assets && pickerResult.assets.length > 0) {
        const newImages = pickerResult.assets.map((asset) => asset.uri);
        setFiles((prev) => [...prev, ...newImages]);
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred while uploading files.");
    }
  };

  const openImageModal = (imageUri) => {
    setImages([{ url: imageUri }]);
    setModalVisible(true);
  };

  const handleDeleteFile = (index) => {
    const updatedFiles = [...files];
    updatedFiles.splice(index, 1);
    setFiles(updatedFiles);
  };

  return (
    <View style={styles.container}>
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
      <Text style={styles.headerText}>Submit Solutions</Text>

      <TouchableOpacity style={styles.uploadButton} onPress={handleUpload}>
        <Text style={styles.uploadButtonText}>Upload File</Text>
      </TouchableOpacity>

      <View style={styles.filePreviewContainer}>
        {files ? (
          files.map((image, index) => (
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
          ))
        ) : (
          <Text style={styles.emptyListText}>No files uploaded yet.</Text>
        )}
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {/* <Modal
                visible={!!previewFile}
                transparent={false}
                animationType="slide"
                onRequestClose={() => setPreviewFile(null)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setPreviewFile(null)}>
                            <AntDesign name="arrowleft" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={{ color: "#fff", fontSize: 18 }}>Solutions Preview</Text>
                    </View>
                    {previewFile && renderPreview(previewFile)}
                </View>
            </Modal> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 50,
    backgroundColor: "#fff",
  },
  headerText: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  uploadButton: {
    backgroundColor: "#4B0082",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.17,
    shadowRadius: 3.05,
    elevation: 4,
  },
  uploadButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  fileItem: {
    backgroundColor: "#f1f1f1",
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
  },
  fileText: {
    color: "#333",
  },
  emptyListText: {
    textAlign: "center",
    color: "#6c757d",
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 15,
  },
  submitButton: {
    backgroundColor: "#00871E",
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
    flex: 1,
    paddingVertical: 12,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.17,
    shadowRadius: 3.05,
    elevation: 4,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#B64928",
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 12,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.17,
    shadowRadius: 3.05,
    elevation: 4,
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  modalHeader: {
    width: "100%",
    paddingHorizontal: 25,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
    position: "absolute",
    zIndex: 999,
    top: 0,
    gap: 80,
  },
  previewImage: {
    width: "100%",
    height: "100%",
    resizeMode: "center",
    // marginBottom: 20,
  },
  closeButton: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 5,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
  },

  previewPDF: {
    width: "90%",
    height: "60%",
  },
  previewVideo: {
    width: "90%",
    height: "60%",
  },
  previewText: {
    width: "90%",
    height: "60%",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
  },
  unsupportedText: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
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
  filePreviewContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
    justifyContent: "center",
    gap: 10,
  },
  filePreviewWrapper1: {
    position: "relative",
    margin: 5,
  },
  filePreview1: {
    width: 140,
    height: 140,
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

export default SubmitSolutionScreen;
