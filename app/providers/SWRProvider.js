import React from 'react';
import { SWRConfig } from 'swr';
import ApiService from '../lib/apiService';

// Global SWR configuration
const swrConfig = {
  // Global fetcher function
  fetcher: async (url, options = {}) => {
    const api = ApiService;
    await api.init();
    
    if (options.method && options.method !== 'GET') {
      return api.makeRequest(url, options);
    }
    
    const response = await api.makeRequest(url);
    return response.data;
  },
  
  // Global options
  refreshInterval: 0, // Disable global refresh (we'll set per-hook)
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  shouldRetryOnError: true,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  dedupingInterval: 2000,
  
  // Global error handler
  onError: (error, key) => {
    console.error('SWR Error:', error, 'Key:', key);
    
    // Don't show toast for auth errors (handled by ApiService)
    if (error.message?.includes('unauthorized') || error.message?.includes('authentication')) {
      return;
    }
  },
  
  // Global loading handler
  onLoadingSlow: (key) => {
    console.log('SWR Loading slowly for key:', key);
  },
  
  // Global success handler
  onSuccess: (data, key) => {
    console.log('SWR Success for key:', key);
  },
};

export const SWRProvider = ({ children }) => {
  return (
    <SWRConfig value={swrConfig}>
      {children}
    </SWRConfig>
  );
};

export default SWRProvider;