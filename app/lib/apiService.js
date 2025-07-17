// API service for communicating with the Bird Earner Node.js backend
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = "https://expression-wound-length-tiny.trycloudflare.com/api"; // Local network IP


class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = null;
  }

  // Initialize token from storage
  async init() {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (token) {
        this.token = token;
      }
    } catch (error) {
      console.error("Error loading auth token:", error);
    }
  }

  // Set auth token
  async setAuthToken(token) {
    this.token = token;
    if (token) {
      await AsyncStorage.setItem("authToken", token);
    } else {
      await AsyncStorage.removeItem("authToken");
    }
  }

  // Make authenticated requests
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const config = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    if (this.token) {
      config.headers["Authorization"] = `Bearer ${this.token}`;
    }

    try {
      console.log(`API Request: ${config.method || "GET"} ${url}`);
      const response = await fetch(url, config);
      console.log(`API Response: ${response.status} ${url}` );
      console.log(`Response Status: ${response.status} for ${endpoint}`);
      // console.log('Response Headers:', JSON.stringify([...response.headers.entries()], null, 2));
      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.error('Response was not valid JSON:', responseText);
        throw new Error(`Invalid JSON response: ${responseText}`);
      }
      if (!response.ok) {
        throw new Error(
          data.message || `HTTP error! status: ${response.status}`
        );
      }
      return data;
    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error);
      throw error;
    }
  }

  // Check if email exists
  async checkEmail(email) {
    const response = await this.makeRequest("/check-email", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    return response;
  }

  // Signup client
  async signupClient(clientData) {
    const response = await this.makeRequest("/signup/client", {
      method: "POST",
      body: JSON.stringify(clientData),
    });
    return response;
  }

  // Signup freelancer
  async signupFreelancer(freelancerData) {
    console.log("Signing up freelancer with data:", freelancerData);
    
    const response = await this.makeRequest("/signup/freelancer", {
      method: "POST",
      body: JSON.stringify(freelancerData),
    });
    return response;
  }

  // Auth endpoints
  async login(email, password) {
    const response = await this.makeRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (response.success && response.data) {
      // Store user data
      await AsyncStorage.setItem("userData", JSON.stringify(response.data));
      return response.data;
    }

    throw new Error("Login failed");
  }

  async register(userData) {
    const response = await this.makeRequest("/users", {
      method: "POST",
      body: JSON.stringify(userData),
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error("Registration failed");
  }

  async logout() {
    await this.setAuthToken(null);
    await AsyncStorage.multiRemove(["userData", "userProfile"]);
  }

  // User endpoints
  async getCurrentUser() {
    try {
      const userData = await AsyncStorage.getItem("userData");
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  }

  async getUserById(userId) {
    const response = await this.makeRequest(`/users/${userId}`);
    return response.data;
  }

  async updateUser(userId, updateData) {
    const response = await this.makeRequest(`/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    });
    return response.data;
  }

  // Freelancer endpoints
  async createFreelancerProfile(freelancerData) {
    const response = await this.makeRequest("/freelancers", {
      method: "POST",
      body: JSON.stringify(freelancerData),
    });
    return response.data;
  }

  async getFreelancerProfile(userId) {
    const response = await this.makeRequest(`/freelancers/user/${userId}`);
    return response.data;
  }

  async updateFreelancerProfile(freelancerId, updateData) {
    const response = await this.makeRequest(`/freelancers/${freelancerId}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    });
    return response.data;
  }

  async getAllFreelancers(page = 1, limit = 10, filters = {}) {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });

    const response = await this.makeRequest(`/freelancers?${queryParams}`);
    return response.data;
  }

  // Client endpoints
  async createClientProfile(clientData) {
    const response = await this.makeRequest("/clients", {
      method: "POST",
      body: JSON.stringify(clientData),
    });
    return response.data;
  }

  async getClientProfile(userId) {
    const response = await this.makeRequest(`/clients/user/${userId}`);
    return response.data;
  }

  async updateClientProfile(clientId, updateData) {
    const response = await this.makeRequest(`/clients/${clientId}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    });
    return response.data;
  }

  // ==================== JOB MANAGEMENT ====================
  
  // Create a new job
  async createJob(jobData) {
    try {
      const response = await this.makeRequest("/jobs", {
        method: "POST",
        body: JSON.stringify(jobData),
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create job: ${error.message}`);
    }
  }

  // Get all jobs with filters
  async getAllJobs(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await this.makeRequest(`/jobs${queryParams ? `?${queryParams}` : ""}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch jobs: ${error.message}`);
    }
  }

  // Get job by ID
  async getJobById(jobId) {
    try {
      const response = await this.makeRequest(`/jobs/${jobId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch job: ${error.message}`);
    }
  }

  // Get jobs by client ID
  async getJobsByClientId(clientId, page = 1, limit = 10, status = null) {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(status && { status })
      }).toString();
      
      const response = await this.makeRequest(`/jobs/client/${clientId}?${queryParams}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch client jobs: ${error.message}`);
    }
  }

  // Get ongoing jobs by client ID (for ClientHome screen)
  async getOngoingJobsByClientId(clientId) {
    try {
      const response = await this.makeRequest(`/jobs/client/${clientId}/ongoing`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch ongoing jobs: ${error.message}`);
    }
  }

  // Get jobs by freelancer ID
  async getJobsByFreelancerId(freelancerId, page = 1, limit = 10, status = null) {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(status && { status })
      }).toString();
      
      const response = await this.makeRequest(`/jobs/freelancer/${freelancerId}?${queryParams}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch freelancer jobs: ${error.message}`);
    }
  }

  // Get jobs by status
  async getJobsByStatus(status, page = 1, limit = 10, filters = {}) {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      }).toString();
      
      const response = await this.makeRequest(`/jobs/status/${status}?${queryParams}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch jobs by status: ${error.message}`);
    }
  }

  // Update job
  async updateJob(jobId, jobData) {
    try {
      const response = await this.makeRequest(`/jobs/${jobId}`, {
        method: "PUT",
        body: JSON.stringify(jobData),
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update job: ${error.message}`);
    }
  }

  // Assign freelancer to job
  async assignFreelancerToJob(jobId, freelancerId) {
    try {
      const response = await this.makeRequest(`/jobs/${jobId}/assign`, {
        method: "POST",
        body: JSON.stringify({ freelancerId }),
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to assign freelancer: ${error.message}`);
    }
  }

  // Update job status
  async updateJobStatus(jobId, status) {
    try {
      const response = await this.makeRequest(`/jobs/${jobId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update job status: ${error.message}`);
    }
  }

  // Delete job
  async deleteJob(jobId) {
    try {
      const response = await this.makeRequest(`/jobs/${jobId}`, {
        method: "DELETE",
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to delete job: ${error.message}`);
    }
  }

  // Get job statistics
  async getJobStats(clientId) {
    try {
      const response = await this.makeRequest(`/jobs/stats/${clientId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch job stats: ${error.message}`);
    }
  }

  // Message endpoints
  async sendMessage(messageData) {
    const response = await this.makeRequest("/messages", {
      method: "POST",
      body: JSON.stringify(messageData),
    });
    return response.data;
  }

  async getMessagesBetweenUsers(userId1, userId2, page = 1, limit = 50) {
    const response = await this.makeRequest(
      `/messages/conversation/${userId1}/${userId2}?page=${page}&limit=${limit}`
    );
    return response.data;
  }

  async getUserConversations(userId, page = 1, limit = 20) {
    const response = await this.makeRequest(
      `/messages/conversations/${userId}?page=${page}&limit=${limit}`
    );
    return response.data;
  }

  async markMessagesAsRead(senderId, receiverId) {
    const response = await this.makeRequest("/messages/mark-read", {
      method: "POST",
      body: JSON.stringify({ senderId, receiverId }),
    });
    return response.data;
  }

  // Statistics endpoints
  async getUserStats() {
    const response = await this.makeRequest("/stats/users");
    return response.data;
  }

  async getJobStats() {
    const response = await this.makeRequest("/stats/jobs");
    return response.data;
  }

  // Service endpoints
  // Returns services with structure: { id, name, category, description, imageUrl, isActive, createdAt, updatedAt }
  async getAllServices(category = null, isActive = true) {
    const queryParams = new URLSearchParams();
    if (category) queryParams.append('category', category);
    if (isActive !== undefined) queryParams.append('isActive', isActive);
    
    const response = await this.makeRequest(`/services?${queryParams.toString()}`);
    return response.data;
  }

  async getServicesByCategory(category) {
    const response = await this.makeRequest(`/services/category/${category}`);
    return response.data;
  }

  async getServiceById(serviceId) {
    const response = await this.makeRequest(`/services/${serviceId}`);
    return response.data;
  }

  async createService(serviceData) {
    const response = await this.makeRequest("/services", {
      method: "POST",
      body: JSON.stringify(serviceData),
    });
    return response.data;
  }

  async updateService(serviceId, updateData) {
    const response = await this.makeRequest(`/services/${serviceId}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    });
    return response.data;
  }

  async deleteService(serviceId) {
    const response = await this.makeRequest(`/services/${serviceId}`, {
      method: "DELETE",
    });
    return response.data;
  }

  async seedServices() {
    const response = await this.makeRequest("/services/seed", {
      method: "POST",
    });
    return response.data;
  }

  // ==================== USER PROFILE MANAGEMENT ====================
  
  // Get user profile with updated data
  async getUserProfile(userId) {
    try {
      const response = await this.makeRequest(`/users/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch user profile: ${error.message}`);
    }
  }

  // Get client profile by user ID
  async getClientProfile(userId) {
    try {
      const response = await this.makeRequest(`/clients/user/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch client profile: ${error.message}`);
    }
  }

  // Get freelancer profile by user ID
  async getFreelancerProfile(userId) {
    try {
      const response = await this.makeRequest(`/freelancers/user/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch freelancer profile: ${error.message}`);
    }
  }

  // Update user profile
  async updateUserProfile(userId, userData) {
    try {
      const response = await this.makeRequest(`/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify(userData),
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update user profile: ${error.message}`);
    }
  }

  // Get complete profile data with user information
  async getCompleteProfile(userId) {
    try {
      const user = await this.getUserProfile(userId);
      let profileData = null;
      
      if (user.role === 'FREELANCER') {
        try {
          profileData = await this.getFreelancerProfile(userId);
        } catch (error) {
          console.log('No freelancer profile found');
        }
      } else if (user.role === 'CLIENT') {
        try {
          profileData = await this.getClientProfile(userId);
        } catch (error) {
          console.log('No client profile found');
        }
      }
      
      return {
        user,
        profile: profileData,
        // Merge user and profile data for easier access
        ...(profileData && { ...profileData }),
        fullName: user.fullName,
        email: user.email,
        role: user.role
      };
    } catch (error) {
      throw new Error(`Failed to fetch complete profile: ${error.message}`);
    }
  }

  // Update user availability status
  async updateUserAvailability(userId, isAvailable) {
    try {
      const profileData = await this.getUserProfile(userId);
      
      if (profileData.role === 'FREELANCER') {
        const freelancerProfile = await this.getFreelancerProfile(userId);
        if (freelancerProfile) {
          return await this.updateFreelancerProfile(freelancerProfile.id, {
            currentlyAvailable: isAvailable
          });
        }
      } else if (profileData.role === 'CLIENT') {
        const clientProfile = await this.getClientProfile(userId);
        if (clientProfile) {
          return await this.updateClientProfile(clientProfile.id, {
            currentlyAvailable: isAvailable
          });
        }
      }
      
      throw new Error('No profile found to update');
    } catch (error) {
      throw new Error(`Failed to update availability: ${error.message}`);
    }
  }

  // Error handling helper
  handleApiError(error) {
    console.error("API Error:", error);

    if (error.message.includes("Network request failed")) {
      throw new Error("Network error. Please check your internet connection.");
    }

    if (error.message.includes("401")) {
      throw new Error("Authentication failed. Please login again.");
    }

    if (error.message.includes("404")) {
      throw new Error("Resource not found.");
    }

    if (error.message.includes("500")) {
      throw new Error("Server error. Please try again later.");
    }

    throw error;
  }

  // ==================== FILE UPLOAD ====================
  
  // Upload file (image) to server
  async uploadFile(fileUri, fileName, fileType = 'image') {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: fileUri,
        name: fileName,
        type: `image/${fileType}`,
      });

      const response = await fetch(`${this.baseURL}/uploads`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const data = await response.json();
      return data.data.url; // Return the uploaded file URL
    } catch (error) {
      console.error('File upload error:', error);
      throw new Error(`File upload failed: ${error.message}`);
    }
  }

  // ==================== PROFILE UPDATE METHODS ====================
  
  // Update freelancer profile with phase 2 data
  async updateFreelancerPhase2(freelancerId, profileData) {
    try {
      const updateData = {
        ...profileData,
        phase2Completed: true,
      };
      
      const response = await this.updateFreelancerProfile(freelancerId, updateData);
      
      // Update local user profile cache
      const userProfile = await AsyncStorage.getItem('userProfile');
      if (userProfile) {
        const updatedProfile = { ...JSON.parse(userProfile), ...updateData };
        await AsyncStorage.setItem('userProfile', JSON.stringify(updatedProfile));
      }
      
      return response;
    } catch (error) {
      throw new Error(`Failed to update freelancer profile: ${error.message}`);
    }
  }

  // Update client profile with phase 2 data
  async updateClientPhase2(clientId, profileData) {
    try {
      const updateData = {
        ...profileData,
        phase2Completed: true,
      };
      
      const response = await this.updateClientProfile(clientId, updateData);
      
      // Update local user profile cache
      const userProfile = await AsyncStorage.getItem('userProfile');
      if (userProfile) {
        const updatedProfile = { ...JSON.parse(userProfile), ...updateData };
        await AsyncStorage.setItem('userProfile', JSON.stringify(updatedProfile));
      }
      
      return response;
    } catch (error) {
      throw new Error(`Failed to update client profile: ${error.message}`);
    }
  }
}

// Create singleton instance
const apiService = new ApiService();

// Initialize on app start
apiService.init();

export default apiService;
