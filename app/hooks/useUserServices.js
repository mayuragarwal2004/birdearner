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
        if (userData && userData.role === 'FREELANCER' && userProfile?.selectedServices) {

          let servicesList = userProfile.selectedServices;
          if (typeof servicesList === 'string') {
            try {
              servicesList = JSON.parse(servicesList);
            } catch (e) {
              servicesList = [];
            }
          }
          if (!Array.isArray(servicesList)) servicesList = [];

          if (servicesList.length > 0) {
            console.log('Loading services for user:', userData.id);
            console.log('Selected services:', servicesList);

            // Load service details for the user's selected services
            const services = await Promise.all(
              servicesList.map(async (serviceId) => {
                try {
                  const service = await apiService.getServiceById(serviceId);
                  return service;
                } catch (error) {
                  console.error(`Error loading service ${serviceId}:`, error.message);
                  return null;
                }
              })
            );

            // Filter out null services (failed to load)
            const validServices = services.filter(s => s !== null);
            setUserServices(validServices);

            // Show warning if some services failed to load
            if (validServices.length < servicesList.length) {
              const failedCount = servicesList.length - validServices.length;
              console.warn(`${failedCount} service(s) failed to load`);
              showToast("warning", "Warning", `Some services could not be loaded (${failedCount} failed)`);
            }
          } else {
            setUserServices([]);
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
    hasServices: Boolean(userServices?.length > 0),
    isFreelancer: currentUserRole === 'FREELANCER',
    refreshUserData
  };
};