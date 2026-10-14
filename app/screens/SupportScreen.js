import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../context/ThemeContext";
import apiService from "../lib/apiService";

const SupportScreen = ({ navigation }) => {
    const { theme, themeStyles } = useTheme();
    const currentTheme = themeStyles[theme];
    const styles = getStyles(currentTheme);

    const [faqs, setFaqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadFailed, setLoadFailed] = useState(false);
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => {
        let active = true;
        const loadFaqs = async () => {
            try {
                const data = await apiService.getFaqs();
                if (active) setFaqs(data);
            } catch (error) {
                if (active) setLoadFailed(true);
            } finally {
                if (active) setLoading(false);
            }
        };
        loadFaqs();
        return () => {
            active = false;
        };
    }, []);

    // Group FAQs by category, keeping the order the API returns them in
    const faqSections = useMemo(() => {
        const groups = {};
        faqs.forEach((faq) => {
            const category = faq.category || "General";
            if (!groups[category]) groups[category] = [];
            groups[category].push(faq);
        });
        return Object.entries(groups);
    }, [faqs]);

    const openTicketForm = () => navigation.navigate("Feedback", { mode: "support" });

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.main}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={currentTheme.text || "black"} />
                </TouchableOpacity>
                <Text style={styles.header}>Support</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.introCard}>
                    <View style={styles.introIcon}>
                        <Ionicons name="headset-outline" size={24} color="#892DFC" />
                    </View>
                    <Text style={styles.introTitle}>Need help with BirdEarner?</Text>
                    <Text style={styles.introText}>
                        Check the common questions below. If you can't find your answer, open a support ticket and our
                        team will reply to you.
                    </Text>
                </View>

                <TouchableOpacity onPress={openTicketForm} activeOpacity={0.8} style={styles.ticketButtonWrapper}>
                    <LinearGradient
                        colors={["#A155FD", "#892DFC", "#A459FE"]}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={styles.ticketButton}
                    >
                        <Ionicons name="ticket-outline" size={18} color="#FFFFFF" />
                        <Text style={styles.ticketButtonText}>Raise a support ticket</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <Text style={styles.sectionTitle}>Frequently asked questions</Text>

                {loading && (
                    <View style={styles.centered}>
                        <ActivityIndicator size="small" color="#892DFC" />
                    </View>
                )}

                {!loading && loadFailed && (
                    <Text style={styles.emptyText}>Couldn't load FAQs right now. Please try again later.</Text>
                )}

                {!loading && !loadFailed && faqs.length === 0 && (
                    <Text style={styles.emptyText}>No FAQs available yet.</Text>
                )}

                {faqSections.map(([category, items]) => (
                    <View key={category} style={styles.categoryBlock}>
                        <Text style={styles.categoryTitle}>{category}</Text>
                        {items.map((faq) => {
                            const isOpen = expandedId === faq.id;
                            return (
                                <TouchableOpacity
                                    key={faq.id}
                                    style={styles.faqCard}
                                    onPress={() => setExpandedId(isOpen ? null : faq.id)}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.faqHeader}>
                                        <Text style={styles.faqQuestion}>{faq.question}</Text>
                                        <Ionicons
                                            name={isOpen ? "chevron-up" : "chevron-down"}
                                            size={18}
                                            color="#888"
                                        />
                                    </View>
                                    {isOpen && <Text style={styles.faqAnswer}>{faq.answer}</Text>}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                ))}

                <View style={{ height: 32 }} />
            </ScrollView>
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
        scrollView: {
            paddingHorizontal: 16,
        },
        introCard: {
            padding: 16,
            borderRadius: 12,
            backgroundColor: currentTheme.background || "#fff",
            marginBottom: 16,
            shadowColor: "#000",
            shadowOpacity: 0.08,
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 4,
            elevation: 2,
        },
        introIcon: {
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#F3EAFF",
            marginBottom: 12,
        },
        introTitle: {
            fontSize: 16,
            fontWeight: "700",
            color: currentTheme.text || "#333",
        },
        introText: {
            fontSize: 14,
            lineHeight: 20,
            color: currentTheme.subText || "#666",
            marginTop: 6,
        },
        ticketButtonWrapper: {
            borderRadius: 12,
            marginBottom: 24,
            shadowColor: "#8935FC",
            shadowOpacity: 0.35,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: 4,
        },
        ticketButton: {
            height: 52,
            borderRadius: 12,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
        },
        ticketButtonText: {
            color: "#FFFFFF",
            fontSize: 16,
            fontWeight: "600",
        },
        sectionTitle: {
            fontSize: 16,
            fontWeight: "700",
            color: currentTheme.text || "#333",
            marginBottom: 12,
        },
        centered: {
            paddingVertical: 24,
            alignItems: "center",
        },
        emptyText: {
            fontSize: 14,
            color: currentTheme.subText || "#666",
            textAlign: "center",
            paddingVertical: 24,
        },
        categoryBlock: {
            marginBottom: 16,
        },
        categoryTitle: {
            fontSize: 13,
            fontWeight: "600",
            color: "#892DFC",
            textTransform: "uppercase",
            marginBottom: 8,
        },
        faqCard: {
            padding: 14,
            borderRadius: 12,
            backgroundColor: currentTheme.background || "#fff",
            marginBottom: 8,
            shadowColor: "#000",
            shadowOpacity: 0.06,
            shadowOffset: { width: 0, height: 1 },
            shadowRadius: 3,
            elevation: 1,
        },
        faqHeader: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
        },
        faqQuestion: {
            flex: 1,
            fontSize: 15,
            fontWeight: "600",
            color: currentTheme.text || "#333",
        },
        faqAnswer: {
            fontSize: 14,
            lineHeight: 20,
            color: currentTheme.subText || "#555",
            marginTop: 10,
        },
    });

export default SupportScreen;
