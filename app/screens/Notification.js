import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  Platform,
  Modal,
  ScrollView
} from "react-native";
import SafeSpinner from "../components/SafeSpinner";
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
        const sortedData = [...(response.data || [])].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        if (shouldReset) {
          setNotifications(sortedData);
        } else {
          setNotifications(prev => {
            const combined = [...prev, ...sortedData];
            return combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          });
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

  const [selectedNotification, setSelectedNotification] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

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

    // 3. Open modal popup with complete message
    setSelectedNotification(notification);
    setModalVisible(true);
  };

  const handleAction = () => {
    if (!selectedNotification) return;
    const { type, data } = selectedNotification;
    setModalVisible(false);

    if (type === 'JOB_UPDATE' && data?.jobId) {
      // navigation.navigate('JobDetails', { jobId: data.jobId });
    } else if (type === 'CHAT' && data?.threadId) {
      if (userData?.role === 'CLIENT') {
        navigation.navigate('ClientChat', {
          threadId: data.threadId,
          projectId: data.projectId,
          freelancer: {
            user: { id: data.senderId, fullName: data.senderName || 'Freelancer' },
            profilePhoto: data.senderImage,
            id: data.senderId
          }
        });
      } else {
        navigation.navigate('FreelancerChat', {
          threadId: data.threadId,
          projectId: data.projectId,
          client: {
            user: { id: data.senderId, fullName: data.senderName || 'Client' },
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

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const dateFormatted = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const timeFormatted = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return `${dateFormatted} • ${timeFormatted}`;
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
            {formatDateTime(item.createdAt)}
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
          <SafeSpinner size={42} color="#762BAD" />
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
          ListFooterComponent={hasMore && page > 1 && <SafeSpinner size={18} color="#762BAD" style={{ padding: 10 }} />}
        />
      )}

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalContainer}
            activeOpacity={1}
            onPress={(e) => e?.stopPropagation?.()}
          >
            {selectedNotification && (
              <>
                <View style={styles.modalHeader}>
                  <View style={[styles.modalIconContainer, { backgroundColor: `${getColorForType(selectedNotification.type)}20` }]}>
                    <MaterialCommunityIcons
                      name={getIconForType(selectedNotification.type)}
                      size={28}
                      color={getColorForType(selectedNotification.type)}
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Ionicons name="close" size={20} color={currentTheme.text || "#333"} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalTitle}>{selectedNotification.title}</Text>
                <Text style={styles.modalTime}>{formatDateTime(selectedNotification.createdAt)}</Text>

                <View style={styles.modalDivider} />

                <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={true}>
                  <Text style={styles.modalMessage}>{selectedNotification.message}</Text>
                </ScrollView>

                <View style={styles.modalFooter}>
                  {(selectedNotification.type === 'CHAT' || selectedNotification.data?.threadId) && (
                    <TouchableOpacity
                      style={styles.modalActionButton}
                      onPress={handleAction}
                    >
                      <Text style={styles.modalActionButtonText}>Open Chat</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.modalDismissButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.modalDismissButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
    backgroundColor: currentTheme.isDark ? "#333333" : "#E0E0E0",
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
    color: currentTheme.text || "#000",
    marginTop: 10,
  },
  markAllButton: {
    marginTop: 10,
  },
  markAllText: {
    color: currentTheme.isDark ? "#A78BFA" : "#762BAD",
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
    borderBottomColor: currentTheme.border || (currentTheme.isDark ? '#2A2A2A' : 'rgba(0,0,0,0.05)'),
    backgroundColor: currentTheme.cardBackground || (currentTheme.isDark ? '#1E1E1E' : '#FFF')
  },
  unreadItem: {
    backgroundColor: currentTheme.isDark ? '#2A1F3D' : '#FAF5FF'
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
    color: currentTheme.text || "#000",
    flex: 1,
    marginRight: 8
  },
  time: {
    fontSize: 11,
    color: currentTheme.subText || '#999'
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
    backgroundColor: currentTheme.isDark ? '#A78BFA' : '#762BAD',
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
    backgroundColor: currentTheme.isDark ? "#2E1A47" : "#F3E5F5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: currentTheme.text || "#000",
    marginBottom: 8
  },
  emptySubtitle: {
    fontSize: 14,
    color: currentTheme.subText || '#999',
    textAlign: 'center',
    lineHeight: 20
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: currentTheme.surface || currentTheme.cardBackground || (currentTheme.isDark ? '#1E1E1E' : '#FFFFFF'),
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: currentTheme.isDark ? 1 : 0,
    borderColor: currentTheme.border || '#333',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: currentTheme.text || '#1E293B',
    marginBottom: 4,
  },
  modalTime: {
    fontSize: 12,
    color: currentTheme.subText || '#94A3B8',
    marginBottom: 12,
  },
  modalDivider: {
    height: 1,
    backgroundColor: currentTheme.border || (currentTheme.isDark ? '#333333' : 'rgba(0,0,0,0.08)'),
    marginBottom: 14,
  },
  modalScroll: {
    maxHeight: 280,
    marginBottom: 16,
  },
  modalMessage: {
    fontSize: 15,
    color: currentTheme.text || '#334155',
    lineHeight: 22,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalActionButton: {
    backgroundColor: currentTheme.isDark ? '#8B5CF6' : '#762BAD',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  modalActionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  modalDismissButton: {
    backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  modalDismissButtonText: {
    color: currentTheme.text || '#475569',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default NotificationScreen;
