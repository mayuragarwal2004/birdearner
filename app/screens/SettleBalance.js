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
import RazorpayCheckout from "react-native-razorpay";
import { useAuth } from "../context/NewAuthContext";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import apiService from "../lib/apiService";
import Toast from "react-native-toast-message";

const SettleBalanceScreen = ({ navigation }) => {
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const { userData, userProfile, refreshUserData } = useAuth();

    // Calculate outstanding amount (absolute value if negative)
    const initialAmount = userProfile?.withdrawableAmount < 0
        ? Math.abs(parseFloat(userProfile.withdrawableAmount)).toFixed(2)
        : "";

    const [amount, setAmount] = useState(initialAmount);
    const [amountAnimation] = useState(new Animated.Value(0));
    const [isLoading, setIsLoading] = useState(false);

    const pic = apiService.loadImageURI(userProfile?.profilePhoto) || "https://example.com/default-profile-pic.png";
    const name = userData?.fullName || "Freelancer";
    const email = userData?.email || "";

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
        const numericValue = value.replace(/[^0-9.]/g, "");
        setAmount(numericValue);
    };

    const handlePayment = async () => {
        try {
            setIsLoading(true);

            const parsedAmount = parseFloat(amount);
            if (!amount || parsedAmount <= 0) {
                Toast.show({
                    type: "error",
                    text1: "Invalid Amount",
                    text2: "Please enter a valid amount to settle",
                });
                return;
            }

            await apiService.init();

            // NEW SECURE FLOW

            // 1. Create order on backend (Type: SETTLEMENT)
            const orderResponse = await apiService.createPaymentOrder(
                parsedAmount, 
                "Outstanding Balance Settlement",
                "SETTLEMENT"
            );

                if (!orderResponse.success) {
                    throw new Error(orderResponse.message || "Failed to initialize settlement order");
                }

                const { order } = orderResponse;

                const options = {
                    description: "Settle outstanding balance of ₹" + amount,
                    image: pic,
                    currency: order.currency,
                    key: order.key,
                    amount: order.amount,
                    order_id: order.id,
                    name: "Bird Earner Settlement",
                    prefill: {
                        email: email,
                        phone: userProfile?.mobileNumber || "",
                        name: name,
                    },
                    theme: { color: "#6A0DAD" },
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
                            text1: "Settlement Successful",
                            text2: "Your balance has been updated!",
                        });
                    } else {
                        throw new Error(verificationResult.message || "Settlement verification failed");
                    }

                } catch (error) {
                    if (error?.code === 0 || error?.description === "Payment Cancelled") {
                        Toast.show({
                            type: "info",
                            text1: "Payment Cancelled",
                        });
                        return;
                    }
                    throw error;
                }
        } catch (error) {
            console.error("Settlement error:", error);
            Toast.show({
                type: "error",
                text1: "Settlement Failed",
                text2: error.message || "Please try again later",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                {!paymentSuccess && (
                    <View style={styles.main}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color={currentTheme.text} />
                        </TouchableOpacity>
                        <Text style={[styles.header, { color: currentTheme.text }]}>
                            Settle Balance
                        </Text>
                    </View>
                )}

                {!paymentSuccess ? (
                    <Animated.View style={[styles.inputContainer, { transform: [{ scale: amountAnimation }] }]}>
                        <Text style={styles.label}>Settlement Amount (₹)</Text>
                        <View style={styles.debtInfo}>
                            <Text style={styles.debtLabel}>Current Outstanding:</Text>
                            <Text style={styles.debtValue}>₹{Math.abs(userProfile?.withdrawableAmount || 0).toFixed(2)}</Text>
                        </View>

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
                            style={[styles.settleButton, isLoading && styles.disabledButton]}
                            onPress={handlePayment}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <FontAwesome5 name="check-circle" size={20} color="#fff" />
                                    <Text style={styles.settleButtonText}>
                                        Pay Now
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
                        <Text style={styles.successText}>Settlement Successful!</Text>
                        <Text style={styles.amountText}>
                            ₹{amount} cleared from your account
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
            width: "100%",
        },
        label: {
            fontSize: 18,
            color: currentTheme.text,
            marginBottom: 5,
        },
        debtInfo: {
            flexDirection: "row",
            marginBottom: 20,
            alignItems: "baseline",
        },
        debtLabel: {
            fontSize: 14,
            color: currentTheme.subText || "#666",
            marginRight: 5,
        },
        debtValue: {
            fontSize: 16,
            fontWeight: "bold",
            color: "#FF3B30",
        },
        input: {
            width: "80%",
            height: 60,
            backgroundColor: currentTheme.cardBackground || "#FFF",
            borderRadius: 15,
            paddingHorizontal: 20,
            fontSize: 24,
            fontWeight: "bold",
            color: currentTheme.text,
            textAlign: "center",
            elevation: 5,
            borderColor: currentTheme.border,
            borderWidth: 1,
        },
        settleButton: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            width: "70%",
            height: 50,
            backgroundColor: "#6A0DAD",
            borderRadius: 25,
            marginTop: 30,
            elevation: 5,
        },
        disabledButton: {
            opacity: 0.7,
        },
        settleButtonText: {
            color: "#fff",
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
            fontSize: 18,
            color: currentTheme.subText || "#666",
            marginBottom: 30,
        },
        doneButton: {
            paddingHorizontal: 40,
            paddingVertical: 15,
            backgroundColor: "#6A0DAD",
            borderRadius: 25,
        },
        doneButtonText: {
            color: "#fff",
            fontSize: 18,
            fontWeight: "bold",
        },
    });

export default SettleBalanceScreen;
