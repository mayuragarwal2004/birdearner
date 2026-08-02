import React from "react";
import { createStackNavigator } from "@react-navigation/stack";

const Stack = createStackNavigator();

const ClientHomeStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="HomeScreen"
      getComponent={() => require("../screens/ClientHome").default}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Notification"
      getComponent={() => require("../screens/Notification").default}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="ClientChatList"
      getComponent={() => require("../screens/ClientChatList").default}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="ClientChat"
      getComponent={() => require("../screens/ClientChat").default}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Inbox"
      getComponent={() => require("../screens/Inbox").default}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

export default ClientHomeStack;
