import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import NotificationScreen from "../screens/Notification";
import HomeScreen from "../screens/Home";
import ClientChatList from "../screens/ClientChatList";
import ClientChat from "../screens/ClientChat";
import ClientHomeScreen from "../screens/ClientHome";
import Inbox from "../screens/Inbox";

const Stack = createStackNavigator();

const ClientHomeStack = () =>
(
  <Stack.Navigator>
    <Stack.Screen
      name="HomeScreen"
      component={ClientHomeScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Notification"
      component={NotificationScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="ClientChatList"
      component={ClientChatList}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="ClientChat"
      component={ClientChat}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Inbox"
      component={Inbox}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);


export default ClientHomeStack;