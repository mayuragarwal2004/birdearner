import React, { useState, useEffect } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { View, StyleSheet, Image, Alert } from "react-native";
import { useAuth } from "./context/AuthContext";
import LoginScreen from "./screens/Login";
import LeaderboardScreen from "./screens/Leaderboard";
import ProfileStack from "./stacks/ProfileStack";
import IntroScreen from "./screens/Intro";
import HomeStack from "./stacks/HomeStack";
import Bird from "./screens/Bird";
import JobRequirementStack from "./stacks/JobRequirementStack";
import MarketPlaceStack from "./stacks/MarketPlaceStack";
import JobStack from "./stacks/JobStack";
import ClientHomeStack from "./stacks/ClientHomeStack";
import Signup from "./screens/Signup";
import PortfolioScreen from "./screens/Portfolio";
import Chat from "./screens/Chat";
import DescribeRole from "./screens/DescribeRole";
import TellUsAboutYouScreen from "./screens/TellUsAboutYou";
import Inbox from "./screens/Inbox";
import JobDetailsChatScreen from "./screens/JobDetailsChat";
import ReviewGive from "./screens/ReviewGive";
import ForgotPasswordScreen from "./screens/ForgotPassword";
import Role from "./screens/Role";
import PortfolioComScreen from "./screens/PortfolioCom";
import ChatList from "./screens/ChatList";
import OffersScreen from "./screens/Offers";
import DescribeRoleCom from "./screens/DescribeRoleCom";
import ProfileScreen from "./screens/ProfileScreen";
import ReviewsScreen from "./screens/ReviewsScreen";
import SubmitSolutionScreen from "./screens/SubmitSolutionScreen";
import ViewSolutionsScreen from "./screens/ViewSolutionsScreen";
import UpdateJobDetailsScreen from "./screens/UpdateJobDetailsScreen";

import messaging from "@react-native-firebase/messaging";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// MainTabs Component
function MainTabs() {
  const { userData } = useAuth();
  const isClient = userData?.role === "client";

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

// Function to render tab icons
function renderTabIcon(route, focused) {
  const iconColor = focused ? "#FFF" : "#fff";
  const icons = {
    Home: "home",
    Leaderboard: "leaderboard",
    Marketplace: "storefront",
    "Job Requirements": "add",
    Profile: "person",
  };
  const customIcons = {
    "Job Posted": require("./assets/jobIcon.png"),
    "AI Bird": require("./assets/bird.png"),
  };

  const iconName = icons[route.name];
  const customIcon = customIcons[route.name];

  return customIcon
    ? renderCustomIcon(focused, customIcon)
    : renderDefaultIcon(focused, iconName, iconColor);
}

// Render default icon
function renderDefaultIcon(focused, iconName, iconColor) {
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

// Render custom icons
function renderCustomIcon(focused, source) {
  return (
    <View style={focused ? styles.activeTab : styles.inactiveTab}>
      {focused ? (
        <LinearGradient
          colors={["#300E49", "#762BAD"]}
          style={styles.gradientBackground}
        >
          <Image source={source} style={styles.customIcon} />
        </LinearGradient>
      ) : (
        <Image source={source} style={styles.customIcon} />
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
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { user, loading } = useAuth();

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

  useEffect(() => {
    setIsAuthenticated(!!user);
  }, [user]);

  if (loading) {
    return <IntroScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Tabs" component={MainTabs} />
          <Stack.Screen name="Inbox" component={Inbox} />
          <Stack.Screen name="Chat" component={Chat} />
          <Stack.Screen name="ReviewGive" component={ReviewGive} />
          <Stack.Screen
            name="JobDetailsChat"
            component={JobDetailsChatScreen}
          />
          <Stack.Screen name="PortfolioCom" component={PortfolioComScreen} />
          <Stack.Screen
            name="TellUsAboutYouCom"
            component={TellUsAboutYouScreen}
          />
          <Stack.Screen name="DescribeRoleCom" component={DescribeRoleCom} />
          <Stack.Screen name="Chatlist" component={ChatList} />
          <Stack.Screen name="Offers" component={OffersScreen} />
          <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
          <Stack.Screen name="ReviewsScreen" component={ReviewsScreen} />
          <Stack.Screen
            name="SubmitSolution"
            component={SubmitSolutionScreen}
          />
          <Stack.Screen name="ViewSolutions" component={ViewSolutionsScreen} />
          <Stack.Screen
            name="UpdateJobDetailsScreen"
            component={UpdateJobDetailsScreen}
          />
          <Stack.Screen name="Portfolio" component={PortfolioScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={Signup} />
          <Stack.Screen name="DescribeRole" component={DescribeRole} />
          <Stack.Screen
            name="TellUsAboutYou"
            component={TellUsAboutYouScreen}
          />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
          />
          <Stack.Screen name="Role" component={Role} />
          <Stack.Screen name="Portfolio" component={PortfolioScreen} />
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
