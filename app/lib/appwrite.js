import { ID, Account, Client, Databases, Storage } from "react-native-appwrite";
import AsyncStorage from "@react-native-async-storage/async-storage"; // For React Native. Use localStorage for web.

export let appwriteConfig = {};
const client = new Client();
export let account;
export let databases;
export let storage;

const CONFIG_STORAGE_KEY = "appwriteConfig";

async function fetchAppwriteConfigFromServer() {
  try {
    const response = await fetch("https://api.birdearner.com/credentials");
    if (!response.ok) {
      throw new Error(`Failed to fetch config: ${response.statusText}`);
    }

    const data = await response.json();
    let { expiration, ...config } = data;

    // If expiration is missing, set it to 1 day from now
    if (!expiration) {
      const now = new Date();
      expiration = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(); // Add 24 hours
    }

    // Save to local storage
    await AsyncStorage.setItem(
      CONFIG_STORAGE_KEY,
      JSON.stringify({ ...config, expiration })
    );

    return { config, expiration };
  } catch (error) {
    console.error("Error fetching Appwrite configuration:", error.message);
    throw error;
  }
}


async function getAppwriteConfig() {
  try {
    // Check local storage for configuration
    const storedData = await AsyncStorage.getItem(CONFIG_STORAGE_KEY);
    if (storedData) {
      const { expiration, ...config } = JSON.parse(storedData);

      // Check if the stored configuration is still valid
      if (new Date(expiration) > new Date()) {
        return { config, expiration };
      }
    }

    // If expired or not found, fetch new configuration
    return await fetchAppwriteConfigFromServer();
  } catch (error) {
    console.error("Error retrieving Appwrite configuration:", error.message);
    throw error;
  }
}

async function initializeAppwrite() {
  try {
    const { config } = await getAppwriteConfig();
    appwriteConfig = config;

    // Initialize Appwrite services with the fetched configuration
    client
      .setEndpoint(appwriteConfig.endpoint)
      .setProject(appwriteConfig.projectId)
      .setPlatform("*");

    account = new Account(client);
    databases = new Databases(client);
    storage = new Storage(client);
  } catch (error) {
    console.error("App initialization failed:", error.message);
    throw error;
  }
}

// Call the initializeAppwrite function during app initialization
initializeAppwrite().catch((err) => {
  console.error("Failed to initialize Appwrite:", err);
});

// Exported functions remain unchanged
export async function uploadFile(file, type = "application/octet-stream") {
  if (!file || !file.uri) return;

  const fileData = {
    name: file.name || file.fileName || `file_${ID.unique()}`,
    type: file.mimeType || file.type || "application/octet-stream",
    size: file.size || file.fileSize || 0,
    uri: file.uri,
  };

  if (fileData.name.toLowerCase().endsWith("jpeg"))
    fileData.name = `${fileData.name.split(".")[0]}.jpg`;

  try {
    const uniqueID = ID.unique();
    const uploadedFile = await storage.createFile(
      appwriteConfig.bucketId,
      uniqueID,
      fileData
    );

    const fileUrl = await getFileURL(uniqueID, fileData.type);
    return fileUrl;
  } catch (error) {
    throw new Error(error);
  }
}

export async function getFileURL(fileId, mimeType) {
  try {
    let fileUrl;
    if (mimeType.startsWith("image")) {
      fileUrl = storage.getFilePreview(appwriteConfig.bucketId, fileId);
    } else {
      fileUrl = storage.getFileView(appwriteConfig.bucketId, fileId);
    }

    if (!fileUrl) throw new Error("Failed to retrieve file URL");
    return fileUrl;
  } catch (error) {
    throw new Error(error);
  }
}
