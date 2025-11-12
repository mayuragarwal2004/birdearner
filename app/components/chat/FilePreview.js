import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";

const FilePreview = ({ fileInfo, onRemove }) => {
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const styles = getStyles(currentTheme);

  if (!fileInfo || !fileInfo.name) return null;

  return (
    <View style={styles.selectedFileContainer}>
      <View style={styles.fileInfo}>
        <Text style={styles.fileName}>{fileInfo.name}</Text>
        <TouchableOpacity
          style={styles.removeFileButton}
          onPress={onRemove}
        >
          <MaterialIcons name="cancel" size={24} color="#4C0183" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const getStyles = (currentTheme) => StyleSheet.create({
  selectedFileContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: currentTheme.background3 || "#fff",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  fileInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  fileName: {
    color: currentTheme.text || "#000",
    fontSize: 14,
    flex: 1,
    marginRight: 10,
  },
  removeFileButton: {
    padding: 5,
  },
});

export default FilePreview;