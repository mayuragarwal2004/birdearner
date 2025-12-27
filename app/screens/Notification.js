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
      navigation.navigate('Chat', {
        threadId: data.threadId,
        name: data.senderName || 'Chat'
      });
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={currentTheme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={handleMarkAllRead}>
          <Text style={styles.markAllText}>Read All</Text>
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
              <MaterialCommunityIcons name="bell-sleep" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No notifications yet</Text>
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
    backgroundColor: currentTheme.background || '#f8f9fa'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: currentTheme.cardBackground || '#fff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: currentTheme.text
  },
  backButton: {
    padding: 5
  },
  markAllText: {
    color: '#762BAD',
    fontWeight: '600',
    fontSize: 14
  },
  listContent: {
    paddingBottom: 20
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: currentTheme.cardBackground || '#fff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)'
  },
  unreadItem: {
    backgroundColor: currentTheme.isDark ? '#2a1b3d' : '#F3E5F5'
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15
  },
  contentContainer: {
    flex: 1
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: currentTheme.text,
    flex: 1,
    marginRight: 10
  },
  time: {
    fontSize: 11,
    color: '#888'
  },
  message: {
    fontSize: 13,
    color: currentTheme.subText || '#666',
    lineHeight: 18
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#762BAD',
    marginTop: 6,
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
    paddingTop: 100
  },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
    color: '#999'
  }
});

export default NotificationScreen;
