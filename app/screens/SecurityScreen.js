import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from '../context/ThemeContext';

const SecurityScreen = ({ navigation }) => {
    const dummyData = [
        { title: 'Two-Factor Authentication', description: 'Add an extra layer of security to your account.' },
        { title: 'Change Security Questions', description: 'Update your security questions for account recovery.' },
        { title: 'Manage Trusted Devices', description: 'View and remove devices you trust.' },
        { title: 'Account Activity', description: 'Review recent account activity for unusual behavior.' },
    ];

    const { theme, themeStyles } = useTheme();
    const currentTheme = themeStyles[theme];

    const styles = getStyles(currentTheme);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.main}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <Ionicons name="arrow-back" size={24} color={currentTheme.text || "black"} />
                </TouchableOpacity>
                <Text style={styles.header}>Security</Text>
                <View style={styles.headerSpacer} />
            </View>

            {/* Security Options */}
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {dummyData.map((item, index) => (
                    <TouchableOpacity key={index} style={styles.optionContainer}>
                        <View style={{ flex: 1, marginRight: 12 }}>
                            <Text style={styles.optionTitle}>{item.title}</Text>
                            <Text style={styles.optionDescription}>{item.description}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color="#888" />
                    </TouchableOpacity>
                ))}
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
    
        optionContainer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 16,
            backgroundColor: currentTheme.background || '#fff',
            borderRadius: 8,
            marginBottom: 12,
            shadowColor: currentTheme.text  || '#000',
            shadowOpacity: 0.1,
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 4,
            elevation: 2,
        },
        optionTitle: {
            fontSize: 16,
            fontWeight: 'bold',
            color:currentTheme.text || '#333',
        },
        optionDescription: {
            fontSize: 14,
            color: currentTheme.subText || '#666',
            marginTop: 4,
        },
        arrowIcon: {
            fontSize: 18,
            color: '#888',
        },
    });

export default SecurityScreen;
