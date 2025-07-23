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
        <Text style={[
          styles.messageText,
          isUser ? { color: '#fff' } : null
        ]}>{item.text}</Text>
      </View>
    );
  };

  const EmptyChat = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.welcomeTitle}>Welcome to BirdBot! 🦜</Text>
      <Text style={styles.welcomeSubtitle}>Your AI Assistant</Text>
      <Text style={styles.welcomeText}>
        I can help you with:
      </Text>
      <View style={styles.suggestionContainer}>
        <TouchableOpacity 
          style={styles.suggestionButton}
          onPress={() => setInput("What is BirdEarner?")}
        >
          <Text style={styles.suggestionText}>🦜 What is BirdEarner?</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.suggestionButton}
          onPress={() => setInput("What services can I offer?")}
        >
          <Text style={styles.suggestionText}>🛠️ What services can I offer?</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.suggestionButton}
          onPress={() => setInput("How does payment work?")}
        >
          <Text style={styles.suggestionText}>💰 How does payment work?</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(_, index) => index.toString()}
        renderItem={renderMessage}
        style={styles.chatList}
        contentContainerStyle={styles.chatListContainer}
        ListEmptyComponent={EmptyChat}
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
      paddingTop: 50
    },
    chatList: { 
      flex: 1 
    },
    chatListContainer: { 
      padding: 10,
      flexGrow: 1 
    },
    messageContainer: {
      marginVertical: 5,
      padding: 12,
      borderRadius: 15,
      maxWidth: '85%',
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.18,
      shadowRadius: 1.0,
      elevation: 1,
    },
    userMessage: {
      backgroundColor: "#4C0183",
      alignSelf: "flex-end",
      borderTopRightRadius: 5,
    },
    botMessage: {
      backgroundColor: currentTheme.cardBackground || "#f1f1f1",
      alignSelf: "flex-start",
      borderTopLeftRadius: 5,
    },
    messageText: { 
      fontSize: 16, 
      color: props => props.sender === 'user' ? '#fff' : currentTheme.text || "#000",
      lineHeight: 22 
    },
    inputContainer: {
      flexDirection: "row",
      padding: 15,
      borderTopWidth: 1,
      borderColor: currentTheme.border || "#ddd",
      backgroundColor: currentTheme.background || "#fff",
    },
    input: {
      flex: 1,
      padding: 12,
      borderWidth: 1,
      borderColor: currentTheme.border || "#ddd",
      borderRadius: 20,
      color: currentTheme.text || "#000000",
      backgroundColor: currentTheme.background3 || '#fff',
      fontSize: 16,
    },
    sendButton: {
      marginLeft: 10,
      padding: 12,
      backgroundColor: "#4C0183",
      borderRadius: 25,
      justifyContent: "center",
      width: 50,
      height: 50,
      alignItems: 'center',
    },
    sendButtonText: { 
      color: "#fff", 
      fontWeight: "bold",
      fontSize: 16,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 100,
    },
    welcomeTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#4C0183',
      marginBottom: 8,
    },
    welcomeSubtitle: {
      fontSize: 18,
      color: currentTheme.text || '#666',
      marginBottom: 24,
    },
    welcomeText: {
      fontSize: 16,
      color: currentTheme.text || '#666',
      marginBottom: 20,
      textAlign: 'center',
    },
    suggestionContainer: {
      width: '100%',
      gap: 12,
    },
    suggestionButton: {
      backgroundColor: currentTheme.cardBackground || '#f5f5f5',
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: currentTheme.border || '#eee',
    },
    suggestionText: {
      color: currentTheme.text || '#333',
      fontSize: 16,
    },
  });

export default Bird;