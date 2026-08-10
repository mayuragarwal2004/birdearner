import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { X, Check, SlidersHorizontal, ArrowsDownUp } from 'phosphor-react-native';

const SORT_OPTIONS = [
  { key: 'none', label: 'Default' },
  { key: 'lowToHigh', label: 'Price: Low to High' },
  { key: 'highToLow', label: 'Price: High to Low' },
];

const AdvancedFilter = ({
  visible,
  onClose,
  services,
  selectedServices,
  onToggleService,
  onSelectAllServices,
  onClearAllServices,
  sortBy,
  onSortChange,
  theme,
}) => {
  const isDark = theme?.theme === 'dark';
  const styles = getStyles(isDark);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <SlidersHorizontal size={20} color="#762BAD" />
              <Text style={styles.headerTitle}>Advanced Filters</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color={isDark ? '#FFF' : '#333'} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Sort By Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <ArrowsDownUp size={16} color="#762BAD" />
                <Text style={styles.sectionTitle}>Sort by Price</Text>
              </View>
              {SORT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.optionRow,
                    sortBy === option.key && styles.optionRowActive,
                  ]}
                  onPress={() => onSortChange(option.key)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.optionText,
                      sortBy === option.key && styles.optionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {sortBy === option.key && (
                    <Check size={18} color="#762BAD" weight="bold" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Filter Services Section */}
            {services && services.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Filter by Service</Text>
                  <View style={styles.serviceActions}>
                    <TouchableOpacity onPress={onSelectAllServices}>
                      <Text style={styles.serviceActionText}>Select All</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onClearAllServices}>
                      <Text style={[styles.serviceActionText, { color: '#EF4444' }]}>Clear</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                {services.map((service) => {
                  const isSelected = selectedServices.includes(service.id);
                  return (
                    <TouchableOpacity
                      key={service.id}
                      style={[
                        styles.optionRow,
                        isSelected && styles.optionRowActive,
                      ]}
                      onPress={() => onToggleService(service.id)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          isSelected && styles.optionTextActive,
                        ]}
                      >
                        {service.name}
                      </Text>
                      {isSelected && (
                        <Check size={18} color="#762BAD" weight="bold" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {/* Apply Button */}
          <TouchableOpacity style={styles.applyButton} onPress={onClose}>
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const getStyles = (isDark) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    container: {
      backgroundColor: isDark ? '#1f2937' : '#FFF',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '75%',
      paddingBottom: 20,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#F3E8FF',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: isDark ? '#FFF' : '#1F1D2B',
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDark ? '#374151' : '#F3E8FF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    section: {
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#F3E8FF',
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: isDark ? '#FFF' : '#1F1D2B',
    },
    serviceActions: {
      flexDirection: 'row',
      gap: 12,
    },
    serviceActionText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#762BAD',
    },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 12,
      marginBottom: 8,
      backgroundColor: isDark ? '#374151' : '#F8F4FF',
    },
    optionRowActive: {
      backgroundColor: isDark ? '#4B0082' : '#F3E8FF',
      borderWidth: 1,
      borderColor: '#762BAD',
    },
    optionText: {
      fontSize: 15,
      color: isDark ? '#D1D5DB' : '#333',
    },
    optionTextActive: {
      fontWeight: '600',
      color: '#762BAD',
    },
    applyButton: {
      marginHorizontal: 20,
      marginTop: 10,
      backgroundColor: '#762BAD',
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
    },
    applyButtonText: {
      color: '#FFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
  });

export default AdvancedFilter;
