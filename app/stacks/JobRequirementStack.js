import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import JobRequirementsScreen from '../screens/JobRequirements';
import JobDetailsScreen from '../screens/JobDetails';
import JobSubmissionTimmerScreen from '../screens/JobSubmissionTimmer';
import WalletClientScreen from '../screens/WalletClient';
import PaymentScreen from '../screens/PaymentScreen';


const Stack = createStackNavigator();

const JobRequirementStack = () =>
(
  <Stack.Navigator>
    <Stack.Screen
      name="JobRequirements"
      component={JobRequirementsScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="JobDetails"
      component={JobDetailsScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="JobSubmissionTimmer"
      component={JobSubmissionTimmerScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="WalletClient"
      component={WalletClientScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Payment"
      component={PaymentScreen}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);


export default JobRequirementStack