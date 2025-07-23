import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import JobsPostedScreen from '../screens/JobsPosted';
import AppliersScreen from '../screens/Appliers';
import Chat from '../screens/Chat';
import ClientChat from '../screens/ClientChat';


const Stack = createStackNavigator();

const JobStack = () =>
(
  <Stack.Navigator>
    <Stack.Screen
      name="JobsPostedScreen"
      component={JobsPostedScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="AppliersScreen"
      component={AppliersScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="ClientChat"
      component={ClientChat}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

export default JobStack;