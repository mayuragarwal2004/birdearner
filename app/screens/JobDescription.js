import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

const JobDescriptionScreen = () => {
  return (
    <ScrollView style={styles.container}>
      {/* Job Header */}
      <View style={styles.jobHeader}>
        <Image
          source={{ uri: 'https://via.placeholder.com/60' }}
          style={styles.avatar}
        />
        <View style={styles.jobInfo}>
          <Text style={styles.jobTitle}>
            Looking for graphic designer for branding project
          </Text>
          <FontAwesome name="flag" size={20} color="black" style={styles.flagIcon} />
        </View>
      </View>

      {/* Job Details */}
      <View style={styles.jobDetails}>
        <Text style={styles.detailText}>
          <Text style={styles.boldText}>Budget:</Text> $300
        </Text>
        <Text style={styles.detailText}>
          <Text style={styles.boldText}>Location:</Text> IND (Global)
        </Text>
        <Text style={styles.detailText}>
          <Text style={styles.boldText}>Deadline:</Text> 5-7 Days
        </Text>
        <Text style={styles.detailText}>
          <Text style={styles.boldText}>Skills:</Text> Design, Sketching, Adobe Suits
        </Text>
      </View>

      {/* Job Description */}
      <View style={styles.jobDescription}>
        <Text style={styles.descriptionText}>
          We need a designer for a health agency rebranding that deals with various sectors...
        </Text>
        <Text style={styles.descriptionText}>
          We need a designer for a health agency rebranding that deals with various sectors...
        </Text>
        <Text style={styles.descriptionText}>
          We need a designer for a health agency rebranding that deals with various sectors...
        </Text>
        <Text style={styles.descriptionText}>
          We need a designer for a health agency rebranding that deals with various sectors...
        </Text>
      </View>

      {/* Attached Files */}
      <View style={styles.attachedFilesContainer}>
        <Text style={styles.attachedFilesTitle}>Attached files</Text>
        <View style={styles.filePreviewContainer}>
          <View style={styles.filePreview} />
          <View style={styles.filePreview} />
          <View style={styles.filePreview} />
        </View>
      </View>

      {/* Apply Button */}
      <TouchableOpacity style={styles.applyButton}>
        <Text style={styles.applyButtonText}>Apply</Text>
      </TouchableOpacity>

      {/* Report Job Link */}
      <Text style={styles.reportText}>Report this job</Text>
    </ScrollView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 20
  },
  jobHeader: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 20,
  },
  jobInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4e2587',
    flex: 1,
  },
  flagIcon: {
    marginLeft: 10,
  },
  jobDetails: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  detailText: {
    fontSize: 14,
    color: '#4e2587',
    marginBottom: 10,
  },
  boldText: {
    fontWeight: 'bold',
  },
  jobDescription: {
    marginBottom: 20,
  },
  descriptionText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
    marginBottom: 10,
  },
  attachedFilesContainer: {
    marginBottom: 30,
  },
  attachedFilesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4e2587',
    marginBottom: 10,
  },
  filePreviewContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filePreview: {
    width: 60,
    height: 60,
    backgroundColor: '#ccc',
    borderRadius: 5,
  },
  applyButton: {
    backgroundColor: '#4e2587',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 20,
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  reportText: {
    color: '#555',
    textAlign: 'center',
    textDecorationLine: 'underline',
    fontSize: 14,
  },
});

export default JobDescriptionScreen;
