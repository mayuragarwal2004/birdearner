import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/NewAuthContext';
import { useFocusEffect } from '@react-navigation/native';
import skipTracker from '../lib/skipTracker';

// Profile Setup Screens
import DescribeRole from '../screens/DescribeRole';
import TellUsAboutYouScreen from '../screens/TellUsAboutYou';
import PortfolioScreen from '../screens/Portfolio';

// Main App Components
import MainTabs from './MainTabs'; // You'll need to create this

const Stack = createStackNavigator();

const ProfileSetupNavigator = () => {
  const [initialRoute, setInitialRoute] = useState(null);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(true);
  const { user, userProfile } = useAuth();

  // Determine the correct initial route based on profile completion and skip status
  const determineInitialRoute = async () => {
    try {
      if (!user || !userProfile) {
        setInitialRoute('DescribeRole');
        return;
      }

      // Check phase completion flags from database
      const hasPhase1Complete = userProfile && userProfile.phase1Completed;
      const hasPhase2Complete = userProfile && userProfile.phase2Completed;

      // Check if phases were skipped locally
      const phase1Skipped = await skipTracker.isPhaseSkipped('describe_role');
      const phase2Skipped = await skipTracker.isPhaseSkipped('tell_us_about_you');

      console.log('Profile Setup Navigator - Phase 1 completed:', hasPhase1Complete, 'skipped:', phase1Skipped);
      console.log('Profile Setup Navigator - Phase 2 completed:', hasPhase2Complete, 'skipped:', phase2Skipped);

      // Determine if user needs profile setup
      const needsPhase1 = !hasPhase1Complete && !phase1Skipped;
      const needsPhase2 = !hasPhase2Complete && !phase2Skipped;
      const needsSetup = needsPhase1 || needsPhase2;

      setNeedsProfileSetup(needsSetup);

      if (!needsSetup) {
        // Profile is complete or skipped, go to main app
        setInitialRoute('MainApp');
        return;
      }

      // Determine which phase to start with
      if (needsPhase1) {
        setInitialRoute('DescribeRole');
      } else if (needsPhase2) {
        setInitialRoute('TellUsAboutYou');
      } else {
        // Fallback
        setInitialRoute('DescribeRole');
      }
    } catch (error) {
      console.error('Error determining profile setup route:', error);
      // Safe fallback
      setInitialRoute('MainApp');
      setNeedsProfileSetup(false);
    }
  };

  // Check profile setup status when navigator is focused
  useFocusEffect(
    React.useCallback(() => {
      determineInitialRoute();
    }, [user, userProfile])
  );

  // Show loading if we haven't determined the route yet
  if (initialRoute === null) {
    return null; // Or a loading screen
  }

  return (
    <Stack.Navigator 
      screenOptions={{ headerShown: false }}
      initialRouteName={initialRoute}
    >
      {/* Main App Screen */}
      <Stack.Screen name="MainApp" component={MainTabs} />
      
      {/* Profile Setup Screens */}
      <Stack.Screen name="DescribeRole" component={DescribeRole} />
      <Stack.Screen name="TellUsAboutYou" component={TellUsAboutYouScreen} />
      <Stack.Screen name="Portfolio" component={PortfolioScreen} />
    </Stack.Navigator>
  );
};

export default ProfileSetupNavigator;
