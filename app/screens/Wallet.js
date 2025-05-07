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
import { useAppwrite } from "../context/AppwriteContext";
import { Query } from "react-native-appwrite";
import { useTheme } from "../context/ThemeContext";

const WalletScreen = ({ navigation, route }) => {
  const { appwriteConfig, databases } = useAppwrite();

  const { userData } = useAuth();
  const [history, setHistory] = useState();

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];

  const styles = getStyles(currentTheme);

  useEffect(() => {
    const fetchHistry = async () => {
      try {
        const freelancerId = userData?.$id;

        const response = await databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.withdrawalRequestsCollectionId,
          [Query.equal("freelancerId", freelancerId)]
        );

        const sortedDocuments = response.documents.sort(
          (a, b) => new Date(b.$createdAt) - new Date(a.$createdAt)
        );

        setHistory(sortedDocuments);
      } catch (error) {
        Alert.alert("Failed to fetch reviews");
      }
    };

    fetchHistry();
  }, [userData]);

  function getStatusColor(status) {
    switch (status) {
      case "pending":
        return "#FFCC00";
      case "rejected":
        return "#FF3B30";
      case "approved":
        return "#71C232";
      default:
        return "#808080";
    }
  }

  function getStatusText(status) {
    switch (status) {
      case "pending":
        return "Requested amount successfully";
      case "rejected":
        return "Withdrawal has been rejected";
      case "approved":
        return "Received amount successfully";
      default:
        return "Something went wrong";
    }
  }

  const renderItem = ({ item }) => {
    const createdAt = item?.createdAt;
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
                    borderLeftColor: getStatusColor(item?.status), // Color based on status
                  },
                ]}
              />
              <Text style={styles.name}>{getStatusText(item?.status)} </Text>
            </View>
            <Text style={styles.amount}>₹{item?.requestedAmount}</Text>
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

      {/* Full Name Input */}
      <Text style={styles.label}>Total Amount in Wallet</Text>
      <Text style={styles.colorText}>
        RS. {userData?.withdrawableAmount || "0"}
      </Text>

      <TouchableOpacity
        onPress={() => navigation.navigate("Withdrawal Earning")}
      >
        <Text style={styles.addAmount}>Withdrawal Amount</Text>
      </TouchableOpacity>

      {/* <TouchableOpacity style={styles.signupButton}>
        <Text style={styles.signupButtonText}>Next Page</Text>
      </TouchableOpacity> */}

      <View style={styles.container}>
        <Text style={styles.headerHis}>Payment History</Text>

        <FlatList
          data={history}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
        />
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
      paddingHorizontal: 20,
    },
    main: {
      marginTop: 45,
      marginBottom: 50,
      display: "flex",
      flexDirection: "row",
      gap: 120,
      alignItems: "center",
      // paddingHorizontal: 20
    },
    header: {
      fontSize: 24,
      fontWeight: "bold",
      // marginBottom: 20,
      textAlign: "center",
      color: currentTheme.text,
    },
    headerHis: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 20,
      textAlign: "center",
      color: "#8F8F8F",
    },
    label: {
      fontSize: 18,
      color: currentTheme.text || "#000000",
      marginBottom: 8,
      // marginLeft: 8,
      fontWeight: "400",
      textAlign: "center",
    },
    addAmount: {
      textAlign: "center",
      textDecorationLine: "underline",
      fontSize: 16,
      color: "#4B0082",
      marginBottom: 30,
    },
    colorText: {
      fontSize: 30,
      fontWeight: "600",
      color: currentTheme.primary || "#4B0082",
      textAlign: "center",
      marginBottom: 10,
    },
    withdrwal: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      marginTop: 10,
    },
    withdrwalText: {
      color: "#fff",
      fontSize: 24,
      fontWeight: "600",
      textAlign: "center",
      backgroundColor: "#4B0082",
      width: 100,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 12,
    },
    input: {
      width: "25%",
      height: 44,
      backgroundColor: "#fff",
      borderRadius: 12,
      paddingHorizontal: 20,
      marginBottom: 40,
      fontSize: 16,
      borderColor: "#4B0082",
      borderWidth: 2,
      margin: "auto",
      marginVertical: 10,
    },
    signupButton: {
      width: "50%",
      height: 50,
      backgroundColor: "#6A0DAD",
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 50,
      margin: "auto",
    },
    signupButtonText: {
      color: "white",
      fontSize: 24,
      fontWeight: "700",
    },

    paymentItem: {
      backgroundColor: currentTheme.cardBackground || "#fff",
      // padding: 12,
      marginVertical: 5,
      borderRadius: 8,
      elevation: 3, // Add shadow for elevation (optional)
      shadowColor: currentTheme.shadow || "#000",
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
      marginRight: 10, // Space between the triangle and the details
    },
    paymentDetails: {
      flex: 1, // Ensure details take remaining space
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
      fontSize: 16,
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

export default WalletScreen;
