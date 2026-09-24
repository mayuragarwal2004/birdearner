import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";

const FilePreview = ({ fileInfo, filesInfo, onRemove }) => {
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const styles = getStyles(currentTheme);

  const files = filesInfo || (Array.isArray(fileInfo) ? fileInfo : fileInfo ? [fileInfo] : []);

  if (!files || files.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {files.map((file, index) => {
          if (!file || !file.name) return null;
          return (
            <View key={`${file.name}-${index}`} style={styles.selectedFileContainer}>
              <MaterialIcons
                name={file.mimeType?.startsWith('image/') ? 'image' : 'insert-drive-file'}
                size={18}
                color={currentTheme.primary || "#4C0183"}
                style={{ marginRight: 6 }}
              />
              <Text style={styles.fileName} numberOfLines={1}>
                {file.name}
              </Text>
              <TouchableOpacity
                style={styles.removeFileButton}
                onPress={() => onRemove(index)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons name="cancel" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const getStyles = (currentTheme) => StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  scrollContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 2,
  },
  selectedFileContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: currentTheme.background3 || currentTheme.background || "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: currentTheme.border || "#E2E8F0",
    maxWidth: 220,
  },
  fileName: {
    color: currentTheme.text || "#000",
    fontSize: 12,
    fontWeight: "500",
    flexShrink: 1,
    marginRight: 6,
  },
  removeFileButton: {
    padding: 2,
  },
});

export default FilePreview;