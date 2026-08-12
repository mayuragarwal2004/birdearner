import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import SafeSpinner from '../SafeSpinner';
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import FilePreview from './FilePreview';

const ChatInput = ({
  onSend,
  onFilePick,
  characterLimit,
  charactersRemaining,
  onInputChange,
  fileInfo,
  onRemoveFile,
  sending,
  isUploading,
  uploadProgress,
}) => {
  const [input, setInput] = useState("");
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const styles = getStyles(currentTheme);

  const handleSend = () => {
    if (input.trim() || (fileInfo && fileInfo.name)) {
      onSend(input, fileInfo);
      setInput("");
    }
  };

  return (
    <View style={styles.container}>
      {fileInfo && (
        <FilePreview
          fileInfo={fileInfo}
          onRemove={onRemoveFile}
        />
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={(text) => {
            setInput(text);
            onInputChange?.(text.length);
          }}
          placeholder={charactersRemaining === 0 ? "Character limit reached" : "Type your message..."}
          placeholderTextColor={currentTheme.subText || "#666"}
          maxLength={charactersRemaining !== null ? Math.max(0, charactersRemaining) : undefined}
          editable={charactersRemaining !== 0}
        />
        
        {!fileInfo && (
          <TouchableOpacity
            style={styles.attachButton}
            onPress={onFilePick}
          >
            <MaterialIcons name="attach-file" size={20} color={currentTheme.text || "#64748B"} />
          </TouchableOpacity>
        )}

        {sending ? (
          <View style={styles.sendButton}>
            <SafeSpinner size={18} color="#FFFFFF" />
          </View>
        ) : (
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <MaterialIcons name="send" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      {isUploading && (
        <View style={styles.uploadProgress}>
          <Text style={styles.uploadText}>
            Uploading file... {Math.round(uploadProgress)}%
          </Text>
          <SafeSpinner size={18} color="#4C0183" />
        </View>
      )}
    </View>
  );
};

const getStyles = (currentTheme) => StyleSheet.create({
  container: {
    flexDirection: "column",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: currentTheme.surface || "#FFFFFF",
    borderTopWidth: 1,
    borderColor: currentTheme.border || "#E5E7EB",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: currentTheme.surface || "#FFFFFF",
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: currentTheme.border || "#E5E7EB",
    borderRadius: 24,
    color: currentTheme.text || "#1E293B",
    backgroundColor: currentTheme.background || "#F8FAFC",
    fontSize: 16,
    maxHeight: 120,
    textAlignVertical: 'top',
  },
  attachButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    backgroundColor: currentTheme.background || "#F8FAFC",
    borderWidth: 1,
    borderColor: currentTheme.border || "#E5E7EB",
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    backgroundColor: currentTheme.primary || "#5c2d91",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  uploadProgress: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: currentTheme.background || "#F8FAFC",
    borderRadius: 12,
    marginTop: 6,
    borderWidth: 1,
    borderColor: currentTheme.border || "#E5E7EB",
  },
  uploadText: {
    color: currentTheme.text || "#64748B",
    marginRight: 12,
    fontSize: 14,
    fontWeight: "500",
  },
});

export default ChatInput;