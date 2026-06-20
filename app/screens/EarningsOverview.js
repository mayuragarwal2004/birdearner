import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform, Modal } from 'react-native';
import { ArrowLeft, Question, Wallet, ChartBar, Tag, ShoppingBag, ClipboardText, TrendUp, Download, Clock, Sparkle } from 'phosphor-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/NewAuthContext';
import apiService from '../lib/apiService';

const EarningsOverview = ({ navigation }) => {
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const isDark = theme === 'dark';

  const [showHelp, setShowHelp] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('Last 30 Days');
  const filterOptions = ['Last 7 Days', 'Last 30 Days', 'This Month', 'This Year', 'All Time'];
  
  const { user } = useAuth();
  const [earningsData, setEarningsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEarningsData = async () => {
      if (user?.id) {
        setLoading(true);
        const data = await apiService.getFreelancerEarnings(user.id, selectedFilter);
        setEarningsData(data);
        setLoading(false);
      }
    };
    fetchEarningsData();
  }, [user?.id, selectedFilter]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.background }]}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <ArrowLeft size={24} color={currentTheme.text} weight="bold" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: currentTheme.text }]}>Earnings Overview</Text>
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
          <View style={styles.walletIconCircle}>
            <Wallet size={28} color="#FFF" weight="fill" />
          </View>
          <Text style={styles.mainAmount}>Rs. {earningsData?.summary?.available || 0}</Text>
          <Text style={styles.availableText}>Available for withdrawal ⓘ</Text>

          <View style={styles.withdrawBox}>
            <View style={styles.withdrawLeft}>
              <View style={styles.withdrawIcon}>
                <Wallet size={20} color="#FFF" weight="fill" />
              </View>
              <View>
                <Text style={styles.withdrawTitle}>Withdraw your earnings</Text>
                <Text style={styles.withdrawSubtitle}>Secure withdrawals, anytime</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.withdrawButton} onPress={() => navigation.navigate("WithdrawalEarning")}>
              <Text style={styles.withdrawButtonText}>Withdraw</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Analytics Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Analytics</Text>
          <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowFilter(true)}>
            <Clock size={16} color="#762BAD" weight="bold" />
            <Text style={styles.dropdownText}>{selectedFilter}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.listContainer, { backgroundColor: currentTheme.cardBackground }]}>
          <AnalyticsItem icon={<ChartBar size={20} color="#762BAD" weight="fill" />} title={`Earnings in ${selectedFilter}`} value={`Rs. ${earningsData?.analytics?.earningsInPeriod || 0}`} isDark={isDark} />
          <AnalyticsItem icon={<Tag size={20} color="#762BAD" weight="fill" />} title="Avg. selling price" value={`Rs. ${earningsData?.analytics?.avgSellingPrice || 0}`} isDark={isDark} />
          <AnalyticsItem icon={<ShoppingBag size={20} color="#762BAD" weight="fill" />} title="Active orders" value={`${earningsData?.analytics?.activeOrders?.count || 0} (Rs. ${earningsData?.analytics?.activeOrders?.value || 0})`} isDark={isDark} />
          <AnalyticsItem icon={<Wallet size={20} color="#762BAD" weight="fill" />} title="Available for withdrawal" value={`Rs. ${earningsData?.analytics?.availableForWithdrawal || 0}`} isDark={isDark} />
          <AnalyticsItem icon={<ClipboardText size={20} color="#762BAD" weight="fill" />} title="Completed orders" value={`${earningsData?.analytics?.completedOrders?.count || 0} (Rs. ${earningsData?.analytics?.completedOrders?.value || 0})`} isDark={isDark} hideBorder />
        </View>

        {/* Earnings Summary Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Earnings Summary</Text>
          <Text style={styles.last30Text}>{selectedFilter}</Text>
        </View>

        <View style={[styles.summaryContainer, { backgroundColor: currentTheme.cardBackground }]}>
          <SummaryColumn icon={<TrendUp size={24} color="#762BAD" />} title="Total Earnings" amount={`Rs. ${earningsData?.summary?.totalEarnings || 0}`} isDark={isDark} iconBg="#F3E8FF" />
          <SummaryColumn icon={<Download size={24} color="#34C759" />} title="Withdrawn" amount={`Rs. ${earningsData?.summary?.withdrawn || 0}`} isDark={isDark} iconBg="#E8F5E9" />
          <SummaryColumn icon={<Clock size={24} color="#FF9500" />} title="Pending" amount={`Rs. ${earningsData?.summary?.pending || 0}`} isDark={isDark} iconBg="#FFF9E6" />
          <SummaryColumn icon={<Wallet size={24} color="#FF3B30" />} title="Available" amount={`Rs. ${earningsData?.summary?.available || 0}`} isDark={isDark} iconBg="#FFF0F0" />
        </View>

        {/* Motivational Banner */}
        <View style={[styles.bannerContainer, { backgroundColor: isDark ? '#2E1F4A' : '#FDF8FF' }]}>
          <View style={styles.bannerIconBg}>
            <ChartBar size={24} color="#762BAD" weight="fill" />
          </View>
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>Great job!</Text>
            <Text style={[styles.bannerSubtitle, { color: currentTheme.subText }]}>Keep delivering great work to increase your earnings and unlock more opportunities.</Text>
          </View>
          <Sparkle size={20} color="#C4B5FD" weight="fill" style={styles.sparkle1} />
          <Sparkle size={12} color="#C4B5FD" weight="fill" style={styles.sparkle2} />
        </View>

      </ScrollView>

      {/* Help Modal */}
      <Modal visible={showHelp} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: currentTheme.cardBackground || '#FFF' }]}>
            <Text style={[styles.modalTitle, { color: currentTheme.text || '#000' }]}>Earnings Overview Help</Text>
            <Text style={styles.modalText}>
              This screen provides a summary of your earnings. You can track your available balance, pending clearances, and withdrawn amounts. Use the filter to view earnings from different time periods.
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

const AnalyticsItem = ({ icon, title, value, isDark, hideBorder }) => (
  <View style={[styles.analyticsItem, !hideBorder && styles.analyticsBorder, isDark && !hideBorder && { borderBottomColor: '#374151' }]}>
    <View style={styles.analyticsLeft}>
      <View style={[styles.analyticsIconBg, { backgroundColor: isDark ? '#374151' : '#F3E8FF' }]}>
        {icon}
      </View>
      <Text style={[styles.analyticsTitle, { color: isDark ? '#E5E7EB' : '#333' }]}>{title}</Text>
    </View>
    <Text style={[styles.analyticsValue, { color: isDark ? '#FFF' : '#762BAD' }]}>{value}</Text>
  </View>
);

const SummaryColumn = ({ icon, title, amount, isDark, iconBg }) => (
  <View style={styles.summaryColumn}>
    <View style={[styles.summaryIconBg, { backgroundColor: isDark ? '#374151' : iconBg }]}>
      {icon}
    </View>
    <Text style={[styles.summaryAmount, { color: isDark ? '#FFF' : '#000' }]}>{amount}</Text>
    <Text style={styles.summaryTitle}>{title}</Text>
  </View>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 30 : 0,
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
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  walletIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  mainAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  availableText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 24,
  },
  withdrawBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  withdrawLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  withdrawIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#762BAD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  withdrawTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  withdrawSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
  },
  withdrawButton: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  withdrawButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 13,
  },
  listAmount: {
    fontWeight: 'bold',
    fontSize: 16,
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
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  dropdownText: {
    color: '#762BAD',
    fontWeight: '600',
    fontSize: 13,
    marginLeft: 6,
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
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  analyticsTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  analyticsValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  last30Text: {
    fontSize: 13,
    color: '#762BAD',
    fontWeight: '600',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  summaryColumn: {
    alignItems: 'center',
    width: '24%',
  },
  summaryIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryTitle: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
  },
  bannerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5D5FF',
    position: 'relative',
    overflow: 'hidden',
  },
  bannerIconBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#762BAD',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  sparkle1: {
    position: 'absolute',
    right: 30,
    bottom: 20,
  },
  sparkle2: {
    position: 'absolute',
    right: 15,
    top: 15,
  }
});

export default EarningsOverview;
