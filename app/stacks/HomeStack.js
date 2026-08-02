import React from "react";
import { createStackNavigator } from "@react-navigation/stack";

const Stack = createStackNavigator();

const HomeStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="HomeScreen"
      getComponent={() => require("../screens/Home").default}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Notification"
      getComponent={() => require("../screens/Notification").default}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Inbox"
      getComponent={() => require("../screens/Inbox").default}
      options={{
        headerShown: false,
        tabBarStyle: { display: "block" },
      }}
    />
    <Stack.Screen
      name="FreelancerChatList"
      getComponent={() => require("../screens/FreelancerChatList").default}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="FreelancerChat"
      getComponent={() => require("../screens/FreelancerChat").default}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="SettleBalance"
      getComponent={() => require("../screens/SettleBalance").default}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="EarningsOverview"
      getComponent={() => require("../screens/EarningsOverview").default}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="OrdersOverview"
      getComponent={() => require("../screens/OrdersOverview").default}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="ProfileOverview"
      getComponent={() => require("../screens/ProfileOverview").default}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="WithdrawalEarning"
      getComponent={() => require("../screens/WithdrawalEarning").default}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

export default HomeStack;
