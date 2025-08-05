import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ScrollView,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Linking
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/NewAuthContext";
import { useTheme } from "../context/ThemeContext";
import apiService from "../lib/apiService";
import Toast from "react-native-toast-message";

const DeleteAccountScreen = ({ navigation }) => {
  const { userData, userProfile } = useAuth();
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];

  const styles = getStyles(currentTheme);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingRequest, setExistingRequest] = useState(null);
  const [reason, setReason] = useState("");
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [updatedReason, setUpdatedReason] = useState("");

  // Toast helper
  const showToast = (type, title, message) => {
    Toast.show({
      type,
      text1: title,
      text2: message,
      position: "top",
    });
  };

  // Handle support button press
  const handleSupportPress = async () => {
    try {
      const supported = await Linking.canOpenURL('https://web.birdearner.com');
      if (supported) {
        await Linking.openURL('https://web.birdearner.com');
      } else {
        showToast("error", "Unable to Open", "Cannot open the support website. Please visit web.birdearner.com manually.");
      }
    } catch (error) {
      console.error('Error opening support URL:', error);
      showToast("error", "Error", "Failed to open support website. Please try again.");
    }
  };

  // Handle update request
  const handleUpdateRequest = async () => {
    try {
      setIsUpdating(true);
      
      const response = await apiService.updateDeleteRequest(existingRequest.id, {
        reason: updatedReason.trim() || null
      });
      
      if (response && response.success) {
        showToast("success", "Request Updated", "Your delete request has been updated successfully.");
        setExistingRequest({ ...existingRequest, reason: updatedReason.trim() || null });
        setShowUpdateForm(false);
        setUpdatedReason("");
      } else {
        showToast("error", "Update Failed", response?.message || "Failed to update request. Please try again.");
      }
    } catch (error) {
      console.error("Update request error:", error);
      showToast("error", "Error", "Failed to update request. Please check your connection and try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle delete request (cancel request)
  const handleCancelRequest = async () => {
    Alert.alert(
      "Cancel Delete Request",
      "Are you sure you want to cancel your account deletion request? You can create a new one later if needed.",
      [
        { text: "Keep Request", style: "cancel" },
        { 
          text: "Cancel Request", 
          onPress: async () => {
            try {
              setIsDeleting(true);
              
              const response = await apiService.cancelDeleteRequest(existingRequest.id);
              
              if (response && response.success) {
                showToast("success", "Request Cancelled", "Your delete request has been cancelled.");
                setExistingRequest(null);
              } else {
                showToast("error", "Cancellation Failed", response?.message || "Failed to cancel request. Please try again.");
              }
            } catch (error) {
              console.error("Cancel request error:", error);
              showToast("error", "Error", "Failed to cancel request. Please check your connection and try again.");
            } finally {
              setIsDeleting(false);
            }
          },
          style: "destructive" 
        },
      ]
    );
  };
  

  const handleDeleteRequest = async () => {
    try {
      setIsSubmitting(true);
      
      const response = await apiService.createDeleteRequest(reason.trim() || null);
      
      if (response && response.success) {
        showToast("success", "Request Submitted", "Your account deletion request has been submitted. We may contact you before proceeding.");
        navigation.goBack();
      } else {
        showToast("error", "Submission Failed", response?.message || "Failed to submit delete request. Please try again.");
      }
    } catch (error) {
      console.error("Delete request error:", error);
      showToast("error", "Error", "Failed to submit delete request. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const checkExistingRequest = async () => {
      try {
        setIsLoading(true);
        const response = await apiService.checkDeleteRequestStatus();
        
        if (response && response.success && response.data.hasPendingRequest) {
          setExistingRequest(response.data.deleteRequest);
        }
      } catch (error) {
        console.error("Failed to check existing delete request:", error);
        // Don't show error toast here as it's not critical
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingRequest();
  }, []);

  const confirmDelete = () => {
    if (existingRequest) {
      showToast("info", "Request Already Exists", "You already have a pending deletion request.");
      return;
    }

    Alert.alert(
      "Are you sure?",
      "Deleting your account is irreversible.\n\n• It may take 5–10 business days or more.\n• We might contact you before deleting.\n• Your data will be permanently lost.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Continue", 
          onPress: () => setShowReasonInput(true),
          style: "destructive" 
        },
      ]
    );
  };

  const submitDeleteRequest = () => {
    Alert.alert(
      "Final Confirmation",
      `Are you absolutely sure you want to delete your account?${reason.trim() ? `\n\nReason: ${reason.trim()}` : ""}`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Submit Request", 
          onPress: handleDeleteRequest,
          style: "destructive" 
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={currentTheme.primary || "#6A0DAD"} />
        <Text style={[styles.loadingText, { color: currentTheme.text }]}>
          Checking account status...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
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
          <Text style={styles.headerTitle}>Delete Account</Text>
        </View>

        {/* Warning Card */}
        <View style={styles.warningCard}>
          <View style={styles.warningIconContainer}>
            <Ionicons 
              name="warning" 
              size={32} 
              color="#FF6B6B" 
            />
          </View>
          <Text style={styles.warningTitle}>Account Deletion</Text>
          <Text style={styles.warningText}>
            We're sad to see you go. Before you proceed, please note:
          </Text>
        </View>

        {/* Info Points */}
        <View style={styles.infoCard}>
          <View style={styles.bulletPoint}>
            <Ionicons name="time-outline" size={20} color={currentTheme.primary} />
            <Text style={styles.bulletText}>
              It may take up to 5–10 business days or more to process
            </Text>
          </View>
          
          <View style={styles.bulletPoint}>
            <Ionicons name="call-outline" size={20} color={currentTheme.primary} />
            <Text style={styles.bulletText}>
              We might contact you before deletion for verification
            </Text>
          </View>
          
          <View style={styles.bulletPoint}>
            <Ionicons name="warning-outline" size={20} color={currentTheme.primary} />
            <Text style={styles.bulletText}>
              This action is permanent and cannot be undone
            </Text>
          </View>
        </View>

        {/* Existing Request Notice */}
        {existingRequest && (
          <View style={styles.existingRequestCard}>
            <View style={styles.existingRequestHeader}>
              <Ionicons name="checkmark-circle" size={24} color="#FF9500" />
              <Text style={styles.existingRequestTitle}>Request Already Submitted</Text>
            </View>
            <Text style={styles.existingRequestText}>
              You submitted a deletion request on{" "}
              {new Date(existingRequest.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}.
            </Text>
            <Text style={styles.existingRequestSubtext}>
              Status: <Text style={styles.statusText}>{existingRequest.status}</Text>
            </Text>
            {existingRequest.reason && (
              <View style={styles.reasonDisplayContainer}>
                <Text style={styles.reasonDisplayTitle}>Your reason:</Text>
                <Text style={styles.reasonDisplayText}>"{existingRequest.reason}"</Text>
              </View>
            )}
            <Text style={styles.existingRequestSubtext}>
              We'll contact you soon regarding your request.
            </Text>
            
            {/* Action buttons for existing request */}
            <View style={styles.existingRequestActions}>
              <TouchableOpacity
                style={styles.updateRequestButton}
                onPress={() => {
                  setUpdatedReason(existingRequest.reason || "");
                  setShowUpdateForm(true);
                }}
                disabled={isUpdating || isDeleting}
                activeOpacity={0.8}
              >
                <Ionicons name="create-outline" size={18} color="white" />
                <Text style={styles.updateRequestButtonText}>Update Request</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.cancelRequestButton}
                onPress={handleCancelRequest}
                disabled={isUpdating || isDeleting}
                activeOpacity={0.8}
              >
                {isDeleting ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color="white" />
                    <Text style={styles.cancelRequestButtonText}>Cancelling...</Text>
                  </View>
                ) : (
                  <>
                    <Ionicons name="close-outline" size={18} color="white" />
                    <Text style={styles.cancelRequestButtonText}>Cancel Request</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Update Request Form */}
        {showUpdateForm && existingRequest && (
          <View style={styles.reasonCard}>
            <Text style={styles.reasonTitle}>
              Update Delete Request
            </Text>
            <Text style={styles.reasonSubtitle}>
              Update your reason for leaving or add additional information.
            </Text>
            <View style={styles.contactInfoNotice}>
              <Ionicons name="information-circle" size={20} color="#2196F3" />
              <Text style={styles.contactInfoText}>
                💡 Include your preferred contact method (email/phone) so we can reach you if needed.
              </Text>
            </View>
            <TextInput
              style={styles.reasonInput}
              placeholder="Your reason for leaving and contact info..."
              placeholderTextColor={currentTheme.subText}
              value={updatedReason}
              onChangeText={setUpdatedReason}
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={styles.characterCount}>
              {updatedReason.length}/500 characters
            </Text>
            
            <View style={styles.reasonButtonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowUpdateForm(false);
                  setUpdatedReason("");
                }}
                disabled={isUpdating}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleUpdateRequest}
                disabled={isUpdating}
                activeOpacity={0.8}
              >
                {isUpdating ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color="white" />
                    <Text style={styles.submitButtonText}>Updating...</Text>
                  </View>
                ) : (
                  <Text style={styles.submitButtonText}>Update Request</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Reason Input (when showing) */}
        {showReasonInput && !existingRequest && (
          <View style={styles.reasonCard}>
            <Text style={styles.reasonTitle}>
              Help us improve (Optional)
            </Text>
            <Text style={styles.reasonSubtitle}>
              Could you tell us why you're leaving? This helps us serve others better.
            </Text>
            <View style={styles.contactInfoNotice}>
              <Ionicons name="information-circle" size={20} color="#2196F3" />
              <Text style={styles.contactInfoText}>
                💡 Include your preferred contact method (email/phone) so we can reach you if needed.
              </Text>
            </View>
            <TextInput
              style={styles.reasonInput}
              placeholder="Your reason for leaving and contact info (optional)..."
              placeholderTextColor={currentTheme.subText}
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={styles.characterCount}>
              {reason.length}/500 characters
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {!showReasonInput && !existingRequest && !showUpdateForm && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={confirmDelete}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color="white" />
                  <Text style={styles.deleteButtonText}>Processing...</Text>
                </View>
              ) : (
                <>
                  <Ionicons name="trash-outline" size={20} color="white" />
                  <Text style={styles.deleteButtonText}>Request Account Deletion</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {showReasonInput && !existingRequest && !showUpdateForm && (
            <View style={styles.reasonButtonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowReasonInput(false);
                  setReason("");
                }}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.submitButton}
                onPress={submitDeleteRequest}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                {isSubmitting ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color="white" />
                    <Text style={styles.submitButtonText}>Submitting...</Text>
                  </View>
                ) : (
                  <Text style={styles.submitButtonText}>Submit Request</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {existingRequest && !showUpdateForm && (
            <TouchableOpacity
              style={styles.backToSettingsButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={20} color={currentTheme.primary} />
              <Text style={styles.backToSettingsText}>Back to Settings</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Support Contact */}
        {!existingRequest && (
          <View style={styles.supportCard}>
            <Text style={styles.supportTitle}>Need Help Instead?</Text>
            <Text style={styles.supportText}>
              If you're facing issues, our support team is here to help.
            </Text>
            <TouchableOpacity 
              style={styles.supportButton}
              onPress={handleSupportPress}
              activeOpacity={0.7}
            >
              <Ionicons name="mail-outline" size={18} color={currentTheme.primary} />
              <Text style={styles.supportButtonText}>Contact Support</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      <Toast />
    </KeyboardAvoidingView>
  );
};

const getStyles = (currentTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background,
    },
    scrollContent: {
      flexGrow: 1,
      padding: 20,
    },
    loadingContainer: {
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      marginTop: 15,
      fontSize: 16,
      fontWeight: "500",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 45,
      marginBottom: 30,
    },
    backButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: currentTheme.background2 || "#f5f5f5",
      marginRight: 15,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: currentTheme.text,
      flex: 1,
    },
    warningCard: {
      backgroundColor: currentTheme.background2 || "#f8f9fa",
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      alignItems: "center",
      borderWidth: 1,
      borderColor: "#FFE6E6",
    },
    warningIconContainer: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: "#FFE6E6",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 15,
    },
    warningTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: currentTheme.text,
      marginBottom: 8,
    },
    warningText: {
      fontSize: 16,
      color: currentTheme.subText,
      textAlign: "center",
      lineHeight: 22,
    },
    infoCard: {
      backgroundColor: currentTheme.background2 || "#f8f9fa",
      borderRadius: 12,
      padding: 20,
      marginBottom: 20,
    },
    bulletPoint: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 15,
    },
    bulletText: {
      fontSize: 15,
      color: currentTheme.text,
      marginLeft: 12,
      flex: 1,
      lineHeight: 20,
    },
    existingRequestCard: {
      backgroundColor: "#FFF8E1",
      borderRadius: 12,
      padding: 20,
      marginBottom: 20,
      borderLeftWidth: 4,
      borderLeftColor: "#FF9500",
    },
    existingRequestHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    existingRequestTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#E65100",
      marginLeft: 8,
    },
    existingRequestText: {
      fontSize: 15,
      color: "#BF360C",
      marginBottom: 8,
      lineHeight: 20,
    },
    existingRequestSubtext: {
      fontSize: 14,
      color: "#BF360C",
      marginBottom: 4,
    },
    statusText: {
      fontWeight: "bold",
      textTransform: "capitalize",
    },
    existingRequestActions: {
      flexDirection: "row",
      marginTop: 16,
      gap: 12,
    },
    updateRequestButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#FF9500",
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      gap: 6,
      shadowColor: "#FF9500",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    updateRequestButtonText: {
      color: "white",
      fontSize: 14,
      fontWeight: "600",
    },
    cancelRequestButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#D32F2F",
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      gap: 6,
      shadowColor: "#D32F2F",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    cancelRequestButtonText: {
      color: "white",
      fontSize: 14,
      fontWeight: "600",
    },
    reasonDisplayContainer: {
      backgroundColor: "rgba(255, 149, 0, 0.1)",
      borderRadius: 8,
      padding: 12,
      marginVertical: 8,
      borderLeftWidth: 3,
      borderLeftColor: "#FF9500",
    },
    reasonDisplayTitle: {
      fontSize: 13,
      fontWeight: "600",
      color: "#E65100",
      marginBottom: 4,
    },
    reasonDisplayText: {
      fontSize: 14,
      color: "#BF360C",
      fontStyle: "italic",
      lineHeight: 18,
    },
    reasonCard: {
      backgroundColor: currentTheme.background2 || "#f8f9fa",
      borderRadius: 12,
      padding: 20,
      marginBottom: 20,
    },
    reasonTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: currentTheme.text,
      marginBottom: 8,
    },
    reasonSubtitle: {
      fontSize: 14,
      color: currentTheme.subText,
      marginBottom: 15,
      lineHeight: 18,
    },
    contactInfoNotice: {
      flexDirection: "row",
      alignItems: "flex-start",
      backgroundColor: "#E3F2FD",
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
      borderLeftWidth: 4,
      borderLeftColor: "#2196F3",
    },
    contactInfoText: {
      fontSize: 13,
      color: "#1565C0",
      lineHeight: 18,
      marginLeft: 8,
      flex: 1,
    },
    reasonInput: {
      backgroundColor: currentTheme.background3 || "#fff",
      borderRadius: 8,
      padding: 15,
      fontSize: 15,
      color: currentTheme.text,
      borderWidth: 1,
      borderColor: currentTheme.border || "#e0e0e0",
      minHeight: 100,
      textAlignVertical: "top",
    },
    characterCount: {
      fontSize: 12,
      color: currentTheme.subText,
      textAlign: "right",
      marginTop: 5,
    },
    buttonContainer: {
      marginTop: 10,
    },
    deleteButton: {
      backgroundColor: "#D32F2F",
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderRadius: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#D32F2F",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    deleteButtonText: {
      color: "white",
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 8,
    },
    reasonButtonContainer: {
      flexDirection: "row",
      gap: 12,
    },
    cancelButton: {
      flex: 1,
      backgroundColor: currentTheme.background3 || "#f0f0f0",
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    cancelButtonText: {
      color: currentTheme.text,
      fontSize: 16,
      fontWeight: "500",
    },
    submitButton: {
      flex: 2,
      backgroundColor: "#D32F2F",
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    submitButtonText: {
      color: "white",
      fontSize: 16,
      fontWeight: "600",
    },
    backToSettingsButton: {
      backgroundColor: currentTheme.background2 || "#f8f9fa",
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderRadius: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: currentTheme.border || "#e0e0e0",
    },
    backToSettingsText: {
      color: currentTheme.primary,
      fontSize: 16,
      fontWeight: "500",
      marginLeft: 8,
    },
    supportCard: {
      backgroundColor: currentTheme.background2 || "#f8f9fa",
      borderRadius: 12,
      padding: 20,
      marginTop: 20,
      alignItems: "center",
    },
    supportTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: currentTheme.text,
      marginBottom: 8,
    },
    supportText: {
      fontSize: 14,
      color: currentTheme.subText,
      textAlign: "center",
      marginBottom: 15,
      lineHeight: 18,
    },
    supportButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: currentTheme.background3 || "#fff",
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: currentTheme.primary,
    },
    supportButtonText: {
      color: currentTheme.primary,
      fontSize: 14,
      fontWeight: "500",
      marginLeft: 6,
    },
    loadingRow: {
      flexDirection: "row",
      alignItems: "center",
    },
  });

export default DeleteAccountScreen;
