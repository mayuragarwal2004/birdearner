import React, { useEffect } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { LinearGradient } from "expo-linear-gradient";
import { View, StyleSheet, Platform, Text } from "react-native";
import * as LucideIcons from "lucide-react-native";

const getLucideIcon = (name) => LucideIcons[name]?.default || LucideIcons[name];
const Briefcase = getLucideIcon("Briefcase");
const ChartColumn = getLucideIcon("ChartColumn");
const ClipboardPen = getLucideIcon("ClipboardPen");
const House = getLucideIcon("House");
const LucideBird = getLucideIcon("Bird");
const Plus = getLucideIcon("Plus");

// Lightweight assets needed for the tab bar (keep these eager)
import BirdEarnerSvg from "./assets/BirdEarnerSvg";
import MarketplaceSvg from "./assets/MarketplaceSvg";
import UserSvg from "./assets/UserSvg";
import { useAuth, AuthProvider } from "./context/NewAuthContext";

// Only the first-paint screen is eager — everything else loads on demand
import IntroScreen from "./screens/Intro";

import { SWRProvider } from "./providers/SWRProvider";
import Toast from "react-native-toast-message";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider } from "./context/ThemeContext";
import { KeyboardProvider, useKeyboard } from "./context/KeyboardContext";
import { NavigationContainer } from "@react-navigation/native";
import { navigationRef } from "./lib/navigationRef";
import * as Linking from "expo-linking";
import apiService from "./lib/apiService";

// Lazy getters — React Navigation only requires these when the screen opens
const getLoginScreen = () => require("./screens/Login").default;
const getSignupScreen = () => require("./screens/Signup").default;
const getForgotPasswordScreen = () => require("./screens/ForgotPassword").default;
const getResetPasswordScreen = () => require("./screens/ResetPassword").default;
const getRoleScreen = () => require("./screens/Role").default;
const getLeaderboardScreen = () => require("./screens/Leaderboard").default;
// Stable wrapper components for profile tabs (avoids infinite re-render from getComponent)
const ClientProfileTab = (props) => {
  const ProfileStack = require("./stacks/ProfileStack").default;
  return <ProfileStack {...props} initialRouteName="MyProfile" />;
};
const SettingsProfileTab = (props) => {
  const ProfileStack = require("./stacks/ProfileStack").default;
  return <ProfileStack {...props} initialRouteName="Settings" />;
};

const getProfileStack = () => require("./stacks/ProfileStack").default;
const getClientProfileTab = () => ClientProfileTab;
const getSettingsProfileTab = () => SettingsProfileTab;
const getHomeStack = () => require("./stacks/HomeStack").default;
const getBirdScreen = () => require("./screens/Bird").default;
const getJobRequirementStack = () => require("./stacks/JobRequirementStack").default;
const getMarketPlaceStack = () => require("./stacks/MarketPlaceStack").default;
const getJobStack = () => require("./stacks/JobStack").default;
const getClientHomeStack = () => require("./stacks/ClientHomeStack").default;
const getPortfolioScreen = () => require("./screens/Portfolio").default;
const getChatScreen = () => require("./screens/Chat").default;
const getInboxScreen = () => require("./screens/Inbox").default;
const getJobDetailsChatScreen = () => require("./screens/JobDetailsChat").default;
const getReviewGiveScreen = () => require("./screens/ReviewGive").default;
const getPortfolioComScreen = () => require("./screens/PortfolioCom").default;
const getChatListScreen = () => require("./screens/ChatList").default;
const getOffersScreen = () => require("./screens/Offers").default;
const getProfileScreen = () => require("./screens/ProfileScreen").default;
const getReviewsScreen = () => require("./screens/ReviewsScreen").default;
const getSubmitSolutionScreen = () => require("./screens/SubmitSolutionScreen").default;
const getViewSolutionsScreen = () => require("./screens/ViewSolutionsScreen").default;
const getUpdateJobDetailsScreen = () => require("./screens/UpdateJobDetailsScreen").default;
const getTermsAndConditionsScreen = () => require("./screens/TermsAndConditionsScreen").default;
const getPrivacyPolicyScreen = () => require("./screens/PrivacyPolicyScreen").default;
const getClientSignupScreen = () => require("./screens/ClientSignup").default;
const getFreelancerSignupScreen = () => require("./screens/FreelancerSignup").default;
const getOtpVerificationScreen = () => require("./screens/OtpVerification").default;

// Toast Configuration
const toastConfig = {
  success: (props) => (
    <View style={[styles.toastContainer, styles.successToast]}>
      <Text style={styles.toastTitle}>{props.text1}</Text>
      {props.text2 ? <Text style={styles.toastMessage}>{props.text2}</Text> : null}
    </View>
  ),
  error: (props) => (
    <View style={[styles.toastContainer, styles.errorToast]}>
      <Text style={styles.toastTitle}>{props.text1}</Text>
      {props.text2 ? <Text style={styles.toastMessage}>{props.text2}</Text> : null}
    </View>
  ),
  warning: (props) => (
    <View style={[styles.toastContainer, styles.warningToast]}>
      <Text style={styles.toastTitle}>{props.text1}</Text>
      {props.text2 ? <Text style={styles.toastMessage}>{props.text2}</Text> : null}
    </View>
  ),
  info: (props) => (
    <View style={[styles.toastContainer, styles.infoToast]}>
      <Text style={styles.toastTitle}>{props.text1}</Text>
      {props.text2 ? <Text style={styles.toastMessage}>{props.text2}</Text> : null}
    </View>
  ),
};

const linking = {
  prefixes: [
    "birdearner://",
    "https://birdearner.com",
    "https://app.birdearner.com",
    "https://web.birdearner.com",
    "http://localhost:3000",
    "http://localhost:3001",
  ],
  config: {
    screens: {
      // Direct access to ProfileScreen (view another user's profile)
      ProfileScreen: {
        path: "/profile/:userId",
        parse: {
          userId: (userId) => userId,
        },
      },
      // Password Reset
      ResetPassword: {
        path: "/auth/reset-password/:token",
        parse: {
          token: (token) => token,
        },
      },
    },
  },
};

export default function MainApp() {
  // Add debugging for deep links
  React.useEffect(() => {
    const handleDeepLink = (url) => {
      // Handle deep link navigation logic here
      // TODO: Implement proper deep link routing
    };

    // Handle initial URL if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    // Handle deep links while app is running
    const subscription = Linking.addEventListener("url", ({ url }) => {
      handleDeepLink(url);
    });

    return () => subscription?.remove();
  }, []);

  return (
    <NavigationContainer linking={linking} ref={navigationRef}>
      <ThemeProvider>
        <AuthProvider>
          <KeyboardProvider>
            <SWRProvider>
              <App />
            </SWRProvider>
          </KeyboardProvider>
          <StatusBar style="auto" />
        </AuthProvider>
      </ThemeProvider>
      <Toast config={toastConfig} />
    </NavigationContainer>
  );
}

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// MainTabs Component - Now used only after profile setup is complete
function MainTabs() {
  const { userData } = useAuth();
  const { isKeyboardVisible } = useKeyboard();
  const isClient = userData?.role === "CLIENT";

  const tabScreens = isClient
    ? [
      { name: "Home", getComponent: getClientHomeStack },
      { name: "Job Posted", getComponent: getJobStack },
      { name: "Job Requirements", getComponent: getJobRequirementStack },
      { name: "AI Bird", getComponent: getBirdScreen },
      { name: "Settings", getComponent: getSettingsProfileTab },
    ]
    : [
      { name: "Home", getComponent: getHomeStack },
      { name: "Leaderboard", getComponent: getLeaderboardScreen },
      { name: "Marketplace", getComponent: getMarketPlaceStack },
      { name: "AI Bird", getComponent: getBirdScreen },
      { name: "Settings", getComponent: getSettingsProfileTab },
    ];

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarStyle: [
          styles.tabBarStyle,
          isKeyboardVisible && { display: 'none' }
        ],
        tabBarIcon: ({ focused }) => renderTabIcon(route, focused),
        tabBarActiveTintColor: "#FFFFFF",
        tabBarInactiveTintColor: "#C4B5FD",
        tabBarItemStyle: styles.tabBarItem,
        tabBarHideOnKeyboard: true,
        tabBarVisibilityAnimationConfig: {
          show: {
            animation: "timing",
            config: {
              duration: 150,
            },
          },
          hide: {
            animation: "timing",
            config: {
              duration: 150,
            },
          },
        },
      })}
    >
      {tabScreens.map((screen, index) => (
        <Tab.Screen
          key={index}
          name={screen.name}
          getComponent={screen.getComponent}
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
  const DashboardStack =
    userData.role === "CLIENT" ? getClientHomeStack() : getHomeStack();
  return <DashboardStack />;
}

// Function to render tab icons
function renderTabIcon(route, focused) {
  const activeColor = "#FFFFFF";
  const inactiveColor = "#C4B5FD";

  // Material Icons mapping
  const materialIcons = {};

  // Lucide icons mapping
  const lucideIcons = {
    "Job Posted": Briefcase,
    "Job Posted": ClipboardPen,
    "Job Requirements": Plus,
    Home: House,
    "Leaderboard": ChartColumn,
  };

  // Custom SVG icons mapping
  const customSvgIcons = {
    // Enable these custom SVGs - you can uncomment others as needed
    "AI Bird": BirdEarnerSvg,
    Profile: UserSvg,
    Settings: UserSvg,
    Marketplace: MarketplaceSvg,
  };

  const materialIcon = materialIcons[route.name];
  const lucideIcon = lucideIcons[route.name];
  const customSvgIcon = customSvgIcons[route.name];

  // Priority: Custom SVG > Lucide > Material Icons
  if (customSvgIcon) {
    return renderCustomSvgIcon(
      focused,
      customSvgIcon,
      focused ? activeColor : inactiveColor
    );
  } else if (lucideIcon) {
    return renderLucideIcon(
      focused,
      lucideIcon,
      focused ? activeColor : inactiveColor
    );
  } else if (materialIcon) {
    return renderMaterialIcon(
      focused,
      materialIcon,
      focused ? activeColor : inactiveColor
    );
  }
}

// Render Material Icons
function renderMaterialIcon(focused, iconName, iconColor) {
  return (
    <View style={styles.iconContainer}>
      <View style={[styles.iconWrapper, focused && styles.activeIconWrapper]}>
        {focused ? (
          <LinearGradient
            colors={["#762BAD", "#300E49"]}
            style={styles.gradientBackground}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialIcons name={iconName} color="#FFFFFF" size={22} />
          </LinearGradient>
        ) : (
          <View style={styles.inactiveIconBackground}>
            <MaterialIcons name={iconName} color="#C4B5FD" size={22} />
          </View>
        )}
      </View>
    </View>
  );
}

// Render Custom SVG Icons
function renderCustomSvgIcon(focused, SvgComponent, iconColor) {
  const activeColor = "#FFFFFF";
  const inactiveColor = "#C4B5FD";

  const SvgItem = SvgComponent?.default || SvgComponent;
  if (!SvgItem || (typeof SvgItem !== "function" && typeof SvgItem !== "object")) {
    return null;
  }

  return (
    <View style={styles.iconContainer}>
      <View style={[styles.iconWrapper, focused && styles.activeIconWrapper]}>
        {focused ? (
          <LinearGradient
            colors={["#762BAD", "#300E49"]}
            style={styles.gradientBackground}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={[styles.svgIconWrapper, { tintColor: activeColor }]}>
              <SvgItem
                width={22}
                height={22}
                fill={activeColor}
                color={activeColor}
                fillColor={activeColor}
                strokeColor={activeColor}
              />
            </View>
          </LinearGradient>
        ) : (
          <View style={styles.inactiveIconBackground}>
            <View style={[styles.svgIconWrapper, { tintColor: inactiveColor }]}>
              <SvgItem
                width={22}
                height={22}
                fill={inactiveColor}
                color={inactiveColor}
                fillColor={inactiveColor}
                strokeColor={inactiveColor}
              />
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

// Render Lucide icons
function renderLucideIcon(focused, IconComponent = LucideBird, iconColor) {
  const Icon = IconComponent?.default || IconComponent || LucideBird?.default || LucideBird;
  if (!Icon || (typeof Icon !== "function" && typeof Icon !== "object")) {
    return null;
  }

  return (
    <View style={styles.iconContainer}>
      <View style={[styles.iconWrapper, focused && styles.activeIconWrapper]}>
        {focused ? (
          <LinearGradient
            colors={["#762BAD", "#300E49"]}
            style={styles.gradientBackground}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Icon color="#FFFFFF" size={22} />
          </LinearGradient>
        ) : (
          <View style={styles.inactiveIconBackground}>
            <Icon color="#C4B5FD" size={22} />
          </View>
        )}
      </View>
    </View>
  );
}

// Main App Component
export function App() {
  const { userData } = useAuth();
  const getMessaging = () => require("@react-native-firebase/messaging").default;

  async function requestUserPermission() {
    try {
      const messaging = getMessaging();
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      return enabled;
    } catch (error) {
      console.error("Error requesting push notification permission:", error);
      return false;
    }
  }

  // Use a ref to prevent multiple registrations in the same session/load
  const isRegisteredRef = React.useRef(false);

  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        if (!userData?.id || isRegisteredRef.current) return;

        const hasPermission = await requestUserPermission();
        if (hasPermission) {
          const messaging = getMessaging();
          const token = await messaging().getToken();
          // Sending token to backend
          await apiService.registerPushToken(userData.id, userData.role, token);
          console.log("Push token registered once for this session:", token);
          isRegisteredRef.current = true;
        }
      } catch (error) {
        console.error("Error initializing push notifications:", error);
      }
    };

    const setupMessageHandlers = () => {
      const messaging = getMessaging();

      // Handle initial notification when app was opened from killed state
      messaging()
        .getInitialNotification()
        .then(async (remoteMessage) => {
          if (remoteMessage) {
            console.log("Notification caused app to open from quit state:", remoteMessage);
            // Navigate based on data if needed
          }
        });

      // Handle notification when app is opened from background
      const onNotificationOpenedAppSub = messaging().onNotificationOpenedApp(async (remoteMessage) => {
        console.log("Notification caused app to open from background:", remoteMessage);
        // Navigate based on data if needed
      });

      // Handle foreground messages
      const onMessageSub = messaging().onMessage(async (remoteMessage) => {
        // Show Toast for foreground message instead of Alert
        Toast.show({
          type: 'info',
          text1: remoteMessage?.notification?.title || "New Notification",
          text2: remoteMessage?.notification?.body,
          position: 'top',
          visibilityTime: 4000,
        });
      });

      return () => {
        onNotificationOpenedAppSub();
        onMessageSub();
      };
    };

    let cleanupHandlers = () => {};
    const startupTimer = setTimeout(() => {
      initializeNotifications();
      cleanupHandlers = setupMessageHandlers();
    }, __DEV__ ? 1500 : 600);

    return () => {
      clearTimeout(startupTimer);
      cleanupHandlers();
    };
  }, [userData?.id, userData?.role]);

  // Always show intro screen first, let it handle navigation
  // No need for loading check here since Intro will handle it

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
          <Stack.Screen name="Role" getComponent={getRoleScreen} />
          <Stack.Screen name="Portfolio" getComponent={getPortfolioScreen} />

          {/* Additional authenticated screens available for navigation */}
          <Stack.Screen name="Chat" getComponent={getChatScreen} />
          <Stack.Screen name="Inbox" getComponent={getInboxScreen} />
          <Stack.Screen name="Chatlist" getComponent={getChatListScreen} />
          <Stack.Screen
            name="JobDetailsChat"
            getComponent={getJobDetailsChatScreen}
          />
          <Stack.Screen name="PortfolioCom" getComponent={getPortfolioComScreen} />
          <Stack.Screen
            name="ProfileScreen"
            getComponent={getProfileScreen}
            options={options}
          />
          <Stack.Screen
            name="Offers"
            getComponent={getOffersScreen}
            options={options}
          />
          <Stack.Screen name="ReviewGive" getComponent={getReviewGiveScreen} />
          <Stack.Screen
            name="ReviewsScreen"
            getComponent={getReviewsScreen}
            options={options}
          />
          <Stack.Screen
            name="SubmitSolution"
            getComponent={getSubmitSolutionScreen}
          />
          <Stack.Screen name="ViewSolutions" getComponent={getViewSolutionsScreen} />
          <Stack.Screen
            name="UpdateJobDetailsScreen"
            getComponent={getUpdateJobDetailsScreen}
          />
          <Stack.Screen
            name="TermsAndConditions"
            getComponent={getTermsAndConditionsScreen}
          />
          <Stack.Screen name="PrivacyPolicy" getComponent={getPrivacyPolicyScreen} />
          <Stack.Screen name="ClientSignup" getComponent={getClientSignupScreen} />
          <Stack.Screen
            name="FreelancerSignup"
            getComponent={getFreelancerSignupScreen}
          />
          <Stack.Screen
            name="OtpVerification"
            getComponent={getOtpVerificationScreen}
          />
        </>
      ) : (
        // Non-Authenticated Stack - Login/Signup flow
        <>
          <Stack.Screen name="Login" getComponent={getLoginScreen} />
          <Stack.Screen name="Signup" getComponent={getSignupScreen} />
          <Stack.Screen
            name="ForgotPassword"
            getComponent={getForgotPasswordScreen}
          />
          <Stack.Screen
            name="ResetPassword"
            getComponent={getResetPasswordScreen}
          />
          <Stack.Screen name="Role" getComponent={getRoleScreen} />
          <Stack.Screen name="ClientSignup" getComponent={getClientSignupScreen} />
          <Stack.Screen
            name="FreelancerSignup"
            getComponent={getFreelancerSignupScreen}
          />
          <Stack.Screen
            name="OtpVerification"
            getComponent={getOtpVerificationScreen}
          />
          <Stack.Screen
            name="TermsAndConditions"
            getComponent={getTermsAndConditionsScreen}
          />
          <Stack.Screen name="PrivacyPolicy" getComponent={getPrivacyPolicyScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

// Shared Styles
const styles = StyleSheet.create({
  tabBarStyle: {
    backgroundColor: "#2A1B3D",
    borderTopWidth: 0.5,
    borderTopColor: "rgba(118, 43, 173, 0.3)",
    height: Platform.OS === "ios" ? 85 : 70,
    paddingBottom: Platform.OS === "ios" ? 20 : 8,
    paddingTop: 8,
    paddingHorizontal: 10,
    elevation: 15,
    shadowColor: "#762BAD",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabBarItem: {
    paddingVertical: 3,
    paddingHorizontal: 2,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  tabBarLabel: {
    fontSize: 9,
    fontWeight: "600",
    marginTop: 10,
    textTransform: "capitalize",
    letterSpacing: 0.3,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 0.5 },
    textShadowRadius: 1,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 1,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    transition: "all 0.2s ease-in-out",
  },
  activeIconWrapper: {
    transform: [{ scale: 1.1 }],
    shadowColor: "#762BAD",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  gradientBackground: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  inactiveIconBackground: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  customIcon: {
    width: 22,
    height: 22,
  },
  svgIconWrapper: {
    justifyContent: "center",
    alignItems: "center",
  },
  // Toast Styles
  toastContainer: {
    height: 80,
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderLeftWidth: 5,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  successToast: {
    borderLeftColor: "#28a745",
    backgroundColor: "#d4edda",
  },
  errorToast: {
    borderLeftColor: "#dc3545",
    backgroundColor: "#f8d7da",
  },
  warningToast: {
    borderLeftColor: "#ffc107",
    backgroundColor: "#fff3cd",
  },
  infoToast: {
    borderLeftColor: "#17a2b8",
    backgroundColor: "#d1ecf1",
  },
  toastTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  toastMessage: {
    fontSize: 14,
    color: "#666",
    lineHeight: 18,
  },
});
