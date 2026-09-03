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
  Alert,
  Linking,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import apiService from "../lib/apiService";
import Toast from "react-native-toast-message";
import { resetToLogin } from "../lib/navigationRef";

const parseIdTokenFromUrl = (urlStr) => {
  if (!urlStr) return null;
  try {
    const hashIdx = urlStr.indexOf("#");
    const queryIdx = urlStr.indexOf("?");
    let paramsStr = "";
    if (hashIdx !== -1) {
      paramsStr = urlStr.substring(hashIdx + 1);
    } else if (queryIdx !== -1) {
      paramsStr = urlStr.substring(queryIdx + 1);
    }
    const parsed = new URLSearchParams(paramsStr);
    return parsed.get("id_token");
  } catch (e) {
    return null;
  }
};

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [userProfile, setUserProfile] = useState(null); // freelancer or client profile
  const [authToken, setAuthToken] = useState(null);
  const [roleSelectionVisible, setRoleSelectionVisible] = useState(false);
  const [roleOptions, setRoleOptions] = useState({
    freelancerData: null,
    clientData: null,
  });

  // Helper function to determine user role dynamically based on profiles
  const determineUserRole = useCallback((userData, preferredRole = null) => {
    if (!userData) return null;

    const hasFreelancerProfile = !!userData.freelancer;
    const hasClientProfile = !!userData.client;

    // Normalize preferredRole for comparison
    const normPreferred = preferredRole?.toUpperCase();

    // If user has preferred role and the profile exists, use it
    if (normPreferred === "FREELANCER" && hasFreelancerProfile) {
      return "FREELANCER";
    }
    if (normPreferred === "CLIENT" && hasClientProfile) {
      return "CLIENT";
    }

    // If no preferred role or preferred role doesn't exist, use fallback logic
    if (hasFreelancerProfile && hasClientProfile) {
      // User has both profiles, prefer the one from stored preference OR the database default
      return normPreferred || userData.role?.toUpperCase() || "FREELANCER";
    } else if (hasFreelancerProfile) {
      return "FREELANCER";
    } else if (hasClientProfile) {
      return "CLIENT";
    }

    return userData.role?.toUpperCase() || null; // No profiles found, return database role if available
  }, []);

  // Helper function to update role options based on user data
  const updateRoleOptions = useCallback((data) => {
    if (!data) return { freelancerData: null, clientData: null };

    const roleOptionsData = {
      freelancerData: null,
      clientData: null,
    };

    if (data.freelancer) {
      roleOptionsData.freelancerData = {
        ...data,
        role: "FREELANCER",
        profile: data.freelancer,
      };
    }

    if (data.client) {
      roleOptionsData.clientData = {
        ...data,
        role: "CLIENT",
        profile: data.client,
      };
    }

    setRoleOptions(roleOptionsData);
    return roleOptionsData;
  }, []);

  // Fetch user profile data (freelancer/client) from our backend
  const fetchUserProfile = useCallback(async (userId = user?.id, userRole) => {
    if (!userId) return null;
    try {
      // First, verify that the user exists in the database
      try {
        const userExists = await apiService.getUserById(userId);
        if (!userExists) {
          console.log("User not found in database, triggering logout");
          Toast.show({
            type: "error",
            text1: "Session Expired",
            text2: "Please log in again.",
          });
          await logout();
          return null;
        }
      } catch (error) {
        // If user is not found (404 or similar), logout the user
        if (
          error.message &&
          (error.message.includes("User not found") ||
            error.message.includes("404"))
        ) {
          console.log("User not found in database, triggering logout");
          await logout();
          return null;
        }
        // For other errors, continue with the normal flow
        console.warn("Error checking user existence:", error.message);
      }

      let profileData = null;

      if (userRole === "FREELANCER") {
        try {
          profileData = await apiService.getFreelancerProfile(userId);
        } catch (error) {
          console.log("No freelancer profile found for user");
        }
      } else if (userRole === "CLIENT") {
        try {
          profileData = await apiService.getClientProfile(userId);
        } catch (error) {
          console.log("No client profile found for user");
        }
      }

      // Always set userProfile, even if it's null
      setUserProfile(profileData);

      if (profileData) {
        await AsyncStorage.setItem("userProfile", JSON.stringify(profileData));
      } else {
        // Remove stored profile if none exists
        await AsyncStorage.removeItem("userProfile");
      }

      return profileData;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      // Explicitly set to null on error
      setUserProfile(null);
      return null;
    }
  }, [user?.id, logout]);

  // Check if user is already logged in
  const checkUserSession = async () => {
    try {
      setLoading(true);

      const [storedUserData, storedUserProfile, storedAuthToken] =
        await Promise.all([
          AsyncStorage.getItem("userData"),
          AsyncStorage.getItem("userProfile"),
          AsyncStorage.getItem("authToken"),
        ]);

      // Half-session: profile cached but JWT missing — force a clean login
      if (storedUserData && !storedAuthToken) {
        console.warn("Session missing auth token; clearing stale session");
        await AsyncStorage.multiRemove(["userData", "userProfile", "authToken"]);
        await apiService.setAuthToken(null);
        setUser(null);
        setUserData(null);
        setUserProfile(null);
        setAuthToken(null);
        setLoading(false);
        return;
      }

      if (storedUserData && storedAuthToken) {
        const cachedUserData = JSON.parse(storedUserData);
        const cachedProfile = storedUserProfile
          ? JSON.parse(storedUserProfile)
          : null;

        // Keep ApiService token in sync with storage (critical for authenticated calls)
        await apiService.setAuthToken(storedAuthToken);

        setUser(cachedUserData);
        setUserData(cachedUserData);
        setUserProfile(cachedProfile);
        setAuthToken(storedAuthToken);
        updateRoleOptions(cachedUserData);
        setLoading(false);

        try {
          const freshUserData = await apiService.getUserById(cachedUserData.id);
          if (!freshUserData) throw new Error("User not found");

          const preferredRole = cachedUserData.role;
          const dynamicRole = determineUserRole(freshUserData, preferredRole);
          const updatedUserData = {
            ...freshUserData,
            role: dynamicRole || preferredRole,
          };

          let profileData = cachedProfile;
          if (dynamicRole === "FREELANCER" && freshUserData.freelancer) {
            profileData = freshUserData.freelancer;
          } else if (dynamicRole === "CLIENT" && freshUserData.client) {
            profileData = freshUserData.client;
          }

          setUser(updatedUserData);
          setUserData(updatedUserData);
          setUserProfile(profileData);
          updateRoleOptions(freshUserData);

          await AsyncStorage.setItem("userData", JSON.stringify(updatedUserData));
          if (profileData) {
            await AsyncStorage.setItem("userProfile", JSON.stringify(profileData));
          } else {
            await AsyncStorage.removeItem("userProfile");
          }

          console.log(`Session restored with role: ${updatedUserData.role}`);
        } catch (error) {
          if (error?.isAuthError) {
            // Token rejected — unauthorized handler already clears session
            return;
          }
          if (
            error.message &&
            (error.message.includes("User not found") ||
              error.message.includes("404"))
          ) {
            console.log(
              "Stored user not found in database during session check, clearing session"
            );
            await AsyncStorage.multiRemove([
              "userData",
              "userProfile",
              "authToken",
            ]);
            await apiService.setAuthToken(null);
            setUser(null);
            setUserData(null);
            setUserProfile(null);
            setAuthToken(null);
            return;
          }
          console.warn(
            "Using cached session; background refresh failed:",
            error.message
          );
        }
      } else {
        await apiService.setAuthToken(null);
        setUser(null);
        setUserData(null);
        setUserProfile(null);
        setAuthToken(null);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error checking user session :", error);
      await AsyncStorage.multiRemove(["userData", "userProfile", "authToken"]);
      await apiService.setAuthToken(null);
      setUser(null);
      setUserData(null);
      setUserProfile(null);
      setAuthToken(null);
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
        if (loginResponse.token) {
          setAuthToken(loginResponse.token);
        }

        // Check for both freelancer and client profiles (using embedded profiles first)
        let freelancerProfile = (loginResponse.freelancer && loginResponse.freelancer.id) ? loginResponse.freelancer : null;
        let clientProfile = (loginResponse.client && loginResponse.client.id) ? loginResponse.client : null;

        if (!freelancerProfile) {
          try {
            const fetchedFreelancer = await apiService.getFreelancerProfile(
              loginResponse.id
            );
            if (fetchedFreelancer && fetchedFreelancer.id) {
              freelancerProfile = fetchedFreelancer;
            }
          } catch (error) {
            console.log("No freelancer profile found");
          }
        }

        if (!clientProfile) {
          try {
            const fetchedClient = await apiService.getClientProfile(loginResponse.id);
            if (fetchedClient && fetchedClient.id) {
              clientProfile = fetchedClient;
            }
          } catch (error) {
            console.log("No client profile found");
          }
        }

        // Create a complete user data object with profiles
        const completeUserData = {
          ...loginResponse,
          freelancer: freelancerProfile,
          client: clientProfile,
        };

        // Handle dual-role scenario
        if (freelancerProfile && clientProfile) {
          // User has both roles, show selection modal
          updateRoleOptions(completeUserData);
          setRoleSelectionVisible(true);

          // Store user data but don't set userData yet (wait for role selection)
          await AsyncStorage.setItem(
            "userData",
            JSON.stringify(completeUserData)
          );
          return loginResponse;
        } else if (freelancerProfile) {
          // Only freelancer profile
          const role = determineUserRole(completeUserData, "FREELANCER");
          const userData = { ...completeUserData, role };
          setUserData(userData);
          setUserProfile(freelancerProfile);
          await AsyncStorage.setItem("userData", JSON.stringify(userData));
          await AsyncStorage.setItem(
            "userProfile",
            JSON.stringify(freelancerProfile)
          );
        } else if (clientProfile) {
          // Only client profile
          const role = determineUserRole(completeUserData, "CLIENT");
          const userData = { ...completeUserData, role };
          setUserData(userData);
          setUserProfile(clientProfile);
          await AsyncStorage.setItem("userData", JSON.stringify(userData));
          await AsyncStorage.setItem(
            "userProfile",
            JSON.stringify(clientProfile)
          );
        } else {
          // No profile found, set basic user data without role
          setUserData(completeUserData);
          setUserProfile(null);
          await AsyncStorage.setItem(
            "userData",
            JSON.stringify(completeUserData)
          );
        }

        return loginResponse;
      }
    } catch (error) {
      console.error("Login error:", error);
      throw new Error(error.message || "Login failed. Please try again.");
    }
  };

  // Google Login function
  const googleLogin = async () => {
    try {
      const clientId =
        process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
        "750433749399-vuco9j5gh6t7rii1cmpt1avbsjgq2fi3.apps.googleusercontent.com";

      const appRedirectScheme = "birdearner://google-auth";
      const apiBaseUrl = apiService.getBaseUrl();
      const backendCallbackUrl = apiBaseUrl.replace(/\/api$/, "") + "/api/auth/google/callback";

      const authUrl =
        "https://accounts.google.com/o/oauth2/v2/auth?" +
        new URLSearchParams({
          client_id: clientId,
          redirect_uri: backendCallbackUrl,
          response_type: "code",
          scope: "openid email profile",
          access_type: "offline",
          prompt: "consent",
          state: backendCallbackUrl,
        }).toString();

      console.log("[Google OAuth] clientId:", clientId);
      console.log("[Google OAuth] callbackUrl:", backendCallbackUrl);
      console.log("[Google OAuth] authUrl:", authUrl);

      const userData = await new Promise(async (resolve, reject) => {
        let subscription = null;
        const timeout = setTimeout(() => {
          if (subscription) subscription.remove();
          reject(new Error("Google sign-in timed out. Please try again."));
        }, 120000);

        const handleUrl = ({ url }) => {
          if (url && url.startsWith("birdearner://google-auth")) {
            clearTimeout(timeout);
            if (subscription) subscription.remove();
            try {
              const parsedUrl = new URL(url);
              const dataParam = parsedUrl.searchParams.get("data");
              const errorParam = parsedUrl.searchParams.get("error");

              if (errorParam) {
                reject(new Error("Google sign-in failed: " + decodeURIComponent(errorParam)));
                return;
              }

              if (dataParam) {
                resolve(JSON.parse(decodeURIComponent(dataParam)));
              } else {
                reject(new Error("No user data received from Google sign-in"));
              }
            } catch (e) {
              reject(new Error("Failed to parse Google sign-in response"));
            }
          }
        };

        try {
          subscription = Linking.addEventListener("url", handleUrl);

          const initialUrl = await Linking.getInitialURL().catch(() => null);
          if (initialUrl && initialUrl.startsWith("birdearner://google-auth")) {
            try {
              const parsedUrl = new URL(initialUrl);
              const dataParam = parsedUrl.searchParams.get("data");
              const errorParam = parsedUrl.searchParams.get("error");

              if (errorParam) {
                clearTimeout(timeout);
                if (subscription) subscription.remove();
                reject(new Error("Google sign-in failed: " + decodeURIComponent(errorParam)));
                return;
              }

              if (dataParam) {
                clearTimeout(timeout);
                if (subscription) subscription.remove();
                resolve(JSON.parse(decodeURIComponent(dataParam)));
                return;
              }
            } catch (e) {}
          }

          await Linking.openURL(authUrl);
        } catch (err) {
          clearTimeout(timeout);
          if (subscription) subscription.remove();
          reject(err);
        }
      });

      if (!userData || !userData.token) {
        throw new Error("Google sign-in completed but no user data was returned.");
      }

      await apiService.setAuthToken(userData.token);
      await AsyncStorage.setItem("authToken", userData.token);

      const response = userData;

      if (response) {
        setUser(response);
        if (response.token) {
          setAuthToken(response.token);
        }

        let freelancerProfile = (response.freelancer && response.freelancer.id) ? response.freelancer : null;
        let clientProfile = (response.client && response.client.id) ? response.client : null;

        if (!freelancerProfile) {
          try {
            const fetchedFreelancer = await apiService.getFreelancerProfile(response.id);
            if (fetchedFreelancer && fetchedFreelancer.id) {
              freelancerProfile = fetchedFreelancer;
            }
          } catch (error) {
            console.log("No freelancer profile found");
          }
        }

        if (!clientProfile) {
          try {
            const fetchedClient = await apiService.getClientProfile(response.id);
            if (fetchedClient && fetchedClient.id) {
              clientProfile = fetchedClient;
            }
          } catch (error) {
            console.log("No client profile found");
          }
        }

        const completeUserData = {
          ...response,
          freelancer: freelancerProfile,
          client: clientProfile,
        };

        if (freelancerProfile && clientProfile) {
          updateRoleOptions(completeUserData);
          setRoleSelectionVisible(true);
          await AsyncStorage.setItem("userData", JSON.stringify(completeUserData));
          return response;
        } else if (freelancerProfile) {
          const role = determineUserRole(completeUserData, "FREELANCER");
          const userDataStored = { ...completeUserData, role };
          setUserData(userDataStored);
          setUserProfile(freelancerProfile);
          await AsyncStorage.setItem("userData", JSON.stringify(userDataStored));
          await AsyncStorage.setItem("userProfile", JSON.stringify(freelancerProfile));
        } else if (clientProfile) {
          const role = determineUserRole(completeUserData, "CLIENT");
          const userDataStored = { ...completeUserData, role };
          setUserData(userDataStored);
          setUserProfile(clientProfile);
          await AsyncStorage.setItem("userData", JSON.stringify(userDataStored));
          await AsyncStorage.setItem("userProfile", JSON.stringify(clientProfile));
        } else {
          setUserData(completeUserData);
          setUserProfile(null);
          await AsyncStorage.setItem("userData", JSON.stringify(completeUserData));
        }

        return response;
      }
    } catch (error) {
      console.error("Google login error:", error);
      throw new Error(error.message || "Google login failed. Please try again.");
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      console.log("Starting registration with data:", userData);
      let registrationResponse;

      // Use specific signup endpoints based on role
      if (userData.role === "FREELANCER") {
        registrationResponse = await apiService.signupFreelancer(userData);
      } else if (userData.role === "CLIENT") {
        registrationResponse = await apiService.signupClient(userData);
      } else {
        // Fallback to generic register for backward compatibility
        registrationResponse = await apiService.register(userData);
      }

      console.log("Registration response:", registrationResponse);

      if (
        registrationResponse &&
        registrationResponse.success &&
        registrationResponse.data
      ) {
        console.log(
          "Registration successful, user authenticated automatically"
        );
        const authenticatedUser = registrationResponse.data;

        console.log("Setting user state with:", authenticatedUser);

        // Keep in-memory/session token in sync immediately after signup
        if (authenticatedUser.token) {
          setAuthToken(authenticatedUser.token);
        }

        // Normalize role/profile shape the same way login/session restore does
        const normalizedRole = determineUserRole(
          authenticatedUser,
          authenticatedUser.role || userData.role
        );
        const completeUserData = {
          ...authenticatedUser,
          role: normalizedRole || authenticatedUser.role || userData.role,
        };

        // Set states with the authenticated user data
        setUser(completeUserData);
        setUserData(completeUserData);

        // Extract profile data from the response
        let profileData = null;
        if (
          completeUserData.role === "FREELANCER" &&
          authenticatedUser.freelancer
        ) {
          profileData = authenticatedUser.freelancer;
          console.log("Found freelancer profile:", profileData);
        } else if (
          completeUserData.role === "CLIENT" &&
          authenticatedUser.client
        ) {
          profileData = authenticatedUser.client;
          console.log("Found client profile:", profileData);
        }

        if (profileData) {
          setUserProfile(profileData);
          await AsyncStorage.setItem(
            "userProfile",
            JSON.stringify(profileData)
          );
          console.log("Stored user profile in AsyncStorage");
        }

        // Store user data
        await AsyncStorage.setItem(
          "userData",
          JSON.stringify(completeUserData)
        );

        console.log("Registration and authentication completed successfully");
        console.log(
          "Final user state - user:",
          !!authenticatedUser,
          "userData:",
          !!authenticatedUser,
          "userProfile:",
          !!profileData
        );

        return authenticatedUser;
      } else {
        console.log("Registration was not successful:", registrationResponse);
        throw new Error("Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      throw new Error(
        error.message || "Registration failed. Please try again."
      );
    }
  };

  // Logout function
  const logout = useCallback(async () => {
    try {
      await apiService.logout();
      setUser(null);
      setUserData(null);
      setUserProfile(null);
      setAuthToken(null);
      setRoleOptions({ freelancerData: null, clientData: null });
    } catch (error) {
      console.error("Logout error:", error);
      // Force logout even if API call fails
      await AsyncStorage.multiRemove(["userData", "userProfile", "authToken"]);
      setUser(null);
      setUserData(null);
      setUserProfile(null);
      setAuthToken(null);
    }
  }, []);

  // When JWT expires / API returns 401, clear session and prompt re-login
  useEffect(() => {
    apiService.setUnauthorizedHandler(async () => {
      Toast.show({
        type: "error",
        text1: "Session expired",
        text2: "Please log in again to continue.",
        visibilityTime: 3500,
      });

      setUser(null);
      setUserData(null);
      setUserProfile(null);
      setAuthToken(null);
      setRoleOptions({ freelancerData: null, clientData: null });

      // Wait for guest navigator to mount, then land on Login
      setTimeout(() => {
        resetToLogin();
      }, 150);
    });

    return () => {
      apiService.setUnauthorizedHandler(null);
    };
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

      const freelancerProfile = await apiService.createFreelancerProfile(
        profileData
      );

      if (freelancerProfile) {
        setUserProfile(freelancerProfile);
        await AsyncStorage.setItem(
          "userProfile",
          JSON.stringify(freelancerProfile)
        );
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
        await AsyncStorage.setItem(
          "userProfile",
          JSON.stringify(clientProfile)
        );
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

      if (user.role === "FREELANCER") {
        updatedProfile = await apiService.updateFreelancerProfile(
          userProfile.id,
          updateData
        );
      } else if (user.role === "CLIENT") {
        updatedProfile = await apiService.updateClientProfile(
          userProfile.id,
          updateData
        );
      }

      if (updatedProfile) {
        setUserProfile(updatedProfile);
        await AsyncStorage.setItem(
          "userProfile",
          JSON.stringify(updatedProfile)
        );
        return updatedProfile;
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      throw new Error(error.message || "Failed to update profile");
    }
  };

  // Role selection modal handlers
  const selectRole = useCallback(async (selectedRole) => {
    try {
      if (selectedRole === "FREELANCER" && roleOptions.freelancerData) {
        const userData = roleOptions.freelancerData;
        const profileData = userData.profile;

        setUserData(userData);
        setUserProfile(profileData);

        // Store the selected role data
        await AsyncStorage.setItem("userData", JSON.stringify(userData));
        await AsyncStorage.setItem("userProfile", JSON.stringify(profileData));
      } else if (selectedRole === "CLIENT" && roleOptions.clientData) {
        const userData = roleOptions.clientData;
        const profileData = userData.profile;

        setUserData(userData);
        setUserProfile(profileData);

        // Store the selected role data
        await AsyncStorage.setItem("userData", JSON.stringify(userData));
        await AsyncStorage.setItem("userProfile", JSON.stringify(profileData));
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
  }, [roleOptions]);

  // Role switching functionality for users with multiple roles
  const updateUserRole = async (newRole) => {
    try {
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Create updated user data with new role
      const updatedUserData = { ...userData, role: newRole };

      // Update local state first
      setUserData(updatedUserData);
      await AsyncStorage.setItem("userData", JSON.stringify(updatedUserData));

      // Fetch the corresponding profile
      await fetchUserProfile(user.id, newRole);

      // Optional: Update backend if needed (commented out to prevent conflicts)
      // const updatedUser = await apiService.updateUser(user.id, { role: newRole });

      console.log(`Role successfully switched to: ${newRole}`);
      return updatedUserData;
    } catch (error) {
      console.error("Error updating user role:", error);
      throw new Error(error.message || "Failed to update user role");
    }
  };

  // Function to switch role for dual-role users without backend sync
  const switchUserRole = async (newRole) => {
    try {
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Validate that the user has the requested role
      const freshUserData = await apiService.getUserById(user.id);
      const hasRequestedRole =
        (newRole === "FREELANCER" && freshUserData.freelancer) ||
        (newRole === "CLIENT" && freshUserData.client);

      if (!hasRequestedRole) {
        throw new Error(`User does not have ${newRole} profile`);
      }

      // Create updated user data with new role using dynamic determination
      const dynamicRole = determineUserRole(freshUserData, newRole);
      const updatedUserData = { ...freshUserData, role: dynamicRole };

      // Update local state
      setUserData(updatedUserData);
      setUser(updatedUserData);

      // Set the appropriate profile
      let profileData = null;
      if (dynamicRole === "FREELANCER" && freshUserData.freelancer) {
        profileData = freshUserData.freelancer;
      } else if (dynamicRole === "CLIENT" && freshUserData.client) {
        profileData = freshUserData.client;
      }

      if (profileData) {
        setUserProfile(profileData);
        await AsyncStorage.setItem("userProfile", JSON.stringify(profileData));
      }

      // Persist the role change
      await AsyncStorage.setItem("userData", JSON.stringify(updatedUserData));

      console.log(`Role successfully switched to: ${dynamicRole}`);
      return updatedUserData;
    } catch (error) {
      console.error("Error switching user role:", error);
      throw new Error(error.message || "Failed to switch user role");
    }
  };

  // Refresh user data
  const refreshUserData = useCallback(async () => {
    if (user) {
      try {
        // Fetch fresh user data from backend
        const freshUserData = await apiService.getUserById(user.id);

        if (freshUserData) {
          // Preserve the currently selected role from local state, or determine dynamically
          // Prioritize current local role if it exists to avoid auto-switching
          const currentRole = userData?.role || user?.role;
          const dynamicRole = determineUserRole(freshUserData, currentRole);

          const updatedUserData = {
            ...freshUserData,
            role: dynamicRole || currentRole, // Preserve current role if no profiles found
          };

          // Only update user data if there are meaningful changes
          if (JSON.stringify(userData) !== JSON.stringify(updatedUserData)) {
            setUserData(updatedUserData);
          }

          // Extract profile data from the response
          let profileData = null;

          // Set profile based on determined role
          if (dynamicRole === "FREELANCER" && freshUserData.freelancer) {
            profileData = freshUserData.freelancer;
          } else if (dynamicRole === "CLIENT" && freshUserData.client) {
            profileData = freshUserData.client;
          }

          if (
            profileData &&
            JSON.stringify(userProfile) !== JSON.stringify(profileData)
          ) {
            setUserProfile(profileData);
            await AsyncStorage.setItem(
              "userProfile",
              JSON.stringify(profileData)
            );
          }

          updateRoleOptions(freshUserData);

          // Update stored user data with preserved role only if it's different
          if (JSON.stringify(userData) !== JSON.stringify(updatedUserData)) {
            await AsyncStorage.setItem(
              "userData",
              JSON.stringify(updatedUserData)
            );
          }

          console.log(
            `User data refreshed, current role: ${dynamicRole || currentRole}`
          );
        }
      } catch (error) {
        console.error("Error refreshing user data:", error);

        // If user is not found in database, logout automatically
        if (
          error.message &&
          (error.message.includes("User not found") ||
            error.message.includes("404"))
        ) {
          console.log("User not found during refresh, triggering logout");
          await logout();
        }
      }
    }
  }, [user, userData, userProfile, logout, determineUserRole, updateRoleOptions]);

  const handleRoleSelection = async (roleData) => {
    try {
      console.log("Handling role selection:", roleData);

      setUserData(roleData);
      setUserProfile(roleData.profile);
      setUser(roleData); // Also update the user state
      setRoleSelectionVisible(false);

      // Persist the role selection to AsyncStorage
      await AsyncStorage.setItem("userData", JSON.stringify(roleData));
      if (roleData.profile) {
        await AsyncStorage.setItem(
          "userProfile",
          JSON.stringify(roleData.profile)
        );
      }

      console.log(`Role successfully switched to: ${roleData.role}`);
    } catch (error) {
      console.error("Error handling role selection:", error);
      Alert.alert("Error", "Failed to switch role. Please try again.");
    }
  };

  // Validate if current user still exists in database
  const validateUserExists = async () => {
    if (!user) return false;

    try {
      const userExists = await apiService.getUserById(user.id);
      return !!userExists;
    } catch (error) {
      if (
        error.message &&
        (error.message.includes("User not found") ||
          error.message.includes("404"))
      ) {
        console.log(
          "User validation failed: user not found, triggering logout"
        );
        await logout();
        return false;
      }
      // For other errors, assume user exists to avoid unnecessary logouts
      console.warn("Error validating user existence:", error.message);
      return true;
    }
  };

  const value = React.useMemo(() => ({
    user,
    userData,
    userProfile,
    authToken,
    loading,
    login,
    googleLogin,
    register,
    logout,
    createFreelancerProfile,
    createClientProfile,
    updateUserProfile,
    updateUserRole,
    switchUserRole,
    refreshUserData,
    checkUserSession,
    fetchUserProfile,
    validateUserExists,
    selectRole,
    roleOptions,
    roleSelectionVisible,
    handleRoleSelection,
  }), [
    user,
    userData,
    userProfile,
    authToken,
    loading,
    login,
    googleLogin,
    register,
    logout,
    createFreelancerProfile,
    createClientProfile,
    updateUserProfile,
    updateUserRole,
    switchUserRole,
    refreshUserData,
    checkUserSession,
    fetchUserProfile,
    validateUserExists,
    selectRole,
    roleOptions,
    roleSelectionVisible,
    handleRoleSelection,
  ]);

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
              onPress={() => selectRole("FREELANCER")}
            >
              <Text style={styles.buttonText}>Freelancer</Text>
            </TouchableOpacity>
          )}

          {roleOptions.clientData && (
            <TouchableOpacity
              style={[styles.button, styles.clientButton]}
              onPress={() => selectRole("CLIENT")}
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
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

const styles = StyleSheet.create({
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
