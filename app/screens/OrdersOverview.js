import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Modal } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Question, ClipboardText, ListDashes, XCircle, ChartLine, CheckCircle, Clock } from 'phosphor-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/NewAuthContext';
import apiService from '../lib/apiService';

const OrdersOverview = ({ navigation }) => {
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const isDark = theme === 'dark';

  const [showHelp, setShowHelp] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('Last 30 Days');
  const filterOptions = ['Last 7 Days', 'Last 30 Days', 'This Month', 'All Time'];
  
  const { user } = useAuth();
  const [ordersData, setOrdersData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrdersData = async () => {
      if (user?.id) {
        setLoading(true);
        const data = await apiService.getFreelancerOrders(user.id, selectedFilter);
        setOrdersData(data);
        setLoading(false);
      }
    };
    fetchOrdersData();
  }, [user?.id, selectedFilter]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.background }]}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <ArrowLeft size={24} color={currentTheme.text} weight="bold" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: currentTheme.text }]}>Orders Overview</Text>
        <TouchableOpacity style={styles.iconButton} onPress={() => setShowHelp(true)}>
          <Question size={24} color="#762BAD" weight="regular" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Top Purple Card */}
        <LinearGradient
          colors={['#762BAD', '#4A148C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.topCard}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={styles.smallIconCircle}>
                <ClipboardText size={16} color="#762BAD" weight="fill" />
              </View>
              <Text style={styles.cardTitle}>Order Summary</Text>
            </View>
            <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowFilter(true)}>
              <Text style={styles.dropdownText}>{selectedFilter}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.summaryStatsRow}>
            <StatColumn icon={<ClipboardText size={24} color="#762BAD" weight="fill" />} iconBg="#F3E8FF" value={ordersData?.summary?.completedOrders?.count || 0} label="Orders Completed" />
            <View style={styles.divider} />
            <StatColumn icon={<ListDashes size={24} color="#762BAD" weight="fill" />} iconBg="#F3E8FF" value={ordersData?.summary?.activeOrders?.count || 0} label="Active Orders" />
            <View style={styles.divider} />
            <StatColumn icon={<XCircle size={24} color="#FF9500" weight="fill" />} iconBg="#FFF9E6" value={ordersData?.summary?.cancelledOrders || 0} label="Cancelled Orders" />
          </View>
        </LinearGradient>

        {/* Analytics Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionIconBg}>
              <ChartLine size={16} color="#762BAD" weight="bold" />
            </View>
            <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Order Analytics</Text>
          </View>
          <TouchableOpacity style={styles.dropdownBtnOutline} onPress={() => setShowFilter(true)}>
            <Text style={styles.dropdownTextOutline}>{selectedFilter}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.listContainer, { backgroundColor: currentTheme.cardBackground }]}>
          <AnalyticsItem icon={<ClipboardText size={20} color="#762BAD" weight="fill" />} title="Total Orders" subtitle="All orders received" value={ordersData?.summary?.totalOrders || 0} isDark={isDark} iconBg="#F3E8FF" />
          <AnalyticsItem icon={<CheckCircle size={20} color="#34C759" weight="fill" />} title="Completed Orders" subtitle="Successfully completed orders" value={ordersData?.summary?.completedOrders?.count || 0} isDark={isDark} iconBg="#E8F5E9" />
          <AnalyticsItem icon={<ListDashes size={20} color="#762BAD" weight="fill" />} title="Active Orders" subtitle="Orders in progress" value={ordersData?.summary?.activeOrders?.count || 0} isDark={isDark} iconBg="#F3E8FF" />
          <AnalyticsItem icon={<XCircle size={20} color="#FF9500" weight="fill" />} title="Cancelled Orders" subtitle="Orders that were cancelled" value={ordersData?.summary?.cancelledOrders || 0} isDark={isDark} iconBg="#FFF9E6" />
          <AnalyticsItem icon={<Clock size={20} color="#762BAD" weight="fill" />} title="Completion Rate" subtitle="Percentage of completed orders" value={ordersData?.summary?.totalOrders ? `${Math.round((ordersData.summary.completedOrders.count / ordersData.summary.totalOrders) * 100)}%` : '0%'} isDark={isDark} iconBg="#F3E8FF" hideBorder />
        </View>

        {/* Recent Orders Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionIconBg}>
              <ClipboardText size={16} color="#762BAD" weight="fill" />
            </View>
            <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Recent Orders</Text>
          </View>
          <TouchableOpacity style={styles.viewAllBtn} onPress={() => navigation.navigate("Inbox")}>
            <Text style={styles.viewAllText}>View All Orders {'>'}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.emptyStateContainer, { backgroundColor: currentTheme.cardBackground }]}>
          <View style={styles.emptyStateIllustration}>
            <ClipboardText size={64} color="#E5D5FF" weight="fill" />
          </View>
          <Text style={[styles.emptyStateTitle, { color: currentTheme.text }]}>No orders yet</Text>
          <Text style={styles.emptyStateSubtitle}>Once you start receiving orders, they will appear here.</Text>
        </View>

      </ScrollView>

      {/* Help Modal */}
      <Modal visible={showHelp} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: currentTheme.cardBackground || '#FFF' }]}>
            <Text style={[styles.modalTitle, { color: currentTheme.text || '#000' }]}>Orders Overview Help</Text>
            <Text style={styles.modalText}>
              This screen provides a summary of your recent orders. You can track your completed, active, and cancelled orders. Use the filter to view orders from different time periods.
            </Text>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowHelp(false)}>
              <Text style={styles.modalCloseText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Filter Modal */}
      <Modal visible={showFilter} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: currentTheme.cardBackground || '#FFF' }]}>
            <Text style={[styles.modalTitle, { color: currentTheme.text || '#000' }]}>Select Time Period</Text>
            {filterOptions.map((opt, i) => (
              <TouchableOpacity 
                key={i} 
                style={styles.filterOption} 
                onPress={() => {
                  setSelectedFilter(opt);
                  setShowFilter(false);
                }}
              >
                <Text style={[styles.filterOptionText, selectedFilter === opt && { color: '#762BAD', fontWeight: 'bold' }]}>{opt}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowFilter(false)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const StatColumn = ({ icon, iconBg, value, label }) => (
  <View style={styles.statColumn}>
    <View style={[styles.statIconCircle, { backgroundColor: iconBg }]}>
      {icon}
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const AnalyticsItem = ({ icon, iconBg, title, subtitle, value, isDark, hideBorder }) => (
  <View style={[styles.analyticsItem, !hideBorder && styles.analyticsBorder, isDark && !hideBorder && { borderBottomColor: '#374151' }]}>
    <View style={styles.analyticsLeft}>
      <View style={[styles.analyticsIconBg, { backgroundColor: isDark ? '#374151' : iconBg }]}>
        {icon}
      </View>
      <View>
        <Text style={[styles.analyticsTitle, { color: isDark ? '#E5E7EB' : '#000' }]}>{title}</Text>
        <Text style={styles.analyticsSubtitle}>{subtitle}</Text>
      </View>
    </View>
    <Text style={[styles.analyticsValue, { color: isDark ? '#FFF' : '#762BAD' }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  iconButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 140,
  },
  topCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cardTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dropdownBtn: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  dropdownText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  summaryStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statColumn: {
    alignItems: 'center',
    flex: 1,
  },
  statIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    textAlign: 'center',
  },
  divider: {
    width: 1,
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dropdownBtnOutline: {
    borderWidth: 1,
    borderColor: '#E5D5FF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  dropdownTextOutline: {
    color: '#762BAD',
    fontSize: 12,
    fontWeight: 'bold',
  },
  viewAllBtn: {
    borderWidth: 1,
    borderColor: '#E5D5FF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  viewAllText: {
    color: '#762BAD',
    fontSize: 12,
    fontWeight: 'bold',
  },
  listContainer: {
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 24,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  analyticsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  analyticsBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  analyticsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  analyticsIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  analyticsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  analyticsSubtitle: {
    fontSize: 11,
    color: '#6B7280',
  },
  analyticsValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyStateContainer: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  emptyStateIllustration: {
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalCloseBtn: {
    backgroundColor: '#762BAD',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  modalCloseText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  filterOption: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filterOptionText: {
    fontSize: 16,
    color: '#4B5563',
  }
});

export default OrdersOverview;
