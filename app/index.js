import React, { useState, useEffect } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { View, StyleSheet, Alert, Platform } from "react-native";
import { Briefcase, Bird as LucideBird } from "lucide-react-native";

// Import custom SVG files as React components
import BirdEarnerSvg from "./assets/BirdEarnerSvg";
import HomeSvg from "./assets/HomeSvg";
import MarketplaceSvg from "./assets/MarketplaceSvg";
import StatsSvg from "./assets/StatsSvg";
import UserSvg from "./assets/UserSvg";
import JobIconSvg from "./assets/JobIconSvg";
// import JobIconSvg from "./assets/jobIconSvg";
import { useAuth } from "./context/NewAuthContext";

// Authentication Screens
import LoginScreen from "./screens/Login";
import Signup from "./screens/Signup";
import ForgotPasswordScreen from "./screens/ForgotPassword";
import Role from "./screens/Role";

// Main App Components
import LeaderboardScreen from "./screens/Leaderboard";
import ProfileStack from "./stacks/ProfileStack";
import IntroScreen from "./screens/Intro";
import HomeStack from "./stacks/HomeStack";
import Bird from "./screens/Bird";
import JobRequirementStack from "./stacks/JobRequirementStack";
import MarketPlaceStack from "./stacks/MarketPlaceStack";
import JobStack from "./stacks/JobStack";
import ClientHomeStack from "./stacks/ClientHomeStack";

// Individual Screens (for stack navigation)
import PortfolioScreen from "./screens/Portfolio";
import Chat from "./screens/Chat";
import Inbox from "./screens/Inbox";
import JobDetailsChatScreen from "./screens/JobDetailsChat";
import ReviewGive from "./screens/ReviewGive";
import PortfolioComScreen from "./screens/PortfolioCom";
import ChatList from "./screens/ChatList";
import OffersScreen from "./screens/Offers";
import ProfileScreen from "./screens/ProfileScreen";
import ReviewsScreen from "./screens/ReviewsScreen";
import SubmitSolutionScreen from "./screens/SubmitSolutionScreen";
import ViewSolutionsScreen from "./screens/ViewSolutionsScreen";
import UpdateJobDetailsScreen from "./screens/UpdateJobDetailsScreen";
import TermsAndConditionsScreen from "./screens/TermsAndConditionsScreen";
import PrivacyPolicyScreen from "./screens/PrivacyPolicyScreen";
import ClientSignupScreen from "./screens/ClientSignup";
import FreelancerSignupScreen from "./screens/FreelancerSignup";

import messaging from "@react-native-firebase/messaging";
import { AuthProvider } from "./context/NewAuthContext";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider } from "./context/ThemeContext";
import { NavigationContainer } from "@react-navigation/native";
import * as Linking from "expo-linking";

const linking = {
  prefixes: ['birdearner://', 'https://birdearner.com'],
  config: {
    screens: {
      MainTabs: {
        screens: {
          Profile: {
            screens: {
              ProfileScreen: {
                path: '/profile/:userId',
                parse: {
                  userId: (userId) => userId,
                },
              },
            },
          },
        },
      },
      // Direct access to ProfileScreen when not in tabs
      ProfileScreen: {
        path: '/profile/:userId',
        parse: {
          userId: (userId) => userId,
        },
      },
    },
  },
};

export default function MainApp() {
  console.log("hi");

  // Add debugging for deep links
  React.useEffect(() => {
    const handleDeepLink = (url) => {
      console.log('Deep link received:', url);
    };

    // Handle initial URL if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('Initial URL:', url);
        handleDeepLink(url);
      }
    });

    // Handle deep links while app is running
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    return () => subscription?.remove();
  }, []);

  return (
    <NavigationContainer 
      linking={linking}
      onStateChange={(state) => {
        console.log('Navigation state changed:', state);
      }}
    >
      <ThemeProvider>
        <AuthProvider>
          <App />
          <StatusBar style="auto" />
        </AuthProvider>
      </ThemeProvider>
    </NavigationContainer>
  );
}

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// MainTabs Component - Now used only after profile setup is complete
function MainTabs() {
  const { userData } = useAuth();
  const isClient = userData?.role === "CLIENT";

  const tabScreens = isClient
    ? [
        { name: "Home", component: ClientHomeStack },
        { name: "Job Posted", component: JobStack },
        { name: "Job Requirements", component: JobRequirementStack },
        { name: "AI Bird", component: Bird },
        { name: "Profile", component: ProfileStack },
      ]
    : [
        { name: "Home", component: HomeStack },
        { name: "Leaderboard", component: LeaderboardScreen },
        { name: "Marketplace", component: MarketPlaceStack },
        { name: "AI Bird", component: Bird },
        { name: "Profile", component: ProfileStack },
      ];

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBarStyle,
        tabBarIcon: ({ focused }) => renderTabIcon(route, focused),
      })}
    >
      {tabScreens.map((screen, index) => (
        <Tab.Screen
          key={index}
          name={screen.name}
          component={screen.component}
        />
      ))}
    </Tab.Navigator>
  );
}

// Role-based Dashboard Router - Routes to appropriate dashboard
function RoleDashboardRouter() {
  const { userData } = useAuth();

  if (!userData) {
    return null; // This shouldn't happen in authenticated state
  }

  // Route directly to role-specific dashboard
  // The dashboard will handle profile setup internally
  if (userData.role === "CLIENT") {
    return <ClientHomeStack />;
  } else {
    return <HomeStack />;
  }
}

// Function to render tab icons
function renderTabIcon(route, focused) {
  const iconColor = focused ? "#FFF" : "#fff";

  // Material Icons mapping
  const materialIcons = {
    "Job Requirements": "add",
  };

  // Lucide icons mapping
  const lucideIcons = {
    "Job Posted": "briefcase",
  };

  // Custom SVG icons mapping
  const customSvgIcons = {
    // Enable these custom SVGs - you can uncomment others as needed
    "Job Posted": JobIconSvg,
    "AI Bird": BirdEarnerSvg,
    Profile: UserSvg,
    Marketplace: MarketplaceSvg,
    Home: HomeSvg,
    Leaderboard: StatsSvg,
  };

  const materialIcon = materialIcons[route.name];
  const lucideIcon = lucideIcons[route.name];
  const customSvgIcon = customSvgIcons[route.name];

  // Priority: Custom SVG > Lucide > Material Icons
  if (customSvgIcon) {
    return renderCustomSvgIcon(focused, customSvgIcon, iconColor);
  } else if (lucideIcon) {
    return renderLucideIcon(focused, lucideIcon, iconColor);
  } else if (materialIcon) {
    return renderMaterialIcon(focused, materialIcon, iconColor);
  }
}

// Render Material Icons
function renderMaterialIcon(focused, iconName, iconColor) {
  return (
    <View style={focused ? styles.activeTab : styles.inactiveTab}>
      {focused ? (
        <LinearGradient
          colors={["#300E49", "#762BAD"]}
          style={styles.gradientBackground}
        >
          <MaterialIcons name={iconName} color={iconColor} size={30} />
        </LinearGradient>
      ) : (
        <MaterialIcons name={iconName} color={iconColor} size={30} />
      )}
    </View>
  );
}

// Render Custom SVG Icons
function renderCustomSvgIcon(focused, SvgComponent, iconColor) {
  return (
    <View style={focused ? styles.activeTab : styles.inactiveTab}>
      {focused ? (
        <LinearGradient
          colors={["#300E49", "#762BAD"]}
          style={styles.gradientBackground}
        >
          <SvgComponent width={30} height={30} fill={iconColor} />
        </LinearGradient>
      ) : (
        <SvgComponent width={30} height={30} fill={iconColor} />
      )}
    </View>
  );
}

// Render Lucide icons
function renderLucideIcon(focused, iconType, iconColor) {
  const IconComponent = iconType === "briefcase" ? Briefcase : LucideBird;

  return (
    <View style={focused ? styles.activeTab : styles.inactiveTab}>
      {focused ? (
        <LinearGradient
          colors={["#300E49", "#762BAD"]}
          style={styles.gradientBackground}
        >
          <IconComponent color={iconColor} size={30} />
        </LinearGradient>
      ) : (
        <IconComponent color={iconColor} size={30} />
      )}
    </View>
  );
}

async function requestUserPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log("Notification permission granted:", authStatus);
  } else {
    console.log("Notification permission denied:", authStatus);
  }
}

// Main App Component
export function App() {
  console.log("hi");
  const [skipTrackingHealthy, setSkipTrackingHealthy] = useState(true);
  const { userData, loading } = useAuth();

  async function requestUserPermission() {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log("Authorization status:", authStatus);
    }
  }

  useEffect(() => {
    try {
      if (requestUserPermission()) {
        messaging()
          .getToken()
          .then((token) => {
            console.log(token);
          });
      } else {
        console.log("Failed Auth Status", authStatus);
      }

      messaging()
        .getInitialNotification()
        .then(async (remoteMessage) => {
          if (remoteMessage) {
            console.log(
              "Notification caused app to open from quit state:",
              remoteMessage
            );
          }
        });

      messaging().onNotificationOpenedApp(async (remoteMessage) => {
        console.log(
          "Notification caused app to open from background state:",
          remoteMessage.notification
        );
      });

      // Register background handler
      messaging().setBackgroundMessageHandler(async (remoteMessage) => {
        console.log(
          "Message handled in the background!",
          remoteMessage.notification
        );
      });

      const unsubscribe = messaging().onMessage(async (remoteMessage) => {
        Alert.alert(
          "A new FCM message arrived!",
          JSON.stringify(remoteMessage)
        );
      });

      return unsubscribe;
    } catch (error) {
      console.log("Error in App.js", error);
    }
  }, []);

  // Always show intro screen first, let it handle navigation
  // No need for loading check here since Intro will handle it

  console.log("App: Rendering navigation - user authenticated:", !!userData);

  const options = {
    headerShown: Platform.OS === "ios",
    headerBackVisible: Platform.OS === "ios",
    headerBackTitleVisible: false,
    headerTitle: "",
    headerBackTitle: "Back",
  };

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="Intro"
    >
      {/* Intro/Splash Screen - Always shown first */}
      <Stack.Screen name="Intro" component={IntroScreen} />
      
      {userData ? (
        // Authenticated Stack - Route directly to role dashboard
        <>
          {/* Main App Tabs - Available after profile setup */}
          <Stack.Screen name="MainTabs" component={MainTabs} />

          {/* Role-based Dashboard Router - handles profile setup internally */}
          <Stack.Screen name="Dashboard" component={RoleDashboardRouter} />

          {/* Profile Setup Screens - Available for navigation */}
          <Stack.Screen name="Role" component={Role} />
          <Stack.Screen name="Portfolio" component={PortfolioScreen} />

          {/* Additional authenticated screens available for navigation */}
          <Stack.Screen name="Chat" component={Chat} />
          <Stack.Screen name="Inbox" component={Inbox} />
          <Stack.Screen name="Chatlist" component={ChatList} />
          <Stack.Screen
            name="JobDetailsChat"
            component={JobDetailsChatScreen}
          />
          <Stack.Screen name="PortfolioCom" component={PortfolioComScreen} />
          <Stack.Screen name="ProfileScreen" component={ProfileScreen} options={options} />
          <Stack.Screen name="Offers" component={OffersScreen} options={options} />
          <Stack.Screen name="ReviewGive" component={ReviewGive} />
          <Stack.Screen name="ReviewsScreen" component={ReviewsScreen} options={options} />
          <Stack.Screen
            name="SubmitSolution"
            component={SubmitSolutionScreen}
          />
          <Stack.Screen name="ViewSolutions" component={ViewSolutionsScreen} />
          <Stack.Screen
            name="UpdateJobDetailsScreen"
            component={UpdateJobDetailsScreen}
          />
          <Stack.Screen
            name="TermsAndConditions"
            component={TermsAndConditionsScreen}
          />
          <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
          <Stack.Screen name="ClientSignup" component={ClientSignupScreen} />
          <Stack.Screen
            name="FreelancerSignup"
            component={FreelancerSignupScreen}
          />
        </>
      ) : (
        // Non-Authenticated Stack - Login/Signup flow
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={Signup} />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
          />
          <Stack.Screen name="Role" component={Role} />
          <Stack.Screen name="ClientSignup" component={ClientSignupScreen} />
          <Stack.Screen
            name="FreelancerSignup"
            component={FreelancerSignupScreen}
          />
          <Stack.Screen
            name="TermsAndConditions"
            component={TermsAndConditionsScreen}
          />
          <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

// Shared Styles
const styles = StyleSheet.create({
  tabBarStyle: {
    backgroundColor: "#370F54",
    borderTopWidth: 0,
  },
  activeTab: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  inactiveTab: {
    justifyContent: "center",
    alignItems: "center",
  },
  gradientBackground: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    // borderRadius: 50,
  },
  customIcon: {
    width: 25,
    height: 25,
  },
});
