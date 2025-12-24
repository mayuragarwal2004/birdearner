import React, { useState } from 'react';
import { View, Text, Image, ImageBackground, TouchableOpacity, StyleSheet, Modal, Share, Alert } from 'react-native';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import ImageViewer from 'react-native-image-zoom-viewer';
import apiService from '../../lib/apiService';
import { useTheme } from '../../context/ThemeContext';

const ProfileHeader = ({ 
  profileData, 
  userData, 
  userServices = [],
  isOwnProfile = false,
  onEditPress,
  onSharePress
}) => {
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const styles = getStyles(currentTheme);
  const [modalVisible, setModalVisible] = useState(false);
  const [images, setImages] = useState([]);

  // Determine display data
  // For own profile: use profileData (if available) or userData as fallback
  // For public profile: profileData is the main source
  
  const displayName = profileData?.fullName || profileData?.user?.fullName || userData?.fullName || "User";
  const displayRole = profileData?.role || userData?.role;
  
  // Organization Type logic
  const organizationType = profileData?.organizationType || profileData?.organization_type;
  
  // Status Logic
  const isAvailable = profileData?.currentlyAvailable === true;

  const openImageModal = (imageUri) => {
    if (imageUri) {
        setImages([{ url: apiService.loadImageURI(imageUri) }]);
        setModalVisible(true);
    }
  };

  const handleShare = async () => {
    if (onSharePress) {
        onSharePress();
        return;
    }

    try {
      const userIdToShare = profileData?.userId || profileData?.id || userData?.id;
      if (!userIdToShare) {
        Alert.alert("Error", "Unable to share profile - user ID not found");
        return;
      }

      const deepLink = `birdearner://profile/${userIdToShare}`;
      const webLink = `https://birdearner.com/profile/${userIdToShare}`;
      const shareMessage = `Check out ${isOwnProfile ? 'my' : 'this'} profile on Bird Earner!\n\n👤 ${displayName}\n\n🌐 Click here: ${webLink}\n\nDownload Bird Earner to connect with amazing freelancers and clients!`;

      const result = await Share.share({
        message: shareMessage,
        url: deepLink,
        title: `${displayName}'s Bird Earner Profile`,
      });
      
      if (result.action === Share.sharedAction) {
        console.log("Profile shared successfully.");
      }
    } catch (error) {
      console.error("Share error:", error);
      Alert.alert("Error", "Failed to share the profile.");
    }
  };

  return (
    <View>
      <Modal
        visible={modalVisible}
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <ImageViewer
          imageUrls={images}
          enableSwipeDown={true}
          onSwipeDown={() => setModalVisible(false)}
          renderIndicator={() => null}
          renderHeader={() => (
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.modalHeader}
            >
              <FontAwesome name="arrow-left" size={24} color="#fff" />
            </TouchableOpacity>
          )}
        />
      </Modal>

      <ImageBackground
        source={
          profileData?.coverPhoto
            ? { uri: apiService.loadImageURI(profileData.coverPhoto) }
            : require("../../assets/backGroungBanner.png")
        }
        style={styles.backgroundImg}
      >
        <TouchableOpacity
          onPress={() => openImageModal(profileData?.profilePhoto)}
          disabled={!profileData?.profilePhoto}
          style={{ zIndex: 1 }}
        >
          <Image
            source={
              profileData?.profilePhoto
                ? { uri: apiService.loadImageURI(profileData.profilePhoto) }
                : require("../../assets/profile.png")
            }
            style={styles.profileImage}
          />
        </TouchableOpacity>

        {isOwnProfile && onEditPress && (
          <TouchableOpacity style={styles.settings} onPress={onEditPress}>
            <MaterialIcons name="settings" size={30} color={currentTheme.text || "black"} />
          </TouchableOpacity>
        )}
        
        <TouchableOpacity style={styles.share} onPress={handleShare}>
           <MaterialIcons name="share" size={30} color={currentTheme.text || "black"} />
        </TouchableOpacity>
      </ImageBackground>

      <View style={styles.userDetails}>
        <Text style={styles.nameText}>{displayName}</Text>
        
        {displayRole === "CLIENT" ? (
          <Text style={styles.roleText}>
             {organizationType || profileData?.companyName || profileData?.company_name || "Organization"}
          </Text>
        ) : (
          <View style={styles.roleWrap}>
            <Text>
              {userServices?.length > 0 ? (
                  userServices.map((item, idx) => (
                    <Text key={idx} style={styles.roleText}>
                      {item.name}
                      {idx < userServices.length - 1 ? ", " : ""}
                    </Text>
                  ))
              ) : (
                <Text style={styles.roleText}>No role designation available</Text>
              )}
            </Text>
          </View>
        )}

        {/* Location Section - with safe checks */}
        <View style={styles.locationContainer}>
             <MaterialIcons name="location-on" size={16} color="#4C0183" />
             <Text style={styles.locationText}>
               {profileData?.city ? `${profileData?.city}, ` : ""}
               {profileData?.state ? `${profileData?.state} ` : ""}
               ({profileData?.country || userData?.country})
             </Text>
        </View>

        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            Status: {isAvailable ? " Active " : " Inactive "} 
            <FontAwesome name="circle" size={12} color={isAvailable ? "#6BCD2F" : "#FF3131"} />
          </Text>
        </View>
      </View>
    </View>
  );
};

const getStyles = (currentTheme) => StyleSheet.create({
  modalHeader: {
    paddingTop: 40, // Increased for safe area
    paddingLeft: 20,
    zIndex: 10, 
  },
  backgroundImg: {
    width: "100%",
    height: 150,
    position: "relative",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    position: "absolute",
    top: 82,
    left: "38%", // Ideally should be centralized with flexbox but keeping legacy style for visual consistency
  },
  share: {
    position: "absolute",
    bottom: 5,
    right: 80, // matched MyProfile.js
    backgroundColor: currentTheme.background || "#fff",
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: currentTheme.text || "black",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  settings: {
    position: "absolute",
    bottom: 5,
    right: 20,
    backgroundColor: currentTheme.background || "#fff",
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: currentTheme.text || "black",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  userDetails: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 30, // Space for profile image overlap
    paddingBottom: 10,
  },
  nameText: {
    fontSize: 28,
    fontWeight: "600",
    color: currentTheme.text,
    textAlign: "center",
  },
  roleWrap: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  roleText: {
    fontSize: 14,
    fontWeight: "400",
    color: currentTheme.text,
    textAlign: "center",
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  locationText: {
    fontSize: 14,
    color: currentTheme.text || "#666",
    marginLeft: 4,
  },
  statusContainer: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
    color: currentTheme.text,
  },
});

export default ProfileHeader;
