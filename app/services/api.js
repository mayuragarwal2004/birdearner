// API service for backend communication
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL for your backend server
const BASE_URL = 'http://localhost:3000/api'; // Update this to your actual backend URL

// Helper function to get auth token
const getAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  try {
    const token = await getAuthToken();
    const url = `${BASE_URL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

// Job API functions
export const jobAPI = {
  // Create a new job
  createJob: async (jobData) => {
    return apiRequest('/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
  },

  // Get all jobs with filters
  getAllJobs: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null) {
        queryParams.append(key, filters[key]);
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/jobs${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest(endpoint);
  },

  // Get job by ID
  getJobById: async (jobId) => {
    return apiRequest(`/jobs/${jobId}`);
  },

  // Get jobs by client ID
  getJobsByClientId: async (clientId, page = 1, limit = 10, status = null) => {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (status) {
      queryParams.append('status', status);
    }
    
    return apiRequest(`/jobs/client/${clientId}?${queryParams.toString()}`);
  },

  // Get ongoing jobs by client ID
  getOngoingJobsByClientId: async (clientId) => {
    return apiRequest(`/jobs/client/${clientId}/ongoing`);
  },

  // Update job status
  updateJobStatus: async (jobId, status) => {
    return apiRequest(`/jobs/${jobId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  // Assign freelancer to job
  assignFreelancerToJob: async (jobId, freelancerId) => {
    return apiRequest(`/jobs/${jobId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ freelancerId }),
    });
  },
};

// Service API functions
export const serviceAPI = {
  // Get all services
  getAllServices: async (category = null, isActive = true) => {
    const queryParams = new URLSearchParams({
      isActive: isActive.toString(),
    });
    
    if (category) {
      queryParams.append('category', category);
    }
    
    return apiRequest(`/services?${queryParams.toString()}`);
  },

  // Get services by category
  getServicesByCategory: async (category) => {
    return apiRequest(`/services/category/${category}`);
  },

  // Get service by ID
  getServiceById: async (serviceId) => {
    return apiRequest(`/services/${serviceId}`);
  },
};

// User API functions (for future use)
export const userAPI = {
  // Get user profile
  getUserProfile: async (userId) => {
    return apiRequest(`/users/${userId}`);
  },

  // Update user profile
  updateUserProfile: async (userId, userData) => {
    return apiRequest(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },
};

// Export default API object
export default {
  job: jobAPI,
  service: serviceAPI,
  user: userAPI,
};
