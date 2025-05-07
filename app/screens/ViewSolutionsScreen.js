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
} from "react-native";
import { useAppwrite } from "../context/AppwriteContext";

const ViewSolutionsScreen = ({ route, navigation }) => {
  const { appwriteConfig, databases } = useAppwrite();
  const { projectId } = route.params;
  const [solutions, setSolutions] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSolutions = async () => {
      setLoading(true);
      try {
        const jobDoc = await databases.getDocument(
          appwriteConfig.databaseId,
          appwriteConfig.jobCollectionID,
          projectId
        );

        if (jobDoc?.solutions && jobDoc.solutions.length > 0) {
          setSolutions(jobDoc.solutions);
        } else {
          Alert.alert("No Solutions", "No solutions have been submitted yet.");
        }
      } catch (err) {
        Alert.alert("Error", "Failed to load solutions. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchSolutions();
  }, [projectId]);

  const handleDownload = (fileUri) => {
    Alert.alert("Download", `You can't download for now.`);
    // Here, you can implement file download functionality if needed
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>View Solutions</Text>

      {loading ? (
        <Text style={styles.loadingText}>Loading...</Text>
      ) : (
        <FlatList
          style={{ marginLeft: 30 }}
          data={solutions}
          keyExtractor={(item, index) => `${item}-${index}`}
          // horizontal
          numColumns={3}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.fileItem}
              onPress={() => setPreviewFile(item)}
              onLongPress={() => handleDownload(item)}
            >
              <Image source={{ uri: item }} style={styles.filePreview1} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyListText}>No solutions available.</Text>
          }
        />
      )}

      <Modal visible={!!previewFile} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalHeader}>File Preview</Text>
          <Image source={{ uri: previewFile }} style={styles.previewImage} />
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setPreviewFile(null)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
    paddingTop: 50,
  },
  headerText: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  loadingText: {
    textAlign: "center",
    color: "#6c757d",
    fontSize: 16,
  },
  fileItem: {
    backgroundColor: "#fff",
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
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalHeader: {
    fontSize: 20,
    color: "#fff",
    marginBottom: 20,
  },
  previewImage: {
    width: "80%",
    height: "50%",
    resizeMode: "contain",
    marginBottom: 20,
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
  filePreview1: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
});

export default ViewSolutionsScreen;
