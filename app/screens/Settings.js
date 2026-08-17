import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  ImageBackground,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { useAuth } from "../context/NewAuthContext";
import { useTheme } from "../context/ThemeContext";
import apiService from "../lib/apiService";
import SafeSpinner from "../components/SafeSpinner";

const PURPLE = "#7B2CFF";
const DEEP = "#17151D";
const BORDER = "#E7E1EF";

const showToast = (type, title, message = "") => {
  Toast.show({
    type,
    text1: title,
    text2: message,
    position: "top",
  });
};

const getImageUri = (image) => {
  const raw = image?.uri || image?.url || image?.secure_url || image;
  return typeof raw === "string" && raw ? apiService.loadImageURI(raw) : null;
};

const getDisplayName = (userData, userProfile) =>
  userProfile?.fullName ||
  userProfile?.user?.fullName ||
  userData?.fullName ||
  "Bird Earner";

const getEmail = (userData, userProfile) =>
  userData?.email || userProfile?.email || userProfile?.user?.email || "Email not added";

const getPhone = (userData, userProfile) =>
  userProfile?.phone ||
  userProfile?.phoneNumber ||
  userData?.phone ||
  userData?.phoneNumber ||
  "Phone not added";

const SettingsScreen = ({ navigation }) => {
  const {
    userData,
    userProfile,
    logout,
    switchUserRole,
    refreshUserData,
  } = useAuth();
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const styles = useMemo(() => getStyles(currentTheme), [currentTheme]);

  const [switchingRole, setSwitchingRole] = useState(false);

  const role = userData?.role;
  const hasBothProfiles = !!userData?.freelancer && !!userData?.client;
  const nextRole = role === "FREELANCER" ? "CLIENT" : "FREELANCER";
  const profilePhotoUri = getImageUri(userProfile?.profilePhoto);

  const editProfileOption = useMemo(() => {
    if (role === "CLIENT") {
      return {
        stack_name: "ClientSignup",
        params: {
          mode: "update",
          profileData: userProfile,
          title: "Edit Client Profile",
        },
      };
    }

    return {
      stack_name: "FreelancerSignup",
      params: {
        mode: "update",
        profileData: userProfile,
        title: "Edit Freelancer Profile",
      },
    };
  }, [role, userProfile]);

  const walletRoute = role === "CLIENT" ? null : "WalletFreelancer";

  const navigateTo = (routeName, params) => {
    if (!routeName) return;
    navigation.navigate(routeName, params);
  };

  const handleEditProfile = () => {
    navigateTo(editProfileOption.stack_name, editProfileOption.params);
  };

  const handleViewProfile = () => {
    navigateTo("MyProfile");
  };

  const handleRoleSwitch = async () => {
    if (switchingRole) return;

    const hasTargetProfile =
      (nextRole === "FREELANCER" && !!userData?.freelancer) ||
      (nextRole === "CLIENT" && !!userData?.client);

    if (!hasTargetProfile) {
      if (nextRole === "CLIENT") {
        navigation.navigate("ClientSignup", {
          mode: "create",
          title: "Create Client Profile",
        });
      } else {
        navigation.navigate("FreelancerSignup", {
          mode: "create",
          title: "Create Freelancer Profile",
        });
      }
      return;
    }

    try {
      setSwitchingRole(true);
      await switchUserRole(nextRole);
      await refreshUserData();
      showToast("success", "Role switched", `You are now using ${nextRole.toLowerCase()} mode`);
    } catch (error) {
      console.error("Error switching role from settings:", error);
      Alert.alert("Error", "Failed to switch role. Please try again.");
    } finally {
      setSwitchingRole(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
            showToast("success", "Logged out successfully");
          } catch (error) {
            showToast("error", "Logout Failed", error.message);
          }
        },
      },
    ]);
  };

  const isFreelancer = role === "FREELANCER";

  const sections = [
    {
      title: "Account Settings",
      items: [
        {
          label: "View Profile",
          icon: "person-outline",
          onPress: handleViewProfile,
        },
        ...(isFreelancer
          ? [
              {
                label: "Availability",
                icon: "time-outline",
                route: "Availability",
              },
            ]
          : [
              {
                label: "Manage Addresses",
                icon: "location-outline",
                route: "ManageAddresses",
              },
            ]),
        {
          label: "Security",
          icon: "shield-checkmark-outline",
          route: "Security",
        },
      ],
    },
    {
      title: "Payment Settings",
      items: [
        {
          label: isFreelancer ? "Payment Details" : "Payment Methods",
          icon: "card-outline",
          route: "Bank Account details",
        },
        ...(isFreelancer
          ? [
              {
                label: "Wallet",
                icon: "wallet-outline",
                route: walletRoute,
              },
              {
                label: "Transaction History",
                icon: "receipt-outline",
                route: walletRoute,
              },
            ]
          : []),
      ],
    },
    {
      title: "Preferences",
      items: [
        {
          label: "Notifications",
          icon: "notifications-outline",
          route: "Notifications Setting",
        },
        {
          label: "Appearance",
          icon: "color-palette-outline",
          route: "Appearance",
        },
      ],
    },
    {
      title: "About",
      items: [
        {
          label: "Terms and Condition",
          icon: "document-text-outline",
          route: "TermsAndConditions",
        },
        {
          label: "Policy and Data",
          icon: "shield-outline",
          route: "PrivacyPolicy",
        },
        ...(!isFreelancer
          ? [
              {
                label: "Your Feedbacks",
                icon: "chatbox-ellipses-outline",
                route: "Feedback",
              },
            ]
          : []),
        {
          label: "Support",
          icon: "headset-outline",
          route: "Feedback",
        },
      ],
    },
    {
      title: "More",
      items: [
        {
          label: isFreelancer ? "Job History" : "Job Post History",
          icon: "briefcase-outline",
          route: isFreelancer ? "FreelancerJobHistory" : "Job Posted",
        },
        {
          label: "Delete Account",
          icon: "trash-outline",
          route: "DeleteAccount",
        },
        {
          label: "Logout",
          icon: "log-out-outline",
          danger: true,
          onPress: handleLogout,
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={30} color={currentTheme.text || "#000"} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ImageBackground
          source={require("../assets/backGroungBanner.png")}
          imageStyle={styles.profileImageBackground}
          style={styles.profileCard}
        >
          <View style={styles.profileTop}>
            <View style={styles.profileIdentity}>
              <View style={styles.avatarRing}>
                <Image
                  source={
                    profilePhotoUri
                      ? { uri: profilePhotoUri }
                      : require("../assets/profile.png")
                  }
                  style={styles.avatar}
                />
              </View>
              <View style={styles.profileText}>
                <Text style={styles.profileName} numberOfLines={1}>
                  {getDisplayName(userData, userProfile)}
                </Text>
                <Text style={styles.profileMeta} numberOfLines={1}>
                  {getPhone(userData, userProfile)}
                </Text>
                <Text style={styles.profileMeta} numberOfLines={2}>
                  {getEmail(userData, userProfile)}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.editShortcut} onPress={handleEditProfile}>
              <Ionicons name="create-outline" size={30} color="#FFFFFF" />
              <Text style={styles.editShortcutText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.switchDivider} />
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>
              {hasBothProfiles
                ? `Switch to ${nextRole === "CLIENT" ? "Client" : "Freelancer"}`
                : `Setup ${nextRole === "CLIENT" ? "Client" : "Freelancer"} Profile`}
            </Text>
            {switchingRole ? (
              <SafeSpinner size="small" color="#FFFFFF" />
            ) : (
              <Switch
                value={role === "FREELANCER"}
                onValueChange={handleRoleSwitch}
                trackColor={{ false: "#46454D", true: "#7B2CFF" }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#46454D"
              />
            )}
          </View>
        </ImageBackground>

        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, index) => (
                <SettingsRow
                  key={item.label}
                  item={item}
                  isLast={index === section.items.length - 1}
                  styles={styles}
                  onPress={() => (item.onPress ? item.onPress() : navigateTo(item.route, item.params))}
                />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
      <Toast />
    </SafeAreaView>
  );
};

function SettingsRow({ item, isLast, styles, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.row, isLast && styles.rowLast]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      <View style={styles.rowLeft}>
        <Ionicons
          name={item.icon}
          size={28}
          color={item.danger ? "#FF1F1F" : PURPLE}
        />
        <Text style={[styles.rowText, item.danger && styles.rowTextDanger]}>
          {item.label}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={22} color={styles.chevronColor.color} />
    </TouchableOpacity>
  );
}

const getStyles = (currentTheme) => {
  const surface = currentTheme.background || "#FFFFFF";
  const card = currentTheme.cardBackground || surface;
  const text = currentTheme.text || "#101114";
  const muted = currentTheme.subText || "#656B7A";
  const border = currentTheme.border || BORDER;
  const isDark = surface === "#000000";

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: surface,
    },
    header: {
      minHeight: 64,
      paddingHorizontal: 24,
      paddingTop: Platform.OS === "android" ? 24 : 6,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: surface,
    },
    backButton: {
      width: 44,
      height: 44,
      justifyContent: "center",
      alignItems: "flex-start",
    },
    headerTitle: {
      color: text,
      fontSize: 25,
      fontWeight: "900",
      textAlign: "center",
    },
    headerSpacer: {
      width: 44,
    },
    scrollView: {
      flex: 1,
      backgroundColor: surface,
    },
    scrollContent: {
      paddingHorizontal: 18,
      paddingBottom: Platform.OS === "ios" ? 112 : 96,
    },
    profileCard: {
      borderRadius: 12,
      overflow: "hidden",
      backgroundColor: DEEP,
      marginTop: 8,
      marginBottom: 26,
      borderWidth: 1,
      borderColor: isDark ? "#2A2634" : "#1F1B29",
    },
    profileImageBackground: {
      opacity: 0.14,
      resizeMode: "cover",
    },
    profileTop: {
      paddingHorizontal: 18,
      paddingTop: 20,
      paddingBottom: 20,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      backgroundColor: "rgba(17, 16, 22, 0.94)",
    },
    profileIdentity: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      minWidth: 0,
    },
    avatarRing: {
      width: 92,
      height: 92,
      borderRadius: 46,
      borderWidth: 3,
      borderColor: "#B070FF",
      padding: 4,
      backgroundColor: "#F7F4FB",
    },
    avatar: {
      width: "100%",
      height: "100%",
      borderRadius: 41,
      backgroundColor: "#ECE7F3",
    },
    profileText: {
      flex: 1,
      minWidth: 0,
    },
    profileName: {
      color: "#FFFFFF",
      fontSize: 23,
      fontWeight: "900",
      marginBottom: 6,
    },
    profileMeta: {
      color: "#FFFFFF",
      fontSize: 15,
      lineHeight: 21,
    },
    editShortcut: {
      width: 62,
      alignItems: "center",
      gap: 5,
    },
    editShortcutText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "700",
      textAlign: "center",
    },
    switchDivider: {
      height: 1,
      backgroundColor: "rgba(255,255,255,0.16)",
    },
    switchRow: {
      minHeight: 82,
      paddingHorizontal: 20,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: "rgba(17, 16, 22, 0.96)",
    },
    switchLabel: {
      color: "#FFFFFF",
      fontSize: 23,
      fontWeight: "900",
    },
    section: {
      marginBottom: 26,
    },
    sectionTitle: {
      color: text,
      fontSize: 19,
      fontWeight: "900",
      marginBottom: 12,
      marginLeft: 18,
    },
    sectionCard: {
      borderWidth: 1,
      borderColor: border,
      borderRadius: 12,
      overflow: "hidden",
      backgroundColor: isDark ? card : "#FFFFFF",
    },
    row: {
      minHeight: 68,
      paddingHorizontal: 24,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottomWidth: 1,
      borderBottomColor: border,
      backgroundColor: isDark ? card : "#FFFFFF",
    },
    rowLast: {
      borderBottomWidth: 0,
    },
    rowLeft: {
      flex: 1,
      minWidth: 0,
      flexDirection: "row",
      alignItems: "center",
      gap: 24,
    },
    rowText: {
      flex: 1,
      color: text,
      fontSize: 18,
      fontWeight: "600",
    },
    rowTextDanger: {
      color: "#FF1F1F",
    },
    chevronColor: {
      color: text,
    },
  });
};

export default SettingsScreen;
