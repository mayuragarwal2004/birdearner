// AppwriteProvider.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { ID, Account, Client, Databases, Storage } from 'react-native-appwrite';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CONFIG_STORAGE_KEY = 'appwriteConfig';

const AppwriteContext = createContext(null);

export const useAppwrite = () => useContext(AppwriteContext);

export const AppwriteProvider = ({ children }) => {
  const [client, setClient] = useState(null);
  const [account, setAccount] = useState(null);
  const [databases, setDatabases] = useState(null);
  const [storage, setStorage] = useState(null);
  const [appwriteConfig, setAppwriteConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAppwriteConfigFromServer = async () => {
    const response = await fetch('https://api.birdearner.com/credentials');
    if (!response.ok) {
      throw new Error(`Failed to fetch config: ${response.statusText}`);
    }
    const data = await response.json();
    let { expiration, ...config } = data;

    if (!expiration) {
      const now = new Date();
      expiration = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    }

    await AsyncStorage.setItem(
      CONFIG_STORAGE_KEY,
      JSON.stringify({ ...config, expiration })
    );

    return { config, expiration };
  };

  const getAppwriteConfig = async () => {
    const storedData = await AsyncStorage.getItem(CONFIG_STORAGE_KEY);
    if (storedData) {
      const { expiration, ...config } = JSON.parse(storedData);
      if (new Date(expiration) > new Date()) {
        return { config, expiration };
      }
    }
    return await fetchAppwriteConfigFromServer();
  };

  const initAppwrite = async () => {
    try {
      const { config } = await getAppwriteConfig();
      setAppwriteConfig(config);

      const clientInstance = new Client()
        .setEndpoint(config.endpoint)
        .setProject(config.projectId)
        .setPlatform('*');

      const accountInstance = new Account(clientInstance);
      const databasesInstance = new Databases(clientInstance);
      const storageInstance = new Storage(clientInstance);

      setClient(clientInstance);
      setAccount(accountInstance);
      setDatabases(databasesInstance);
      setStorage(storageInstance);
    } catch (err) {
      console.error('Appwrite init error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {

    initAppwrite();
  }, []);

  const uploadFile = async (file, type = 'application/octet-stream') => {
    if (!storage || !file || !file.uri) return;

    const fileData = {
      name: file.name || file.fileName || `file_${ID.unique()}`,
      type: file.mimeType || file.type || 'application/octet-stream',
      size: file.size || file.fileSize || 0,
      uri: file.uri,
    };

    if (fileData.name.toLowerCase().endsWith('jpeg')) {
      fileData.name = `${fileData.name.split('.')[0]}.jpg`;
    }

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
  };

  const getFileURL = async (fileId, mimeType) => {
    try {
      let fileUrl;
      if (mimeType.startsWith('image')) {
        fileUrl = storage.getFilePreview(appwriteConfig.bucketId, fileId);
      } else {
        fileUrl = storage.getFileView(appwriteConfig.bucketId, fileId);
      }

      if (!fileUrl) throw new Error('Failed to retrieve file URL');
      return fileUrl;
    } catch (error) {
      throw new Error(error);
    }
  };

  if (loading) return null; // or a splash screen/loading indicator

  return (
    <AppwriteContext.Provider
      value={{ client, account, databases, storage, appwriteConfig, uploadFile, getFileURL, initAppwrite }}
    >
      {children}
    </AppwriteContext.Provider>
  );
};
