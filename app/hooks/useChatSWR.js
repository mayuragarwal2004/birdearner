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
        const response = await fetcher('/chats/thread', {
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
        return await fetcher(`/chats/messages/${threadId}`);
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
    params?.jobId || params?.projectId,
    freelancerId,
    clientId
  );

  const { messages, isMessagesLoading, messagesError, mutateMessages } = useChatMessages(
    params?.threadId || thread?.id
  );

  const { job, isJobLoading, jobError, mutateJob } = useJobDetails(params?.jobId || params?.projectId);

  // Optimistic message update
  const addOptimisticMessage = useCallback((newMessage) => {
    mutateMessages((currentMessages = []) => [...currentMessages, newMessage], false);
  }, [mutateMessages]);

  // Send message with optimistic update
  const sendMessage = useCallback(async (messageContent, attachmentData = null) => {
    const activeThreadId = params?.threadId || thread?.id;
    if (!activeThreadId) return;

    // Debug logging for attachment data
    console.log('SendMessage - attachmentData:', attachmentData);
    console.log('SendMessage - messageContent:', messageContent);

    // Check cumulative character limit for OPEN jobs
    if (job?.jobStatus?.toUpperCase() === 'OPEN') {
      const totalLimit = thread?.characterLimit || job?.characterLimit || 200;
      const currentUsage = messages
        .filter(msg => msg.senderId === userData.id)
        .reduce((total, msg) => total + (msg.messageContent?.length || 0), 0);

      if (currentUsage + messageContent.length > totalLimit) {
        Toast.show({
          type: 'error',
          text1: 'Character Limit Exceeded',
          text2: `You have ${Math.max(0, totalLimit - currentUsage)} characters remaining`,
        });
        return;
      }
    }

    // Debug logging
    console.log('SendMessage params:', params);
    console.log('Role:', role);
    console.log('userData:', userData);

    // Determine message type based on attachment
    const messageType = attachmentData ? 'ATTACHMENT' : 'text';

    // Format attachments for backend (must be array or undefined for Zod)
    const formattedAttachments = attachmentData ? [{
      url: attachmentData.attachmentUrl,
      name: attachmentData.attachmentName,
      size: attachmentData.attachmentSize,
      mimeType: attachmentData.attachmentMime,
    }] : undefined;

    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      messageContent,
      senderId: userData?.id,
      createdAt: new Date().toISOString(),
      messageType: messageType,
      attachments: formattedAttachments || null, // UI can handle null
      isOptimistic: true,
    };

    // Add optimistic message immediately
    addOptimisticMessage(optimisticMessage);

    try {
      const api = ApiService;
      await api.init();

      // Get receiver ID with fallbacks - ensure it's a User ID
      // receiverId should be the User ID of the other person in the chat
      let receiverId = role === 'freelancer'
        ? (params.clientUserId || params.client?.userId || params.client?.user?.id)
        : (params.freelancerUserId || params.freelancer?.userId || params.freelancer?.user?.id);

      // If still missing, try to get from thread if it exists
      if (!receiverId && thread) {
        receiverId = role === 'freelancer' ? thread.clientUserId : thread.freelancerUserId;
      }

      if (!receiverId) {
        console.error('SendMessage - Error: Receiver ID not found. Params:', params, 'Thread:', thread);
        throw new Error('Receiver ID not found');
      }

      // Prepare request body
      const requestBody = {
        chatThreadId: activeThreadId,
        senderId: userData?.id,
        receiverId: receiverId,
        messageContent: messageContent,
        messageType: messageType,
        attachments: formattedAttachments, // Use formattedAttachments (array or undefined)
        senderType: role.toUpperCase(),
      };

      console.log('SendMessage - Request body:', JSON.stringify(requestBody, null, 2));

      // Send message with attachment data or text only
      const response = await api.makeRequest('/chats/message', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

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
        ? '/chats/message/completion-request/freelancer'
        : '/chats/message/completion-request/client';

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

  const handleJobCancel = useCallback(async (reason) => {
    try {
      const api = ApiService;
      await api.init();

      const res = await api.makeRequest(`/jobs/${job?.id}/cancel`, {
        method: 'PATCH',
        body: JSON.stringify({ reason: reason || undefined }),
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

  // Handle updating offer during negotiation
  const updateOffer = useCallback(async (amount) => {
    const activeThreadId = params?.threadId || thread?.id;
    if (!activeThreadId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Chat thread not initialized yet',
      });
      return;
    }

    try {
      const api = ApiService;
      await api.init();
      const res = await api.updateNegotiationOffer(activeThreadId, amount, role);
      if (res.success) {
        Toast.show({
          type: 'success',
          text1: 'Offer Updated',
          text2: `Your offer has been updated to ₹${amount}`,
        });
        await mutateThread();
        await mutateMessages();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: res.message || 'Failed to update offer',
        });
      }
    } catch (err) {
      console.error('Error updating offer:', err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.message || 'Failed to update offer',
      });
    }
  }, [thread?.id, params?.threadId, role, mutateThread, mutateMessages]);

  // Calculate character usage for current user
  const totalCharacterLimit = (job?.jobStatus?.toUpperCase() === 'OPEN')
    ? (thread?.characterLimit || job?.characterLimit || 200)
    : null;

  const charactersUsed = totalCharacterLimit
    ? messages
      .filter(msg => msg.senderId === userData.id)
      .reduce((total, msg) => total + (msg.messageContent?.length || 0), 0)
    : 0;

  const charactersRemaining = totalCharacterLimit
    ? Math.max(0, totalCharacterLimit - charactersUsed)
    : null;

  // Calculate character usage for the other user in the thread (the other party)
  const otherCharactersUsed = totalCharacterLimit
    ? messages
      .filter(msg => msg.senderId && msg.senderId !== userData.id)
      .reduce((total, msg) => total + (msg.messageContent?.length || 0), 0)
    : 0;

  const otherCharactersRemaining = totalCharacterLimit
    ? Math.max(0, totalCharacterLimit - otherCharactersUsed)
    : null;

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
    updateOffer,

    // Negotiation values
    clientOffer: thread?.clientOffer || job?.budgetAmount?.toString() || "0",
    freelancerOffer: thread?.freelancerOffer || job?.budgetAmount?.toString() || "0",
    agreedAmount: thread?.agreedAmount || (thread?.isAccepted ? job?.budgetAmount?.toString() : null),
    isNegotiable: !thread?.isAccepted && thread?.status !== 'ACCEPTED' && thread?.status !== 'REJECTED',

    // Computed values
    chatStatus: thread?.status || 'PENDING',
    jobStatus: job?.jobStatus?.toUpperCase() || 'PENDING',
    characterLimit: (job?.jobStatus?.toUpperCase() === 'OPEN')
      ? (thread?.characterLimit || job?.characterLimit || 200)
      : null,
    charactersUsed: (job?.jobStatus?.toUpperCase() === 'OPEN')
      ? messages
        .filter(msg => msg.senderId === userData.id)
        .reduce((total, msg) => total + (msg.messageContent?.length || 0), 0)
      : 0,
    charactersRemaining: (job?.jobStatus?.toUpperCase() === 'OPEN')
      ? Math.max(0, (thread?.characterLimit || job?.characterLimit || 200) -
        messages
          .filter(msg => msg.senderId === userData.id)
          .reduce((total, msg) => total + (msg.messageContent?.length || 0), 0)
      )
      : null,
    // Other user's cumulative usage (useful to show notices to each party)
    otherCharactersUsed: (job?.jobStatus?.toUpperCase() === 'OPEN')
      ? messages
        .filter(msg => msg.senderId && msg.senderId !== userData.id)
        .reduce((total, msg) => total + (msg.messageContent?.length || 0), 0)
      : 0,
    otherCharactersRemaining: (job?.jobStatus?.toUpperCase() === 'OPEN')
      ? Math.max(0, (thread?.characterLimit || job?.characterLimit || 200) -
        messages
          .filter(msg => msg.senderId && msg.senderId !== userData.id)
          .reduce((total, msg) => total + (msg.messageContent?.length || 0), 0)
      )
      : null,
  };
};