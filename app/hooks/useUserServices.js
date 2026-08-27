import { useState, useEffect } from 'react';
import { useAuth } from '../context/NewAuthContext';
import apiService from '../lib/apiService';
import Toast from 'react-native-toast-message';

export const useUserServices = () => {
  const { userData, userProfile, refreshUserData } = useAuth();
  const [availableServices, setAvailableServices] = useState([]);
  const [currentUserRole, setCurrentUserRole] = useState(userData?.role || 'FREELANCER');
  const [userServices, setUserServices] = useState([]);

  const showToast = (type, text1, text2) => {
    Toast.show({ type, text1, text2, position: "top" });
  };

  // Load user services and role info
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const validServices = await apiService.loadServicesFromSelected(userProfile || userData);
        setUserServices(validServices);
        setCurrentUserRole(userData?.role || 'FREELANCER');
      } catch (error) {
        console.error('Error loading user info:', error);
        setUserServices([]);
        showToast("error", "Error", "Failed to load user services");
      }
    };

    if (userData) {
      loadUserInfo();
    }
  }, [userData, userProfile]);

  const hasServices = userServices.length > 0;
  const isFreelancer = currentUserRole === 'FREELANCER';

  return {
    userServices,
    availableServices,
    currentUserRole,
    hasServices: Boolean(userServices?.length > 0),
    isFreelancer: currentUserRole === 'FREELANCER',
    refreshUserData
  };
};