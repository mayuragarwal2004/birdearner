import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import StatusBadge from './StatusBadge';
import ChatMenu from './ChatMenu';

const ChatHeader = ({ 
  user, 
  chatStatus, 
  onBack, 
  onViewProfile, 
  assignedId,
  currentUserId,
  showMenu,
  setShowMenu,
  onMenuAction
}) => {
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const styles = getStyles(currentTheme);

  console.log({chat_header_user:user});
  

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Ionicons
          name="arrow-back"
          size={24}
          color={currentTheme.text || "black"}
        />
      </TouchableOpacity>
      
      <View style={styles.headerData}>
        <Text style={styles.profile}>Tap to view profile</Text>
        <TouchableOpacity onPress={onViewProfile}>
          <Text style={styles.username}>@{user.user.fullName}</Text>
        </TouchableOpacity>

        <StatusBadge status={chatStatus} />

        {assignedId && assignedId !== currentUserId && (
          <View style={styles.assignedBanner}>
            <Text style={styles.assignedText}>
              {user.role === 'client' 
                ? 'You have assigned this job to another freelancer'
                : 'Job has been assigned to another freelancer'}
            </Text>
          </View>
        )}
      </View>

      <ChatMenu
        visible={showMenu}
        onToggle={() => setShowMenu(!showMenu)}
        onAction={onMenuAction}
      />
    </View>
  );
};

const getStyles = (currentTheme) => StyleSheet.create({
  header: {
    padding: 15,
    alignItems: "flex-start",
    flex: 0,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  backButton: {
    padding: 5,
  },
  headerData: {
    alignItems: "center",
    flex: 0,
    flexDirection: "column",
  },
  profile: {
    fontSize: 12,
    fontWeight: "400",
    color: currentTheme.text || "#000000",
  },
  username: {
    fontSize: 24,
    fontWeight: "600",
    color: "#5c2d91",
    paddingVertical: 4,
  },
  assignedBanner: {
    backgroundColor: "#FFE0E0",
    padding: 10,
    marginTop: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FFB0B0",
  },
  assignedText: {
    color: "#D32F2F",
    textAlign: "center",
    fontSize: 14,
    fontWeight: "500",
  },
});

export default ChatHeader;