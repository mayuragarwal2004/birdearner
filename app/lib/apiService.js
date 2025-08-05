// API service for communicating with the Bird Earner Node.js backend
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL =
  "https://api.birdearner.com/api"; // Local development server

// upload image categories are mentioned over here, above uploadImage function and in backend at /upload route
/** @type {const} */
const CATEGORIES = [
  "client_profile_photos",
  "freelancer_profile_photos",
  "client_cover_photos",
  "freelancer_cover_photos",
  "freelancer_portfolios",
  "job_portfolios",
];

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
        console.log("API Service initialized with token from storage");
      } else {
        console.log(
          "No token found in storage during API Service initialization"
        );
      }
      return this.token;
    } catch (error) {
      console.error("Error loading auth token:", error);
      return null;
    }
  }

  // Set auth token
  async setAuthToken(token) {
    this.token = token;
    if (token) {
      await AsyncStorage.setItem("authToken", token);
      console.log("Auth token set in API Service");
    } else {
      await AsyncStorage.removeItem("authToken");
      console.log("Auth token removed from API Service");
    }
    return token;
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
    } else {
      console.warn(`No auth token available for request to ${endpoint}`);
    }

    try {
      console.log(`API Request: ${config.method || "GET"} ${url}`);
      console.log(
        `Auth header present: ${config.headers["Authorization"] ? "Yes" : "No"}`
      );

      const response = await fetch(url, config);
      console.log(`API Response: ${response.status} ${url}`);

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        console.error("Response was not valid JSON:", responseText);
        throw new Error(`Invalid JSON response: ${responseText}`);
      }

      if (!response.ok) {
        // Check for authentication errors specifically
        if (response.status === 401 || response.status === 403) {
          console.error(
            "Authentication error:",
            data.message || "Access denied"
          );
          throw new Error(
            `Authentication failed: ${
              data.message || "Access denied, please login again"
            }`
          );
        }

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

    if (response.success && response.data && response.data.token) {
      // Set token in the API service instance
      await this.setAuthToken(response.data.token);

      // Store user data without token to avoid duplication
      const { token, ...userData } = response.data;
      await AsyncStorage.setItem("userData", JSON.stringify(userData));
    }

    return response;
  }

  // Signup freelancer
  async signupFreelancer(freelancerData) {
    console.log("Signing up freelancer with data:", freelancerData);

    const response = await this.makeRequest("/signup/freelancer", {
      method: "POST",
      body: JSON.stringify(freelancerData),
    });

    if (response.success && response.data && response.data.token) {
      // Set token in the API service instance
      await this.setAuthToken(response.data.token);

      // Store user data without token to avoid duplication
      const { token, ...userData } = response.data;
      await AsyncStorage.setItem("userData", JSON.stringify(userData));
    }

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
      console.log("Login successful, storing user data and token");

      // Set token in the API service instance
      await this.setAuthToken(response.data.token);

      // Store user data without token to avoid duplication
      const { token, ...userData } = response.data;
      await AsyncStorage.setItem("userData", JSON.stringify(userData));

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

  // Update password
  async updatePassword(currentPassword, newPassword) {
    const response = await this.makeRequest("/auth/update-password", {
      method: "PUT",
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (response.success) {
      return response;
    }

    throw new Error(response.message || "Password update failed");
  }

  // Update email
  async updateEmail(newEmail, password) {
    const response = await this.makeRequest("/auth/update-email", {
      method: "PUT",
      body: JSON.stringify({ newEmail, password }),
    });

    if (response.success) {
      // Update stored user data with new email
      if (response.data) {
        await AsyncStorage.setItem("userData", JSON.stringify(response.data));
      }
      return response;
    }

    throw new Error(response.message || "Email update failed");
  }

  // User endpoints
  async getCurrentUser() {
    try {
      const userData = await this.makeRequest("/users/me");
      return userData ? userData : null;
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
    return { ...response.data, role: "FREELANCER" };
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
    return { ...response.data, role: "CLIENT" };
  }

  async updateClientProfile(clientId, updateData) {
    const response = await this.makeRequest(`/clients/${clientId}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    });
    return response.data;
  }

  // ==================== JOB MANAGEMENT ====================

  // ==================== REVIEW MANAGEMENT ====================

  // Get reviews for a user
  async getReviewsByUserId(userId) {
    try {
      const response = await this.makeRequest(`/reviews/user/${userId}`);
      return response;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Get review statistics
  async getReviewStats(userId) {
    try {
      const response = await this.makeRequest(`/reviews/stats/${userId}`);
      return response;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Create a review
  async createReview(reviewData) {
    try {
      const response = await this.makeRequest("/reviews", {
        method: "POST",
        body: JSON.stringify(reviewData),
      });
      return response;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Update a review
  async updateReview(reviewId, reviewData) {
    try {
      const response = await this.makeRequest(`/reviews/${reviewId}`, {
        method: "PUT",
        body: JSON.stringify(reviewData),
      });
      return response;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Delete a review
  async deleteReview(reviewId) {
    try {
      const response = await this.makeRequest(`/reviews/${reviewId}`, {
        method: "DELETE",
      });
      return response;
    } catch (error) {
      this.handleApiError(error);
    }
  }

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
      const response = await this.makeRequest(
        `/jobs${queryParams ? `?${queryParams}` : ""}`
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch jobs: ${error.message}`);
    }
  }

  // Get all jobs categorized by priority levels (Immediate, High, Standard)
  async getAllJobsCategorizedByPriority(filters = {}) {
    try {
      // Remove undefined/null values
      const cleanFilters = Object.entries(filters).reduce(
        (acc, [key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            acc[key] = value;
          }
          return acc;
        },
        {}
      );

      const queryParams = new URLSearchParams(cleanFilters).toString();
      const response = await this.makeRequest(
        `/jobs/categorized/priority${queryParams ? `?${queryParams}` : ""}`
      );

      console.log("Categorized jobs response:", response);
      return response.data;
    } catch (error) {
      console.error("Error fetching categorized jobs:", error);
      throw new Error(`Failed to fetch categorized jobs: ${error.message}`);
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
        ...(status && { status }),
      }).toString();

      const response = await this.makeRequest(
        `/jobs/client/${clientId}?${queryParams}`
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch client jobs: ${error.message}`);
    }
  }

  // Get ongoing jobs by client ID (for ClientHome screen)
  async getOngoingJobsByClientId(clientId) {
    try {
      const response = await this.makeRequest(
        `/jobs/client/${clientId}/ongoing`
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch ongoing jobs: ${error.message}`);
    }
  }

  // Get jobs by freelancer ID
  async getJobsByFreelancerId(
    freelancerId,
    page = 1,
    limit = 10,
    status = null
  ) {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(status && { status }),
      }).toString();

      const response = await this.makeRequest(
        `/jobs/freelancer/${freelancerId}?${queryParams}`
      );
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
        ...filters,
      }).toString();

      const response = await this.makeRequest(
        `/jobs/status/${status}?${queryParams}`
      );
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
      return response; // Return full response to include wallet update info
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

  async getFreelancerConversations(freelancerId, page = 1, limit = 20) {
    const response = await this.makeRequest(
      `/messages/freelancer/conversations/${freelancerId}?page=${page}&limit=${limit}`
    );
    return response.data;
  }

  async getClientConversations(clientId, page = 1, limit = 20) {
    const response = await this.makeRequest(
      `/messages/client/conversations/${clientId}?page=${page}&limit=${limit}`
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
    if (category) queryParams.append("category", category);
    if (isActive !== undefined) queryParams.append("isActive", isActive);

    const response = await this.makeRequest(
      `/services?${queryParams.toString()}`
    );
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

      if (user.role === "FREELANCER") {
        try {
          profileData = await this.getFreelancerProfile(userId);
        } catch (error) {
          console.log("No freelancer profile found");
        }
      } else if (user.role === "CLIENT") {
        try {
          profileData = await this.getClientProfile(userId);
        } catch (error) {
          console.log("No client profile found");
        }
      }

      return {
        user,
        profile: profileData,
        // Merge user and profile data for easier access
        ...(profileData && { ...profileData }),
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      };
    } catch (error) {
      throw new Error(`Failed to fetch complete profile: ${error.message}`);
    }
  }

  // Update user availability status
  async updateUserAvailability(roleId, role, isAvailable) {
    try {
      if (role === "FREELANCER") {
        const freelancerProfile = await this.getFreelancerProfile(roleId);
        if (freelancerProfile) {
          return await this.updateFreelancerProfile(freelancerProfile.id, {
            currentlyAvailable: isAvailable,
          });
        }
      } else if (role === "CLIENT") {
        const clientProfile = await this.getClientProfile(roleId);
        if (clientProfile) {
          return await this.updateClientProfile(clientProfile.id, {
            currentlyAvailable: isAvailable,
          });
        }
      }

      throw new Error("No profile found to update");
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
  async uploadFile(fileUri, fileName, fileType = "image") {
    try {
      const formData = new FormData();
      formData.append("file", {
        uri: fileUri,
        name: fileName,
        type: `image/${fileType}`,
      });

      const response = await fetch(`${this.baseURL}/uploads`, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
          ...(this.token && { Authorization: `Bearer ${this.token}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const data = await response.json();
      return data.data.url; // Return the uploaded file URL
    } catch (error) {
      console.error("File upload error:", error);
      throw new Error(`File upload failed: ${error.message}`);
    }
  }

  // ==================== WALLET MANAGEMENT ====================

  // Get client wallet information
  async getClientWallet(userId) {
    try {
      const response = await this.makeRequest(`/clients/user/${userId}/wallet`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch wallet information: ${error.message}`);
    }
  }

  // Update client wallet balance
  async updateClientWallet(userId, amount, operation = "add") {
    try {
      const response = await this.makeRequest(
        `/clients/user/${userId}/wallet`,
        {
          method: "PUT",
          body: JSON.stringify({
            amount: parseFloat(amount),
            operation,
          }),
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update wallet: ${error.message}`);
    }
  }

  // Get client payment history
  async getClientPaymentHistory(userId, page = 1, limit = 20, status = null) {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(status && { status }),
      }).toString();

      const response = await this.makeRequest(
        `/clients/user/${userId}/payment-history?${queryParams}`
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch payment history: ${error.message}`);
    }
  }

  // Create payment record
  async createPaymentRecord(paymentData) {
    try {
      const response = await this.makeRequest("/payments", {
        method: "POST",
        body: JSON.stringify(paymentData),
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create payment record: ${error.message}`);
    }
  }

  // Update payment status
  async updatePaymentStatus(paymentId, status, transactionId = null) {
    try {
      const response = await this.makeRequest(`/payments/${paymentId}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status,
          ...(transactionId && { transactionId }),
        }),
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update payment status: ${error.message}`);
    }
  }

  // ==================== ENHANCED WALLET API ====================

  // Get current client wallet information (using auth token)
  async getClientWalletInfo() {
    try {
      const response = await this.makeRequest("/wallet/client/info");
      return response;
    } catch (error) {
      console.error("Wallet info fetch error:", error);
      throw new Error(`Failed to fetch client wallet info: ${error.message}`);
    }
  }

  // Get freelancer wallet information
  async getFreelancerWalletInfo() {
    try {
      const response = await this.makeRequest("/wallet/freelancer/info");
      return response;
    } catch (error) {
      throw new Error(
        `Failed to fetch freelancer wallet info: ${error.message}`
      );
    }
  }

  // Add money to client wallet
  async addMoneyToWallet(amount, paymentMethod = "online") {
    try {
      const response = await this.makeRequest("/wallet/client/deposit", {
        method: "POST",
        body: JSON.stringify({ amount, paymentMethod }),
      });
      return response;
    } catch (error) {
      throw new Error(`Failed to add money to wallet: ${error.message}`);
    }
  }

  // Request freelancer withdrawal
  async requestWithdrawal(amount, paymentDetails = {}) {
    try {
      const response = await this.makeRequest("/wallet/freelancer/withdraw", {
        method: "POST",
        body: JSON.stringify({ amount, paymentDetails }),
      });
      return response;
    } catch (error) {
      throw new Error(`Failed to request withdrawal: ${error.message}`);
    }
  }

  // Get client transaction history
  async getClientTransactionHistory(page = 1, limit = 20) {
    try {
      const response = await this.makeRequest(
        `/wallet/transactions?page=${page}&limit=${limit}&userType=CLIENT`
      );
      return response;
    } catch (error) {
      throw new Error(
        `Failed to fetch client transaction history: ${error.message}`
      );
    }
  }

  // Get freelancer transaction history
  async getFreelancerTransactionHistory(page = 1, limit = 20) {
    try {
      const response = await this.makeRequest(
        `/wallet/transactions?page=${page}&limit=${limit}&userType=FREELANCER`
      );
      return response;
    } catch (error) {
      throw new Error(
        `Failed to fetch freelancer transaction history: ${error.message}`
      );
    }
  }

  // Get transaction by ID
  async getTransactionById(transactionId) {
    try {
      const response = await this.makeRequest(
        `/wallet/transactions/${transactionId}`
      );
      return response;
    } catch (error) {
      throw new Error(`Failed to fetch transaction: ${error.message}`);
    }
  }

  // Get job payment status
  async getJobPaymentStatus(jobId) {
    try {
      const response = await this.makeRequest(
        `/wallet/jobs/${jobId}/payment-status`
      );
      return response;
    } catch (error) {
      throw new Error(`Failed to fetch job payment status: ${error.message}`);
    }
  }

  // Process job payment (for freelancers when completing jobs)
  async processJobPayment(jobId) {
    try {
      const response = await this.makeRequest(
        `/wallet/jobs/${jobId}/process-payment`,
        {
          method: "POST",
        }
      );
      return response;
    } catch (error) {
      throw new Error(`Failed to process job payment: ${error.message}`);
    }
  }

  // ==================== JOB BOOKMARKS ====================

  // Toggle job bookmark
  async toggleJobBookmark(jobId) {
    try {
      const response = await this.makeRequest(
        `/bookmarks/jobs/${jobId}/toggle`,
        {
          method: "POST",
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to toggle job bookmark: ${error.message}`);
    }
  }

  // Check if job is bookmarked
  async isJobBookmarked(jobId) {
    try {
      const response = await this.makeRequest(
        `/bookmarks/jobs/${jobId}/status`
      );
      return response.data.bookmarked;
    } catch (error) {
      throw new Error(`Failed to check bookmark status: ${error.message}`);
    }
  }

  // Get user's bookmarked jobs
  async getBookmarkedJobs(page = 1, limit = 10) {
    try {
      const response = await this.makeRequest(
        `/bookmarks/jobs?page=${page}&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get bookmarked jobs: ${error.message}`);
    }
  }

  // Add job bookmark
  async addJobBookmark(jobId) {
    try {
      const response = await this.makeRequest(`/bookmarks/jobs/${jobId}`, {
        method: "POST",
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to bookmark job: ${error.message}`);
    }
  }

  // Remove job bookmark
  async removeJobBookmark(jobId) {
    try {
      const response = await this.makeRequest(`/bookmarks/jobs/${jobId}`, {
        method: "DELETE",
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to remove bookmark: ${error.message}`);
    }
  }

  async getUserBankDetails() {
    try {
      const response = await this.makeRequest("/bank-details");
      return response;
    } catch (error) {
      throw new Error(`Failed to get bank details: ${error.message}`);
    }
  }

  async updateBankDetails(data) {
    try {
      const response = await this.makeRequest("/bank-details", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update bank details: ${error.message}`);
    }
  }

  async getOffersData() {
    try {
      const response = await this.makeRequest("/cashback-offers");
      return response;
    } catch (error) {
      throw new Error(`Failed to get offers data: ${error.message}`);
    }
  }

  async updateOfferData(data) {
    try {
      const response = await this.makeRequest("/cashback-offers", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update offer data: ${error.message}`);
    }
  }

  loadImageURI = (uri) => {
    if (!Boolean(uri)) {
      return null;
    } else if (uri.startsWith("http://") || uri.startsWith("https://")) {
      return uri; // Return remote URL as is
    } else if (uri.startsWith("/")) {
      return `${this.baseURL}${uri}`; // Convert relative path to absolute URL
    } else if (uri.startsWith("file://")) {
      // console.warn(
      //   "File is being loaded from local storage, ensure this is intended."
      // );
      return uri; // Handle other cases (e.g., local paths)
    } else {
      console.error("Invalid URI format:", uri);
      return null; // Return null for invalid URIs
    }
  };

  /**
   * Upload an image asset to the server
   * @param {{ file: File | Blob, name: string, size: number }} asset
   * @param {"client_profile_photos" | "freelancer_profile_photos" | "client_cover_photos" | "freelancer_cover_photos" | "freelancer_portfolios" | "job_portfolios"} category
   * @returns {Promise<{ success: true, url: string, filename: string } | { success: false, error: string }>}
   */
  async uploadImage(asset, category) {
    try {
      console.log({ asset });

      if (!asset?.uri) throw new Error("Invalid asset: no URI.");
      if (!CATEGORIES.includes(category)) throw new Error("Invalid category.");

      const formData = new FormData();
      formData.append("file", {
        uri: asset.uri,
        type: asset.mimeType || "image/jpeg",
        name: asset.fileName || "upload.jpg",
      });

      formData.append("category", category);

      const response = await fetch(
        `${this.baseURL}/upload?category=${category}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.token}`,
            Accept: "application/json",
            // ⚠️ DO NOT manually set 'Content-Type' for FormData — let fetch handle it
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Upload failed");
      }

      return {
        success: true,
        url: data.data?.url,
        filename: data.data?.filename,
      };
    } catch (err) {
      console.error("Upload Error:", err);
      return {
        success: false,
        error: err.message,
      };
    }
  }
}

// Create singleton instance
const apiService = new ApiService();

// Initialize on app start
apiService.init();

export default apiService;
