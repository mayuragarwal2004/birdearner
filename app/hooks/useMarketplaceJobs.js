import { useState, useCallback } from 'react';
import apiService from '../lib/apiService';
import Toast from 'react-native-toast-message';

export const useMarketplaceJobs = () => {
  const [jobs, setJobs] = useState({
    Immediate: [],
    High: [],
    Standard: [],
  });
  const [loading, setLoading] = useState(true); // Only for initial load
  const [refreshing, setRefreshing] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false); // For distance/filter changes

  const showToast = (type, text1, text2) => {
    Toast.show({ type, text1, text2, position: "top" });
  };

  const fetchJobs = async (filterByLocation = false, location = null, distance = 20, currentUserRole = 'FREELANCER', userServices = [], isInitialLoad = false) => {
    try {
      // Only show main loading on initial load, use filter loading for updates
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setFilterLoading(true);
      }
      
      // Build filter parameters
      const filters = {
        status: 'OPEN', // Only get open jobs that are available
        unassigned: true, // Filter out jobs that already have freelancers
      };

      // If user is a freelancer, filter jobs by their services
      if (currentUserRole === 'FREELANCER' && userServices.length > 0) {
        filters.serviceIds = userServices.map(service => service.id);
      }

      // Add location filtering if requested
      if (filterByLocation && location) {
        filters.latitude = location.latitude;
        filters.longitude = location.longitude;
        filters.maxDistance = distance;
      }

      console.log('Fetching jobs with filters:', filters);

      // Get jobs categorized by priority from the new backend
      const categorizedJobs = await apiService.getAllJobsCategorizedByPriority(filters);

      console.log('Categorized jobs API response:', categorizedJobs);

      setJobs(categorizedJobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack
      });
      showToast("error", "Error", "Failed to fetch jobs. Please try again later.");
      // Set empty jobs on error
      setJobs({
        Immediate: [],
        High: [],
        Standard: [],
      });
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      } else {
        setFilterLoading(false);
      }
    }
  };

  const onRefresh = async (
    location, 
    currentUserRole, 
    userServices, 
    distance,
    fetchUserProfile
  ) => {
    try {
      setRefreshing(true);
      console.log('Starting refresh...');
      
      // Refresh user profile to get latest services
      if (fetchUserProfile) {
        try {
          console.log('Refreshing user profile...');
          await fetchUserProfile();
          console.log('User profile refreshed successfully');
        } catch (error) {
          console.error('Error refreshing user profile:', error);
          // Don't block the entire refresh if profile fails
          showToast("warning", "Warning", "Could not refresh user profile");
        }
      }
      
      // Refresh jobs data
      console.log('Refreshing jobs data...');
      await fetchJobs(location ? true : false, location, distance, currentUserRole, userServices, false);
      console.log('Jobs data refreshed successfully');
      
      showToast("success", "Refreshed", "Jobs data updated successfully");
    } catch (error) {
      console.error('Error during refresh:', error);
      showToast("error", "Error", "Failed to refresh data");
    } finally {
      setRefreshing(false);
      console.log('Refresh completed');
    }
  };

  const getTotalJobsCount = useCallback(() => {
    return jobs.Immediate.length + jobs.High.length + jobs.Standard.length;
  }, [jobs]);

  const getAllJobs = useCallback(() => {
    return [...jobs.Immediate, ...jobs.High, ...jobs.Standard];
  }, [jobs]);

  return {
    jobs,
    loading,
    refreshing,
    filterLoading,
    fetchJobs,
    onRefresh,
    getTotalJobsCount,
    getAllJobs
  };
};