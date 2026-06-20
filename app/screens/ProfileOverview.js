import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform, Modal } from 'react-native';
import { ArrowLeft, Question, Star, TrendUp, Target, Flag, ChatCircleText, Trophy, ChartBar, Sparkle, Clock } from 'phosphor-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/NewAuthContext';
import apiService from '../lib/apiService';

const ProfileOverview = ({ navigation }) => {
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const isDark = theme === 'dark';

  const [showHelp, setShowHelp] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('Last 30 Days');
  const filterOptions = ['Last 7 Days', 'Last 30 Days', 'This Month', 'All Time'];
  
  const { user } = useAuth();
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatsData = async () => {
      if (user?.id) {
        setLoading(true);
        const data = await apiService.getFreelancerStats(user.id, selectedFilter);
        setStatsData(data);
        setLoading(false);
      }
    };
    fetchStatsData();
  }, [user?.id, selectedFilter]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.background }]}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <ArrowLeft size={24} color={currentTheme.text} weight="bold" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: currentTheme.text }]}>Profile Overview</Text>
        <TouchableOpacity style={styles.iconButton} onPress={() => setShowHelp(true)}>
          <Question size={24} color="#762BAD" weight="regular" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Top Level Card */}
        <View style={[styles.topLevelCard, { backgroundColor: currentTheme.cardBackground }]}>
          <View style={styles.levelBadgeContainer}>
            <Sparkle size={16} color="#FBBF24" weight="fill" style={styles.sparkleTL} />
            <Sparkle size={12} color="#FBBF24" weight="fill" style={styles.sparkleBL} />
            <Sparkle size={18} color="#FBBF24" weight="fill" style={styles.sparkleTR} />
            
            <View style={styles.levelBadgeBorder}>
              <LinearGradient colors={['#762BAD', '#4A148C']} style={styles.levelBadgeInner}>
                <Star size={24} color="#FFF" weight="fill" />
              </LinearGradient>
            </View>
          </View>
          <Text style={[styles.levelText, { color: currentTheme.text }]}>{statsData?.profile?.rank || 'Level 1'}</Text>
          <Text style={styles.levelSubtitle}>{statsData?.profile?.xp || 0} XP • {statsData?.stats?.ordersCompleted || 0} Orders Completed</Text>

          {/* Stepper */}
          <View style={styles.stepperContainer}>
            <View style={styles.stepperLineBg} />
            <View style={styles.stepperLineActive} />
            
            <StepItem number="1" label="Beginner" isActive isFirst />
            <StepItem number="2" label="Level 2" />
            <StepItem number="3" label="Level 3" />
            <StepItem number="4" label="Level 4" />
            <StepItem number="5" label="Top Rated" isLast />
          </View>

          <View style={styles.infoBox}>
            <View style={styles.infoIconCircle}>
              <TrendUp size={20} color="#762BAD" />
            </View>
            <Text style={styles.infoBoxText}>Complete more jobs and maintain great performance to reach higher levels and unlock more opportunities.</Text>
          </View>
        </View>

        {/* Performance Insights */}
        <LinearGradient
          colors={['#762BAD', '#4A148C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.insightsCard}
        >
          <View style={styles.insightsHeader}>
            <View style={styles.insightsHeaderLeft}>
              <View style={styles.insightsIconCircle}>
                <ChartBar size={20} color="#762BAD" weight="fill" />
              </View>
              <View>
                <Text style={styles.insightsTitle}>Performance Insights</Text>
                <Text style={styles.insightsSubtitle}>Track your progress & improve your stats</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowFilter(true)}>
              <Text style={styles.dropdownText}>{selectedFilter} v</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.insightsGrid, { backgroundColor: isDark ? '#1F2937' : '#FDF8FF' }]}>
            <InsightItem 
              icon={<Target size={24} color="#34C759" />} 
              iconBg="#E8F5E9" 
              value={`${statsData?.stats?.successScore || 0}%`} 
              label="Success Score" 
              progressColor="#34C759" 
              progress={statsData?.stats?.successScore || 0} 
              isDark={isDark}
              footerText="0                     100"
            />
            <InsightItem 
              icon={<Star size={24} color="#762BAD" />} 
              iconBg="#F3E8FF" 
              value={(statsData?.stats?.averageRating || 0).toFixed(1)} 
              label="Rating" 
              progressColor="#762BAD" 
              progress={(statsData?.stats?.averageRating || 0) * 20} 
              isDark={isDark}
              footerText="                 / 5.0"
            />
            <InsightItem 
              icon={<Clock size={24} color="#FF9500" />} 
              iconBg="#FFF9E6" 
              value="1 hr" 
              label="Avg. Response Time" 
              progressColor="#FF9500" 
              progress={100} 
              isDark={isDark}
            />
            <InsightItem 
              icon={<Flag size={24} color="#FF3B30" />} 
              iconBg="#FFF0F0" 
              value={statsData?.profile?.flagsCount?.toString() || "0"} 
              label="Flags (Reported)" 
              subLabel="Total reports received"
              isDark={isDark}
              isFullWidth
            />
            <InsightItem 
              icon={<ChatCircleText size={24} color="#34C759" />} 
              iconBg="#E8F5E9" 
              value={`${statsData?.stats?.responseRate || 0}%`} 
              label="Response Rate" 
              progressColor="#34C759" 
              progress={statsData?.stats?.responseRate || 0} 
              isDark={isDark}
              footerText="Target: 70%+"
              isFullWidth
            />
          </View>
        </LinearGradient>

        {/* Motivational Banners */}
        <View style={[styles.bannerContainer, { backgroundColor: isDark ? '#2E1F4A' : '#FDF8FF', borderColor: '#E5D5FF' }]}>
          <View style={[styles.bannerIconBg, { backgroundColor: '#762BAD' }]}>
            <Star size={20} color="#FFF" weight="fill" />
          </View>
          <View style={styles.bannerTextContainer}>
            <Text style={[styles.bannerTitle, { color: '#762BAD' }]}>Great job!</Text>
            <Text style={[styles.bannerSubtitle, { color: currentTheme.subText }]}>Consistently performing well helps you earn more trust and better opportunities.</Text>
          </View>
          <Sparkle size={16} color="#C4B5FD" weight="fill" style={styles.bannerSparkle} />
        </View>

        <LinearGradient
          colors={['#762BAD', '#4A148C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.bannerContainer, { marginTop: 12 }]}
        >
          <View style={[styles.bannerIconBg, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Trophy size={20} color="#FBBF24" weight="fill" />
          </View>
          <View style={styles.bannerTextContainer}>
            <Text style={[styles.bannerTitle, { color: '#FFF' }]}>Keep going! You're on your way to Level 2!</Text>
          </View>
          <Sparkle size={16} color="#FFF" weight="fill" style={styles.bannerSparkle} />
        </LinearGradient>

      </ScrollView>

      {/* Help Modal */}
      <Modal visible={showHelp} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: currentTheme.cardBackground || '#FFF' }]}>
            <Text style={[styles.modalTitle, { color: currentTheme.text || '#000' }]}>Profile Overview Help</Text>
            <Text style={styles.modalText}>
              This screen provides a summary of your profile performance. You can track your success score, rating, and response rate. Use the filter to view performance from different time periods.
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

const StepItem = ({ number, label, isActive, isFirst, isLast }) => (
  <View style={[styles.stepItem, isFirst && { alignItems: 'flex-start' }, isLast && { alignItems: 'flex-end' }]}>
    <View style={[styles.stepCircle, isActive ? styles.stepCircleActive : styles.stepCircleInactive]}>
      <Text style={[styles.stepNumber, isActive ? styles.stepNumberActive : styles.stepNumberInactive]}>{number}</Text>
    </View>
    <Text style={[styles.stepLabel, isActive ? styles.stepLabelActive : styles.stepLabelInactive]}>{label}</Text>
  </View>
);

const InsightItem = ({ icon, iconBg, value, label, subLabel, progressColor, progress, footerText, isDark, isFullWidth }) => (
  <View style={[styles.insightItem, isFullWidth && { width: '48%' }, { backgroundColor: isDark ? '#374151' : '#FFF' }]}>
    <View style={[styles.insightIconBg, { backgroundColor: iconBg }]}>
      {icon}
    </View>
    <Text style={[styles.insightValue, { color: isDark ? '#FFF' : '#000' }]}>{value}</Text>
    <Text style={styles.insightLabel}>{label}</Text>
    {subLabel && <Text style={styles.insightSubLabel}>{subLabel}</Text>}
    
    {progressColor && (
      <View style={styles.progressContainer}>
        <View style={[styles.progressBarBg, { backgroundColor: isDark ? '#4B5563' : '#F3F4F6' }]}>
          <View style={[styles.progressBarFill, { backgroundColor: progressColor, width: `${progress}%` }]} />
        </View>
        {footerText && <Text style={styles.progressFooter}>{footerText}</Text>}
      </View>
    )}
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
  topLevelCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  levelBadgeContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  levelBadgeBorder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#762BAD',
    padding: 4,
  },
  levelBadgeInner: {
    flex: 1,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleTL: { position: 'absolute', top: -10, left: -10 },
  sparkleBL: { position: 'absolute', bottom: 10, left: -20 },
  sparkleTR: { position: 'absolute', top: 10, right: -20 },
  levelText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  levelSubtitle: {
    fontSize: 14,
    color: '#762BAD',
    fontWeight: '600',
    marginBottom: 32,
  },
  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 32,
    position: 'relative',
  },
  stepperLineBg: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    height: 2,
    backgroundColor: '#E5E7EB',
    zIndex: 0,
  },
  stepperLineActive: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: '15%',
    height: 2,
    backgroundColor: '#762BAD',
    zIndex: 1,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
    zIndex: 2,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepCircleActive: {
    backgroundColor: '#762BAD',
  },
  stepCircleInactive: {
    backgroundColor: '#F3F4F6',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepNumberActive: {
    color: '#FFF',
  },
  stepNumberInactive: {
    color: '#9CA3AF',
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  stepLabelActive: {
    color: '#762BAD',
  },
  stepLabelInactive: {
    color: '#9CA3AF',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#FDF8FF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5D5FF',
  },
  infoIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 18,
  },
  insightsCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
  },
  insightsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  insightsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  insightsIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  insightsTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  insightsSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  dropdownBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  dropdownText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  insightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  insightItem: {
    width: '31%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  insightIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  insightValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  insightLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  insightSubLabel: {
    fontSize: 9,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 4,
  },
  progressContainer: {
    width: '100%',
    marginTop: 8,
  },
  progressBarBg: {
    height: 4,
    borderRadius: 2,
    width: '100%',
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressFooter: {
    fontSize: 9,
    color: '#9CA3AF',
    width: '100%',
  },
  bannerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    position: 'relative',
  },
  bannerIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bannerTextContainer: {
    flex: 1,
    paddingRight: 20,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  bannerSparkle: {
    position: 'absolute',
    right: 16,
    bottom: 16,
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

export default ProfileOverview;
