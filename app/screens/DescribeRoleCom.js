import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useAppwrite } from "../context/AppwriteContext";
import Toast from "react-native-toast-message";
import { Picker } from "@react-native-picker/picker";
import { ID, Query } from "react-native-appwrite";

const DescribeRoleCom = ({ navigation, route }) => {
  const { account, appwriteConfig, databases } = useAppwrite();
  const { fullName, email, role } = route.params;
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

  const handleInputChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
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
      role === "client"
        ? [
            "designation",
            "heading",
            "city",
            "state",
            "zipCode",
            "country",
            "bio",
          ]
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
      if (
        !formData[field] ||
        (Array.isArray(formData[field]) && !formData[field].length)
      ) {
        showToast("info", "All fields are required.");
        return false;
      }
    }
    return true;
  };

  const authenticateUser = async () => {
    try {
      return await account.getSession("current");
    } catch {
      await account.createEmailPasswordSession(email, password);
    }
  };

  // 678223c5002d015d1667

  const saveDetails = async () => {
    if (!validateForm()) return;

    try {
      const user = await authenticateUser();

      const collectionId =
        role === "client"
          ? appwriteConfig.clientCollectionId
          : appwriteConfig.freelancerCollectionId;

      const payload =
        role === "client"
          ? {
              full_name: fullName,
              email,
              role,
              organization_type: formData.designation,
              company_name: formData.heading,
              city: formData.city,
              state: formData.state,
              zipcode: parseInt(formData.zipCode),
              country: formData.country,
              profile_description: formData.bio,
              userId: user.userId,
            }
          : {
              full_name: fullName,
              email,
              role,
              role_designation: formData.designations,
              highest_qualification: formData.qualification,
              experience: parseInt(formData.experience),
              profile_heading: formData.heading,
              city: formData.city,
              state: formData.state,
              zipcode: parseInt(formData.zipCode),
              country: formData.country,
              userId: user.userId,
            };

      await databases.createDocument(
        appwriteConfig.databaseId,
        collectionId,
        ID.unique(),
        { ...payload, created_at: new Date().toISOString() }
      );

      showToast("success", `${role} details saved successfully.`);
      navigation.navigate("TellUsAboutYouCom", { role });
    } catch (error) {
      showToast("error", `Error saving details: ${error.message}`);
    }
  };

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.roleCollectionID,
          [Query.equal("category", ["freelance_service", "household_service"])]
        );
        const roles = response.documents.map((doc) => doc.role).flat();
        setServices(roles);
      } catch (error) {
        showToast("error", "Error fetching services.");
      }
    };
    fetchServices();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>
        {role === "client" ? "Tell us about yourself" : "Describe Your Role"}
      </Text>

      {/* Role/Designation */}
      <Text style={styles.label}>
        {role === "client" ? "Type of your organisation" : "Role/Designation"}
      </Text>
      {role === "client" ? (
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
            >
              <Picker.Item label="Select Role" value="" />
              {services.map((service, id) => (
                <Picker.Item key={id} label={service} value={service} />
              ))}
            </Picker>
          </View>

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

      {role === "freelancer" && (
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
        {role === "client"
          ? "Company Name (Optional)"
          : "Heading on your profile"}
      </Text>
      <TextInput
        style={styles.input}
        placeholder={
          role === "client" ? "Company name" : "E.g. I am a designer"
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
      {role === "client" && (
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

      {/* Next Button */}
      <TouchableOpacity style={styles.nextButton} onPress={saveDetails}>
        <Text style={styles.nextButtonText}>Next</Text>
      </TouchableOpacity>

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
  nextButton: {
    width: "32%",
    height: 40,
    backgroundColor: "#fff",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    marginLeft: 230,
  },
  nextButtonText: {
    color: "#6A0DAD",
    fontWeight: "bold",
    fontSize: 20,
  },
});

export default DescribeRoleCom;
