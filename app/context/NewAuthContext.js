import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../lib/apiService';
import { setActiveRole, clearProfileStatus } from '../lib/profileStatusStorage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [userProfile, setUserProfile] = useState(null); // freelancer or client profile
  const [roleSelectionVisible, setRoleSelectionVisible] = useState(false);
  const [roleOptions, setRoleOptions] = useState({
    freelancerData: null,
    clientData: null,
  });

  // Fetch user profile data (freelancer/client) from our backend
  const fetchUserProfile = async (userId, userRole) => {
    try {
      let profileData = null;
      
      if (userRole === 'FREELANCER') {
        try {
          profileData = await apiService.getFreelancerProfile(userId);
        } catch (error) {
          console.log('No freelancer profile found for user');
        }
      } else if (userRole === 'CLIENT') {
        try {
          profileData = await apiService.getClientProfile(userId);
        } catch (error) {
          console.log('No client profile found for user');
        }
      }

      // Always set userProfile, even if it's null
      setUserProfile(profileData);
      
      if (profileData) {
        await AsyncStorage.setItem('userProfile', JSON.stringify(profileData));
      } else {
        // Remove stored profile if none exists
        await AsyncStorage.removeItem('userProfile');
      }

      return profileData;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      // Explicitly set to null on error
      setUserProfile(null);
      return null;
    }
  };

  // Check if user is already logged in
  const checkUserSession = async () => {
    try {
      setLoading(true);
      
      // Check for stored user data
      const [storedUserData, storedUserProfile] = await Promise.all([
        AsyncStorage.getItem('userData'),
        AsyncStorage.getItem('userProfile'),
      ]);

      if (storedUserData) {
        const userData = JSON.parse(storedUserData);
        setUser(userData);
        setUserData(userData);

        if (storedUserProfile) {
          setUserProfile(JSON.parse(storedUserProfile));
        } else {
          // Try to fetch profile data, this will set userProfile to null if none found
          await fetchUserProfile(userData.id, userData.role);
        }
      } else {
        // No stored user data, ensure userProfile is explicitly null
        setUserProfile(null);
      }
    } catch (error) {
      console.error("Error checking user session :", error);
      // Clear invalid session data
      await AsyncStorage.multiRemove(['userData', 'userProfile', 'authToken']);
      setUser(null);
      setUserData(null);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  };

  // Initialize auth state
  useEffect(() => {
    checkUserSession();
  }, []);

  // Login function with dual-role detection
  const login = async (email, password) => {
    try {
      const loginResponse = await apiService.login(email, password);
      
      if (loginResponse) {
        setUser(loginResponse);
        
        // Check for both freelancer and client profiles
        let freelancerProfile = null;
        let clientProfile = null;
        
        try {
          freelancerProfile = await apiService.getFreelancerProfile(loginResponse.id);
        } catch (error) {
          console.log("No freelancer profile found");
        }
        
        try {
          clientProfile = await apiService.getClientProfile(loginResponse.id);
        } catch (error) {
          console.log("No client profile found");
        }
        
        // Handle dual-role scenario
        if (freelancerProfile && clientProfile) {
          // User has both roles, show selection modal
          setRoleOptions({
            freelancerData: { ...loginResponse, role: 'FREELANCER', profile: freelancerProfile },
            clientData: { ...loginResponse, role: 'CLIENT', profile: clientProfile }
          });
          setRoleSelectionVisible(true);
          
          // Store user data but don't set userData yet (wait for role selection)
          await AsyncStorage.setItem('userData', JSON.stringify(loginResponse));
          return loginResponse;
        } else if (freelancerProfile) {
          // Only freelancer profile
          const userData = { ...loginResponse, role: 'FREELANCER' };
          setUserData(userData);
          setUserProfile(freelancerProfile);
          await AsyncStorage.setItem('userData', JSON.stringify(userData));
          await AsyncStorage.setItem('userProfile', JSON.stringify(freelancerProfile));
          
          // Set active role in profile status
          await setActiveRole('FREELANCER');
        } else if (clientProfile) {
          // Only client profile
          const userData = { ...loginResponse, role: 'CLIENT' };
          setUserData(userData);
          setUserProfile(clientProfile);
          await AsyncStorage.setItem('userData', JSON.stringify(userData));
          await AsyncStorage.setItem('userProfile', JSON.stringify(clientProfile));
          
          // Set active role in profile status
          await setActiveRole('CLIENT');
        } else {
          // No profile found, set basic user data
          setUserData(loginResponse);
          setUserProfile(null);
          await AsyncStorage.setItem('userData', JSON.stringify(loginResponse));
        }
        
        return loginResponse;
      }
    } catch (error) {
      console.error("Login error:", error);
      throw new Error(error.message || "Login failed. Please try again.");
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      console.log('Starting registration with data:', userData);
      let registrationResponse;
      
      // Use specific signup endpoints based on role
      if (userData.role === 'FREELANCER') {
        registrationResponse = await apiService.signupFreelancer(userData);
      } else if (userData.role === 'CLIENT') {
        registrationResponse = await apiService.signupClient(userData);
      } else {
        // Fallback to generic register for backward compatibility
        registrationResponse = await apiService.register(userData);
      }
      
      console.log('Registration response:', registrationResponse);
      
      if (registrationResponse && registrationResponse.success && registrationResponse.data) {
        console.log('Registration successful, user authenticated automatically');
        const authenticatedUser = registrationResponse.data;
        
        console.log('Setting user state with:', authenticatedUser);
        
        // Set states with the authenticated user data
        setUser(authenticatedUser);
        setUserData(authenticatedUser);
        
        // Extract profile data from the response
        let profileData = null;
        if (authenticatedUser.role === 'FREELANCER' && authenticatedUser.freelancer) {
          profileData = authenticatedUser.freelancer;
          console.log('Found freelancer profile:', profileData);
        } else if (authenticatedUser.role === 'CLIENT' && authenticatedUser.client) {
          profileData = authenticatedUser.client;
          console.log('Found client profile:', profileData);
        }
        
        if (profileData) {
          setUserProfile(profileData);
          await AsyncStorage.setItem('userProfile', JSON.stringify(profileData));
          console.log('Stored user profile in AsyncStorage');
        }
        
        // Store user data
        await AsyncStorage.setItem('userData', JSON.stringify(authenticatedUser));
        
        console.log('Registration and authentication completed successfully');
        console.log('Final user state - user:', !!authenticatedUser, 'userData:', !!authenticatedUser, 'userProfile:', !!profileData);
        
        return authenticatedUser;
      } else {
        console.log('Registration was not successful:', registrationResponse);
        throw new Error("Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      throw new Error(error.message || "Registration failed. Please try again.");
    }
  };

  // Logout function
  const logout = useCallback(async () => {
    try {
      await apiService.logout();
      setUser(null);
      setUserData(null);
      setUserProfile(null);
      setRoleOptions({ freelancerData: null, clientData: null });
      
      // Clear profile status on logout
      await clearProfileStatus();
    } catch (error) {
      console.error("Logout error:", error);
      // Force logout even if API call fails
      await AsyncStorage.multiRemove(['userData', 'userProfile', 'authToken']);
      setUser(null);
      setUserData(null);
      setUserProfile(null);
      
      // Clear profile status on logout
      await clearProfileStatus();
    }
  }, []);

  // Create freelancer profile
  const createFreelancerProfile = async (freelancerData) => {
    try {
      if (!user) {
        throw new Error("User not authenticated");
      }

      const profileData = {
        ...freelancerData,
        userId: user.id,
        email: user.email,
      };

      const freelancerProfile = await apiService.createFreelancerProfile(profileData);
      
      if (freelancerProfile) {
        setUserProfile(freelancerProfile);
        await AsyncStorage.setItem('userProfile', JSON.stringify(freelancerProfile));
        return freelancerProfile;
      }
    } catch (error) {
      console.error("Error creating freelancer profile:", error);
      throw new Error(error.message || "Failed to create freelancer profile");
    }
  };

  // Create client profile
  const createClientProfile = async (clientData) => {
    try {
      if (!user) {
        throw new Error("User not authenticated");
      }

      const profileData = {
        ...clientData,
        userId: user.id,
        email: user.email,
      };

      const clientProfile = await apiService.createClientProfile(profileData);
      
      if (clientProfile) {
        setUserProfile(clientProfile);
        await AsyncStorage.setItem('userProfile', JSON.stringify(clientProfile));
        return clientProfile;
      }
    } catch (error) {
      console.error("Error creating client profile:", error);
      throw new Error(error.message || "Failed to create client profile");
    }
  };

  // Update user profile
  const updateUserProfile = async (updateData) => {
    try {
      if (!user || !userProfile) {
        throw new Error("User or profile not found");
      }

      let updatedProfile;
      
      if (user.role === 'FREELANCER') {
        updatedProfile = await apiService.updateFreelancerProfile(userProfile.id, updateData);
      } else if (user.role === 'CLIENT') {
        updatedProfile = await apiService.updateClientProfile(userProfile.id, updateData);
      }

      if (updatedProfile) {
        setUserProfile(updatedProfile);
        await AsyncStorage.setItem('userProfile', JSON.stringify(updatedProfile));
        return updatedProfile;
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      throw new Error(error.message || "Failed to update profile");
    }
  };

  // Role selection modal handlers
  const selectRole = async (selectedRole) => {
    try {
      if (selectedRole === 'FREELANCER' && roleOptions.freelancerData) {
        const userData = roleOptions.freelancerData;
        const profileData = userData.profile;
        
        setUserData(userData);
        setUserProfile(profileData);
        
        // Store the selected role data
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        await AsyncStorage.setItem('userProfile', JSON.stringify(profileData));
        
        // Set active role in profile status
        await setActiveRole('FREELANCER');
        
      } else if (selectedRole === 'CLIENT' && roleOptions.clientData) {
        const userData = roleOptions.clientData;
        const profileData = userData.profile;
        
        setUserData(userData);
        setUserProfile(profileData);
        
        // Store the selected role data
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        await AsyncStorage.setItem('userProfile', JSON.stringify(profileData));
        
        // Set active role in profile status
        await setActiveRole('CLIENT');
      }
      
      setRoleSelectionVisible(false);
      
      // Clear role options after selection
      setRoleOptions({
        freelancerData: null,
        clientData: null,
      });
    } catch (error) {
      console.error("Error selecting role:", error);
      Alert.alert("Error", "Failed to select role. Please try again.");
    }
  };

  // Refresh user data
  const refreshUserData = async () => {
    if (user) {
      try {
        // Fetch fresh user data from backend
        const freshUserData = await apiService.getUserById(user.id);
        
        if (freshUserData) {
          setUserData(freshUserData);
          
          // Extract profile data from the response
          let profileData = null;
          if (freshUserData.role === 'FREELANCER' && freshUserData.freelancer) {
            profileData = freshUserData.freelancer;
          } else if (freshUserData.role === 'CLIENT' && freshUserData.client) {
            profileData = freshUserData.client;
          }
          
          if (profileData) {
            setUserProfile(profileData);
            await AsyncStorage.setItem('userProfile', JSON.stringify(profileData));
          }
          
          // Update stored user data
          await AsyncStorage.setItem('userData', JSON.stringify(freshUserData));
        }
      } catch (error) {
        console.error("Error refreshing user data:", error);
      }
    }
  };

  const value = {
    user,
    userData,
    userProfile,
    loading,
    login,
    register,
    logout,
    createFreelancerProfile,
    createClientProfile,
    updateUserProfile,
    refreshUserData,
    checkUserSession,
    selectRole,
    roleOptions,
    roleSelectionVisible,
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
      
      {/* Role Selection Modal */}
      <Modal
        visible={roleSelectionVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setRoleSelectionVisible(false)}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Select Role</Text>
          <Text style={styles.modalSubtitle}>
            Multiple accounts found for your email. Please choose a role to
            continue:
          </Text>
          
          {roleOptions.freelancerData && (
            <TouchableOpacity
              style={[styles.button, styles.freelancerButton]}
              onPress={() => selectRole('FREELANCER')}
            >
              <Text style={styles.buttonText}>Freelancer</Text>
            </TouchableOpacity>
          )}
          
          {roleOptions.clientData && (
            <TouchableOpacity
              style={[styles.button, styles.clientButton]}
              onPress={() => selectRole('CLIENT')}
            >
              <Text style={styles.buttonText}>Client</Text>
            </TouchableOpacity>
          )}
        </View>
      </Modal>
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#3b006b",
    padding: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15,
    color: "white",
  },
  modalSubtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
    color: "#fff",
    fontWeight: "300",
    paddingHorizontal: 30,
  },
  button: {
    width: "80%",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 15,
  },
  freelancerButton: {
    backgroundColor: "#fff",
  },
  clientButton: {
    backgroundColor: "#fff",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4B0082",
  },
});

export default AuthContext;
