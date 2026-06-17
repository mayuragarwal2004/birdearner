import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, ArrowsClockwise, CaretRight, PaperPlaneRight } from "phosphor-react-native";
import apiService from "../lib/apiService";
import { useKeyboard } from "../context/KeyboardContext";

const Bird = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef(null);

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isKeyboardVisible } = useKeyboard();

  // Dynamic colors for dark/light mode balance
  const isDark = theme === "dark";
  const gradientColors = isDark 
    ? ["#350F6A", currentTheme.background || "#111827"] 
    : ["#4B0082", currentTheme.background || "#F9FAFB"];
  const headerTextColor = "#FFFFFF";
  const titleColor = isDark ? "#FFFFFF" : "#1e1b4b";
  const subtitleColor = isDark ? "#9ca3af" : "#4b5563";
  const cardBg = isDark ? "#1f2937" : "#F4F5F7";
  const iconBg = isDark ? "#374151" : "#EBEBF0";
  const textColor = isDark ? "#FFFFFF" : "#111827";
  const primaryPurple = isDark ? "#C4B5FD" : "#4B0082";
  const inputBg = isDark ? "#1f2937" : "#FFFFFF";
  const inputBorder = isDark ? "#374151" : "#E5E7EB";

  const sendMessage = async (overrideText = null) => {
    const textToSend = overrideText !== null ? overrideText : input;
    if (!textToSend.trim()) return;

    const userMessage = { sender: "user", text: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    if (overrideText === null) setInput("");

    try {
      setLoading(true);
      const history = messages.map((msg) => msg.text);

      const response = await fetch(`${apiService.baseURL}/faqs/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: textToSend, history }),
      });

      const data = await response.json();

      if (response.ok) {
        const botMessage = {
          sender: "bot",
          text: data.answer || "I couldn't process that. Please try again.",
        };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        throw new Error(data.error || "An error occurred.");
      }
    } catch (error) {
      console.log("Error sending message:", error);
      const errorMessage = {
        sender: "bot",
        text: "Oops! Something went wrong. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const resetChat = () => {
    setMessages([]);
    setInput("");
  };

  const renderMessage = ({ item }) => {
    const isUser = item.sender === "user";
    return (
      <View style={[styles.messageWrapper, isUser ? styles.messageWrapperUser : styles.messageWrapperBot]}>
        <View
          style={[
            styles.messageBubble,
            isUser ? { backgroundColor: "#4B0082" } : { backgroundColor: cardBg },
          ]}
        >
          <Text style={[styles.messageText, isUser ? { color: "#FFF" } : { color: textColor }]}>
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  const EmptyChat = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.welcomeTitle, { color: titleColor }]}>Welcome to BirdBot!</Text>
      <Text style={[styles.welcomeSubtitle, { color: subtitleColor }]}>Your AI Assistant</Text>
      <Text style={[styles.helpText, { color: textColor }]}>I can help you with:</Text>
      
      <View style={styles.suggestionContainer}>
        <TouchableOpacity style={[styles.suggestionButton, { backgroundColor: cardBg }]} onPress={() => sendMessage("What is BirdEarner?")}>
          <View style={[styles.suggestionIconWrapper, { backgroundColor: iconBg }]}>
            <Text style={styles.emojiIcon}>🦜</Text>
          </View>
          <Text style={[styles.suggestionText, { color: textColor }]}>What is BirdEarner?</Text>
          <CaretRight size={20} color={primaryPurple} weight="bold" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.suggestionButton, { backgroundColor: cardBg }]} onPress={() => sendMessage("What services can I offer?")}>
          <View style={[styles.suggestionIconWrapper, { backgroundColor: iconBg }]}>
            <Text style={styles.emojiIcon}>🛠️</Text>
          </View>
          <Text style={[styles.suggestionText, { color: textColor }]}>What services can I offer?</Text>
          <CaretRight size={20} color={primaryPurple} weight="bold" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.suggestionButton, { backgroundColor: cardBg }]} onPress={() => sendMessage("How does payment work?")}>
          <View style={[styles.suggestionIconWrapper, { backgroundColor: iconBg }]}>
            <Text style={styles.emojiIcon}>💰</Text>
          </View>
          <Text style={[styles.suggestionText, { color: textColor }]}>How does payment work?</Text>
          <CaretRight size={20} color={primaryPurple} weight="bold" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradientColors}
        style={StyleSheet.absoluteFill}
        locations={[0, 0.4]}
      />
      
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView 
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
              <ArrowLeft size={24} color={headerTextColor} />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={resetChat} style={styles.resetButton}>
              <ArrowsClockwise size={20} color={headerTextColor} style={styles.resetIcon} />
              <Text style={styles.resetText}>Reset chat</Text>
            </TouchableOpacity>
          </View>

          {/* Chat List */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(_, index) => index.toString()}
            renderItem={renderMessage}
            contentContainerStyle={[styles.chatListContainer, messages.length === 0 && { flex: 1 }]}
            ListEmptyComponent={EmptyChat}
            showsVerticalScrollIndicator={false}
          />

          {/* Input Area */}
          <View style={[styles.inputOuterContainer, { paddingBottom: isKeyboardVisible ? Math.max(insets.bottom + 10, 20) : (Platform.OS === "ios" ? 100 : 85) }]}>
            <View style={[styles.inputInnerContainer, { backgroundColor: inputBg, borderColor: inputBorder }]}>
              <TextInput
                style={[styles.inputField, { color: textColor }]}
                placeholder="Ask me anything..."
                placeholderTextColor={subtitleColor}
                value={input}
                onChangeText={setInput}
                editable={!loading}
                multiline
                maxLength={500}
              />
              <TouchableOpacity 
                style={[styles.sendButton, (!input.trim() || loading) && { opacity: 0.6 }]}
                onPress={() => sendMessage(null)}
                disabled={!input.trim() || loading}
              >
                <PaperPlaneRight size={20} color="#FFF" weight="fill" style={styles.sendIcon} />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerIcon: {
    padding: 5,
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 5,
  },
  resetIcon: {
    marginRight: 6,
  },
  resetText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "500",
  },
  chatListContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 40,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    marginBottom: 30,
  },
  helpText: {
    fontSize: 16,
    marginBottom: 20,
  },
  suggestionContainer: {
    width: "100%",
    gap: 16,
  },
  suggestionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
  },
  suggestionIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  emojiIcon: {
    fontSize: 22,
  },
  suggestionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
  messageWrapper: {
    width: "100%",
    marginBottom: 16,
  },
  messageWrapperUser: {
    alignItems: "flex-end",
  },
  messageWrapperBot: {
    alignItems: "flex-start",
  },
  messageBubble: {
    maxWidth: "85%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  inputOuterContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  inputInnerContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    minHeight: 60,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  inputField: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingRight: 10,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#4B0082",
    justifyContent: "center",
    alignItems: "center",
  },
  sendIcon: {
    marginLeft: -2, 
  },
});

export default Bird;
