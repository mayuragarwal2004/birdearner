import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MarketplaceScreen from '../screens/Marketplace';
import JobPriority from '../screens/JobPriority';
import JobDescriptionScreen from '../screens/JobDescription';
import Chat from '../screens/Chat';
import ClientChat from '../screens/ClientChat';
import FreelancerChat from '../screens/FreelancerChat';


const Stack = createStackNavigator();

const MarketPlaceStack = () => 
   (
    <Stack.Navigator>
      <Stack.Screen
        name="MarketplaceScreen"
        component={MarketplaceScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="JobPriority"
        component={JobPriority}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="JobDescription"
        component={JobDescriptionScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="ClientChat"
        component={ClientChat}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="FreelancerChat"
        component={FreelancerChat}
        options={{headerShown: false}}
      />
    </Stack.Navigator>
  );

  export default MarketPlaceStack;