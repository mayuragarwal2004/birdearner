import { KeyboardAvoidingView as KeyboardControllerAvoidingView } from "react-native-keyboard-controller";
import KeyboardAwareScrollView from "../components/KeyboardAwareScrollView";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import SafeSpinner from "../components/SafeSpinner";
import { useAuth } from "../context/NewAuthContext";
import { useTheme } from "../context/ThemeContext";
import apiService from "../lib/apiService";
import Toast from "react-native-toast-message";

// Same contact form, worded for "Your Feedbacks" or for "Support" tickets
const MODE_COPY = {
  feedback: {
    title: "Your Feedbacks",
    infoTitle: "We'd Love to Hear From You!",
    infoText:
      "Your feedback helps us improve BirdEarner. Share your thoughts, suggestions, or report any issues you've encountered.",
    subjectPrefix: "Feedback: ",
    submitLabel: "Send Feedback",
    toastTitle: "Feedback Sent!",
    toastMessage: "Thank you for your feedback. We'll get back to you soon.",
    successTitle: "Feedback Sent Successfully!",
    successMessage:
      "Thank you for taking the time to share your feedback with us. We've received your message and will get back to you as soon as possible.",
  },
  support: {
    title: "Contact Support",
    infoTitle: "How can we help?",
    infoText:
      "Describe the problem you're facing and we'll open a support ticket. Keep your reference ID to follow up.",
    subjectPrefix: "Support: ",
    submitLabel: "Submit Ticket",
    toastTitle: "Ticket Created!",
    toastMessage: "Our support team will reply to you soon.",
    successTitle: "Support Ticket Created",
    successMessage:
      "We've received your request. Our support team will reply as soon as possible.",
  },
};

const FeedbackScreen = ({ navigation, route }) => {
  const mode = route?.params?.mode === "support" ? "support" : "feedback";
  const copy = MODE_COPY[mode];
  const { userData } = useAuth();
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const styles = getStyles(currentTheme);

  // Form state
  const [formData, setFormData] = useState({
    name: userData?.fullName || "",
    email: userData?.email || "",
    phone: userData?.phoneNumber || "",
    subject: "",
    message: "",
  });

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [ticketId, setTicketId] = useState("");

  // Toast helper
  const showToast = (type, title, message) => {
    Toast.show({
      type,
      text1: title,
      text2: message,
      position: "top",
    });
  };

  // Validation function
  const validateForm = () => {
    const errors = {};

    // Name validation
    if (!formData.name.trim()) {
      errors.name = "Full name is required";
    } else if (formData.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    } else if (formData.name.trim().length > 100) {
      errors.name = "Name must be less than 100 characters";
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = "Email address is required";
    } else if (!emailRegex.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    // Phone validation (optional but if provided, should be valid)
    if (formData.phone.trim()) {
      const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,15}$/;
      if (!phoneRegex.test(formData.phone.replace(/\s/g, ""))) {
        errors.phone = "Please enter a valid phone number";
      }
    }

    // Subject validation
    if (!formData.subject.trim()) {
      errors.subject = "Subject is required";
    } else if (formData.subject.trim().length < 5) {
      errors.subject = "Subject must be at least 5 characters";
    } else if (formData.subject.trim().length > 500) {
      errors.subject = "Subject must be less than 500 characters";
    }

    // Message validation
    if (!formData.message.trim()) {
      errors.message = "Message is required";
    } else if (formData.message.trim().length < 10) {
      errors.message = "Message must be at least 10 characters";
    } else if (formData.message.trim().length > 5000) {
      errors.message = "Message must be less than 5000 characters";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  // Format phone number as user types
  const formatPhoneNumber = (value) => {
    // Remove all non-digit characters except +
    const cleaned = value.replace(/[^\d+]/g, "");

    // Basic formatting for display
    if (cleaned.startsWith("+")) {
      return cleaned;
    }

    return cleaned;
  };

  // Handle form submission
  const handleSubmitFeedback = async () => {
    if (!validateForm()) {
      showToast("error", "Validation Error", "Please fix the errors above");
      return;
    }

    setIsSubmitting(true);

    try {
      const contactData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || null,
        subject: `${copy.subjectPrefix}${formData.subject.trim()}`,
        message: formData.message.trim(),
      };

      const response = await apiService.submitContactForm(contactData);
      console.log({ response });

      if (response && response.success) {
        setTicketId(response.data.ticketId);
        setSubmissionSuccess(true);
        showToast(
          "success",
          copy.toastTitle,
          copy.toastMessage
        );
      } else {
        throw new Error(response?.message || "Failed to submit feedback");
      }
    } catch (error) {
      console.error("Feedback submission error:", error);
      showToast(
        "error",
        "Submission Failed",
        error.message || "Failed to submit feedback. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle submit another feedback
  const handleSubmitAnother = () => {
    setFormData({
      name: userData?.fullName || "",
      email: userData?.email || "",
      phone: userData?.phoneNumber || "",
      subject: "",
      message: "",
    });
    setFormErrors({});
    setSubmissionSuccess(false);
    setTicketId("");
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardControllerAvoidingView
        style={styles.flex}
        behavior="padding"
      >
        <KeyboardAwareScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={currentTheme.text || "#000"}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{copy.title}</Text>
          </View>

          {!submissionSuccess ? (
            <>
              {/* Info Card */}
              <View style={styles.infoCard}>
                <View style={styles.infoIconContainer}>
                  <Ionicons
                    name="chatbubble-ellipses"
                    size={24}
                    color="#6A0DAD"
                  />
                </View>
                <Text style={styles.infoTitle}>
                  {copy.infoTitle}
                </Text>
                <Text style={styles.infoText}>
                  {copy.infoText}
                </Text>
              </View>

              {/* Feedback Form */}
              <View style={styles.formContainer}>
                {/* Name Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Full Name *</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons
                      name="person-outline"
                      size={18}
                      color="#6A0DAD"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[
                        styles.input,
                        styles.inputWithIcon,
                        formErrors.name && styles.inputError,
                      ]}
                      placeholder="Your full name"
                      placeholderTextColor={currentTheme.subText + "80"}
                      value={formData.name}
                      onChangeText={(value) => handleInputChange("name", value)}
                      editable={!isSubmitting}
                      maxLength={100}
                    />
                  </View>
                  {formErrors.name && (
                    <Text style={styles.errorText}>{formErrors.name}</Text>
                  )}
                </View>

                {/* Email Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email Address *</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons
                      name="mail-outline"
                      size={18}
                      color="#6A0DAD"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[
                        styles.input,
                        styles.inputWithIcon,
                        formErrors.email && styles.inputError,
                      ]}
                      placeholder="your.email@example.com"
                      placeholderTextColor={currentTheme.subText + "80"}
                      value={formData.email}
                      onChangeText={(value) =>
                        handleInputChange("email", value.toLowerCase())
                      }
                      keyboardType="email-address"
                      autoCapitalize="none"
                      editable={!isSubmitting}
                    />
                  </View>
                  {formErrors.email && (
                    <Text style={styles.errorText}>{formErrors.email}</Text>
                  )}
                </View>

                {/* Phone Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Phone Number (Optional)</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons
                      name="call-outline"
                      size={18}
                      color="#6A0DAD"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[
                        styles.input,
                        styles.inputWithIcon,
                        formErrors.phone && styles.inputError,
                      ]}
                      placeholder="+91 98765 43210"
                      placeholderTextColor={currentTheme.subText + "80"}
                      value={formData.phone}
                      onChangeText={(value) =>
                        handleInputChange("phone", formatPhoneNumber(value))
                      }
                      keyboardType="phone-pad"
                      editable={!isSubmitting}
                      maxLength={15}
                    />
                  </View>
                  {formErrors.phone && (
                    <Text style={styles.errorText}>{formErrors.phone}</Text>
                  )}
                  <Text style={styles.helperText}>
                    Optional - May be used for urgent matters
                  </Text>
                </View>

                {/* Subject Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Subject *</Text>
                  <TextInput
                    style={[
                      styles.input,
                      formErrors.subject && styles.inputError,
                    ]}
                    placeholder="What's this about?"
                    placeholderTextColor={currentTheme.subText + "80"}
                    value={formData.subject}
                    onChangeText={(value) =>
                      handleInputChange("subject", value)
                    }
                    editable={!isSubmitting}
                    maxLength={500}
                  />
                  {formErrors.subject && (
                    <Text style={styles.errorText}>{formErrors.subject}</Text>
                  )}
                  <Text style={styles.characterCount}>
                    {formData.subject.length}/500 characters
                  </Text>
                </View>

                {/* Message Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Your Message *</Text>
                  <TextInput
                    style={[
                      styles.input,
                      styles.textArea,
                      formErrors.message && styles.inputError,
                    ]}
                    placeholder="Tell us about your experience, suggestions, or any issues you've encountered..."
                    placeholderTextColor={currentTheme.subText + "80"}
                    value={formData.message}
                    onChangeText={(value) =>
                      handleInputChange("message", value)
                    }
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                    editable={!isSubmitting}
                    maxLength={5000}
                  />
                  {formErrors.message && (
                    <Text style={styles.errorText}>{formErrors.message}</Text>
                  )}
                  <Text style={styles.characterCount}>
                    {formData.message.length}/5000 characters
                  </Text>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    isSubmitting && styles.submitButtonDisabled,
                  ]}
                  onPress={handleSubmitFeedback}
                  disabled={isSubmitting}
                  activeOpacity={0.8}
                >
                  {isSubmitting ? (
                    <View style={styles.loadingContainer}>
                      <SafeSpinner size={18} color="#fff" />
                      <Text style={styles.submitText}>Sending...</Text>
                    </View>
                  ) : (
                    <View style={styles.submitContent}>
                      <Ionicons name="send" size={18} color="#fff" />
                      <Text style={styles.submitText}>{copy.submitLabel}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </>
          ) : (
            /* Success Screen */
            <View style={styles.successContainer}>
              <View style={styles.successIconContainer}>
                <Ionicons name="checkmark-circle" size={56} color="#4CAF50" />
              </View>

              <Text style={styles.successTitle}>
                {copy.successTitle}
              </Text>
              <Text style={styles.successMessage}>
                {copy.successMessage}
              </Text>

              <View style={styles.ticketContainer}>
                <View style={styles.ticketHeader}>
                  <Ionicons name="receipt-outline" size={24} color="#6A0DAD" />
                  <Text style={styles.ticketTitle}>Your Reference ID</Text>
                </View>
                <View style={styles.ticketIdContainer}>
                  <Text style={styles.ticketId}>{ticketId}</Text>
                </View>
                <Text style={styles.ticketNote}>
                  Please save this reference ID for your records. You can use it
                  to track your inquiry.
                </Text>
              </View>

              <View style={styles.responseInfo}>
                <View style={styles.responseItem}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={20}
                    color="#4CAF50"
                  />
                  <Text style={styles.responseText}>
                    We typically respond within 24 hours
                  </Text>
                </View>
                <View style={styles.responseItem}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={20}
                    color="#4CAF50"
                  />
                  <Text style={styles.responseText}>
                    Check your email for updates
                  </Text>
                </View>
              </View>

              <View style={styles.successActions}>
                <TouchableOpacity
                  style={styles.anotherFeedbackButton}
                  onPress={handleSubmitAnother}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={20}
                    color="#6A0DAD"
                  />
                  <Text style={styles.anotherFeedbackText}>
                    Submit Another Feedback
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.backToAppButton}
                  onPress={() => navigation.goBack()}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="arrow-back-circle-outline"
                    size={20}
                    color="#fff"
                  />
                  <Text style={styles.backToAppText}>Back to Settings</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </KeyboardAwareScrollView>
        <Toast />
      </KeyboardControllerAvoidingView>
    </SafeAreaView>
  );
};

const getStyles = (currentTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background || "#f9f9f9",
    },
    flex: {
      flex: 1,
    },
    scrollContainer: {
      flexGrow: 1,
      padding: 16,
      paddingBottom: 32,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 8,
      marginBottom: 12,
    },
    backButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: currentTheme.background2 || "#f5f5f5",
      marginRight: 15,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: currentTheme.text,
      flex: 1,
    },
    infoCard: {
      backgroundColor: currentTheme.background2 || "#f8f9fa",
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      alignItems: "center",
      borderWidth: 1,
      borderColor: "#E8E3F3",
    },
    infoIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: "#F3F0FF",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 12,
    },
    infoTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: currentTheme.text,
      marginBottom: 8,
      textAlign: "center",
    },
    infoText: {
      fontSize: 14,
      color: currentTheme.subText,
      textAlign: "center",
      lineHeight: 20,
    },
    formContainer: {
      backgroundColor: currentTheme.background3 || "#fff",
      borderRadius: 12,
      padding: 16,
      shadowColor: currentTheme.shadow || "#000",
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 12,
      elevation: 5,
    },
    inputGroup: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      color: currentTheme.text || "#333",
      marginBottom: 8,
      fontWeight: "600",
    },
    inputContainer: {
      position: "relative",
    },
    input: {
      backgroundColor: currentTheme.background || "#f8f9fa",
      borderWidth: 1,
      borderColor: currentTheme.border || "#E8E3F3",
      borderRadius: 10,
      padding: 12,
      fontSize: 15,
      color: currentTheme.text || "#000",
      shadowColor: currentTheme.shadow || "#000",
      shadowOpacity: 0.05,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
      elevation: 2,
    },
    inputWithIcon: {
      paddingLeft: 48,
    },
    inputIcon: {
      position: "absolute",
      left: 16,
      top: 13,
      zIndex: 1,
    },
    inputError: {
      borderColor: "#ff4757",
      borderWidth: 2,
    },
    errorText: {
      fontSize: 14,
      color: "#ff4757",
      marginTop: 6,
      marginLeft: 4,
    },
    helperText: {
      fontSize: 13,
      color: currentTheme.subText || "#666",
      marginTop: 6,
      marginLeft: 4,
    },
    characterCount: {
      fontSize: 12,
      color: currentTheme.subText || "#666",
      textAlign: "right",
      marginTop: 4,
    },
    textArea: {
      height: 100,
      textAlignVertical: "top",
      paddingTop: 12,
    },
    submitButton: {
      backgroundColor: "#6A0DAD",
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: "center",
      marginTop: 16,
      shadowColor: "#6A0DAD",
      shadowOpacity: 0.3,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 8,
      elevation: 6,
    },
    submitButtonDisabled: {
      backgroundColor: "#ccc",
      shadowOpacity: 0.1,
    },
    submitContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    loadingContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    submitText: {
      fontSize: 16,
      color: "#fff",
      fontWeight: "bold",
    },

    // Success Screen Styles
    successContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    },
    successIconContainer: {
      marginBottom: 16,
    },
    successTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: currentTheme.text,
      marginBottom: 12,
      textAlign: "center",
    },
    successMessage: {
      fontSize: 15,
      color: currentTheme.subText,
      textAlign: "center",
      lineHeight: 22,
      marginBottom: 24,
      maxWidth: "90%",
    },
    ticketContainer: {
      backgroundColor: currentTheme.background2 || "#f8f9fa",
      borderRadius: 12,
      padding: 16,
      width: "100%",
      marginBottom: 16,
      borderWidth: 1,
      borderColor: "#E8E3F3",
    },
    ticketHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
      gap: 8,
    },
    ticketTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: currentTheme.text,
    },
    ticketIdContainer: {
      backgroundColor: currentTheme.background3 || "#fff",
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: "#E8E3F3",
    },
    ticketId: {
      fontSize: 16,
      fontWeight: "bold",
      color: "#6A0DAD",
      textAlign: "center",
      fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
      letterSpacing: 2,
    },
    ticketNote: {
      fontSize: 14,
      color: currentTheme.subText,
      textAlign: "center",
      lineHeight: 20,
    },
    responseInfo: {
      width: "100%",
      marginBottom: 20,
    },
    responseItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
      gap: 8,
    },
    responseText: {
      fontSize: 14,
      color: currentTheme.subText,
    },
    successActions: {
      width: "100%",
      gap: 12,
    },
    anotherFeedbackButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: currentTheme.background3 || "#fff",
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: "#6A0DAD",
      gap: 8,
    },
    anotherFeedbackText: {
      fontSize: 15,
      color: "#6A0DAD",
      fontWeight: "600",
    },
    backToAppButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#6A0DAD",
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 12,
      gap: 8,
    },
    backToAppText: {
      fontSize: 16,
      color: "#fff",
      fontWeight: "600",
    },
  });

export default FeedbackScreen;
