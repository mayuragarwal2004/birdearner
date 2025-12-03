import { useState, useEffect } from 'react';
import { useAuth } from '../context/NewAuthContext';
import apiService from '../lib/apiService';
import Toast from 'react-native-toast-message';

export const useUserServices = () => {
  const { userData, userProfile, fetchUserProfile } = useAuth();
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
        if (userData && userData.role === 'FREELANCER' && userProfile?.selectedServices) {
          console.log('Loading services for user:', userData.id);
          console.log('Selected services:', userProfile.selectedServices);
          
          // Load service details for the user's selected services
          const services = await Promise.all(
            userProfile.selectedServices.map(async (serviceId) => {
              try {
                // console.log(`Loading service: ${serviceId}`);
                const service = await apiService.getServiceById(serviceId);
                // console.log(`Service ${serviceId} loaded:`, service);
                return service;
              } catch (error) {
                console.error(`Error loading service ${serviceId}:`, error.message);
                // Return null for invalid services instead of breaking
                return null;
              }
            })
          );
          
          // Filter out null services (failed to load)
          const validServices = services.filter(s => s !== null);
          setUserServices(validServices);
          
          // Show warning if some services failed to load
          if (validServices.length < userProfile.selectedServices.length) {
            const failedCount = userProfile.selectedServices.length - validServices.length;
            console.warn(`${failedCount} service(s) failed to load`);
            showToast("warning", "Warning", `Some services could not be loaded (${failedCount} failed)`);
          }
        } else {
          // Clear services if user is not a freelancer or has no selected services
          setUserServices([]);
        }
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
    hasServices,
    isFreelancer,
    fetchUserProfile
  };
};