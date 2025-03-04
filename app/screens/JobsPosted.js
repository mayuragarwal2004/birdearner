import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Image, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { appwriteConfig, databases } from '../lib/appwrite';
import { Query } from 'react-native-appwrite';
import { differenceInDays } from 'date-fns';
import { useTheme } from '../context/ThemeContext';

const categorizeJobs = (jobs) => {
  const today = new Date();
  return jobs.map((job) => {
    const daysRemaining = differenceInDays(new Date(job.deadline), today);

    let priority;
    let color = '#FFCC00';

    if (job.applied_freelancer.length === 0) {
      priority = 'Under process';
    } else if (job.applied_freelancer.length === 1) {
      priority = `${job.applied_freelancer.length} Entry Received`;
    } else {
      priority = `${job.applied_freelancer.length} Entries Received`;
    }

    if (daysRemaining <= 2) {
      color = '#FF3B30';
    } else if (daysRemaining <= 10) {
      color = '#34C759';
    }

    return {
      ...job,
      color,
      priority,
    };
  });
};

const JobsPostedScreen = ({ navigation }) => {
  const { userData } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false); // State for modal visibility
  const [selectedJob, setSelectedJob] = useState(null);


  const cachedJobs = useRef([]);
  const profilePic = userData?.profile_photo

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];

  const styles = getStyles(currentTheme);

  const fetchJobs = async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.jobCollectionID,
        [
          Query.equal('job_created_by', userData.$id),
          Query.orderDesc('created_at'),
        ]
      );

      const fetchedJobs = response.documents;
      if (JSON.stringify(fetchedJobs) !== JSON.stringify(cachedJobs.current)) {
        const categorizedJobs = categorizeJobs(fetchedJobs);
        cachedJobs.current = fetchedJobs;
        setJobs(categorizedJobs);
      }
    } catch (err) {
      Alert.alert('Failed to fetch jobs:', err)
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (cachedJobs.current.length === 0) {
        fetchJobs();
      }
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchJobs();
    setRefreshing(false);
  };

  const handleOptionSelect = (option) => {
    setModalVisible(false); // Close the modal
    if (option === 'View Details') {
      navigation.navigate('JobDetailsChat', { projectId: selectedJob.$id });
    } else if (option === 'Update') {
      navigation.navigate('UpdateJobDetailsScreen', { projectId: selectedJob.$id});
    } else if (option === 'Delete') {
      Alert.alert(
        'Delete Job',
        'Are you sure you want to delete this job?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => deleteJob(selectedJob.$id),
          },
        ]
      );
    }
  };

  const deleteJob = async (jobId) => {
    try {
      await databases.deleteDocument(
        appwriteConfig.databaseId,
        appwriteConfig.jobCollectionID,
        jobId
      );
      Alert.alert('Success', 'Job deleted successfully.');
      fetchJobs(); // Refresh jobs after deletion
    } catch (err) {
      Alert.alert('Error', 'Failed to delete job.');
    }
  };

  const renderJobItem = ({ item }) => {
    const title = item.title;
    const freelancersId = item.applied_freelancer;
    const color = item.color;
    const projectId = item.$id;

    return (
      <TouchableOpacity
        style={styles.jobContainer}
        onPress={() => {
          navigation.navigate('AppliersScreen', { title, freelancersId, color, item, projectId });
        }}
      >
        <Image
          source={{ uri: profilePic || 'https://randomuser.me/api/portraits/women/3.jpg' }}
          style={styles.avatar}
        />
        <View style={styles.jobContent}>
          <Text style={styles.jobTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.jobStatus}>Status: {item.priority}</Text>
        </View>
        <TouchableOpacity
        style={styles.threedots}
        onPress={() => {
          setSelectedJob(item); // Set the selected job
          setModalVisible(true); // Show the modal
        }}
      >
        <Ionicons name="ellipsis-vertical" size={24} color={currentTheme.text} />
      </TouchableOpacity>
        <View style={[styles.statusIndicator, { backgroundColor: item.color }]} />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b006b" />
        <Text style={{ color: currentTheme.subText }} >Loading jobs...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorMessage}>Failed to load jobs. Please try again later.</Text>
        <TouchableOpacity onPress={fetchJobs} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (jobs.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyMessage}>No jobs posted yet.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.main}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={currentTheme.text || "black"} />
        </TouchableOpacity>
        <Text style={styles.header}>Jobs Posted</Text>
      </View>
      <FlatList
        data={jobs}
        renderItem={renderJobItem}
        keyExtractor={(item) => item.$id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3b006b']}
            progressBackgroundColor={currentTheme.cardBackground || "#fff"}
          />
        }
      />

      {/* Modal for Job Options */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Options for {selectedJob?.title}</Text>
            <TouchableOpacity onPress={() => handleOptionSelect('View Details')}>
              <Text style={styles.modalOption}>View Job Details</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleOptionSelect('Update')}>
              <Text style={styles.modalOption}>Update Job Details</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleOptionSelect('Delete')}>
              <Text style={[styles.modalOption, { color: 'red' }]}>Delete This Job</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>


    </View>
  );
};

const getStyles = (currentTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background || '#FFFFFF',
      paddingHorizontal: 20,
      paddingTop: 30,
    },
    backButton: {
      // color: currentTheme.primary || "#4B0082",
    },
    main: {
      marginTop: 25,
      marginBottom: 10,
      display: 'flex',
      flexDirection: 'row',
      gap: 100,
      alignItems: 'center',
    },
    header: {
      fontSize: 24,
      fontWeight: 'bold',
      textAlign: 'center',
      color: currentTheme.text || "black"
    },
    listContainer: {
      paddingBottom: 20,
    },
    jobContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: currentTheme.cardBackground || '#F5F5F5',
      borderTopRightRadius: 10,
      borderBottomRightRadius: 10,
      borderTopLeftRadius: 40,
      borderBottomLeftRadius: 40,
      marginTop: 20,
      shadowColor: currentTheme.shadow || "#000",
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 5,
      elevation: 2,
      height: 70,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      marginRight: 15,
    },
    jobContent: {
      flex: 1,
      paddingRight: 6,
    },
    jobTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#5A4CAE',
    },
    jobStatus: {
      fontSize: 14,
      color: currentTheme.text2 || '#6D6D6D',
    },
    statusIndicator: {
      width: 10,
      height: '100%',
      borderTopRightRadius: 10,
      borderBottomRightRadius: 10,
      backgroundColor: currentTheme.accent || "#FF4500",
      position: "relative"
    },
    threedots: {
      // position: "absolute",
      // top: 20,
      // right: -7,
      // zIndex: 12
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: currentTheme.background || "#fff"
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: currentTheme.background || "#fff"
    },
    errorMessage: {
      fontSize: 16,
      color: '#FF3B30',
      textAlign: 'center',
      marginBottom: 20,
    },
    retryButton: {
      backgroundColor: '#3b006b',
      padding: 10,
      borderRadius: 5,
    },
    retryButtonText: {
      color: currentTheme.text || '#FFFFFF',
      fontSize: 16,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: currentTheme.background || "#fff"
    },
    emptyMessage: {
      fontSize: 16,
      color: currentTheme.subText || '#6D6D6D',
      textAlign: 'center',
      marginBottom: 20,
    },
    backButtonText: {
      color: currentTheme.subText || '#3b006b',
      fontSize: 16,
    },

    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      width: '80%',
      backgroundColor: currentTheme.cardBackground || '#fff',
      borderRadius: 10,
      padding: 20,
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 20,
      color: currentTheme.text,
    },
    modalOption: {
      fontSize: 16,
      paddingVertical: 10,
      color: currentTheme.text,
    },
    modalCancel: {
      marginTop: 10,
      fontSize: 16,
      fontWeight: 'bold',
      color: currentTheme.subText,
    },
  });

export default JobsPostedScreen;
