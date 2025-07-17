// Skip Tracker Utility - Manages profile setup skip functionality
import AsyncStorage from '@react-native-async-storage/async-storage';

const SKIP_STORAGE_KEYS = {
  DESCRIBE_ROLE_SKIPPED: 'profile_setup_describe_role_skipped',
  TELL_US_ABOUT_YOU_SKIPPED: 'profile_setup_tell_us_about_you_skipped',
  SKIP_COUNT: 'profile_setup_skip_count',
  LAST_SKIP_DATE: 'profile_setup_last_skip_date',
  GLITCH_DETECTION: 'profile_setup_glitch_attempts',
  USER_PREFERENCE: 'profile_setup_user_preference'
};

class SkipTracker {
  /**
   * Record that user intentionally skipped a phase (with enhanced safety)
   * @param {string} phase - 'describe_role' or 'tell_us_about_you'
   * @param {string} userId - User ID for tracking
   * @param {string} reason - 'user_skip' or 'glitch_recovery'
   */
  async recordSkip(phase, userId, reason = 'user_skip') {
    return this.safeOperation(async () => {
      const skipData = {
        userId,
        phase,
        reason,
        timestamp: new Date().toISOString(),
        deviceInfo: {
          platform: 'mobile', // Could be enhanced with actual device info
        }
      };

      // Store individual phase skip
      const storageKey = phase === 'describe_role' 
        ? SKIP_STORAGE_KEYS.DESCRIBE_ROLE_SKIPPED 
        : SKIP_STORAGE_KEYS.TELL_US_ABOUT_YOU_SKIPPED;
      
      await AsyncStorage.setItem(storageKey, JSON.stringify(skipData));

      // Update skip count
      await this.incrementSkipCount();

      // Store last skip date
      await AsyncStorage.setItem(SKIP_STORAGE_KEYS.LAST_SKIP_DATE, new Date().toISOString());

      console.log(`Skip recorded: ${phase} - ${reason}`);
      return true;
    }, false); // Default to false if operation fails
  }

  /**
   * Check if a specific phase was skipped (with enhanced safety)
   * @param {string} phase - 'describe_role' or 'tell_us_about_you'
   */
  async isPhaseSkipped(phase) {
    return this.safeOperation(async () => {
      const storageKey = phase === 'describe_role' 
        ? SKIP_STORAGE_KEYS.DESCRIBE_ROLE_SKIPPED 
        : SKIP_STORAGE_KEYS.TELL_US_ABOUT_YOU_SKIPPED;
      
      const skipData = await AsyncStorage.getItem(storageKey);
      return !!skipData;
    }, false); // Default to false if operation fails
  }

  /**
   * Get skip count for analytics
   */
  async getSkipCount() {
    try {
      const count = await AsyncStorage.getItem(SKIP_STORAGE_KEYS.SKIP_COUNT);
      return count ? parseInt(count) : 0;
    } catch (error) {
      console.error('Error getting skip count:', error);
      return 0;
    }
  }

  /**
   * Increment skip count
   */
  async incrementSkipCount() {
    try {
      const currentCount = await this.getSkipCount();
      await AsyncStorage.setItem(SKIP_STORAGE_KEYS.SKIP_COUNT, (currentCount + 1).toString());
    } catch (error) {
      console.error('Error incrementing skip count:', error);
    }
  }

  /**
   * Record potential glitch detection (multiple failed attempts)
   * @param {string} phase - Current phase
   * @param {string} errorType - Type of error encountered
   */
  async recordGlitchAttempt(phase, errorType) {
    try {
      const glitchKey = SKIP_STORAGE_KEYS.GLITCH_DETECTION;
      const existingData = await AsyncStorage.getItem(glitchKey);
      const glitchData = existingData ? JSON.parse(existingData) : [];

      glitchData.push({
        phase,
        errorType,
        timestamp: new Date().toISOString(),
      });

      // Keep only last 10 glitch attempts
      const recentGlitches = glitchData.slice(-10);
      await AsyncStorage.setItem(glitchKey, JSON.stringify(recentGlitches));

      return recentGlitches.length;
    } catch (error) {
      console.error('Error recording glitch attempt:', error);
      return 0;
    }
  }

  /**
   * Check if user should be offered skip due to multiple glitches
   * @param {string} phase - Current phase
   */
  async shouldOfferGlitchSkip(phase) {
    try {
      const glitchKey = SKIP_STORAGE_KEYS.GLITCH_DETECTION;
      const existingData = await AsyncStorage.getItem(glitchKey);
      
      if (!existingData) return false;

      const glitchData = JSON.parse(existingData);
      const recentPhaseGlitches = glitchData.filter(
        glitch => glitch.phase === phase && 
        new Date() - new Date(glitch.timestamp) < 30 * 60 * 1000 // Last 30 minutes
      );

      // Offer skip if 3+ glitches in the same phase within 30 minutes
      return recentPhaseGlitches.length >= 3;
    } catch (error) {
      console.error('Error checking glitch skip eligibility:', error);
      return false;
    }
  }

  /**
   * Clear skip data (for testing or reset)
   */
  async clearSkipData() {
    try {
      await Promise.all([
        AsyncStorage.removeItem(SKIP_STORAGE_KEYS.DESCRIBE_ROLE_SKIPPED),
        AsyncStorage.removeItem(SKIP_STORAGE_KEYS.TELL_US_ABOUT_YOU_SKIPPED),
        AsyncStorage.removeItem(SKIP_STORAGE_KEYS.SKIP_COUNT),
        AsyncStorage.removeItem(SKIP_STORAGE_KEYS.LAST_SKIP_DATE),
        AsyncStorage.removeItem(SKIP_STORAGE_KEYS.GLITCH_DETECTION),
        AsyncStorage.removeItem(SKIP_STORAGE_KEYS.USER_PREFERENCE),
      ]);
      console.log('Skip data cleared');
    } catch (error) {
      console.error('Error clearing skip data:', error);
    }
  }

  /**
   * Get comprehensive skip status for debugging
   */
  async getSkipStatus() {
    try {
      const [
        describeRoleSkipped,
        tellUsAboutYouSkipped,
        skipCount,
        lastSkipDate,
        glitchData,
      ] = await Promise.all([
        this.isPhaseSkipped('describe_role'),
        this.isPhaseSkipped('tell_us_about_you'),
        this.getSkipCount(),
        AsyncStorage.getItem(SKIP_STORAGE_KEYS.LAST_SKIP_DATE),
        AsyncStorage.getItem(SKIP_STORAGE_KEYS.GLITCH_DETECTION),
      ]);

      return {
        describeRoleSkipped,
        tellUsAboutYouSkipped,
        skipCount,
        lastSkipDate,
        glitchAttempts: glitchData ? JSON.parse(glitchData) : [],
      };
    } catch (error) {
      console.error('Error getting skip status:', error);
      return null;
    }
  }

  /**
   * Safe wrapper for all skip operations - prevents app crashes
   * @param {Function} operation - The async operation to perform
   * @param {string} fallbackValue - Value to return if operation fails
   */
  async safeOperation(operation, fallbackValue = false) {
    try {
      return await operation();
    } catch (error) {
      console.warn('SkipTracker safe operation failed:', error);
      return fallbackValue;
    }
  }

  /**
   * Emergency clear all data - use when AsyncStorage is corrupted
   */
  async emergencyClear() {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const skipKeys = allKeys.filter(key => key.startsWith('profile_setup_'));
      await AsyncStorage.multiRemove(skipKeys);
      console.log('Emergency clear completed');
      return true;
    } catch (error) {
      console.error('Emergency clear failed:', error);
      return false;
    }
  }

  /**
   * Health check for skip tracking system
   */
  async healthCheck() {
    try {
      // Test basic AsyncStorage operations
      const testKey = 'profile_setup_health_test';
      await AsyncStorage.setItem(testKey, 'test');
      const result = await AsyncStorage.getItem(testKey);
      await AsyncStorage.removeItem(testKey);
      
      return result === 'test';
    } catch (error) {
      console.error('Skip tracking health check failed:', error);
      return false;
    }
  }

  /**
   * Emergency override - marks both phases as skipped to allow app access
   * This is a "panic button" to prevent users from being stuck in profile setup
   */
  async emergencySkipAll(userId, reason = 'emergency_override') {
    try {
      console.log('Emergency skip all phases activated');
      
      await Promise.all([
        this.recordSkip('describe_role', userId, reason),
        this.recordSkip('tell_us_about_you', userId, reason)
      ]);
      
      // Record this emergency action for monitoring
      await this.recordGlitchAttempt('emergency', 'skip_all_activated');
      
      return true;
    } catch (error) {
      console.error('Emergency skip failed:', error);
      return false;
    }
  }

  /**
   * Check if emergency skip is needed (too many glitches across all phases)
   */
  async shouldOfferEmergencySkip() {
    try {
      const skipStatus = await this.getSkipStatus();
      
      // If we have more than 5 total glitch attempts, suggest emergency skip
      return skipStatus && skipStatus.glitchAttempts && skipStatus.glitchAttempts.length > 5;
    } catch (error) {
      console.error('Error checking emergency skip eligibility:', error);
      return false;
    }
  }
}

export default new SkipTracker();
