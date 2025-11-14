import { useState, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { useAuth } from '../context/NewAuthContext';
import ApiService from '../lib/apiService';
import Toast from 'react-native-toast-message';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

export const useChatLogic = (role, params) => {
  const [messages, setMessages] = useState([]);
  const [thread, setThread] = useState(null);
  const [chatStatus, setChatStatus] = useState('PENDING');
  const [characterLimit, setCharacterLimit] = useState(200);
  const [showMenu, setShowMenu] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedReportReason, setSelectedReportReason] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [job, setJob] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [sending, setSending] = useState(false);

  const { userData } = useAuth();
  const api = ApiService;

  const fetchJobDetails = async () => {
    try {
      await api.init();
      console.log(`Fetching job details for jobId: ${params.jobId}`);
      
      const res = await api.makeRequest(`/jobs/${params.jobId}`);
      if (res.success) {
        setJob(res.data);
      }
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to fetch job details',
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await getThreadAndMessages();
      await fetchJobDetails();
      await refreshMessages();
    };
    
    loadData();
  }, [params.jobId]);

  const getThreadAndMessages = async () => {
    try {
      await api.init();
      let freelancerId, clientId;

      console.log({role});
      
      
      if (role === 'freelancer') {
        freelancerId = userData.freelancer.id;
        clientId = params.client.id;
      } else {
        freelancerId = params.freelancer.id;
        clientId = userData.client.id;
      }
      
      console.log("Fetching thread for:", { jobId: params.jobId, freelancerId, clientId });

      const resThread = await api.makeRequest("/chat/thread", {
        method: "POST",
        body: JSON.stringify({ jobId: params.jobId, freelancerId, clientId }),
      });
      setThread(resThread.data);
      setCharacterLimit(resThread.data.characterLimit || 200);
      const resMessages = await api.makeRequest(
        `/chat/messages/${resThread.data.id}`
      );
      setMessages(resMessages.data);
    } catch (err) {
      console.error(err)
      
      Toast.show({ type: "error", text1: "Error", text2: err.message });
    }
  };

  useEffect(() => {
    getThreadAndMessages();
  }, [params.jobId, userData.id]);

  useEffect(() => {
    if (job?.jobStatus) setChatStatus(job.jobStatus.toUpperCase());
    if (job?.characterLimit) setCharacterLimit(job.characterLimit);
  }, [job]);

  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled === false) {
        const file = result.assets[0];
        setFileInfo(file);
        const content = await FileSystem.readAsStringAsync(file.uri);
        setFileContent(content);
      }
    } catch (error) {
      console.error('Error picking file:', error);
    }
  };

  const handleSendMessage = async (messageText, file) => {
    setSending(true);
    try {
      await api.init();
      
      if (file) {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('threadId', thread.id);
        formData.append('senderId', userData.id);
        formData.append('receiverId', role === 'client' ? params.freelancer.user.id : params.client.user.id);
        formData.append('messageContent', messageText);
        formData.append('messageType', 'file');
        formData.append('senderType', role.toUpperCase());
        formData.append('file', {
          uri: Platform.OS === 'ios' ? file.uri.replace('file://', '') : file.uri,
          name: file.name,
          type: file.mimeType || 'application/octet-stream',
        });

        const res = await fetch(
          `${api.baseURL}/chat/message/attachment`,
          {
            method: 'POST',
            body: formData,
            headers: api.getAuthHeaders ? api.getAuthHeaders() : {},
          }
        );

        if (res.status === 200) {
          await refreshMessages();
          setFileInfo(null);
          setFileContent('');
        } else {
          console.error('File upload failed with status:', res.status);
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Failed to send file',
          });
        }
      } else if (messageText.trim()) {
        const res = await api.makeRequest('/chat/message', {
          method: 'POST',
          body: JSON.stringify({
            chatThreadId: thread.id,
            senderId: userData.id,
            receiverId: role === 'client' ? params.freelancer.user.id : params.client.user.id,
            messageContent: messageText,
            messageType: 'text',
            senderType: role.toUpperCase(),
          }),
        });
        console.log({messages_res: res});
        
        setMessages(prev => [...prev, res.data]);
      }
    } catch (err) {
      Alert.alert('Error sending message:', err.message);
    } finally {
      setIsUploading(false);
      setSending(false);
    }
  };

  const refreshMessages = async () => {
    if (!thread) return;
    try {
      await api.init();
      const resMessages = await api.makeRequest(`/chat/messages/${thread.id}`);
      console.log({messages_res: resMessages});

      setMessages(resMessages.data);
    } catch (err) {
      console.error('Error refreshing messages:', err);
      Toast.show({ type: 'error', text1: 'Error', text2: err.message });
    }
  };

  const handleReport = async () => {
    if (!selectedReportReason) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please select a reason for reporting',
      });
      return;
    }

    try {
      await api.init();
      const res = await api.makeRequest(`/chat/report`, {
        method: 'POST',
        body: JSON.stringify({
          threadId: thread.id,
          userId: userData.id,
          reportedUserId: role === 'client' ? params.freelancer.user.id : params.client.user.id,
          reason: selectedReportReason,
        }),
      });

      if (res.success) {
        setReportModalVisible(false);
        setSelectedReportReason(null);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Report submitted successfully',
        });
      }
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to submit report',
      });
    }
  };

  return {
    messages,
    thread,
    chatStatus,
    characterLimit,
    showMenu,
    setShowMenu,
    reportModalVisible,
    setReportModalVisible,
    selectedReportReason,
    setSelectedReportReason,
    isBlocked,
    job,
    fileInfo,
    fileContent,
    isUploading,
    uploadProgress,
    sending,
    handleFilePick,
    handleSendMessage,
    handleReport,
    refreshMessages,
    getThreadAndMessages,
  };
};