import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { formatDistanceToNow } from "date-fns";
import apiService from "../lib/apiService";
import { useAuth } from "../context/NewAuthContext";
import { useTheme } from "../context/ThemeContext";

const NotificationScreen = () => {
  const navigation = useNavigation();
  const { userData } = useAuth();
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const styles = getStyles(currentTheme);

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (userData?.id) {
      fetchNotifications(1, true);
    }
  }, [userData]);

  const fetchNotifications = async (pageNum, shouldReset = false) => {
    try {
      if (pageNum === 1) setLoading(true);

      const response = await apiService.getNotifications(userData.id, pageNum);

      if (response && response.data) {
        if (shouldReset) {
          setNotifications(response.data);
        } else {
          setNotifications(prev => [...prev, ...response.data]);
        }

        // Check if we reached the end
        const totalPages = response.pagination?.totalPages || 1;
        setHasMore(pageNum < totalPages);
        setPage(pageNum);
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications(1, true);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchNotifications(page + 1);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiService.markAllNotificationsRead(userData.id);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Failed to mark all read:", error);
    }
  };

  const handleNotificationPress = async (notification) => {
    // 1. Mark as read immediately in UI
    if (!notification.isRead) {
      const updatedList = notifications.map(n =>
        n.id === notification.id ? { ...n, isRead: true } : n
      );
      setNotifications(updatedList);

      // 2. Call API in background
      apiService.markNotificationRead(notification.id);
    }

    // 3. Navigate if actionable
    const { type, data } = notification;

    if (type === 'JOB_UPDATE' && data?.jobId) {
      // Example: Navigate to Job Details
      // navigation.navigate('JobDetails', { jobId: data.jobId });
    } else if (type === 'CHAT' && data?.threadId) {
      if (userData?.role === 'CLIENT') {
        navigation.navigate('ClientChat', {
          threadId: data.threadId,
          projectId: data.projectId,
          freelancer: {
            user: { fullName: data.senderName || 'Freelancer' },
            profilePhoto: data.senderImage,
            id: data.senderId
          }
        });
      } else {
        navigation.navigate('FreelancerChat', {
          threadId: data.threadId,
          projectId: data.projectId,
          client: {
            user: { fullName: data.senderName || 'Client' },
            profilePhoto: data.senderImage,
            id: data.senderId
          }
        });
      }
    }
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'JOB_ASSIGNED': return 'briefcase-check';
      case 'PAYMENT': return 'cash-multiple';
      case 'REVIEW': return 'star-circle';
      case 'CHAT': return 'message-text';
      case 'SYSTEM': return 'information';
      default: return 'bell-ring';
    }
  };

  const getColorForType = (type) => {
    switch (type) {
      case 'JOB_ASSIGNED': return '#4CAF50';
      case 'PAYMENT': return '#2196F3';
      case 'REVIEW': return '#FFC107';
      case 'CHAT': return '#9C27B0';
      default: return '#762BAD';
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.isRead && styles.unreadItem]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${getColorForType(item.type)}20` }]}>
        <MaterialCommunityIcons
          name={getIconForType(item.type)}
          size={24}
          color={getColorForType(item.type)}
        />
      </View>
      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.time}>
            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
          </Text>
        </View>
        <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
      </View>
      {!item.isRead && <View style={styles.dot} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.handle} />
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
        >
          <Ionicons name="close" size={24} color={currentTheme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllButton}>
          <Text style={styles.markAllText}>Mark all as read</Text>
        </TouchableOpacity>
      </View>

      {loading && page === 1 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#762BAD" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#762BAD" />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.illustrationCircle}>
                <MaterialCommunityIcons name="bell-off-outline" size={50} color="#762BAD" />
              </View>
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptySubtitle}>We'll notify you when something important happens.</Text>
            </View>
          }
          ListFooterComponent={hasMore && page > 1 && <ActivityIndicator size="small" color="#762BAD" style={{ padding: 10 }} />}
        />
      )}
    </SafeAreaView>
  );
};

const getStyles = (currentTheme) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: currentTheme.background || '#FFF'
  },
  header: {
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: "center",
    backgroundColor: currentTheme.background || "#FFF",
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
    marginBottom: 10,
  },
  closeButton: {
    position: "absolute",
    right: 20,
    top: 20,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: currentTheme.text,
    marginTop: 10,
  },
  markAllButton: {
    marginTop: 10,
  },
  markAllText: {
    color: "#762BAD",
    fontSize: 14,
    fontWeight: "600",
  },
  listContent: {
    paddingBottom: 40,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    backgroundColor: currentTheme.cardBackground || '#FFF'
  },
  unreadItem: {
    backgroundColor: '#FAF5FF'
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
  },
  contentContainer: {
    flex: 1
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: currentTheme.text,
    flex: 1,
    marginRight: 8
  },
  time: {
    fontSize: 11,
    color: '#999'
  },
  message: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#762BAD',
    marginTop: 4,
    marginLeft: 8
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    paddingHorizontal: 40
  },
  illustrationCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F3E5F5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: currentTheme.text,
    marginBottom: 8
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20
  }
});

export default NotificationScreen;
