import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import FilePreview from './FilePreview';

const ChatInput = ({
  onSend,
  onFilePick,
  characterLimit,
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
          onChangeText={setInput}
          placeholder="Type your message..."
          placeholderTextColor={currentTheme.subText || "#666"}
          maxLength={characterLimit || undefined}
        />
        
        {!fileInfo && (
          <TouchableOpacity
            style={styles.attachButton}
            onPress={onFilePick}
          >
            <MaterialIcons name="attach-file" size={24} color="#4C0183" />
          </TouchableOpacity>
        )}

        {sending ? (
          <ActivityIndicator size="small" color="#4C0183" />
        ) : (
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        )}
      </View>

      {isUploading && (
        <View style={styles.uploadProgress}>
          <Text style={styles.uploadText}>
            Uploading file... {Math.round(uploadProgress)}%
          </Text>
          <ActivityIndicator size="small" color="#4C0183" />
        </View>
      )}
    </View>
  );
};

const getStyles = (currentTheme) => StyleSheet.create({
  container: {
    flexDirection: "column",
    padding: 10,
    borderTopWidth: 1,
    borderColor: currentTheme.border || "#ddd",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: currentTheme.background3 || "#fff",
  },
  input: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: currentTheme.border || "#ddd",
    borderRadius: 5,
    color: currentTheme.text || "#000",
    backgroundColor: currentTheme.background || "#fff",
  },
  attachButton: {
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButton: {
    marginLeft: 10,
    padding: 10,
    backgroundColor: "#5c2d91",
    borderRadius: 5,
  },
  sendButtonText: {
    color: "#fff",
  },
  uploadProgress: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    backgroundColor: currentTheme.cardBackground,
    borderTopWidth: 1,
    borderColor: currentTheme.border,
  },
  uploadText: {
    color: currentTheme.text,
    marginRight: 10,
  },
});

export default ChatInput;