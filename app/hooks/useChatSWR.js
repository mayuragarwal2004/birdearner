import useSWR from 'swr';
import { useCallback } from 'react';
import ApiService from '../lib/apiService';
import { useAuth } from '../context/NewAuthContext';
import Toast from 'react-native-toast-message';

// Fetcher function for SWR
const fetcher = async (url, options = {}) => {
  const api = ApiService;
  await api.init();
  
  if (options.method && options.method !== 'GET') {
    return api.makeRequest(url, options);
  }
  
  const response = await api.makeRequest(url);
  return response.data;
};

// Custom hook for chat thread data
export const useChatThread = (jobId, freelancerId, clientId) => {
  const key = jobId && freelancerId && clientId 
    ? ['chat-thread', jobId, freelancerId, clientId] 
    : null;

  const { data, error, mutate, isLoading } = useSWR(
    key,
    async () => {
      try {
        const response = await fetcher('/chat/thread', {
          method: 'POST',
          body: JSON.stringify({ jobId, freelancerId, clientId })
        });
        return response.data;
      } catch (err) {
        console.error('Failed to fetch thread:', err);
        Toast.show({ 
          type: "error", 
          text1: "Error", 
          text2: "Failed to load chat thread" 
        });
        throw err;
      }
    },
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000, // Dedupe requests within 5 seconds
    }
  );

  return {
    thread: data,
    isThreadLoading: isLoading,
    threadError: error,
    mutateThread: mutate,
  };
};

// Custom hook for chat messages
export const useChatMessages = (threadId) => {
  const key = threadId ? ['chat-messages', threadId] : null;

  const { data, error, mutate, isLoading } = useSWR(
    key,
    async () => {
      try {
        return await fetcher(`/chat/messages/${threadId}`);
      } catch (err) {
        console.error('Failed to fetch messages:', err);
        Toast.show({ 
          type: "error", 
          text1: "Error", 
          text2: "Failed to load messages" 
        });
        throw err;
      }
    },
    {
      refreshInterval: 10000, // Refresh every 10 seconds for real-time feel
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 2000, // More frequent for messages
    }
  );

  return {
    messages: data || [],
    isMessagesLoading: isLoading,
    messagesError: error,
    mutateMessages: mutate,
  };
};

// Custom hook for job details
export const useJobDetails = (jobId) => {
  const key = jobId ? ['job-details', jobId] : null;

  const { data, error, mutate, isLoading } = useSWR(
    key,
    async () => {
      try {
        return await fetcher(`/jobs/${jobId}`);
      } catch (err) {
        console.error('Failed to fetch job details:', err);
        Toast.show({ 
          type: "error", 
          text1: "Error", 
          text2: "Failed to load job details" 
        });
        throw err;
      }
    },
    {
      refreshInterval: 60000, // Refresh every minute (job details change less frequently)
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 10000,
    }
  );

  return {
    job: data,
    isJobLoading: isLoading,
    jobError: error,
    mutateJob: mutate,
  };
};

// Combined chat hook that uses all the above hooks
export const useChatData = (role, params) => {
  const { userData } = useAuth();
  
  // Determine freelancer and client IDs based on role
  let freelancerId, clientId;
  if (role === 'freelancer') {
    freelancerId = userData?.freelancer?.id;
    clientId = params?.client?.id;
  } else {
    freelancerId = params?.freelancer?.id;
    clientId = userData?.client?.id;
  }

  // Use individual SWR hooks
  const { thread, isThreadLoading, threadError, mutateThread } = useChatThread(
    params?.jobId, 
    freelancerId, 
    clientId
  );

  const { messages, isMessagesLoading, messagesError, mutateMessages } = useChatMessages(
    thread?.id
  );

  const { job, isJobLoading, jobError, mutateJob } = useJobDetails(params?.jobId);

  // Optimistic message update
  const addOptimisticMessage = useCallback((newMessage) => {
    mutateMessages((currentMessages = []) => [...currentMessages, newMessage], false);
  }, [mutateMessages]);

  // Send message with optimistic update
  const sendMessage = useCallback(async (messageContent, fileInfo = null) => {
    if (!thread?.id) return;

    // Debug logging
    console.log('SendMessage params:', params);
    console.log('Role:', role);
    console.log('userData:', userData);

    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      messageContent,
      senderId: userData.id,
      createdAt: new Date().toISOString(),
      messageType: 'text',
      isOptimistic: true,
    };

    // Add optimistic message immediately
    addOptimisticMessage(optimisticMessage);

    try {
      const api = ApiService;
      await api.init();

      // Get receiver ID with fallbacks
      const receiverId = role === 'freelancer' 
        ? (params.client?.userId || params.client?.user?.id)
        : (params.freelancer?.userId || params.freelancer?.user?.id);

      if (!receiverId) {
        throw new Error('Receiver ID not found in params');
      }

      let response;

      if (fileInfo) {
        // For messages with attachments, use multipart form data
        let formData = new FormData();
        formData.append('threadId', thread.id);
        formData.append('jobId', params.jobId);
        formData.append('messageContent', messageContent);
        formData.append('senderId', userData.id);
        formData.append('receiverId', receiverId);
        formData.append('senderType', role.toUpperCase());
        
        formData.append('file', {
          uri: fileInfo.uri,
          type: fileInfo.mimeType,
          name: fileInfo.name,
        });

        response = await api.makeRequest('/chat/message/attachment', {
          method: 'POST',
          body: formData,
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        // For regular text messages, use JSON
        response = await api.makeRequest('/chat/message', {
          method: 'POST',
          body: JSON.stringify({
            chatThreadId: thread.id,
            messageContent,
            senderId: userData.id,
            receiverId: receiverId,
            senderType: role.toUpperCase(),
            messageType: 'text',
            attachments: null,
          }),
        });
      }

      if (response.success) {
        // Revalidate messages to get the real message from server
        await mutateMessages();
        Toast.show({
          type: 'success',
          text1: 'Message sent successfully',
        });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Remove optimistic message on error
      mutateMessages((currentMessages = []) => 
        currentMessages.filter(msg => msg.id !== optimisticMessage.id), 
        false
      );
      
      Toast.show({
        type: 'error',
        text1: 'Failed to send message',
        text2: error.message,
      });
    }
  }, [thread?.id, userData.id, role, params, addOptimisticMessage, mutateMessages]);

  // Action handlers with SWR mutations
  const handleRequestCompletion = useCallback(async () => {
    try {
      const api = ApiService;
      await api.init();
      
      const endpoint = role === 'freelancer' 
        ? '/chat/message/completion-request/freelancer'
        : '/chat/message/completion-request/client';
      
      const res = await api.makeRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          threadId: thread?.id,
          jobId: job?.id
        }),
      });

      if (res.success) {
        // Mutate both messages and job data
        await Promise.all([
          mutateMessages(),
          mutateJob(),
        ]);
        
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Completion request sent',
        });
      }
    } catch (error) {
      console.error('Error sending completion request:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to send completion request',
      });
    }
  }, [role, thread?.id, job?.id, mutateMessages, mutateJob]);

  const handleJobCancel = useCallback(async () => {
    try {
      const api = ApiService;
      await api.init();
      
      const res = await api.makeRequest(`/jobs/${job?.id}/cancel`, {
        method: 'PATCH',
      });

      if (res.success) {
        // Mutate all related data
        await Promise.all([
          mutateJob(),
          mutateThread(),
          mutateMessages(),
        ]);
        
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Job cancelled successfully',
        });
      }
    } catch (error) {
      console.error('Error cancelling job:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to cancel job',
      });
    }
  }, [job?.id, mutateJob, mutateThread, mutateMessages]);

  return {
    // Data
    thread,
    messages,
    job,
    
    // Loading states
    isLoading: isThreadLoading || isMessagesLoading || isJobLoading,
    isThreadLoading,
    isMessagesLoading,
    isJobLoading,
    
    // Error states
    error: threadError || messagesError || jobError,
    threadError,
    messagesError,
    jobError,
    
    // Mutations
    mutateThread,
    mutateMessages,
    mutateJob,
    
    // Action handlers
    sendMessage,
    handleRequestCompletion,
    handleJobCancel,
    addOptimisticMessage,
    
    // Computed values
    chatStatus: job?.jobStatus?.toUpperCase() || 'PENDING',
    characterLimit: thread?.characterLimit || job?.characterLimit || 200,
  };
};