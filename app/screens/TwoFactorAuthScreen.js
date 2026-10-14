import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import Toast from "react-native-toast-message";
import { useTheme } from "../context/ThemeContext";
import apiService from "../lib/apiService";
import { getDeviceInfo } from "../lib/deviceInfo";

const OPTIONS = [
    {
        value: true,
        title: "Yes",
        description: "Ask for a code sent to your mobile when you sign in from a device you haven't used before.",
    },
    {
        value: false,
        title: "No",
        description: "Sign in with your password only.",
    },
];

const TwoFactorAuthScreen = ({ navigation }) => {
    const { theme, themeStyles } = useTheme();
    const currentTheme = themeStyles[theme];
    const styles = getStyles(currentTheme);

    const [status, setStatus] = useState(null); // { enabled, hasMobile, maskedMobile }
    const [selected, setSelected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Reload on every focus so the page reflects a code that was just confirmed
    useFocusEffect(
        useCallback(() => {
            let active = true;

            const loadStatus = async () => {
                setLoading(true);
                try {
                    const data = await apiService.getTwoFactorStatus();
                    if (!active) return;
                    setStatus(data);
                    setSelected(!!data?.enabled);
                } catch (error) {
                    if (active) {
                        Toast.show({ type: "error", text1: "Couldn't load settings", text2: error.message });
                    }
                } finally {
                    if (active) setLoading(false);
                }
            };

            loadStatus();
            return () => {
                active = false;
            };
        }, [])
    );

    const hasChanged = !!status && selected !== status.enabled;
    const canChooseYes = !!status?.hasMobile;

    const handleContinue = async () => {
        const purpose = selected ? "enable" : "disable";
        setSubmitting(true);
        try {
            const device = await getDeviceInfo();
            const { challengeId, maskedMobile } = await apiService.sendTwoFactorCode(purpose, device);
            navigation.navigate("TwoFactorCode", { purpose, challengeId, maskedMobile });
        } catch (error) {
            Toast.show({ type: "error", text1: "Couldn't send code", text2: error.message });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.main}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={currentTheme.text || "black"} />
                </TouchableOpacity>
                <Text style={styles.header}>Two-Factor Authentication</Text>
                <View style={styles.headerSpacer} />
            </View>

            {loading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#892DFC" />
                </View>
            ) : (
                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    <Text style={styles.intro}>
                        Add an extra layer of security to your account. Turn it on to confirm new sign-ins with a
                        one-time code.
                    </Text>

                    {status && !status.hasMobile && (
                        <View style={styles.warningBox}>
                            <Ionicons name="alert-circle-outline" size={18} color="#B45309" />
                            <Text style={styles.warningText}>
                                Add a mobile number to your account to turn on two-factor authentication.
                            </Text>
                        </View>
                    )}

                    {OPTIONS.map((option) => {
                        const isSelected = selected === option.value;
                        const isDisabled = option.value && !canChooseYes;

                        return (
                            <TouchableOpacity
                                key={option.title}
                                style={[
                                    styles.optionContainer,
                                    isSelected && styles.optionSelected,
                                    isDisabled && styles.optionDisabled,
                                ]}
                                onPress={() => setSelected(option.value)}
                                disabled={isDisabled || submitting}
                                activeOpacity={0.8}
                            >
                                <Ionicons
                                    name={isSelected ? "radio-button-on" : "radio-button-off"}
                                    size={22}
                                    color={isSelected ? "#892DFC" : "#999"}
                                    style={styles.radio}
                                />
                                <View style={styles.optionTextWrapper}>
                                    <Text style={styles.optionTitle}>{option.title}</Text>
                                    <Text style={styles.optionDescription}>{option.description}</Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}

                    {status?.enabled && status?.maskedMobile && (
                        <Text style={styles.helperText}>Codes are sent to {status.maskedMobile}.</Text>
                    )}

                    <TouchableOpacity
                        style={[styles.buttonWrapper, (!hasChanged || submitting) && styles.buttonDisabled]}
                        onPress={handleContinue}
                        disabled={!hasChanged || submitting}
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
                                <Text style={styles.buttonText}>
                                    {selected ? "Turn on & send code" : "Turn off & send code"}
                                </Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

const getStyles = (currentTheme) =>
    StyleSheet.create({
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
        loaderContainer: {
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
        },
        scrollView: {
            paddingHorizontal: 16,
        },
        intro: {
            fontSize: 14,
            lineHeight: 20,
            color: currentTheme.subText || "#666",
            marginBottom: 16,
        },
        warningBox: {
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 8,
            padding: 12,
            borderRadius: 12,
            backgroundColor: "#FFF7ED",
            marginBottom: 16,
        },
        warningText: {
            flex: 1,
            fontSize: 13,
            color: "#B45309",
        },
        optionContainer: {
            flexDirection: "row",
            alignItems: "flex-start",
            padding: 16,
            backgroundColor: currentTheme.background || "#fff",
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "transparent",
            marginBottom: 12,
            shadowColor: "#000",
            shadowOpacity: 0.08,
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 4,
            elevation: 2,
        },
        optionSelected: {
            borderColor: "#892DFC",
        },
        optionDisabled: {
            opacity: 0.5,
        },
        radio: {
            marginRight: 12,
            marginTop: 1,
        },
        optionTextWrapper: {
            flex: 1,
        },
        optionTitle: {
            fontSize: 16,
            fontWeight: "bold",
            color: currentTheme.text || "#333",
        },
        optionDescription: {
            fontSize: 14,
            color: currentTheme.subText || "#666",
            marginTop: 4,
        },
        helperText: {
            fontSize: 13,
            color: currentTheme.subText || "#666",
            marginBottom: 16,
        },
        buttonWrapper: {
            marginTop: 8,
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
    });

export default TwoFactorAuthScreen;
