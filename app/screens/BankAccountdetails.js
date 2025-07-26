import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import apiService from "../lib/apiService";
import { useTheme } from "../context/ThemeContext";

// Define state hooks
const BankAccountDetailsScreen = ({ navigation }) => {
  const [bankName, setBankName] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [confirmAccountNumber, setConfirmAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [isEditingAccountNumber, setIsEditingAccountNumber] = useState(false);
  const [isEditingIfscCode, setIsEditingIfscCode] = useState(false);

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];

  const styles = getStyles(currentTheme);

  useEffect(() => {
    const fetchBankDetails = async () => {
      try {
        const res = await apiService.getUserBankDetails();
        console.log({res});
        
        if (res) {
          const { bankName, accountHolderName, accountNumber, ifscCode } = res;
          setBankName(bankName || "");
          setAccountHolderName(accountHolderName || "");
          setAccountNumber(accountNumber || "");
          setIfscCode(ifscCode || "");
        }
      } catch (err) {
        console.error("Failed to fetch bank details", err);
        Toast.show({
          type: "error",
          text1: "Error fetching bank details",
        });
      }
    };

    fetchBankDetails();
  }, []);

  const handleSave = async () => {
    if (accountNumber !== confirmAccountNumber) {
      Toast.show({
        type: "error",
        text1: "Account numbers do not match",
      });
      return;
    }

    try {
      await apiService.updateBankDetails({
        bankName,
        accountHolderName,
        accountNumber,
        ifscCode,
      });

      Toast.show({
        type: "success",
        text1: "Bank details saved successfully",
      });

      // Optionally clear input or navigate back
    } catch (err) {
      console.error("Error saving bank details:", err);
      Toast.show({
        type: "error",
        text1: "Failed to save bank details",
      });
    }
  };

  const maskValue = (val) => {
    if (!val) return "";
    return "*".repeat(val.length - 2) + val.slice(-2);
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
