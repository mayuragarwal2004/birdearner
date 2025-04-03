import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, SafeAreaView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const SettingsScreen = ({ navigation }) => {
  const { userData } = useAuth();
  const role = userData?.role;
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];

  const styles = getStyles(currentTheme);

  const settingsData = [
    {
      title: 'Account Settings',
      options: [
        { name: "Availability", stack_name: "Availability" },
        { name: "My profile", stack_name: "MyProfile" },
        { name: "Password update", stack_name: "Password update" },
        { name: "Change your email", stack_name: "Email update" },
      ]
    },
    {
      title: 'Payment Settings',
      options: role === "freelancer"
        ? [
          { name: "Withdrawal Earning", stack_name: "Withdrawal Earning" },
          { name: "Link your wallet/Bank account", stack_name: "Bank Account details" },
          { name: "Your Wallet & History", stack_name: "Wallet" },
        ]
        : [
          { name: "Link your wallet/Bank account", stack_name: "Bank Account details" },
          { name: "Your Wallet & History", stack_name: "WalletClient" },
        ]
    },
    {
      title: 'Preferences',
      options: [
        { name: "Notifications", stack_name: "Notifications Setting" },
        { name: "Appearance", stack_name: "Appearance" },
        { name: "Security", stack_name: "Security" },
      ]
    },
    {
      title: 'About',
      options: [
        { name: "Terms & Conditions", stack_name: "TermsAndConditions" },
        { name: "Feedback", stack_name: "Feedback" },
        { name: "Privacy Policy", stack_name: "PrivacyPolicy" },
        { name: "Blogs & Forum", stack_name: "BlogsAndForum" },
      ]
    },
  ];

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState(settingsData);

  const handleSearch = (query) => {
    setSearchQuery(query);

    if (query.trim() === '') {
      setFilteredData(settingsData);
    } else {
      const filtered = settingsData.map((section) => {
        const options = section.options.filter((option) =>
          option.name.toLowerCase().includes(query.toLowerCase())
        );
        return options.length > 0 ? { ...section, options } : null;
      }).filter(Boolean);
      setFilteredData(filtered);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Text style={styles.title}>Settings</Text>

      {/* Search Bar */}
      {/* <View style={styles.searchContainer}>
        <TextInput
          value={searchQuery}
          onChangeText={handleSearch}
          placeholder="Search"
          style={styles.searchInput}
          placeholderTextColor="#888"
        />
      </View> */}

      {/* Settings List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {filteredData.map((section, index) => (
          <View key={index} style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.options.map((option, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.optionContainer}
                onPress={() => navigation.navigate(option.stack_name)}
              >
                <Text style={styles.optionText}>{option.name}</Text>
                <Text style={styles.arrowIcon}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
        {filteredData.length === 0 && (
          <Text style={styles.noResults}>No results found</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (currentTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background || '#fff',
      padding: 16,
      paddingTop: 50,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 16,
      color: currentTheme.text || "white"
    },
    searchContainer: {
      marginBottom: 20,
    },
    searchInput: {
      height: 45,
      borderRadius: 8,
      backgroundColor: currentTheme.background3 || '#f0f0f0',
      paddingHorizontal: 16,
      color: currentTheme.subText || '#333',
    },
    scrollView: {
      flex: 1,
    },
    sectionContainer: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: currentTheme.text || '#555',
      marginBottom: 10,
    },
    optionContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 10,
      backgroundColor: currentTheme.background3 || '#f0f0f0',
      borderRadius: 8,
      marginBottom: 10,
    },
    optionText: {
      fontSize: 14,
      color: currentTheme.text || '#333',
    },
    arrowIcon: {
      fontSize: 18,
      color: currentTheme.text || '#888',
    },
    noResults: {
      textAlign: 'center',
      color: currentTheme.text || '#888',
      fontSize: 16,
      marginTop: 20,
    },
  });

export default SettingsScreen;
