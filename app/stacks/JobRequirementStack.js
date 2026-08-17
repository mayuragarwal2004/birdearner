import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();

const JobRequirementStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="JobRequirements"
      getComponent={() => require('../screens/JobRequirements').default}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="JobDetails"
      getComponent={() => require('../screens/JobDetails').default}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="JobSubmissionTimmer"
      getComponent={() => require('../screens/JobSubmissionTimmer').default}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Payment"
      getComponent={() => require('../screens/PaymentScreen').default}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

export default JobRequirementStack;
