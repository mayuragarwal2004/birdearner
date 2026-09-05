import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Platform,
    Image,
    Dimensions,
    StatusBar,
    RefreshControl
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../context/NewAuthContext";
import { useTheme } from "../context/ThemeContext";
import apiService from "../lib/apiService";
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const LeaderboardScreen = () => {
    const [selectedTab, setSelectedTab] = useState("india");
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const { userData } = useAuth();

    const { theme, themeStyles } = useTheme();
    const currentTheme = themeStyles[theme];
    const styles = getStyles(currentTheme);

    useEffect(() => {
        if (userData?.id) {
            fetchLeaderboardData(selectedTab);
        }
    }, [selectedTab, userData]);

    const fetchLeaderboardData = async (tab, showLoader = true) => {
        if (showLoader) setIsLoading(true);
        setError(null);

        try {
            const data = await apiService.getLeaderboard(tab, userData.id);

            const rankedData = data.map((item, index) => ({
                ...item,
                rank: index + 1,
                isCurrentUser: item.userId === userData.id
            }));

            setLeaderboardData(rankedData);
        } catch (err) {
            console.error("Leaderboard fetch error:", err);
            setError("Failed to fetch leaderboard data");
        } finally {
            setIsLoading(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchLeaderboardData(selectedTab, false).finally(() => {
            setRefreshing(false);
        });
    };

    const formatXP = (xp) => {
        if (!xp) return "0";
        if (xp >= 1000000) return (xp / 1000000).toFixed(1) + "M";
        if (xp >= 1000) return (xp / 1000).toFixed(1) + "K";
        return xp;
    };

    const TopThree = ({ data }) => {
        const renderPodiumItem = (item, position) => {
            if (!item) return null;

            let scale = 1;
            let translateY = 0;
            let ringColor = "#C0C0C0"; // Silver
            let crownColor = null;

            if (position === 1) {
                scale = 1.2;
                translateY = -20;
                ringColor = "#FFD700"; // Gold
                crownColor = "#FFD700";
            } else if (position === 3) {
                scale = 0.9;
                translateY = 10;
                ringColor = "#CD7F32"; // Bronze
            }

            return (
                <View style={[styles.podiumItem, { transform: [{ translateY }] }]}>
                    {crownColor && (
                        <MaterialCommunityIcons name="crown" size={24} color={crownColor} style={styles.crown} />
                    )}
                    <View style={[styles.avatarContainer, { borderColor: ringColor, borderWidth: 3 }]}>
                        <Image
                            source={
                                item.profilePhoto ?
                                    { uri: item.profilePhoto }
                                    : require("../assets/profile.png")
                            }
                            style={styles.podiumAvatar}
                        />
                        <View style={[styles.rankBadge, { backgroundColor: ringColor }]}>
                            <Text style={styles.rankText}>{position}</Text>
                        </View>
                    </View>
                    <Text style={styles.podiumName} numberOfLines={1}>
                        {item.isCurrentUser ? "You" : item.full_name || "Unknown"}
                    </Text>
                    <Text style={styles.podiumXP}>{formatXP(item.xp)} XP</Text>
                </View>
            );
        };

        const first = data.find(i => i.rank === 1);
        const second = data.find(i => i.rank === 2);
        const third = data.find(i => i.rank === 3);

        return (
            <View style={styles.podiumContainer}>
                {/* 2nd Place */}
                <View style={styles.sidePodium}>
                    {renderPodiumItem(second, 2)}
                </View>
                {/* 1st Place */}
                <View style={styles.centerPodium}>
                    {renderPodiumItem(first, 1)}
                </View>
                {/* 3rd Place */}
                <View style={styles.sidePodium}>
                    {renderPodiumItem(third, 3)}
                </View>
            </View>
        );
    };

    const ListItem = ({ item }) => (
        <View style={[styles.listItem, item.isCurrentUser && styles.currentUserItem]}>
            <View style={styles.rankContainer}>
                <Text style={styles.listRank}>#{item.rank}</Text>
            </View>

            <Image
                source={
                    item.profilePhoto ?
                        { uri: item.profilePhoto }
                        : require("../assets/profile.png")
                }
                style={styles.listAvatar}
            />

            <View style={styles.listInfo}>
                <Text style={[styles.listName, item.isCurrentUser && styles.currentUserName]} numberOfLines={1}>
                    {item.isCurrentUser ? "You" : item.full_name || "Unknown"}
                </Text>
                <View style={styles.statsRow}>
                    <MaterialCommunityIcons name="clipboard-check-outline" size={14} color="#666" style={{ marginRight: 4 }} />
                    <Text style={styles.listSubText}>{item.orderCount || 0} Orders</Text>
                </View>
            </View>

            <View style={styles.listScore}>
                <View style={styles.xpBadge}>
                    <Text style={styles.xpText}>{formatXP(item.xp)} XP</Text>
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.mainContainer}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={['#4C0183', '#2E0054']}
                style={styles.backgroundGradient}
            />

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Leaderboard</Text>

                    <View style={styles.tabContainer}>
                        {['local', 'state', 'india'].map((tab) => (
                            <TouchableOpacity
                                key={tab}
                                style={[styles.tab, selectedTab === tab && styles.activeTab]}
                                onPress={() => setSelectedTab(tab)}
                            >
                                <Text style={[styles.tabText, selectedTab === tab && styles.activeTabText]}>
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#4C0183']}
                            tintColor={'#fff'}
                        />
                    }
                >
                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <Text style={styles.loadingText}>Loading...</Text>
                        </View>
                    ) : (
                        <>
                            {leaderboardData.length > 0 && (
                                <TopThree data={leaderboardData} />
                            )}

                            <View style={styles.listContainer}>
                                {leaderboardData.slice(3).map((item) => (
                                    <ListItem key={item.id} item={item} />
                                ))}

                                {leaderboardData.length === 0 && (
                                    <Text style={styles.emptyText}>No freelancers found in this region.</Text>
                                )}

                                {/* Add footer padding within list container */}
                                <Text style={styles.footerText}>
                                    Feature on the top 5 on the leaderboard and win coupons, gifts, and less deduction on your bids!
                                </Text>
                            </View>
                        </>
                    )}
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

const getStyles = (currentTheme) =>
    StyleSheet.create({
        mainContainer: {
            flex: 1,
            backgroundColor: currentTheme.background || '#f5f5f5',
        },
        safeArea: {
            flex: 1,
            backgroundColor: 'transparent',
        },
        backgroundGradient: {
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height: 480, // Fixed height to ensure it covers header + podium area
        },
        header: {
            paddingTop: 20,
            paddingHorizontal: 20,
            alignItems: 'center',
            zIndex: 10,
            marginBottom: 10,
        },
        headerTitle: {
            fontSize: 24,
            fontWeight: 'bold',
            color: '#fff',
            marginBottom: 20,
        },
        loadingContainer: {
            padding: 40,
            alignItems: 'center',
        },
        loadingText: {
            color: '#fff',
            fontSize: 16,
        },
        tabContainer: {
            flexDirection: 'row',
            backgroundColor: 'rgba(255,255,255,0.15)',
            borderRadius: 25,
            padding: 4,
            width: '100%',
            justifyContent: 'space-between',
        },
        tab: {
            flex: 1,
            paddingVertical: 8,
            alignItems: 'center',
            borderRadius: 20,
        },
        activeTab: {
            backgroundColor: '#fff',
        },
        tabText: {
            color: '#fff',
            fontWeight: '600',
            fontSize: 14,
        },
        activeTabText: {
            color: '#4C0183', // Primary Purple
        },
        scrollContent: {
            paddingBottom: 20,
            flexGrow: 1,
        },
        podiumContainer: {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'flex-end',
            height: 220,
            marginTop: 10,
            marginBottom: 20,
        },
        sidePodium: {
            flex: 1,
            alignItems: 'center',
        },
        centerPodium: {
            flex: 1,
            alignItems: 'center',
            zIndex: 2,
        },
        podiumItem: {
            alignItems: 'center',
        },
        crown: {
            marginBottom: -10,
            zIndex: 10,
        },
        avatarContainer: {
            borderRadius: 50,
            padding: 2,
            backgroundColor: '#fff',
            marginBottom: 8,
            shadowColor: "#000",
            shadowOffset: {
                width: 0,
                height: 4,
            },
            shadowOpacity: 0.3,
            shadowRadius: 4.65,
            elevation: 8,
        },
        podiumAvatar: {
            width: 60,
            height: 60,
            borderRadius: 30,
        },
        rankBadge: {
            position: 'absolute',
            bottom: -10,
            alignSelf: 'center',
            width: 24,
            height: 24,
            borderRadius: 12,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 2,
            borderColor: '#fff',
        },
        rankText: {
            color: '#fff',
            fontSize: 12,
            fontWeight: 'bold',
        },
        podiumName: {
            color: '#fff',
            fontWeight: 'bold',
            fontSize: 14,
            marginTop: 8,
            maxWidth: 100,
            textAlign: 'center',
            textShadowColor: 'rgba(0, 0, 0, 0.3)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 2,
        },
        podiumXP: {
            color: 'rgba(255,255,255,0.95)',
            fontSize: 12,
            marginTop: 2,
            fontWeight: '600',
        },
        listContainer: {
            backgroundColor: currentTheme.background || '#fff',
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            paddingTop: 20,
            paddingHorizontal: 20,
            paddingBottom: 40,
            flex: 1, // Ensure it fills remaining space
            minHeight: 500,
            marginTop: 0, // Ensure no gap or overlap issues
        },
        listItem: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: currentTheme.cardBackground || '#fff',
            marginBottom: 12,
            padding: 15, // Increased padding
            borderRadius: 20, // More rounded
            shadowColor: "#000",
            shadowOffset: {
                width: 0,
                height: 3,
            },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 3,
            borderWidth: 1,
            borderColor: 'rgba(0,0,0,0.03)',
        },
        currentUserItem: {
            borderWidth: 1.5,
            borderColor: '#4C0183', // Primary Purple
            backgroundColor: '#F3E5F5', // Very Light Purple
        },
        rankContainer: {
            width: 40,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8f9fa',
            height: 40,
            borderRadius: 20,
            marginRight: 10,
        },
        listRank: {
            fontSize: 14,
            fontWeight: 'bold',
            color: '#666',
        },
        listAvatar: {
            width: 50, // Slightly larger
            height: 50,
            borderRadius: 25,
            marginRight: 15,
            borderWidth: 2,
            borderColor: '#fff',
        },
        listInfo: {
            flex: 1,
        },
        listName: {
            fontSize: 16,
            fontWeight: '700',
            color: currentTheme.text || '#000',
            marginBottom: 4,
        },
        currentUserName: {
            color: '#4C0183', // Primary Purple
            fontWeight: 'bold',
        },
        statsRow: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        listSubText: {
            fontSize: 13,
            color: '#666',
            fontWeight: '500',
        },
        listScore: {
            alignItems: 'flex-end',
            minWidth: 80,
        },
        xpBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            // backgroundColor: '#FFFAE6', // Gold tint
            paddingHorizontal: 0,
            paddingVertical: 5,
            borderRadius: 12,
        },
        xpText: {
            fontSize: 14,
            fontWeight: 'bold',
            color: '#4C0183', // Purple for Value
            marginLeft: 0,
        },
        emptyText: {
            textAlign: 'center',
            marginTop: 40,
            color: currentTheme.subText,
            fontSize: 16,
        },
        footerText: {
            textAlign: "center",
            fontSize: 12,
            color: currentTheme.subText || "#999",
            marginTop: 30,
            marginBottom: 20,
            fontStyle: 'italic',
        }
    });

export default LeaderboardScreen;
