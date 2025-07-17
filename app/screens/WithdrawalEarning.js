import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/NewAuthContext";
import { useAppwrite } from "../context/AppwriteContext";
import Toast from "react-native-toast-message";
import { ID } from "react-native-appwrite";
import { useTheme } from "../context/ThemeContext";

const WithdrawalEarningScreen = ({ navigation }) => {
  const { appwriteConfig, databases } = useAppwrite();
  const [amount, setAmount] = useState(0);
  const [warning, setWarning] = useState("");
  const { userData } = useAuth();
  const totalAmountInWallet = userData?.withdrawableAmount || 0;

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];

  const styles = getStyles(currentTheme);

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

  const handleAmountChange = (value) => {
    const numericValue = parseFloat(value);

    if (isNaN(numericValue) || numericValue < 0) {
      setWarning("Please enter a valid amount.");
      setAmount("");
    } else if (numericValue > totalAmountInWallet) {
      // If the entered amount exceeds the total amount, adjust it to totalAmount
      setAmount(totalAmountInWallet.toString());
      setWarning("Adjusted to maximum withdrawal.");
    } else {
      setWarning("");
      setAmount(value);
    }
  };

  const handleProcess = async () => {
    const freelancerId = userData?.$id;

    if (amount <= 0) {
      handleError("PLease enter amount");
      return;
    }

    try {
      await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.withdrawalRequestsCollectionId,
        ID.unique(),
        {
          freelancerId,
          requestedAmount: parseInt(amount),
          status: "pending",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      );

      const remainingAmount = totalAmountInWallet - amount;

      await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.freelancerCollectionId,
        freelancerId,
        {
          withdrawableAmount: remainingAmount,
        }
      );

      handleSuccess("Withdrawal request submitted successfully!");

      navigation.navigate("Wallet");
    } catch (error) {
      handleError("Failed to submit withdrawal request.");
    }
  };

  return (
    <View style={styles.container}>
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
        <Text style={styles.header}>Withdrawal Earning</Text>
      </View>

      {/* Total Amount in Wallet */}
      <Text style={styles.label}>Total Amount in Wallet</Text>
      <Text style={styles.colorText}>
        RS. {userData?.withdrawableAmount || "0"}
      </Text>

      {/* Withdrawal Amount Input */}
      <Text style={styles.label}>Enter the amount you want to withdraw</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter amount"
        value={amount}
        onChangeText={handleAmountChange}
        keyboardType="numeric"
        autoComplete="off"
      />

      {warning !== "" && <Text style={styles.warning}>{warning}</Text>}

      {/* Amount to Withdraw */}
      <Text style={styles.label}>You’re withdrawing</Text>
      <View style={styles.withdrawal}>
        <Text style={styles.withdrawalText}>RS. {amount}</Text>
      </View>

      <TouchableOpacity style={styles.signupButton} onPress={handleProcess}>
        <Text style={styles.signupButtonText}>Process</Text>
      </TouchableOpacity>

      <Toast />
    </View>
  );
};

const getStyles = (currentTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: currentTheme.background || "#FFF",
      paddingHorizontal: 40,
    },
    main: {
      marginTop: 45,
      marginBottom: 50,
      display: "flex",
      flexDirection: "row",
      gap: 50,
      alignItems: "center",
    },
    header: {
      fontSize: 24,
      fontWeight: "bold",
      textAlign: "center",
      color: currentTheme.text,
    },
    label: {
      fontSize: 18,
      color: currentTheme.text || "#000000",
      marginBottom: 8,
      fontWeight: "400",
      textAlign: "center",
    },
    colorText: {
      fontSize: 24,
      fontWeight: "600",
      color: currentTheme.primary || "#4B0082",
      textAlign: "center",
      marginBottom: 30,
    },
    withdrawal: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      marginTop: 10,
    },
    withdrawalText: {
      color: "#fff",
      fontSize: 24,
      fontWeight: "600",
      textAlign: "center",
      backgroundColor: currentTheme.primary || "#4B0082",
      // width: 100,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 12,
    },
    input: {
      // width: "100%",
      height: 44,
      backgroundColor: currentTheme.background3 || "#fff",
      borderRadius: 12,
      paddingHorizontal: 20,
      // marginBottom: 40,
      fontSize: 16,
      borderColor: "#4B0082",
      borderWidth: 2,
      marginVertical: 10,
      margin: "auto",
      color: currentTheme.subText,
    },
    warning: {
      color: "red",
      fontSize: 14,
      textAlign: "center",
      marginBottom: 40,
    },
    signupButton: {
      width: "50%",
      height: 50,
      backgroundColor: currentTheme.primary || "#6A0DAD",
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 50,
      margin: "auto",
    },
    signupButtonText: {
      color: "white",
      fontSize: 24,
      fontWeight: "700",
    },
  });

export default WithdrawalEarningScreen;
