import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();

const MarketPlaceStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="MarketplaceScreen"
      getComponent={() => require('../screens/MarketplaceRefactored').default}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="MarketplaceJobs"
      getComponent={() => require('../screens/MarketplaceJobs').default}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="JobPriority"
      getComponent={() => require('../screens/JobPriority').default}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="JobDescription"
      getComponent={() => require('../screens/JobDescription').default}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="ClientChat"
      getComponent={() => require('../screens/ClientChat').default}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="FreelancerChat"
      getComponent={() => require('../screens/FreelancerChat').default}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

export default MarketPlaceStack;
