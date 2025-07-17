import AsyncStorage from '@react-native-async-storage/async-storage';

// Default profile status structure
const defaultProfileStatus = {
  client: {
    isRole: false,
    phase1profileComplete: false,
    phase2profileComplete: false,
    phase1skipped: false,
    phase2skipped: false,
  },
  freelancer: {
    isRole: false,
    phase1profileComplete: false,
    phase2profileComplete: false,
    phase1skipped: false,
    phase2skipped: false,
  }
};

// Storage key
const PROFILE_STATUS_KEY = 'profileStatus';

// Get profile status from storage
export const getProfileStatus = async () => {
  try {
    const stored = await AsyncStorage.getItem(PROFILE_STATUS_KEY);
    if (stored) {
      const parsedStatus = JSON.parse(stored);
      // Merge with default structure to ensure all fields exist
      return {
        client: { ...defaultProfileStatus.client, ...parsedStatus.client },
        freelancer: { ...defaultProfileStatus.freelancer, ...parsedStatus.freelancer }
      };
    }
    return defaultProfileStatus;
  } catch (error) {
    console.error('Error getting profile status:', error);
    return defaultProfileStatus;
  }
};

// Save profile status to storage
export const saveProfileStatus = async (profileStatus) => {
  try {
    await AsyncStorage.setItem(PROFILE_STATUS_KEY, JSON.stringify(profileStatus));
    return true;
  } catch (error) {
    console.error('Error saving profile status:', error);
    return false;
  }
};

// Update specific role's profile status
export const updateRoleProfileStatus = async (role, updates) => {
  try {
    const currentStatus = await getProfileStatus();
    const roleKey = role.toLowerCase();
    
    if (currentStatus[roleKey]) {
      currentStatus[roleKey] = { ...currentStatus[roleKey], ...updates };
      await saveProfileStatus(currentStatus);
      return currentStatus;
    }
    
    throw new Error(`Invalid role: ${role}`);
  } catch (error) {
    console.error('Error updating role profile status:', error);
    return null;
  }
};

// Set active role
export const setActiveRole = async (role) => {
  try {
    const currentStatus = await getProfileStatus();
    
    // Reset both roles to inactive
    currentStatus.client.isRole = false;
    currentStatus.freelancer.isRole = false;
    
    // Set the selected role as active
    const roleKey = role.toLowerCase();
    if (currentStatus[roleKey]) {
      currentStatus[roleKey].isRole = true;
      await saveProfileStatus(currentStatus);
      return currentStatus;
    }
    
    throw new Error(`Invalid role: ${role}`);
  } catch (error) {
    console.error('Error setting active role:', error);
    return null;
  }
};

// Get active role
export const getActiveRole = async () => {
  try {
    const status = await getProfileStatus();
    if (status.client.isRole) return 'CLIENT';
    if (status.freelancer.isRole) return 'FREELANCER';
    return null;
  } catch (error) {
    console.error('Error getting active role:', error);
    return null;
  }
};

// Clear profile status (for logout)
export const clearProfileStatus = async () => {
  try {
    await AsyncStorage.removeItem(PROFILE_STATUS_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing profile status:', error);
    return false;
  }
};

// Check if profile setup is needed for a role
export const isProfileSetupNeeded = async (role) => {
  try {
    const status = await getProfileStatus();
    const roleKey = role.toLowerCase();
    
    if (status[roleKey]) {
      const roleStatus = status[roleKey];
      // Setup is needed if neither phase is completed and not skipped
      return !roleStatus.phase1profileComplete && !roleStatus.phase1skipped;
    }
    
    return true; // Default to needing setup
  } catch (error) {
    console.error('Error checking profile setup need:', error);
    return true;
  }
};

// Check if a specific phase is completed or skipped
export const isPhaseCompleteOrSkipped = async (role, phase) => {
  try {
    const status = await getProfileStatus();
    const roleKey = role.toLowerCase();
    
    if (status[roleKey]) {
      const roleStatus = status[roleKey];
      const completedKey = `phase${phase}profileComplete`;
      const skippedKey = `phase${phase}skipped`;
      
      return roleStatus[completedKey] || roleStatus[skippedKey];
    }
    
    return false;
  } catch (error) {
    console.error('Error checking phase status:', error);
    return false;
  }
};

export default {
  getProfileStatus,
  saveProfileStatus,
  updateRoleProfileStatus,
  setActiveRole,
  getActiveRole,
  clearProfileStatus,
  isProfileSetupNeeded,
  isPhaseCompleteOrSkipped
};
