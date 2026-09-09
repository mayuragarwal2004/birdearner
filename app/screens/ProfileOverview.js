import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Modal } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Question, Star, TrendUp, Target, Flag, ChatCircleText, Trophy, ChartBar, Sparkle, Clock, CaretDown } from 'phosphor-react-native';
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

  const levelName = statsData?.profile?.rank || 'Level 1';
  const successScore = statsData?.stats?.successScore || 0;
  const ratingVal = (statsData?.stats?.averageRating || 0).toFixed(1);
  const responseRate = statsData?.stats?.responseRate || 0;
  const flagsCount = statsData?.profile?.flagsCount !== undefined && statsData?.profile?.flagsCount !== null ? String(statsData?.profile?.flagsCount) : "NA";

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? currentTheme.background : '#FAFAFC' }]}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <ArrowLeft size={22} color={currentTheme.text} weight="bold" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: currentTheme.text }]}>Profile Overview</Text>
        <TouchableOpacity style={styles.iconButton} onPress={() => setShowHelp(true)}>
          <Question size={24} color="#7C3AED" weight="regular" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Top Level Card */}
        <View style={[styles.topLevelCard, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]}>
          
          {/* Level Ring Container */}
          <View style={styles.levelBadgeContainer}>
            {/* Decorative Sparkles */}
            <Sparkle size={14} color="#A855F7" weight="fill" style={styles.sparkleTL} />
            <Sparkle size={10} color="#A855F7" weight="fill" style={styles.sparkleBL} />
            <Sparkle size={16} color="#F59E0B" weight="fill" style={styles.sparkleTR} />
            <Sparkle size={12} color="#A855F7" weight="fill" style={styles.sparkleBR} />
            
            <View style={styles.levelRingOuter}>
              <View style={styles.levelBadgeIconBg}>
                <LinearGradient colors={['#9333EA', '#6B21A8']} style={styles.hexagonIconContainer}>
                  <Star size={20} color="#FFF" weight="fill" />
                </LinearGradient>
              </View>
              <Text style={styles.levelTitleText}>{levelName}</Text>
              <Text style={styles.levelSubTitleText}>Beginner</Text>
            </View>
          </View>

          {/* Stepper Line & Steps */}
          <View style={styles.stepperContainer}>
            <View style={styles.stepperLineBg} />
            <View style={styles.stepperLineActive} />
            
            <View style={styles.stepItem}>
              <View style={[styles.stepCircle, styles.stepCircleActive]}>
                <Text style={styles.stepNumberActive}>1</Text>
              </View>
              <Text style={styles.stepLabelActive}>Beginner</Text>
            </View>

            <View style={styles.stepItem}>
              <View style={[styles.stepCircle, styles.stepCircleInactive]}>
                <Text style={styles.stepNumberInactive}>2</Text>
              </View>
              <Text style={styles.stepLabelInactive}>Level 2</Text>
            </View>

            <View style={styles.stepItem}>
              <View style={[styles.stepCircle, styles.stepCircleInactive]}>
                <Text style={styles.stepNumberInactive}>3</Text>
              </View>
              <Text style={styles.stepLabelInactive}>Level 3</Text>
            </View>

            <View style={styles.stepItem}>
              <View style={[styles.stepCircle, styles.stepCircleInactive]}>
                <Text style={styles.stepNumberInactive}>4</Text>
              </View>
              <Text style={styles.stepLabelInactive}>Level 4</Text>
            </View>

            <View style={styles.stepItem}>
              <View style={[styles.stepCircle, styles.stepCircleInactive]}>
                <Text style={styles.stepNumberInactive}>5</Text>
              </View>
              <Text style={styles.stepLabelInactive}>Top Rated</Text>
            </View>
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <View style={styles.infoIconCircle}>
              <TrendUp size={20} color="#7C3AED" />
            </View>
            <Text style={styles.infoBoxText}>
              Complete more jobs and maintain great performance to reach higher levels and unlock more opportunities.
            </Text>
          </View>
        </View>

        {/* Performance Insights Section */}
        <View style={styles.insightsCard}>
          {/* Purple Header Banner */}
          <LinearGradient
            colors={['#6D28D9', '#4C1D95']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.insightsHeader}
          >
            <View style={styles.insightsHeaderLeft}>
              <View style={styles.insightsIconCircle}>
                <ChartBar size={20} color="#FFF" weight="fill" />
              </View>
              <View>
                <Text style={styles.insightsTitle}>Performance Insights</Text>
                <Text style={styles.insightsSubtitle}>Track your progress & improve your stats</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowFilter(true)}>
              <Text style={styles.dropdownText}>{selectedFilter}</Text>
              <CaretDown size={14} color="#FFF" weight="bold" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </LinearGradient>

          {/* Insights Grid Container */}
          <View style={[styles.insightsGrid, { backgroundColor: isDark ? '#1F2937' : '#FAF8FF' }]}>
            
            {/* Row 1: 3 cards */}
            <View style={styles.gridRow3}>
              {/* Card 1: Success Score */}
              <View style={[styles.insightCard3, { backgroundColor: isDark ? '#374151' : '#FFFFFF' }]}>
                <View style={[styles.insightIconBg, { backgroundColor: '#D1FAE5' }]}>
                  <Target size={22} color="#10B981" />
                </View>
                <Text style={[styles.insightValue, { color: isDark ? '#FFF' : '#0F172A' }]}>{successScore}%</Text>
                <Text style={styles.insightLabel}>Success Score</Text>
                <View style={styles.progressContainer}>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { backgroundColor: '#10B981', width: `${Math.min(100, Math.max(0, successScore))}%` }]} />
                  </View>
                  <View style={styles.progressFooterRow}>
                    <Text style={styles.progressFooterText}>0</Text>
                    <Text style={styles.progressFooterText}>100</Text>
                  </View>
                </View>
              </View>

              {/* Card 2: Rating */}
              <View style={[styles.insightCard3, { backgroundColor: isDark ? '#374151' : '#FFFFFF' }]}>
                <View style={[styles.insightIconBg, { backgroundColor: '#EDE9FE' }]}>
                  <Star size={22} color="#7C3AED" />
                </View>
                <Text style={[styles.insightValue, { color: isDark ? '#FFF' : '#0F172A' }]}>{ratingVal}</Text>
                <Text style={styles.insightLabel}>Rating</Text>
                <View style={styles.progressContainer}>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { backgroundColor: '#7C3AED', width: `${Math.min(100, (parseFloat(ratingVal) / 5.0) * 100)}%` }]} />
                  </View>
                  <View style={styles.progressFooterRight}>
                    <Text style={styles.progressFooterText}>/ 5.0</Text>
                  </View>
                </View>
              </View>

              {/* Card 3: Avg. Response Time */}
              <View style={[styles.insightCard3, { backgroundColor: isDark ? '#374151' : '#FFFFFF' }]}>
                <View style={[styles.insightIconBg, { backgroundColor: '#FFEDD5' }]}>
                  <Clock size={22} color="#F97316" />
                </View>
                <Text style={[styles.insightValue, { color: isDark ? '#FFF' : '#0F172A' }]}>1 hr</Text>
                <Text style={styles.insightLabel}>Avg. Response Time</Text>
                <View style={styles.progressContainer}>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { backgroundColor: '#F97316', width: '40%' }]} />
                  </View>
                </View>
              </View>
            </View>

            {/* Row 2: 2 cards */}
            <View style={styles.gridRow2}>
              {/* Card 4: Flags (Reported) */}
              <View style={[styles.insightCard2, { backgroundColor: isDark ? '#374151' : '#FFFFFF' }]}>
                <View style={[styles.insightIconBg, { backgroundColor: '#FEE2E2' }]}>
                  <Flag size={22} color="#EF4444" />
                </View>
                <Text style={[styles.insightValue, { color: isDark ? '#FFF' : '#0F172A' }]}>{flagsCount}</Text>
                <Text style={styles.insightLabel}>Flags (Reported)</Text>
                <Text style={styles.insightSubLabel}>Total reports received</Text>
              </View>

              {/* Card 5: Response Rate */}
              <View style={[styles.insightCard2, { backgroundColor: isDark ? '#374151' : '#FFFFFF' }]}>
                <View style={[styles.insightIconBg, { backgroundColor: '#D1FAE5' }]}>
                  <ChatCircleText size={22} color="#10B981" />
                </View>
                <Text style={[styles.insightValue, { color: isDark ? '#FFF' : '#0F172A' }]}>{responseRate}%</Text>
                <Text style={styles.insightLabel}>Response Rate</Text>
                <View style={styles.progressContainer}>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { backgroundColor: '#10B981', width: `${Math.min(100, Math.max(0, responseRate))}%` }]} />
                  </View>
                  <View style={styles.progressFooterCenter}>
                    <Text style={styles.progressFooterText}>Target: 70%+</Text>
                  </View>
                </View>
              </View>
            </View>

          </View>
        </View>

        {/* Motivational Banners */}
        {/* Banner 1: Light purple */}
        <View style={[styles.bannerLight, { backgroundColor: isDark ? '#2E1F4A' : '#F5F0FF', borderColor: '#EDE9FE' }]}>
          <View style={styles.bannerStarCircle}>
            <Star size={18} color="#FFF" weight="fill" />
          </View>
          <View style={styles.bannerTextCol}>
            <Text style={styles.bannerTextBold}>
              <Text style={{ fontWeight: 'bold', color: '#6D28D9' }}>Great job! </Text>
              <Text style={{ color: '#4B5563', fontWeight: '500' }}>Consistently performing well helps you earn more trust and better opportunities.</Text>
            </Text>
          </View>
        </View>

        {/* Banner 2: Solid purple gradient */}
        <LinearGradient
          colors={['#6D28D9', '#4C1D95']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bannerDark}
        >
          <View style={styles.bannerTrophyCircle}>
            <Trophy size={18} color="#FFF" weight="fill" />
          </View>
          <Text style={styles.bannerDarkText}>Keep going! You're on your way to Level 2!</Text>
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
                <Text style={[styles.filterOptionText, selectedFilter === opt && { color: '#7C3AED', fontWeight: 'bold' }]}>{opt}</Text>
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  iconButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  topLevelCard: {
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3E8FF',
    elevation: 2,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  levelBadgeContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  levelRingOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
  },
  levelBadgeIconBg: {
    marginBottom: 4,
  },
  hexagonIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelTitleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  levelSubTitleText: {
    fontSize: 12,
    color: '#7C3AED',
    fontWeight: '600',
  },
  sparkleTL: { position: 'absolute', top: 10, left: -14 },
  sparkleBL: { position: 'absolute', bottom: 20, left: -18 },
  sparkleTR: { position: 'absolute', top: 14, right: -16 },
  sparkleBR: { position: 'absolute', bottom: 24, right: -12 },
  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
    position: 'relative',
    paddingHorizontal: 8,
  },
  stepperLineBg: {
    position: 'absolute',
    top: 15,
    left: 28,
    right: 28,
    height: 2,
    backgroundColor: '#E2E8F0',
    zIndex: 0,
  },
  stepperLineActive: {
    position: 'absolute',
    top: 15,
    left: 28,
    width: '20%',
    height: 2,
    backgroundColor: '#7C3AED',
    zIndex: 1,
  },
  stepItem: {
    alignItems: 'center',
    zIndex: 2,
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  stepCircleActive: {
    backgroundColor: '#7C3AED',
  },
  stepCircleInactive: {
    backgroundColor: '#E2E8F0',
  },
  stepNumberActive: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  stepNumberInactive: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  stepLabelActive: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#7C3AED',
  },
  stepLabelInactive: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#F5F0FF',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    alignItems: 'center',
    width: '100%',
  },
  infoIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 12,
    color: '#4C1D95',
    lineHeight: 17,
    fontWeight: '500',
  },
  insightsCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  insightsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  insightsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  insightsIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  insightsTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  insightsSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  dropdownText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  insightsGrid: {
    padding: 12,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  gridRow3: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gridRow2: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  insightCard3: {
    width: '31.5%',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },
  insightCard2: {
    width: '48.5%',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },
  insightIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  insightValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  insightLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 2,
  },
  insightSubLabel: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    marginTop: 6,
  },
  progressBarBg: {
    height: 4,
    borderRadius: 2,
    width: '100%',
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  progressFooterRight: {
    alignItems: 'flex-end',
    marginTop: 2,
  },
  progressFooterCenter: {
    alignItems: 'center',
    marginTop: 2,
  },
  progressFooterText: {
    fontSize: 9,
    color: '#94A3B8',
  },
  bannerLight: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  bannerStarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  bannerTextCol: {
    flex: 1,
  },
  bannerTextBold: {
    fontSize: 12,
    lineHeight: 16,
  },
  bannerDark: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    marginBottom: 16,
  },
  bannerTrophyCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  bannerDarkText: {
    flex: 1,
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  sparklesGroup: {
    flexDirection: 'row',
    alignItems: 'center',
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
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalCloseBtn: {
    backgroundColor: '#7C3AED',
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
    borderBottomColor: '#F1F5F9',
  },
  filterOptionText: {
    fontSize: 16,
    color: '#475569',
  },
});

export default ProfileOverview;
