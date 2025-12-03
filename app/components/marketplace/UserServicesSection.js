import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

const UserServicesSection = React.memo(({ 
  isFreelancer, 
  userServices, 
  hasServices, 
  onAddServicesPress,
  theme 
}) => {
  if (!isFreelancer) {
    return null;
  }

  const styles = getStyles(theme);

  return (
    <View style={styles.servicesContainer}>
      {hasServices ? (
        <>
          <Text style={styles.servicesTitle}>Your Services:</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.servicesScroll}
          >
            {userServices.map((service) => (
              <View key={service.id} style={styles.serviceTag}>
                <Text style={styles.serviceTagText}>{service.name}</Text>
              </View>
            ))}
          </ScrollView>
          <Text style={styles.servicesSubtext}>
            Showing jobs matching your services ({userServices.length} services)
          </Text>
        </>
      ) : (
        <View style={styles.noServicesContainer}>
          <Text style={styles.noServicesTitle}>No Services Selected</Text>
          <Text style={styles.noServicesText}>
            You haven't selected any services yet. Showing all available jobs.
          </Text>
          <TouchableOpacity 
            style={styles.addServicesButton}
            onPress={onAddServicesPress}
          >
            <Text style={styles.addServicesButtonText}>Add Services</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
});

const getStyles = (currentTheme) => StyleSheet.create({
  servicesContainer: {
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 12,
  },
  servicesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  servicesScroll: {
    marginBottom: 8,
  },
  serviceTag: {
    backgroundColor: '#762BAD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  serviceTagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  servicesSubtext: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  noServicesContainer: {
    alignItems: 'center',
    padding: 16,
  },
  noServicesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  noServicesText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  addServicesButton: {
    backgroundColor: '#762BAD',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addServicesButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default UserServicesSection;