import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import { useTheme } from "../context/ThemeContext";

const Bird = () => {
  const [messages, setMessages] = useState([]); // Chat messages
  const [input, setInput] = useState(""); // Input text
  const [loading, setLoading] = useState(false);

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];

  const styles = getStyles(currentTheme);

  // Send a new message
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      sender: "user",
      text: input,
    };

    // Add user message to the chat history
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    try {
      setLoading(true);

      // Prepare chat history
      const history = messages.map((msg) => msg.text);

      console.log("test 1");
      

      // API request to backend
      const response = await fetch("https://api.birdearner.com/faq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: input, history }),
      });
      console.log("test 2");

      const data = await response.json();
      console.log("test 3");

      console.log(response);
      

      if (response.ok) {
        const botMessage = {
          sender: "bot",
          text: data.answer || "I couldn't process that. Please try again.",
        };
        console.log("test 4");

        // Add bot response to the chat
        setMessages((prevMessages) => [...prevMessages, botMessage]);
      console.log("test 5");
    } else {
        throw new Error(data.error || "An error occurred.");
      }
    } catch (error) {
      console.log("Error sending message:", error);
      console.log("Error sending message:", JSON.stringify(error));

      const errorMessage = {
        sender: "bot",
        text: "Oops! Something went wrong. Please try again.",
      };

      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setInput("");
      setLoading(false);
    }
  };

  // Render individual message
  const renderMessage = ({ item }) => {
    const isUser = item.sender === "user";
    return (
      <View
        style={[
          styles.messageContainer,
          isUser ? styles.userMessage : styles.botMessage,
        ]}
      >
        <Text style={styles.messageText}>{item.text}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(_, index) => index.toString()}
        renderItem={renderMessage}
        style={styles.chatList}
        contentContainerStyle={styles.chatListContainer}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask me anything..."
          editable={!loading}
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={sendMessage}
          disabled={loading}
        >
          <Text style={styles.sendButtonText}>{loading ? "..." : "Send"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const getStyles = (currentTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background || "#fff",
      paddingHorizontal: 20,
      // marginHorizontal: 10,
      paddingTop: 50
    },
    chatList: { flex: 1 },
    chatListContainer: { padding: 10 },
    messageContainer: {
      marginVertical: 5,
      padding: 10,
      borderRadius: 8,
    },
    userMessage: {
      backgroundColor: currentTheme.cardBackground || "#d1e7dd",
      alignSelf: "flex-end",
    },
    botMessage: {
      backgroundColor: currentTheme.cardBackground || "#f1f1f1",
      alignSelf: "flex-start",
    },
    messageText: { fontSize: 16, color: currentTheme.text || "#000" },
    inputContainer: {
      flexDirection: "row",
      padding: 10,
      borderTopWidth: 1,
      borderColor: "#ddd",
    },
    input: {
      flex: 1,
      padding: 10,
      borderWidth: 1,
      borderColor: currentTheme.border || "#ddd",
      borderRadius: 8,
      color: currentTheme.subText || "#000000",
      backgroundColor: currentTheme.background3 || '#fff',
    },
    sendButton: {
      marginLeft: 10,
      padding: 10,
      backgroundColor: "#5c2d91",
      borderRadius: 8,
      justifyContent: "center",
    },
    sendButtonText: { color: "#fff", fontWeight: "bold" },
  });

export default Bird;