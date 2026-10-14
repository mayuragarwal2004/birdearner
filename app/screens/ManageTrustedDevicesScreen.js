import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { format } from "date-fns";
import Toast from "react-native-toast-message";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/NewAuthContext";
import apiService from "../lib/apiService";
import { getDeviceInfo } from "../lib/deviceInfo";

const formatPlatform = (platform) => {
    if (!platform) return "Unknown platform";
    return platform === "ios" ? "iOS" : platform.charAt(0).toUpperCase() + platform.slice(1);
};

const formatLastSignIn = (value) => {
    if (!value) return "Unknown";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Unknown" : format(date, "d MMM yyyy, h:mm a");
};

const ManageTrustedDevicesScreen = ({ navigation }) => {
    const { theme, themeStyles } = useTheme();
    const currentTheme = themeStyles[theme];
    const styles = getStyles(currentTheme);

    const { logout } = useAuth();

    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [removingId, setRemovingId] = useState(null);

    const loadDevices = useCallback(async () => {
        try {
            const { deviceId } = await getDeviceInfo();
            const data = await apiService.getUserDevices(deviceId);
            setDevices(data);
        } catch (error) {
            Toast.show({ type: "error", text1: "Couldn't load devices", text2: error.message });
        }
    }, []);

    // Refresh whenever the page is shown, e.g. after signing in from another device
    useFocusEffect(
        useCallback(() => {
            let active = true;
            (async () => {
                await loadDevices();
                if (active) setLoading(false);
            })();
            return () => {
                active = false;
            };
        }, [loadDevices])
    );

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadDevices();
        setRefreshing(false);
    };

    const removeDevice = async (device) => {
        setRemovingId(device.id);
        try {
            await apiService.removeUserDevice(device.id);
            setDevices((prev) => prev.filter((item) => item.id !== device.id));

            // Removing this device ends this session, so sign out here instead of waiting for the next call to fail
            if (device.isCurrent) {
                await logout();
                return;
            }

            Toast.show({ type: "success", text1: "Device removed and signed out" });
        } catch (error) {
            Toast.show({ type: "error", text1: "Couldn't remove device", text2: error.message });
        } finally {
            setRemovingId(null);
        }
    };

    const confirmRemove = (device) => {
        Alert.alert(
            "Remove this device?",
            "It will be removed from your trusted devices. If two-factor authentication is on, signing in from it will need a code again.",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Remove", style: "destructive", onPress: () => removeDevice(device) },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.main}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={currentTheme.text || "black"} />
                </TouchableOpacity>
                <Text style={styles.header}>Manage Trusted Devices</Text>
                <View style={styles.headerSpacer} />
            </View>

            {loading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#892DFC" />
                </View>
            ) : (
                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#892DFC" />}
                >
                    <Text style={styles.intro}>
                        Devices you've signed in from. Remove any you don't recognise.
                    </Text>

                    {devices.length === 0 && (
                        <View style={styles.emptyState}>
                            <Ionicons name="phone-portrait-outline" size={36} color="#BBB" />
                            <Text style={styles.emptyText}>No devices yet. Devices you sign in from will appear here.</Text>
                        </View>
                    )}

                    {devices.map((device) => (
                        <View key={device.id} style={styles.deviceCard}>
                            <View style={styles.deviceIcon}>
                                <Ionicons name="phone-portrait-outline" size={22} color="#892DFC" />
                            </View>

                            <View style={styles.deviceInfo}>
                                <View style={styles.nameRow}>
                                    <Text style={styles.deviceName} numberOfLines={1}>
                                        {device.deviceName || "Unnamed device"}
                                    </Text>
                                    {device.isCurrent && (
                                        <View style={styles.currentBadge}>
                                            <Text style={styles.currentBadgeText}>This device</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.deviceMeta}>
                                    {formatPlatform(device.platform)} · Last sign-in {formatLastSignIn(device.lastLoginAt)}
                                </Text>
                            </View>

                            <TouchableOpacity
                                onPress={() => confirmRemove(device)}
                                disabled={removingId === device.id}
                                style={styles.removeButton}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                {removingId === device.id ? (
                                    <ActivityIndicator size="small" color="#EF4444" />
                                ) : (
                                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                )}
                            </TouchableOpacity>
                        </View>
                    ))}
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
        emptyState: {
            alignItems: "center",
            paddingVertical: 40,
            gap: 12,
        },
        emptyText: {
            fontSize: 14,
            color: currentTheme.subText || "#666",
            textAlign: "center",
        },
        deviceCard: {
            flexDirection: "row",
            alignItems: "center",
            padding: 16,
            backgroundColor: currentTheme.background || "#fff",
            borderRadius: 12,
            marginBottom: 12,
            shadowColor: "#000",
            shadowOpacity: 0.08,
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 4,
            elevation: 2,
        },
        deviceIcon: {
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#F3EAFF",
            marginRight: 12,
        },
        deviceInfo: {
            flex: 1,
            marginRight: 8,
        },
        nameRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
        },
        deviceName: {
            flexShrink: 1,
            fontSize: 15,
            fontWeight: "600",
            color: currentTheme.text || "#333",
        },
        currentBadge: {
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 999,
            backgroundColor: "#ECFDF5",
        },
        currentBadgeText: {
            fontSize: 11,
            fontWeight: "600",
            color: "#047857",
        },
        deviceMeta: {
            fontSize: 13,
            color: currentTheme.subText || "#666",
            marginTop: 4,
        },
        removeButton: {
            padding: 6,
        },
    });

export default ManageTrustedDevicesScreen;
