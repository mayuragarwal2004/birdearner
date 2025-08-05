import React from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

const notificationsData = [
  {
    id: 1,
    avatar: "https://randomuser.me/api/portraits/men/1.jpg",
    description: "Your entry is viewed.",
    project: "Logo Design",
    status: "Immediate Action",
    statusColor: "red",
    borderColor: "#FF0000", // Red border
  },
  {
    id: 2,
    avatar: "https://randomuser.me/api/portraits/women/2.jpg",
    description: "Your entry is viewed.",
    project: "Web Design",
    status: "Standard",
    statusColor: "green",
    borderColor: "#00FF00", // Green border
  },
  {
    id: 3,
    avatar: null,
    description: "Update your application to avail new features.",
    project: "",
    status: "",
    statusColor: "",
    borderColor: "#6A1B9A", // Purple for custom icon
    customIcon: "🦅",
  },
  {
    id: 4,
    avatar: null,
    description:
      "Special Announcement!!! We have something good for you, tap to know more!",
    project: "",
    status: "",
    statusColor: "",
    borderColor: "#6A1B9A", // Purple for custom icon
    customIcon: "📣",
  },
  {
    id: 5,
    avatar: "https://randomuser.me/api/portraits/men/3.jpg",
    description: "Your entry is viewed.",
    project: "Web Design",
    status: "High",
    statusColor: "orange",
    borderColor: "#FFA500", // Orange border
  },
  {
    id: 6,
    avatar: "https://randomuser.me/api/portraits/men/1.jpg",
    description: "Your entry is viewed.",
    project: "Logo Design",
    status: "Immediate Action",
    statusColor: "red",
    borderColor: "#FF0000", // Red border
  },
  {
    id: 7,
    avatar: "https://randomuser.me/api/portraits/women/2.jpg",
    description: "Your entry is viewed.",
    project: "Web Design",
    status: "Standard",
    statusColor: "green",
    borderColor: "#00FF00", // Green border
  },
  {
    id: 8,
    avatar: null,
    description: "Update your application to avail new features.",
    project: "",
    status: "",
    statusColor: "",
    borderColor: "#6A1B9A", // Purple for custom icon
    customIcon: "🦅",
  },
  {
    id: 9,
    avatar: null,
    description:
      "Special Announcement!!! We have something good for you, tap to know more!",
    project: "",
    status: "",
    statusColor: "",
    borderColor: "#6A1B9A", // Purple for custom icon
    customIcon: "📣",
  },
  {
    id: 10,
    avatar: "https://randomuser.me/api/portraits/men/3.jpg",
    description: "Your entry is viewed.",
    project: "Web Design",
    status: "High",
    statusColor: "orange",
    borderColor: "#FFA500", // Orange border
  },
  {
    id: 11,
    avatar: "https://randomuser.me/api/portraits/women/2.jpg",
    description: "Your entry is viewed.",
    project: "Web Design",
    status: "Standard",
    statusColor: "green",
    borderColor: "#00FF00", // Green border
  },
  {
    id: 12,
    avatar: null,
    description: "Update your application to avail new features.",
    project: "",
    status: "",
    statusColor: "",
    borderColor: "#6A1B9A", // Purple for custom icon
    customIcon: "🦅",
  },
  {
    id: 13,
    avatar: null,
    description:
      "Special Announcement!!! We have something good for you, tap to know more!",
    project: "",
    status: "",
    statusColor: "",
    borderColor: "#6A1B9A", // Purple for custom icon
    customIcon: "📣",
  },
  {
    id: 14,
    avatar: "https://randomuser.me/api/portraits/women/2.jpg",
    description: "Your entry is viewed.",
    project: "Web Design",
    status: "Standard",
    statusColor: "green",
    borderColor: "#00FF00", // Green border
  },
  {
    id: 15,
    avatar: null,
    description: "Update your application to avail new features.",
    project: "",
    status: "",
    statusColor: "",
    borderColor: "#6A1B9A", // Purple for custom icon
    customIcon: "🦅",
  },
  {
    id: 16,
    avatar: null,
    description:
      "Special Announcement!!! We have something good for you, tap to know more!",
    project: "",
    status: "",
    statusColor: "",
    borderColor: "#6A1B9A", // Purple for custom icon
    customIcon: "📣",
  },
];

const NotificationScreen = ({ navigation }) => {
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
          <Ionicons
            name="arrow-back"
            size={24}
            color={currentTheme.text || "black"}
          />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {notificationsData.map((notification) => (
          <View key={notification.id} style={styles.notificationItem}>
            <View
              style={[
                styles.avatarContainer,
                { borderColor: notification.borderColor },
              ]}
            >
              {notification.avatar ? (
                <Image
                  source={{ uri: notification.avatar }}
                  style={styles.avatar}
                />
              ) : (
                <Text style={styles.customIcon}>{notification.customIcon}</Text>
              )}
            </View>

            <View style={styles.notificationContent}>
              <Text style={styles.description}>{notification.description}</Text>
              {notification.project ? (
                <Text style={styles.projectText}>
                  {notification.project} |{" "}
                  <Text style={{ color: notification.statusColor }}>
                    {notification.status}
                  </Text>
                </Text>
              ) : null}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (currentTheme) =>
  StyleSheet.create({
    container: {
      // flex: 1,
      // padding: 16,
      backgroundColor: currentTheme.background || "#fff",
      paddingHorizontal: 20,
    },
    main: {
      marginTop: 15,
      marginBottom: 15,
      display: "flex",
      flexDirection: "row",
      gap: 120,
      alignItems: "center",
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 16,
      color: currentTheme.text,
    },
    scrollView: {
      marginBottom: 40,
    },
    notificationItem: {
      flexDirection: "row",
      marginBottom: 16,
      backgroundColor: currentTheme.cardBackground || "#f0f0f0",
      borderRadius: 12,
      // padding: 10,
      alignItems: "center",
    },
    avatarContainer: {
      width: 60,
      height: 60,
      borderRadius: 30,
      borderWidth: 3,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 16,
    },
    avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
    },
    customIcon: {
      fontSize: 30,
    },
    notificationContent: {
      flex: 1,
    },
    description: {
      fontSize: 16,
      fontWeight: "bold",
      color: currentTheme.text,
    },
    projectText: {
      fontSize: 14,
      color: currentTheme.subText || "#555",
    },
    bottomNav: {
      flexDirection: "row",
      justifyContent: "space-around",
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: "#ccc",
    },
    icon: {
      fontSize: 24,
    },
  });

export default NotificationScreen;
