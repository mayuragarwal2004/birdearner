import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();

const JobStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="JobsPostedScreen"
      getComponent={() => require('../screens/JobsPosted').default}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="AppliersScreen"
      getComponent={() => require('../screens/Appliers').default}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="ClientChat"
      getComponent={() => require('../screens/ClientChat').default}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

export default JobStack;
