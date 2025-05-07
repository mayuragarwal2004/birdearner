import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useAppwrite } from "../context/AppwriteContext";
import { useTheme } from "../context/ThemeContext";

const LeaderboardScreen = () => {
  const { appwriteConfig, databases } = useAppwrite();
  const [selectedTab, setSelectedTab] = useState("india");
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { userData } = useAuth();

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];

  const styles = getStyles(currentTheme);

  const user = {
    id: userData?.$id,
    country: userData?.country,
    state: userData?.state,
    pin: userData?.zipcode,
  };

  useEffect(() => {
    fetchLeaderboardData(selectedTab);
  }, [selectedTab]);

  const fetchLeaderboardData = async (tab) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.freelancerCollectionId
      );

      const documents = response.documents;

      // Filter and rank data based on the selected tab
      const rankedData = filterAndRankData(documents, tab);
      setLeaderboardData(rankedData);
    } catch (err) {
      setError("Failed to fetch leaderboard data");
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndRankData = (documents, tab) => {
    let filteredDocs;
    if (tab === "india") {
      filteredDocs = documents;
    } else if (tab === "state") {
      filteredDocs = documents.filter((doc) => doc.state === user.state);
    } else {
      filteredDocs = documents.filter((doc) => doc.zipcode === user.pin);
    }

    // Sort by XP and orders
    const rankedDocs = filteredDocs
      .sort((a, b) => {
        if (b.XP === a.XP) {
          return b.assigned_jobs.length - a.assigned_jobs.length;
        }
        return b.XP - a.XP;
      })
      .map((doc, index) => ({
        ...doc,
        rank: index + 1,
        isCurrentUser: doc.$id === user.id,
      }));

    // Extract top 5 and ensure current user is included
    const currentUser = rankedDocs.find((doc) => doc.isCurrentUser);
    const topFive = rankedDocs.slice(0, 5);

    if (currentUser && !topFive.some((doc) => doc.isCurrentUser)) {
      topFive.push(currentUser);
    }

    return topFive.slice(0, 6);
  };

  const formatXP = (xp) => {
    if (xp >= 1000000) {
      return (xp / 1000000).toFixed(1) + "M"; // For millions
    } else if (xp >= 1000) {
      return (xp / 1000).toFixed(1) + "K"; // For thousands
    } else {
      return xp; // For values less than 1000
    }
  };

  const handleTabPress = (tab) => {
    setSelectedTab(tab);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Text style={styles.title}>Lead Board</Text>
      <Text style={styles.subtitle}>
        ({selectedTab.charAt(0).toUpperCase() + selectedTab.slice(1)})
      </Text>

      {/* Leaderboard Table */}
      <ScrollView style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <Text style={[styles.headerText, styles.nameColumn]}>Name</Text>
          <Text style={[styles.headerText, styles.xpColumn]}>XP</Text>
          <Text style={[styles.headerText, styles.ordersColumn]}>Orders</Text>
          <Text style={[styles.headerText, styles.rankColumn]}>Rank</Text>
        </View>

        {leaderboardData.map((user, index) => (
          <View
            key={index}
            style={[
              styles.tableRow,
              isLoading && styles.fadedRow, // Apply faded style during loading
              user.isCurrentUser
                ? styles.currentUserRow
                : user.rank === 1 || user.rank === 2
                ? styles.topRankRow
                : styles.otherUserRow,
            ]}
          >
            <Text
              style={[styles.tableText, styles.nameColumn]}
              numberOfLines={1}
            >
              {user.isCurrentUser ? `You` : user?.full_name}
            </Text>
            <View
              style={[
                styles.xpColumn,
                user.isCurrentUser
                  ? styles.currentredBackground
                  : styles.blueBackground,
              ]}
            >
              <Text style={styles.blueText}>{formatXP(user?.XP)}</Text>
            </View>
            <Text style={[styles.tableText, styles.ordersColumn]}>
              {user?.assigned_jobs.length}
            </Text>
            <View
              style={[
                styles.rankColumn,
                user.isCurrentUser
                  ? styles.currentredBackgroundd
                  : styles.blueBackgroundd,
              ]}
            >
              <Text style={styles.blueText}>{formatXP(user?.rank)}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Footer Text */}
      <Text style={styles.footerText}>
        Feature on the top 5 on the leaderboard and win coupons, gifts, and less
        deduction on your bids!
      </Text>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "local" && styles.activeTab]}
          onPress={() => handleTabPress("local")}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "local" && styles.activeTabText,
            ]}
          >
            Local
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "state" && styles.activeTab]}
          onPress={() => handleTabPress("state")}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "state" && styles.activeTabText,
            ]}
          >
            State
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "india" && styles.activeTab]}
          onPress={() => handleTabPress("india")}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "india" && styles.activeTabText,
            ]}
          >
            India
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const getStyles = (currentTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: currentTheme.background || "#ffffff",
      paddingTop: 50,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 4,
      color: currentTheme.text,
    },
    subtitle: {
      fontSize: 16,
      textAlign: "center",
      marginBottom: 16,
      color: currentTheme.subText,
    },
    tableContainer: {
      marginBottom: 16,
    },
    tableHeader: {
      flexDirection: "row",
      justifyContent: "space-around",
      // backgroundColor: '#f0f0f0',
      padding: 12,
      borderRadius: 10,
    },
    headerText: {
      fontWeight: "bold",
      fontSize: 16,
      color: "#726B6B",
      flex: 1,
      textAlign: "center",
    },
    tableRow: {
      flexDirection: "row",
      justifyContent: "space-around",
      // padding: 12,
      marginVertical: 4,
      borderRadius: 12,
    },
    fadedRow: {
      opacity: 0.5,
    },
    topRankRow: {
      backgroundColor: "#71C232",
    },
    otherUserRow: {
      backgroundColor: "#C9D63E",
    },
    currentUserRow: {
      backgroundColor: "#E8E8E8",
    },
    tableText: {
      fontSize: 16,
      flex: 1,
      textAlign: "center",
      padding: 12,
    },
    nameColumn: {
      flex: 2, // Increased width for Name column
      textAlign: "center", // Align text to the left
    },
    xpColumn: {
      flex: 1, // Default width
      textAlign: "center",
    },
    ordersColumn: {
      flex: 1, // Default width
      textAlign: "center",
    },
    rankColumn: {
      flex: 1, // Default width
      textAlign: "center",
    },
    blueBackground: {
      backgroundColor: currentTheme.primary || "#762BAD",
      // borderRadius: 5,
      paddingVertical: 12,
      flex: 1,
      alignItems: "center",
    },
    blueBackgroundd: {
      backgroundColor: currentTheme.primary || "#762BAD",
      borderTopRightRadius: 12,
      borderBottomRightRadius: 12,
      paddingVertical: 12,
      flex: 1,
      alignItems: "center",
    },
    currentredBackground: {
      backgroundColor: "#DC3737",
      // borderRadius: 5,
      paddingVertical: 12,
      flex: 1,
      alignItems: "center",
    },
    currentredBackgroundd: {
      backgroundColor: "#DC3737",
      borderTopRightRadius: 12,
      borderBottomRightRadius: 12,
      paddingVertical: 12,
      flex: 1,
      alignItems: "center",
    },
    blueText: {
      color: "white",
      fontSize: 16,
    },
    footerText: {
      textAlign: "center",
      fontSize: 16,
      color: currentTheme.subText || "#555",
      marginVertical: 20,
      paddingHorizontal: 50,
    },
    tabContainer: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginBottom: 15,
    },
    tab: {
      paddingHorizontal: 30,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: currentTheme.cardBackground || "#ccc",
    },
    activeTab: {
      backgroundColor: "#6A1B9A",
    },
    tabText: {
      fontSize: 15,
      fontWeight: "bold",
      color: currentTheme.subText || "#fff",
    },
    activeTabText: {
      color: "#fff",
    },
    tabShadow: {
      shadowColor: currentTheme.shadow || "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 5,
    },
  });

export default LeaderboardScreen;
