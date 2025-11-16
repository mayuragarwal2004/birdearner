import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";

const getIconForAction = (action) => {
  switch (action) {
    case "View Profile":
      return "person-outline";
    case "Block":
      return "ban-outline";
    case "Report":
      return "flag-outline";
    case "Request Project Completion":
      return "checkmark-circle-outline";
    case "Cancel Job":
      return "close-circle-outline";
    default:
      return "ellipsis-horizontal";
  }
};

const ChatMenu = ({ visible, onToggle, onAction, menuOptions = ["View Profile", "Block", "Report"] }) => {
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const styles = getStyles(currentTheme);

  if (!visible) {
    return (
      <TouchableOpacity onPress={onToggle} style={styles.menuButton}>
        <Ionicons
          name="ellipsis-horizontal"
          size={24}
          color={currentTheme.text || "black"}
        />
      </TouchableOpacity>
    );
  }

  return (
    <>
      <TouchableOpacity onPress={onToggle} style={styles.menuButton}>
        <Ionicons
          name="ellipsis-horizontal"
          size={24}
          color={currentTheme.text || "black"}
        />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onToggle}
      >
        <View style={styles.menuContainer}>
          {menuOptions.map((action) => (
            <TouchableOpacity
              key={action}
              style={styles.menuItem}
              onPress={() => onAction(action)}
            >
              <Ionicons
                name={getIconForAction(action)}
                size={20}
                color={currentTheme.text || "#1E293B"}
                style={styles.menuIcon}
              />
              <Text style={styles.menuItemText}>{action}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </>
  );
};

const getStyles = (currentTheme) => StyleSheet.create({
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: currentTheme.background || '#F8FAFC',
    borderWidth: 1,
    borderColor: currentTheme.border || '#E5E7EB',
    padding: 8,
  },
  backdrop: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
    backgroundColor: 'transparent',
    zIndex: 2333,
  },
  menuContainer: {
    position: "absolute",
    top: 1055,
    right: 1000,
    backgroundColor: currentTheme.surface || "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    zIndex: 2334,
    minWidth: 200,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 2,
  },
  menuIcon: {
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: currentTheme.text || "#1E293B",
    fontWeight: "500",
    flex: 1,
  },
});

export default ChatMenu;
