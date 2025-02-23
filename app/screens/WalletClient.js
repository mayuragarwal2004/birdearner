import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { Query } from "react-native-appwrite";
import { appwriteConfig, databases } from "../lib/appwrite";
import { useTheme } from "../context/ThemeContext";

const WalletClientScreen = ({ navigation }) => {
  const { userData } = useAuth();
  const [walletAmount, setWalletAmount] = useState(userData?.wallet || 0);
  const [paymentHistory, setPaymentHistory] = useState([]);

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];

  const styles = getStyles(currentTheme);

  // Fetch updated wallet data when the screen is focused
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", fetchWalletData);
    return unsubscribe;
  }, [navigation]);

  const fetchPaymentHistory = async (userId) => {
    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.paymentHistoryCollectionId,
        [Query.equal("userId", userId)]
      );

      const sortedDocuments = response.documents.sort((a, b) => {
        return new Date(b.$createdAt) - new Date(a.$createdAt);
      });
      setPaymentHistory(sortedDocuments || []);
    } catch (error) {
      Alert.alert("Error fetching payment history");
    }
  };

  const fetchWalletData = async () => {
    try {
      if (userData) {
        const userId = userData?.$id;
        const collectionId = appwriteConfig.clientCollectionId;

        // Fetch wallet details
        const userDoc = await databases.getDocument(
          appwriteConfig.databaseId,
          collectionId,
          userId
        );

        setWalletAmount(userDoc.wallet || 0);

        // Fetch payment history
        fetchPaymentHistory(userId);
      }
    } catch (error) {
      Alert.alert("Error fetching wallet data");
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Success":
        return { color: "green" };
      case "Failed":
        return { color: "red" };
      case "Pending":
        return { color: "orange" };
      case "Recieved":
        return { color: "orange" };
      default:
        return {};
    }
  };

  function getStatusColor(status) {
    switch (status) {
      case "Pending":
        return "#FFCC00";
      case "Failed":
        return "#FF3B30";
      case "Paid":
        return "#71C232";
      case "Success":
        return "#71C232";
      case "Recieved":
        return "#FFCC00";
      default:
        return "#808080";
    }
  }

  function getStatusText(status) {
    switch (status) {
      case "Pending":
        return "Requested amount successfully";
      case "Failed":
        return "Withdrawal has been rejected";
      case "Success":
        return "Received amount successfully";
      default:
        return "Something went wrong";
    }
  }

  const renderItem = ({ item }) => {
    const createdAt = item?.date;
    const date = new Date(createdAt);

    // Format the date and time
    const formattedDate = date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const formattedTime = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    return (
      <View style={[styles.paymentItem]}>
        {/* Triangle Indicator and Payment Details */}
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {/* Payment Details */}
          <View style={styles.paymentDetails}>
            {/* Triangle Indicator */}
            <View style={styles.indicatorName}>
              <View
                style={[
                  styles.triangleIndicator,
                  {
                    borderLeftColor: getStatusColor(item?.status),
                  },
                ]}
              />
              <Text style={styles.name}>ID: {item?.paymentId} </Text>
            </View>
            <Text style={styles.amount}>₹{item?.amount}</Text>
          </View>
        </View>

        {/* Date and Status */}
        <View
          style={[
            styles.paymentDetailsn,
            {
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            },
          ]}
        >
          <Text style={styles.date}>
            {formattedDate} | {formattedTime}
          </Text>
          <Text
            style={[
              styles.status,
              { color: getStatusColor(item?.status) }, // Set color based on status
            ]}
          >
            {item?.status}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.main}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={currentTheme.text || black}
          />
        </TouchableOpacity>
        <Text style={styles.header}>Wallet</Text>
      </View>

      <Text style={styles.label}>Total Amount in Wallet</Text>
      <Text style={styles.colorText}>₹{walletAmount || "0.0"}</Text>

      <TouchableOpacity
        style={styles.addAmountButton}
        onPress={() => navigation.navigate("Payment")}
      >
        <Text style={styles.addAmount}>Add Amount to Wallet</Text>
      </TouchableOpacity>

      <View style={styles.historyContainer}>
        <Text style={styles.headerPay}>Payment History</Text>
        {paymentHistory.length > 0 ? (
          <FlatList
            data={paymentHistory}
            renderItem={renderItem}
            keyExtractor={(item) => item.$id}
            style={styles.historyList}
          />
        ) : (
          <Text style={styles.noHistory}>No payment history available.</Text>
        )}
      </View>
    </View>
  );
};

const getStyles = (currentTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: currentTheme.background || "#FFF",
      paddingHorizontal: 40,
    },
    main: {
      marginTop: 45,
      marginBottom: 50,
      display: "flex",
      flexDirection: "row",
      gap: 100,
      alignItems: "center",
    },
    addAmountButton: {
      width: "90%",
      margin: "auto",
      padding: 10,
      backgroundColor: "#6A0DAD",
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    addAmount: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 20,
    },

    header: {
      fontSize: 24,
      fontWeight: "bold",
      textAlign: "center",
      color: currentTheme.text,
    },
    headerPay: {
      fontSize: 22,
      fontWeight: "600",
      marginBottom: 20,
      textAlign: "center",
      marginTop: 25,
      color: "#8F8F8F",
    },
    label: {
      fontSize: 18,
      color: currentTheme.text || "#000000",
      marginBottom: 8,
      fontWeight: "400",
      textAlign: "center",
    },
    colorText: {
      fontSize: 30,
      fontWeight: "600",
      color: "#4B0082",
      textAlign: "center",
      marginBottom: 20,
    },
    historyContainer: {
      flex: 1,
      marginTop: 20,
    },
    historyList: {
      marginTop: 10,
    },
    paymentItem: {
      backgroundColor: currentTheme.background || "#F9F9F9",
      padding: 15,
      marginVertical: 10,
      borderRadius: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
    },
    paymentCon: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "center",
      gap: 50,
      marginLeft: 1,
      alignItems: "center",
    },
    paymentId: {
      fontSize: 14,
      fontWeight: "600",
      color: "#333",
    },
    paymentAmount: {
      fontSize: 14,
      fontWeight: "500",
      color: "#4B0082",
    },
    paymentStatus: {
      fontSize: 14,
      fontWeight: "600",
      // marginTop: 5,
    },
    paymentDate: {
      fontSize: 12,
      color: "#888",
      // marginTop: 5,
    },
    noHistory: {
      fontSize: 16,
      color: "#888",
      textAlign: "center",
      marginTop: 20,
    },

    paymentItem: {
      backgroundColor: currentTheme.cardBackground || "#fff",
      // padding: 12,
      marginVertical: 5,
      borderRadius: 8,
      elevation: 3, // Add shadow for elevation (optional)
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 1.5,
      paddingVertical: 5,
      paddingHorizontal: 10,
    },
    triangleIndicator: {
      width: 0,
      height: 0,
      borderTopWidth: 8,
      borderBottomWidth: 8,
      borderLeftWidth: 16,
      borderStyle: "solid",
      borderTopColor: "transparent",
      borderBottomColor: "transparent",
      marginRight: 10,
    },
    paymentDetails: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 5,
    },
    indicatorName: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "flex-start",
      alignItems: "center",
      // color: currentTheme.text
    },
    name: {
      fontSize: 15,
      fontWeight: "500",
      color: currentTheme.subText || "#333",
    },
    amount: {
      fontSize: 15,
      fontWeight: "500",
      color: "#71C232",
    },
    date: {
      fontSize: 12,
      color: "#666",
    },
    status: {
      fontSize: 12,
      fontWeight: "bold",
    },
  });

export default WalletClientScreen;
