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
import { useAppwrite } from "./AppwriteContext";
import { Query } from "react-native-appwrite";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [roleSelectionVisible, setRoleSelectionVisible] = useState(false);
  const [roleOptions, setRoleOptions] = useState({
    freelancerData: null,
    clientData: null,
  });
  const { account, appwriteConfig, databases } = useAppwrite();

  const fetchUserData = async (email) => {
    try {
      const [freelancerResponse, clientResponse] = await Promise.all([
        databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.freelancerCollectionId,
          [Query.equal("email", email)]
        ),
        databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.clientCollectionId,
          [Query.equal("email", email)]
        ),
      ]);

      const freelancerData = freelancerResponse.documents[0] || null;
      const clientData = clientResponse.documents[0] || null;

      if (freelancerData && clientData) {
        // Open modal for role selection
        setRoleOptions({ freelancerData, clientData });
        setRoleSelectionVisible(true);
      } else if (freelancerData) {
        setRoleOptions({ freelancerData, clientData: null });
        setUserData(freelancerData);
      } else if (clientData) {
        setRoleOptions({ freelancerData: null, clientData });
        setUserData(clientData);
      }
    } catch (error) {
      throw new Error("Error fetching user data");
    }
  };

  const checkUserSession = async () => {
    try {
      const currentUser = await account.get();
      setUser(currentUser);
      await fetchUserData(currentUser.email);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Check if the user is already logged in
  useEffect(() => {
    checkUserSession();
  }, []);

  const login = async (email, password) => {
    try {
      await account.createEmailPasswordSession(email, password);
      const currentUser = await account.get();

      setUser(currentUser);

      await fetchUserData(currentUser.email);
    } catch (error) {
      console.log(error);

      throw new Error("Invalid email or password. Please try again.");
    }
  };

  const logout = useCallback(async () => {
    try {
      await account.deleteSession("current");
      setUser(null);
      setUserData(null);
      setRoleOptions({ freelancerData: null, clientData: null });
    } catch (error) {
      throw new Error("Logout failed");
    }
  }, []);

  // Handle role selection
  const handleRoleSelection = (roleData) => {
    setUserData(roleData);
    setRoleSelectionVisible(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        roleOptions,
        login,
        logout,
        loading,
        handleRoleSelection,
        setUser,
        fetchUserData,
        setUserData,
        checkUserSession,
      }}
    >
      {children}
      <Modal
        visible={roleSelectionVisible}
        animationType="slide"
        transparent={false}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Select Role</Text>
          <Text style={styles.modalText}>
            Multiple accounts found for your email. Please choose a role to
            continue:
          </Text>
          <TouchableOpacity
            style={[styles.button, styles.freelancerButton]}
            onPress={() => handleRoleSelection(roleOptions.freelancerData)}
          >
            <Text style={styles.buttonText}>Freelancer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.clientButton]}
            onPress={() => handleRoleSelection(roleOptions.clientData)}
          >
            <Text style={styles.buttonText}>Client</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

// Styles
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
  modalText: {
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
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
});
