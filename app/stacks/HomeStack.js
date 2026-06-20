import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import NotificationScreen from "../screens/Notification";
import HomeScreen from "../screens/Home";
import FreelancerChatList from "../screens/FreelancerChatList";
import FreelancerChat from "../screens/FreelancerChat";
import Inbox from "../screens/Inbox";
import SettleBalanceScreen from "../screens/SettleBalance";
import EarningsOverview from "../screens/EarningsOverview";
import OrdersOverview from "../screens/OrdersOverview";
import ProfileOverview from "../screens/ProfileOverview";
import WithdrawalEarningScreen from "../screens/WithdrawalEarning";
const Stack = createStackNavigator();

const HomeStack = () =>
(
  <Stack.Navigator>
    <Stack.Screen
      name="HomeScreen"
      component={HomeScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Notification"
      component={NotificationScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Inbox"
      component={Inbox}
      options={{
        headerShown: false,
        tabBarStyle: { display: "block" },
      }}
    />
    <Stack.Screen
      name="FreelancerChatList"
      component={FreelancerChatList}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="FreelancerChat"
      component={FreelancerChat}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="SettleBalance"
      component={SettleBalanceScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="EarningsOverview"
      component={EarningsOverview}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="OrdersOverview"
      component={OrdersOverview}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="ProfileOverview"
      component={ProfileOverview}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="WithdrawalEarning"
      component={WithdrawalEarningScreen}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

export default HomeStack;
