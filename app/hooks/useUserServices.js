import { useState, useEffect } from 'react';
import { useAuth } from '../context/NewAuthContext';
import apiService from '../lib/apiService';
import Toast from 'react-native-toast-message';
import { normalizeWorkType, filterServicesByWorkType } from '../utils/marketplaceUtils';

export const useUserServices = () => {
  const { userData, userProfile, refreshUserData } = useAuth();
  const [availableServices, setAvailableServices] = useState([]);
  const [currentUserRole, setCurrentUserRole] = useState(userData?.role || 'FREELANCER');
  const [userServices, setUserServices] = useState([]);

  // Part 5: current type drives which services Marketplace displays.
  // Inactive-type services are only hidden here, never removed from the profile.
  const workType = normalizeWorkType(userData?.freelancer?.workType);

  const showToast = (type, text1, text2) => {
    Toast.show({ type, text1, text2, position: "top" });
  };

  // Load user services and role info
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const loadedServices = await apiService.loadServicesFromSelected(userProfile || userData);
        setUserServices(filterServicesByWorkType(loadedServices, workType));
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
  }, [userData, userProfile, workType]);

  const hasServices = userServices.length > 0;
  const isFreelancer = currentUserRole === 'FREELANCER';

  return {
    userServices,
    availableServices,
    currentUserRole,
    workType,
    hasServices: Boolean(userServices?.length > 0),
    isFreelancer: currentUserRole === 'FREELANCER',
    refreshUserData
  };
};