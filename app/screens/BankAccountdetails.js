import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import Toast from "react-native-toast-message";
import { useTheme } from "../context/ThemeContext";
import { useAppwrite } from "../context/AppwriteContext";

const BankAccountDetailsScreen = ({ navigation }) => {
  const [bankName, setBankName] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [isEditingAccountNumber, setIsEditingAccountNumber] = useState(false);
  const [confirmAccountNumber, setConfirmAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [isEditingIfscCode, setIsEditingIfscCode] = useState(false);
  const { userData } = useAuth();
  const { appwriteConfig, databases } = useAppwrite();

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];

  const styles = getStyles(currentTheme);

  useEffect(() => {
    fetchBankDetails();
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

  const maskValue = (value) => {
    if (!value || value.length <= 4) return value;
    return "x".repeat(value.length - 4) + value.slice(-4);
  };

  const fetchBankDetails = async () => {
    try {
      if (userData) {
        setBankName(userData?.bankName || "");
        setAccountHolderName(userData?.accountHolderName || "");

        const accountNumber = userData?.accountNumber;
        setAccountNumber(accountNumber ? accountNumber.toString() : "");
        const ifsc = userData?.ifscCode;
        setIfscCode(ifsc || "");
      }
    } catch (error) {
      handleError("Error fetching bank details");
    }
  };

  const handleSave = async () => {
    if (accountNumber === confirmAccountNumber) {
      const collectionId =
        userData?.role === "client"
          ? appwriteConfig.clientCollectionId
          : appwriteConfig.freelancerCollectionId;

      try {
        const document = {
          bankName,
          accountHolderName,
          accountNumber: parseInt(accountNumber),
          ifscCode,
        };
        await databases.updateDocument(
          appwriteConfig.databaseId,
          collectionId,
          userData?.$id,
          document
        );

        handleSuccess("Bank Details Saved successfully!");
        navigation.goBack();
      } catch (error) {
        handleError("Error saving bank details");
      }
    } else {
      handleError("Account numbers do not match!");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.maincon}>
        <View style={styles.main}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={currentTheme.text || black}
            />
          </TouchableOpacity>
          <Text style={styles.header}>Bank Account details</Text>
        </View>

        <Text style={styles.label}>Select your bank</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter bank name"
          value={bankName}
          onChangeText={setBankName}
        />

        <Text style={styles.label}>Account holder name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter account holder's name"
          value={accountHolderName}
          onChangeText={setAccountHolderName}
        />

        <Text style={styles.label}>Enter your account number</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter account number"
          value={
            isEditingAccountNumber ? accountNumber : maskValue(accountNumber)
          }
          onFocus={() => {
            setIsEditingAccountNumber(true);
            setAccountNumber("");
          }}
          onChangeText={(text) => setAccountNumber(text)}
          keyboardType="numeric"
          secureTextEntry={isEditingAccountNumber}
        />

        <Text style={styles.label}>Confirm your account number</Text>
        <TextInput
          style={styles.input}
          placeholder="Re-enter account number"
          value={confirmAccountNumber}
          onChangeText={setConfirmAccountNumber}
          keyboardType="numeric"
          secureTextEntry
        />

        <Text style={styles.label}>Enter your bank IFSC code</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter IFSC code"
          value={isEditingIfscCode ? ifscCode : maskValue(ifscCode)}
          onFocus={() => {
            setIsEditingIfscCode(true);
            setIfscCode("");
          }}
          onChangeText={(text) => setIfscCode(text)}
          secureTextEntry={isEditingIfscCode}
        />

        <TouchableOpacity style={styles.signupButton} onPress={handleSave}>
          <Text style={styles.signupButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <Toast />
    </ScrollView>
  );
};

const getStyles = (currentTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: currentTheme.background || "#FFF",
      paddingHorizontal: 30,
    },
    maincon: {
      alignItems: "center",
    },
    main: {
      marginTop: 45,
      marginBottom: 50,
      flexDirection: "row",
      alignItems: "center",
      gap: 60,
    },
    header: {
      fontSize: 24,
      fontWeight: "bold",
      textAlign: "center",
      color: currentTheme.text,
      marginRight: 40,
    },
    label: {
      fontSize: 18,
      color: currentTheme.text || "#000000",
      marginBottom: 8,
      fontWeight: "400",
      textAlign: "center",
    },
    input: {
      width: "100%",
      height: 44,
      backgroundColor: currentTheme.background3 || "#f4f0f0",
      borderRadius: 12,
      paddingHorizontal: 20,
      marginBottom: 20,
      fontSize: 14,
      color: currentTheme.subText || "#000000",
    },
    signupButton: {
      width: "40%",
      height: 50,
      backgroundColor: currentTheme.primary || "#6A0DAD",
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 20,
    },
    signupButtonText: {
      color: "white",
      fontSize: 18,
      fontWeight: "700",
    },
  });

export default BankAccountDetailsScreen;
