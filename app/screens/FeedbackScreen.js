import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';

const FeedbackScreen = ({ navigation }) => {
    const [feedback, setFeedback] = useState('');
    const {userData} = useAuth()
    const [email, setEmail] = useState(userData?.email);

    const handleSubmitFeedback = () => {
        if (!feedback.trim() || !email.trim()) {
            Alert.alert('Error', 'Please fill out both fields before submitting.');
            return;
        }

        Alert.alert('Thank You!', 'Your feedback has been submitted successfully.');
        setFeedback('');
        setEmail('');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.main}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.header}>Feedback</Text>
            </View>

            {/* Feedback Form */}
            <View style={styles.formContainer}>
                <Text style={styles.label}>Your Email</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor="#888"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                />

                <Text style={styles.label}>Your Feedback</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Enter your feedback"
                    placeholderTextColor="#888"
                    value={feedback}
                    onChangeText={setFeedback}
                    multiline
                    numberOfLines={5}
                />

                <TouchableOpacity style={styles.submitButton} onPress={handleSubmitFeedback}>
                    <Text style={styles.submitText}>Submit Feedback</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#f9f9f9",
    },
    main: {
        marginTop: 45,
        marginBottom: 50,
        display: "flex",
        flexDirection: "row",
        gap: 100,
        alignItems: "center",
    },
    header: {
        fontSize: 24,
        fontWeight: "bold",
        // marginBottom: 20,
        textAlign: "center",
    },
    formContainer: {
        padding: 16,
    },
    label: {
        fontSize: 14,
        color: '#333',
        marginBottom: 8,
        fontWeight: '500',
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        color: '#333',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 2,
    },
    textArea: {
        height: 120,
        textAlignVertical: 'top',
    },
    submitButton: {
        backgroundColor: '#6A0DAD',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 30,
    },
    submitText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default FeedbackScreen;
