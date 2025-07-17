import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/NewAuthContext';
import { useFocusEffect } from '@react-navigation/native';
import skipTracker from '../lib/skipTracker';

// Profile Setup Screens
import DescribeRole from '../screens/DescribeRole';
import TellUsAboutYouScreen from '../screens/TellUsAboutYou';
import PortfolioScreen from '../screens/Portfolio';

/**
 * ProfileSetupHandler - Internal component that handles profile setup flow
 * This component checks profile completion status and skip flags to determine
 * which screen to show or if profile setup can be bypassed
 */
const ProfileSetupHandler = ({ navigation, MainAppComponent }) => {
  const [currentScreen, setCurrentScreen] = useState('loading');
  const [needsProfileSetup, setNeedsProfileSetup] = useState(true);
  const { user, userProfile } = useAuth();

  // Determine the correct screen based on profile completion and skip status
  const determineCurrentScreen = async () => {
    try {
      if (!user) {
        setCurrentScreen('main');
        setNeedsProfileSetup(false);
        return;
      }

      // Check phase completion flags from database
      const hasPhase1Complete = userProfile && userProfile.phase1Completed;
      const hasPhase2Complete = userProfile && userProfile.phase2Completed;

      // Check if phases were skipped locally
      const phase1Skipped = await skipTracker.isPhaseSkipped('describe_role');
      const phase2Skipped = await skipTracker.isPhaseSkipped('tell_us_about_you');

      console.log('ProfileSetupHandler - Phase 1 completed:', hasPhase1Complete, 'skipped:', phase1Skipped);
      console.log('ProfileSetupHandler - Phase 2 completed:', hasPhase2Complete, 'skipped:', phase2Skipped);

      // Determine if user needs profile setup
      const needsPhase1 = !hasPhase1Complete && !phase1Skipped;
      const needsPhase2 = !hasPhase2Complete && !phase2Skipped;
      const needsSetup = needsPhase1 || needsPhase2;

      setNeedsProfileSetup(needsSetup);

      if (!needsSetup) {
        // Profile is complete or skipped, show main app
        setCurrentScreen('main');
        return;
      }

      // Determine which phase to start with
      if (needsPhase1) {
        setCurrentScreen('describeRole');
      } else if (needsPhase2) {
        setCurrentScreen('tellUsAboutYou');
      } else {
        // Fallback to main app
        setCurrentScreen('main');
      }
    } catch (error) {
      console.error('Error determining profile setup screen:', error);
      // Safe fallback - show main app to prevent blocking
      setCurrentScreen('main');
      setNeedsProfileSetup(false);
    }
  };

  // Check profile setup status when component is focused
  useFocusEffect(
    React.useCallback(() => {
      determineCurrentScreen();
    }, [user, userProfile])
  );

  // Re-check when returning from profile setup screens
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      determineCurrentScreen();
    });

    return unsubscribe;
  }, [navigation, user, userProfile]);

  // Create a navigation wrapper that intercepts "Tabs" navigation
  const createNavigationWrapper = (screenName) => {
    return {
      ...navigation,
      navigate: (routeName, params) => {
        console.log(`ProfileSetupHandler - Navigate called: ${routeName}`);
        if (routeName === 'Tabs') {
          // Instead of navigating to Tabs, switch to main app
          setCurrentScreen('main');
        } else {
          navigation.navigate(routeName, params);
        }
      },
      replace: (routeName, params) => {
        console.log(`ProfileSetupHandler - Replace called: ${routeName}`);
        if (routeName === 'Tabs') {
          // Instead of replacing with Tabs, switch to main app
          setCurrentScreen('main');
        } else if (routeName === 'TellUsAboutYou') {
          // Move to next profile setup phase
          setCurrentScreen('tellUsAboutYou');
        } else {
          navigation.replace(routeName, params);
        }
      },
      reset: (resetState) => {
        console.log(`ProfileSetupHandler - Reset called:`, resetState);
        if (resetState.routes && resetState.routes.some(route => route.name === 'Tabs')) {
          // If resetting to Tabs, show main app instead
          setCurrentScreen('main');
        } else {
          navigation.reset(resetState);
        }
      }
    };
  };

  // Render the appropriate screen
  switch (currentScreen) {
    case 'loading':
      return null; // Show nothing while determining screen

    case 'describeRole':
      return (
        <DescribeRole
          navigation={createNavigationWrapper('describeRole')}
          route={{ params: {} }}
        />
      );

    case 'tellUsAboutYou':
      return (
        <TellUsAboutYouScreen
          navigation={createNavigationWrapper('tellUsAboutYou')}
          route={{ params: {} }}
        />
      );

    case 'portfolio':
      return (
        <PortfolioScreen
          navigation={createNavigationWrapper('portfolio')}
          route={{ params: {} }}
        />
      );

    case 'main':
    default:
      return <MainAppComponent />;
  }
};

export default ProfileSetupHandler;
