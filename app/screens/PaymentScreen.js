import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  ActivityIndicator,
} from "react-native";
import LottieView from "lottie-react-native";
import { LinearGradient } from "expo-linear-gradient";
import RazorpayCheckout from "react-native-razorpay";
import { useAuth } from "../context/NewAuthContext";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import apiService from "../lib/apiService";
import Toast from "react-native-toast-message";
import Constants from 'expo-constants';

const expoConfig = Constants.expoConfig;
const extra = expoConfig.extra;

const PaymentScreen = ({ navigation }) => {
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [amount, setAmount] = useState("");
  const [amountAnimation] = useState(new Animated.Value(0));
  const [isLoading, setIsLoading] = useState(false);
  const { userData, userProfile, refreshUserData } = useAuth();
  const pic =
    apiService.loadImageURI(userProfile?.profilePhoto) ||
    "https://example.com/default-profile-pic.png";
  const name = userData?.fullName || "Guest User";
  const email = userData?.email || "user@gmail.com";

  useEffect(() => {
    Animated.spring(amountAnimation, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];

  const styles = getStyles(currentTheme);

  const handleAmountChange = (value) => {
    // Only allow numbers and decimal point
    const numericValue = value.replace(/[^0-9.]/g, "");
    setAmount(numericValue);
  };

  const handlePayment = async () => {
    try {
      setIsLoading(true);

      const parsedAmount = parseFloat(amount);
      // Validate amount
      if (!amount || parsedAmount <= 0) {
        Toast.show({
          type: "error",
          text1: "Invalid Amount",
          text2: "Please enter a valid amount greater than 0",
        });
        return;
      }

      await apiService.init(); // Initialize API service with token

      // NEW SECURE FLOW

      // 1. Create order on backend
      const orderResponse = await apiService.createPaymentOrder(
        parsedAmount,
        "WALLET_DEPOSIT"
      );

      if (!orderResponse.success) {
        throw new Error(orderResponse.message || "Failed to initialize payment order");
      }

      const { order } = orderResponse;

      const options = {
        description: "Add ₹" + amount + " to wallet",
        image: pic,
        currency: order.currency,
        key: order.key,
        amount: order.amount,
        order_id: order.id,
        name: name,
        prefill: {
          email: email,
          phone: userProfile?.mobileNumber || "",
          name: name,
        },
        theme: { color: "#4B0082" },
      };

      try {
        const razorpayResponse = await RazorpayCheckout.open(options);

        // 2. Verify payment on backend
        const verificationResult = await apiService.verifyPayment({
          razorpay_order_id: razorpayResponse.razorpay_order_id,
          razorpay_payment_id: razorpayResponse.razorpay_payment_id,
          razorpay_signature: razorpayResponse.razorpay_signature
        });

        if (verificationResult.success) {
          setPaymentSuccess(true);
          await refreshUserData();
          Toast.show({
            type: "success",
            text1: "Payment Successful",
            text2: "₹" + amount + " added to your wallet!",
          });
        } else {
          throw new Error(verificationResult.message || "Payment verification failed");
        }
      } catch (error) {
        if (
          error?.code === 0 ||
          error?.description === "Payment Cancelled" ||
          error?.error?.description === "Payment Cancelled"
        ) {
          Toast.show({
            type: "info",
            text1: "Payment Cancelled",
            text2: "You cancelled the payment",
          });
          return;
        }
        throw error;
      }
    } catch (error) {
      console.error("Payment error:", error);
      Toast.show({
        type: "error",
        text1: "Payment Failed",
        text2: error.message || "Please try again later",
      });
    } finally {
      setIsLoading(false);
    }
  };

  console.log({ mayur: userData?.isTestAccount });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {!paymentSuccess && (
          <View style={styles.main}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={currentTheme.text} />
            </TouchableOpacity>
            <Text style={[styles.header, { color: currentTheme.text }]}>
              Add Money to Wallet
            </Text>
          </View>
        )}
        {!paymentSuccess ? (
          <Animated.View
            style={[
              styles.inputContainer,
              {
                transform: [
                  {
                    scale: amountAnimation,
                  },
                ],
              },
            ]}
          >
            <Text style={styles.label}>Enter Amount (₹)</Text>
            <Text style={styles.label}>{userData?.isTestAccount ? "Test Account" : "Real Account"}</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor="#c4c4c4"
              value={amount}
              onChangeText={handleAmountChange}
              keyboardType="numeric"
              maxLength={10}
            />
            <TouchableOpacity
              style={[styles.addButton, isLoading && styles.disabledButton]}
              onPress={handlePayment}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <FontAwesome5 name="wallet" size={20} color="#fff" />
                  <Text style={styles.addButtonText}>
                    {DEV_MODE ? "Add Now (DEV)" : "Add Now"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <View style={styles.successContainer}>
            <LottieView
              source={require("../assets/check-animation.json")}
              autoPlay
              loop={false}
              style={styles.successImage}
            />
            <Text style={styles.successText}>Payment Successful!</Text>
            <Text style={styles.amountText}>
              <Text>₹</Text>
              {amount}
              <Text> added to your wallet</Text>
            </Text>
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const getStyles = (currentTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    main: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 40,
      marginBottom: 30,
    },
    backButton: {
      padding: 10,
    },
    header: {
      fontSize: 24,
      fontWeight: "bold",
      marginLeft: 20,
    },
    inputContainer: {
      alignItems: "center",
      marginTop: 40,
    },
    label: {
      fontSize: 18,
      color: currentTheme.text,
      marginBottom: 15,
    },
    input: {
      width: "80%",
      height: 60,
      backgroundColor:
        currentTheme.cardBackground || currentTheme.surface || "#FFF",
      borderRadius: 15,
      paddingHorizontal: 20,
      fontSize: 24,
      fontWeight: "bold",
      color: currentTheme.text,
      textAlign: "center",
      shadowColor: currentTheme.shadowColor || "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
      borderColor: currentTheme.border,
      borderWidth: 1,
    },
    addButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      width: "60%",
      height: 50,
      backgroundColor: currentTheme.primary || "#4B0082",
      borderRadius: 25,
      marginTop: 30,
      shadowColor: currentTheme.shadowColor || "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    disabledButton: {
      opacity: 0.7,
    },
    addButtonText: {
      color: currentTheme.buttonText || "#fff",
      fontSize: 18,
      fontWeight: "bold",
      marginLeft: 10,
    },
    successContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    successImage: {
      width: 150,
      height: 150,
      marginBottom: 20,
    },
    successText: {
      fontSize: 24,
      fontWeight: "bold",
      color: currentTheme.text,
      marginBottom: 10,
    },
    amountText: {
      fontSize: 20,
      color: currentTheme.text,
      marginBottom: 30,
    },
    doneButton: {
      paddingHorizontal: 40,
      paddingVertical: 15,
      backgroundColor: currentTheme.primary || "#4B0082",
      borderRadius: 25,
    },
    doneButtonText: {
      color: currentTheme.buttonText || "#fff",
      fontSize: 18,
      fontWeight: "bold",
    },
  });

export default PaymentScreen;
