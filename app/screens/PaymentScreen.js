import React, { useState } from "react";
import {
  View,
  Button,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import RazorpayCheckout from "react-native-razorpay";
import { useAuth } from "../context/NewAuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import apiService from "../lib/apiService"; // Import the singleton instance
import Toast from "react-native-toast-message";

// Development mode flag - set to false for production
const DEV_MODE = false;

const PaymentScreen = ({ navigation }) => {
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const { userData, userProfile } = useAuth();
  const pic =
    apiService.loadImageURI(userProfile?.profilePhoto) ||
    "https://example.com/default-profile-pic.png";
  const name = userData?.fullName || "Guest User";
  const email = userData?.email || "user@gmail.com";
  const [amount, setAmount] = useState("");

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];

  const styles = getStyles(currentTheme);

  const handleAmountChange = (value) => {
    setAmount(value);
  };

  const handlePayment = async () => {
    try {
      // Validate amount
      if (!amount || parseFloat(amount) <= 0) {
        alert("Please enter a valid amount greater than 0");
        return;
      }

      await apiService.init(); // Initialize API service with token

      let paymentData;

      if (DEV_MODE) {
        // Simulate payment in development mode
        console.log("DEV MODE: Simulating Razorpay payment");
        alert("DEV MODE: Simulating payment success");

        // Simulate payment data
        paymentData = {
          razorpay_payment_id: `dev_payment_${Date.now()}`,
          razorpay_order_id: `dev_order_${Date.now()}`,
          razorpay_signature: "dev_signature_mock",
        };
      } else {
        // Real Razorpay checkout for production
        const options = {
          description: `Add ₹${amount} to wallet`,
          image: pic,
          currency: "INR",
          key: "rzp_test_Jl7LJ6dEC1YfnX",
          amount: amount * 100,
          name: name,
          prefill: {
            email: email,
            phone: "4141414141",
            name: name,
          },
          theme: { color: "#4B0082" },
        };

        try {
          paymentData = await RazorpayCheckout.open(options);
        } catch (error) {
          // Razorpay returns error object on cancellation or failure
          if (
            error &&
            (error.code === 0 ||
              error.description === "Payment Cancelled" ||
              (error.error && error.error.description === "Payment Cancelled"))
          ) {
            Toast.show({
              type: "info",
              text: "Payment cancelled",
            });
            return;
          } else {
            // Real payment error
            console.error("Payment error:", error);
            console.log({ error });

            alert("Payment failed. Please try again.");
            return;
          }
        }
      }

      await updateWalletAmount(amount, paymentData.razorpay_payment_id);
      setPaymentSuccess(true);
    } catch (error) {
      console.error("Payment error:", error);
      const errorMessage = DEV_MODE
        ? "DEV MODE: Simulated payment failed"
        : "Payment failed. Please try again.";
      alert(errorMessage);
    }
  };

  const updateWalletAmount = async (addedAmount, paymentId) => {
    try {
      if (!userData || !userData.id) {
        throw new Error("User not authenticated");
      }

      // Add money to wallet using Node.js API
      const result = await apiService.addMoneyToWallet(
        parseFloat(addedAmount),
        `Razorpay deposit - Payment ID: ${paymentId}`,
        paymentId
      );

      if (result.success) {
        alert(
          `₹${addedAmount} added successfully! Your new wallet balance is ₹${result.data.newBalance}.`
        );
      } else {
        throw new Error(result.message || "Failed to update wallet");
      }
    } catch (error) {
      console.error("Wallet update error:", error);
      alert("Failed to update wallet. Please contact support.");
      throw error; // Re-throw to prevent setting payment success
    }
  };

  return (
    <View style={styles.container}>
      {!paymentSuccess && (
        <View style={styles.main}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={currentTheme.text || "#000"}
            />
          </TouchableOpacity>
          <Text style={styles.header}>Add Amount to Wallet</Text>
        </View>
      )}

      {!paymentSuccess && (
        <>
          <Text style={styles.label}>Enter the amount you want to add</Text>
          <TextInput
            placeholderTextColor="#c4c4c4"
            style={styles.input}
            placeholder="Enter amount"
            value={amount}
            onChangeText={handleAmountChange}
            keyboardType="numeric"
          />
        </>
      )}

      {paymentSuccess ? (
        <View style={styles.paymentContainer}>
          <Image source={{ uri: pic }} style={styles.image} />
          <Text style={styles.description}>Thank you, {name}!</Text>
          <Text style={styles.amount}>Added Amount: ₹{amount}</Text>
          <TouchableOpacity
            style={styles.goBackk}
            onPress={() => navigation.goBack()}
          >
            <Ionicons
              name="arrow-back"
              size={20}
              color={currentTheme.subText || "#000"}
            />
            <Text style={{ color: currentTheme.subText }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.signupButton} onPress={handlePayment}>
          <Text style={styles.signupButtonText}>
            {DEV_MODE ? "Add Now (DEV)" : "Add Now"}
          </Text>
        </TouchableOpacity>
      )}
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
      // justifyContent: "center",
      alignContent: "center",
      alignItems: "center",
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
      marginRight: 50,
    },
    label: {
      fontSize: 18,
      color: currentTheme.text || "#000000",
      marginBottom: 8,
      fontWeight: "400",
      textAlign: "center",
    },
    input: {
      width: "80%",
      height: 44,
      backgroundColor: currentTheme.background3 || "#fff",
      borderRadius: 12,
      paddingHorizontal: 20,
      marginBottom: 40,
      fontSize: 16,
      borderColor: "#4B0082",
      borderWidth: 2,
      marginVertical: 10,
      color: currentTheme.subText || "#000000",
    },
    paymentContainer: {
      alignItems: "center",
      backgroundColor: currentTheme.cardBackground || "#fff",
      padding: 20,
      borderRadius: 10,
      shadowColor: currentTheme.shadow || "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
      alignContent: "center",
      justifyContent: "center",
      marginVertical: 160,
    },
    image: {
      width: 150,
      height: 100,
      resizeMode: "cover",
      borderRadius: 10,
      marginBottom: 10,
    },
    description: {
      fontSize: 18,
      marginBottom: 10,
      color: currentTheme.text,
    },
    amount: {
      fontSize: 16,
      marginBottom: 20,
      color: currentTheme.text,
    },
    signupButton: {
      width: "50%",
      height: 50,
      backgroundColor: "#4B0082",
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 50,
    },
    signupButtonText: {
      color: "white",
      fontSize: 24,
      fontWeight: "700",
    },
    goBackk: {
      display: "flex",
      flexDirection: "row",
      gap: 8,
    },
  });

export default PaymentScreen;
