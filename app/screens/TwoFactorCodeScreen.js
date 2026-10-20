import KeyboardAwareScrollView from "../components/KeyboardAwareScrollView";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Toast from "react-native-toast-message";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/NewAuthContext";
import apiService from "../lib/apiService";

const CODE_LENGTH = 6;

const TITLES = {
    login: "Verify it's you",
    enable: "Turn on two-factor",
    disable: "Turn off two-factor",
};

// Shared by the sign-in challenge (purpose "login") and the Security page's enable/disable confirmation
const TwoFactorCodeScreen = ({ navigation, route }) => {
    const { purpose = "login", challengeId, maskedMobile } = route.params || {};
    const isLogin = purpose === "login";

    const { theme, themeStyles } = useTheme();
    const currentTheme = themeStyles[theme];
    const styles = getStyles(currentTheme);

    const { verifyTwoFactorLogin } = useAuth();

    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleVerify = async () => {
        if (code.length !== CODE_LENGTH) {
            setError(`Enter the ${CODE_LENGTH}-digit code we sent you.`);
            return;
        }

        setSubmitting(true);
        setError("");
        try {
            if (isLogin) {
                // Signing in swaps the root navigator to the app, so no navigation is needed here
                await verifyTwoFactorLogin(challengeId, code);
                Toast.show({ type: "success", text1: "Login Successful!", text2: "Welcome back!" });
                return;
            }

            const result = await apiService.confirmTwoFactor(challengeId, code);
            Toast.show({
                type: "success",
                text1: result?.enabled ? "Two-factor turned on" : "Two-factor turned off",
            });
            navigation.navigate("TwoFactorAuth");
        } catch (err) {
            setError(err.message || "Verification failed. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAwareScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <View style={styles.main}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={currentTheme.text || "black"} />
                </TouchableOpacity>
                <Text style={styles.header}>{TITLES[purpose] || TITLES.login}</Text>
                <View style={styles.headerSpacer} />
            </View>

            <View style={styles.content}>
                <View style={styles.iconCircle}>
                    <Ionicons name="chatbubble-ellipses-outline" size={28} color="#892DFC" />
                </View>

                <Text style={styles.description}>
                    Enter the {CODE_LENGTH}-digit code sent to{" "}
                    <Text style={styles.bold}>{maskedMobile || "your mobile number"}</Text>.
                    {isLogin ? " It's needed once for each new device." : ""}
                </Text>

                <TextInput
                    style={[styles.input, !!error && styles.inputError]}
                    value={code}
                    onChangeText={(text) => {
                        setCode(text.replace(/\D/g, "").slice(0, CODE_LENGTH));
                        if (error) setError("");
                    }}
                    keyboardType="number-pad"
                    maxLength={CODE_LENGTH}
                    autoFocus
                    textContentType="oneTimeCode"
                    autoComplete="sms-otp"
                    placeholder="••••••"
                    placeholderTextColor="#BBB"
                    editable={!submitting}
                />

                {!!error && <Text style={styles.errorText}>{error}</Text>}

                <TouchableOpacity
                    style={[styles.buttonWrapper, (submitting || code.length !== CODE_LENGTH) && styles.buttonDisabled]}
                    onPress={handleVerify}
                    disabled={submitting || code.length !== CODE_LENGTH}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={["#A155FD", "#892DFC", "#A459FE"]}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={styles.button}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.buttonText}>Verify</Text>
                        )}
                    </LinearGradient>
                </TouchableOpacity>

                <Text style={styles.helperText}>
                    Didn't get a code? Go back and try again.
                </Text>
            </View>
            </KeyboardAwareScrollView>
        </SafeAreaView>
    );
};

const getStyles = (currentTheme) =>
    StyleSheet.create({
        scrollContent: {
            flexGrow: 1,
        },
        container: {
            flex: 1,
            backgroundColor: currentTheme.background2 || "#f9f9f9",
        },
        main: {
            minHeight: 52,
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 12,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
        },
        backButton: {
            width: 36,
            height: 36,
            justifyContent: "center",
            alignItems: "flex-start",
        },
        header: {
            fontSize: 18,
            fontWeight: "700",
            textAlign: "center",
            color: currentTheme.text || "black",
        },
        headerSpacer: {
            width: 36,
        },
        content: {
            flex: 1,
            paddingHorizontal: 24,
            paddingTop: 24,
            alignItems: "center",
        },
        iconCircle: {
            width: 64,
            height: 64,
            borderRadius: 32,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#F3EAFF",
            marginBottom: 16,
        },
        description: {
            fontSize: 14,
            lineHeight: 20,
            color: currentTheme.subText || "#666",
            textAlign: "center",
            marginBottom: 24,
        },
        bold: {
            fontWeight: "700",
            color: currentTheme.text || "#333",
        },
        input: {
            width: "100%",
            height: 56,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#E5E5E5",
            backgroundColor: "#FFFFFF",
            fontSize: 24,
            fontWeight: "700",
            letterSpacing: 10,
            textAlign: "center",
            color: currentTheme.text || "#333",
        },
        inputError: {
            borderColor: "#EF4444",
        },
        errorText: {
            alignSelf: "flex-start",
            color: "#EF4444",
            fontSize: 13,
            marginTop: 8,
        },
        buttonWrapper: {
            width: "100%",
            marginTop: 24,
            borderRadius: 12,
            shadowColor: "#8935FC",
            shadowOpacity: 0.35,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: 4,
        },
        buttonDisabled: {
            opacity: 0.5,
        },
        button: {
            height: 52,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
        },
        buttonText: {
            color: "#FFFFFF",
            fontSize: 16,
            fontWeight: "600",
        },
        helperText: {
            marginTop: 16,
            fontSize: 13,
            color: currentTheme.subText || "#888",
        },
    });

export default TwoFactorCodeScreen;
