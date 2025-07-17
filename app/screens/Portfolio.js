import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import Checkbox from "expo-checkbox";
import Toast from "react-native-toast-message";
// import { useAppwrite } from "../context/AppwriteContext";
// import { Query } from "react-native-appwrite";
import { useAuth } from "../context/NewAuthContext";

const PortfolioScreen = ({ navigation, route }) => {
  // const { appwriteConfig, databases, uploadFile, account } = useAppwrite();
  const [portfolioImages, setPortfolioImages] = useState([]);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeTnC, setAgreeTnC] = useState(false);
  // const { checkUserSession } = useAuth();
  const { role } = route.params;

  const showToast = (type, title, message) => {
    Toast.show({
      type,
      text1: title,
      text2: message,
    });
  };

  const uploadPortfolioImages = async () => {
    try {
      let permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        showToast("error", "Permission Denied", "Grant access to photos.");
        return;
      }

      let pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        allowsMultipleSelection: true,
      });

      if (!pickerResult.canceled) {
        const newImages = pickerResult.assets.map((asset) => asset.uri);
        setPortfolioImages([...portfolioImages, ...newImages]);
      }
    } catch (error) {
      showToast("error", "Error", `Failed to pick images: ${error.message}`);
    }
  };

  const removeImage = (index) => {
    setPortfolioImages(portfolioImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!agreeTerms || !agreeTnC) {
      showToast("error", "Agreement Missing", "Agree to terms to proceed.");
      return;
    }

    if (portfolioImages.length === 0) {
      showToast(
        "error",
        "Portfolio Missing",
        "Upload at least one portfolio image."
      );
      return;
    }

    try {
      // TODO: Update to use new backend
      // const user = await account.get();

      // const response = await databases.listDocuments(
      //   appwriteConfig.databaseId,
      //   appwriteConfig.freelancerCollectionId,
      //   [Query.equal("email", user.email)]
      // );

      // if (response.documents.length === 0) {
      //   showToast(
      //     "error",
      //     "User Not Found",
      //     "No user with the provided email."
      //   );
      //   return;
      // }

      showToast(
        "info",
        "Feature Coming Soon",
        "Portfolio upload functionality will be available soon."
      );
      
      // For now, navigate to the next step
      navigation.navigate("Tabs");
    } catch (error) {
      showToast("error", "Error", `Failed to submit: ${error.message}`);
    }
  };

  const handleSubmitClient = async () => {
    if (!agreeTerms || !agreeTnC) {
      showToast("error", "Agreement Missing", "Agree to terms to proceed.");
      return;
    }

    try {
      // TODO: Update to use new backend
      // const user = await account.get();

      // const response = await databases.listDocuments(
      //   appwriteConfig.databaseId,
      //   appwriteConfig.clientCollectionId,
      //   [Query.equal("email", user.email)]
      // );

      // if (response.documents.length === 0) {
      //   showToast(
      //     "error",
      //     "User Not Found",
      //     "No user with the provided email."
      //   );
      //   return;
      // }

      // const userDocumentId = response.documents[0].$id;

      // await databases.updateDocument(
      //   appwriteConfig.databaseId,
      //   appwriteConfig.clientCollectionId,
      //   userDocumentId,
      //   {
      //     terms_accepted: true,
      //     updated_at: new Date().toISOString(),
      //   }
      // );

      showToast("success", "Success", "Portfolio submitted successfully!");
      // await checkUserSession();
      navigation.navigate("Tabs", { screen: "Home" });
    } catch (error) {
      showToast("error", "Error", `Failed to submit: ${error.message}`);
    }
  };

  const skipScreen = async () => {
    try {
      // TODO: Add any necessary checks with new backend
      // await checkUserSession();
      navigation.navigate("Tabs", { screen: "Home" });
    } catch (error) {
      Alert.alert("Error during session check");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>
        {role === "client" ? "Read it loud" : "Portfolio"}
      </Text>

      <TouchableOpacity style={styles.skipButton} onPress={skipScreen}>
        <Text style={styles.skipButtonText}>Skip</Text>
      </TouchableOpacity>

      <Text style={styles.instructions}>
        {role === "client"
          ? "Please read and agree before proceeding on BirdEARNER:"
          : "Please read before adding your portfolio on BirdEARNER:"}
      </Text>

      {role === "client" ? (
        <View style={styles.containerMain}>
          <Text style={styles.boldText}>General Rules</Text>
          <Text style={styles.bulletPoints}>
            1. Upload your image in 1080x1080 px
          </Text>
          <Text style={styles.bulletPoints}>
            2. Image size should be between 100 KB~2 MB.
          </Text>
          <Text style={styles.bulletPoints}>
            3. Don’t upload any inappropriate or NSFW content.
          </Text>
          <Text style={styles.bulletPoints}>4. Don’t fraud......</Text>
          <Text style={styles.boldText}>Terms & Conditions</Text>
          <Text style={styles.bulletPoints}>
            1. Upload your image in 1080x1080 px
          </Text>
          <Text style={styles.bulletPoints}>
            2. Image size should be between 100 KB~2 MB.
          </Text>
          <Text style={styles.bulletPoints}>
            3. Don’t upload any inappropriate or NSFW content.
          </Text>
          <Text style={styles.bulletPoints}>4. Don’t fraud......</Text>
          <Text style={styles.bulletPoints}>
            5. Image size should be between 100 KB~2 MB.
          </Text>
        </View>
      ) : (
        <View>
          <Text style={styles.bulletPoint}>
            1. Upload your image in 1080x1080 px
          </Text>
          <Text style={styles.bulletPoint}>
            2. Image size should be between 100 KB-2 MB.
          </Text>
          <Text style={styles.bulletPoint}>
            3. Don’t upload any inappropriate or NSFW content.
          </Text>
        </View>
      )}

      {role === "freelancer" && (
        <TouchableOpacity
          style={styles.imageUploadButton}
          onPress={uploadPortfolioImages}
        >
          <Text style={styles.imageUploadButtonText}>
            Upload Portfolio Images
          </Text>
        </TouchableOpacity>
      )}

      {role === "freelancer" && (
        <View style={styles.uploadedImages}>
          {portfolioImages.map((image, index) => (
            <View key={index} style={styles.imagePreviewContainer}>
              <Image source={{ uri: image }} style={styles.uploadedImage} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeImage(index)}
              >
                <Text style={styles.removeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Terms and Conditions Checkboxes */}
      <View style={styles.checkboxContainer}>
        <Checkbox
          value={agreeTerms}
          onValueChange={setAgreeTerms}
          color={agreeTerms ? "#ff9800" : undefined}
        />
        <Text style={styles.checkboxLabel}>
          I accept that all the work uploaded on BirdEARNER by me is authentic
          and belongs to me.
        </Text>
      </View>

      <View style={styles.checkboxContainer}>
        <Checkbox
          value={agreeTnC}
          onValueChange={setAgreeTnC}
          color={agreeTnC ? "#ff9800" : undefined}
        />
        <Text style={styles.checkboxLabel}>
          I agree upon all the <Text style={styles.link}>T&C</Text> and proceed.
        </Text>
      </View>

      {/* Navigation Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.nextButtonText}>Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={role === "client" ? handleSubmitClient : handleSubmit}
        >
          <Text style={styles.nextButtonText}>Submit</Text>
        </TouchableOpacity>
      </View>

      <Toast />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#3b006b",
    paddingHorizontal: 25,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 40,
    fontWeight: "600",
  },
  skipButton: {
    position: "absolute",
    top: 40,
    right: 20,
    padding: 10,
    borderRadius: 8,
  },
  skipButtonText: {
    color: "#ffffff",
    fontWeight: "350",
    fontSize: 20,
  },
  instructions: {
    color: "#ffffff",
    fontSize: 16,
    marginBottom: 10,
    fontWeight: "600",
  },
  containerMain: {
    backgroundColor: "#fff",
    paddingHorizontal: 8,
    paddingBottom: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  boldText: {
    color: "#000",
    fontSize: 14,
    marginLeft: 10,
    fontWeight: "600",
    marginBottom: 7,
    marginTop: 15,
  },
  bulletPoint: {
    color: "#ffffff",
    fontSize: 14,
    marginLeft: 10,
  },
  bulletPoints: {
    color: "#000",
    fontSize: 14,
    marginLeft: 10,
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
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  checkboxLabel: {
    color: "#ffffff",
    marginLeft: 10,
    fontSize: 14,
  },
  link: {
    textDecorationLine: "underline",
    color: "#ff9800",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
  },
  nextButton: {
    width: "32%",
    height: 40,
    backgroundColor: "#fff",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  nextButtonText: {
    color: "#6A0DAD",
    fontWeight: "bold",
    fontSize: 20,
  },
});

export default PortfolioScreen;
