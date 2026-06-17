import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { PencilSimple, Briefcase, PaintBrush, VideoCamera, FileVideo } from 'phosphor-react-native';

const getServiceIcon = (name, color = "#FFF", size = 16) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('graphic') || lowerName.includes('design') || lowerName.includes('paint')) {
    return <PaintBrush size={size} color={color} weight="fill" />;
  }
  if (lowerName.includes('video') || lowerName.includes('edit')) {
    return <VideoCamera size={size} color={color} weight="fill" />;
  }
  if (lowerName.includes('animat')) {
    return <FileVideo size={size} color={color} weight="fill" />;
  }
  return <Briefcase size={size} color={color} weight="fill" />;
};

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
      <View style={styles.headerRow}>
        <Text style={styles.servicesTitle}>Your Services</Text>
        <TouchableOpacity style={styles.editButton} onPress={onAddServicesPress}>
          <PencilSimple size={14} color="#762BAD" weight="bold" />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {hasServices ? (
        <>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.servicesScroll}
            contentContainerStyle={styles.servicesScrollContent}
          >
            {userServices.map((service) => (
              <View key={service.id || service.name} style={styles.serviceTag}>
                {getServiceIcon(service.name)}
                <Text style={styles.serviceTagText}>{service.name}</Text>
              </View>
            ))}
          </ScrollView>
          <Text style={styles.servicesSubtext}>
            Showing jobs matching your services ({userServices.length} {userServices.length === 1 ? 'service' : 'services'})
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
    marginBottom: 12,
    backgroundColor: currentTheme.theme === 'dark' ? '#1f2937' : '#F8F4FF',
    padding: 12,
    borderRadius: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  servicesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: currentTheme.text || '#000',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: currentTheme.theme === 'dark' ? '#2e1f4a' : '#FFF',
    borderWidth: 1,
    borderColor: '#E5D5FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  editButtonText: {
    color: '#762BAD',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  servicesScroll: {
    marginBottom: 16,
  },
  servicesScrollContent: {
    paddingRight: 10,
  },
  serviceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4B0082',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  serviceTagText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  servicesSubtext: {
    fontSize: 13,
    color: '#762BAD',
    fontStyle: 'italic',
  },
  noServicesContainer: {
    alignItems: 'center',
    padding: 16,
  },
  noServicesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: currentTheme.text || '#000',
    marginBottom: 8,
  },
  noServicesText: {
    fontSize: 14,
    color: currentTheme.subText || '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  addServicesButton: {
    backgroundColor: '#762BAD',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addServicesButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default UserServicesSection;