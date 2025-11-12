import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";

const ChatMenu = ({ visible, onToggle, onAction }) => {
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const styles = getStyles(currentTheme);

  const menuOptions = ["View Profile", "Block", "Report"];

  if (!visible) {
    return (
      <TouchableOpacity onPress={onToggle}>
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
      <TouchableOpacity onPress={onToggle}>
        <Ionicons
          name="ellipsis-horizontal"
          size={24}
          color={currentTheme.text || "black"}
        />
      </TouchableOpacity>
      <View style={styles.menuContainer}>
        {menuOptions.map((action) => (
          <TouchableOpacity
            key={action}
            style={styles.menuItem}
            onPress={() => onAction(action)}
          >
            <Text style={styles.menuItemText}>{action}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );
};

const getStyles = (currentTheme) => StyleSheet.create({
  menuContainer: {
    position: "absolute",
    top: 115,
    right: 20,
    backgroundColor: currentTheme.background3 || "white",
    borderRadius: 5,
    padding: 10,
    shadowColor: currentTheme.shadow || "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 2334,
  },
  menuItem: {
    paddingVertical: 10,
  },
  menuItemText: {
    fontSize: 16,
    color: currentTheme.text || "black",
  },
});

export default ChatMenu;
