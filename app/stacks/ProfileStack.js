import React from "react";
import { createStackNavigator } from "@react-navigation/stack";

const Stack = createStackNavigator();

const ProfileStack = ({ initialRouteName = "MyProfile" }) => (
  <Stack.Navigator initialRouteName={initialRouteName}>
    <Stack.Screen
      name="MyProfile"
      getComponent={() => require("../screens/MyProfile").default}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="MyReview"
      getComponent={() => require("../screens/MyReview").default}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Settings"
      getComponent={() => require("../screens/Settings").default}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Availability"
      getComponent={() => require("../screens/Availability").default}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Password update"
      getComponent={() => require("../screens/PasswordUpdate").default}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Email update"
      getComponent={() => require("../screens/EmailUpdate").default}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Withdrawal Earning"
      getComponent={() => require("../screens/WithdrawalEarning").default}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Bank Account details"
      getComponent={() => require("../screens/BankAccountdetails").default}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Notifications Setting"
      getComponent={() => require("../screens/NotificationsSetting").default}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Appearance"
      getComponent={() => require("../screens/Appearance").default}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="WalletFreelancer"
      getComponent={() => require("../screens/WalletFreelancer").default}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="WalletClient"
      getComponent={() => require("../screens/WalletClient").default}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Payment"
      getComponent={() => require("../screens/PaymentScreen").default}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="DeleteAccount"
      getComponent={() => require("../screens/DeleteAccount").default}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Security"
      getComponent={() => require("../screens/SecurityScreen").default}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="TermsAndConditions"
      getComponent={() => require("../screens/TermsAndConditionsScreen").default}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Feedback"
      getComponent={() => require("../screens/FeedbackScreen").default}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="PrivacyPolicy"
      getComponent={() => require("../screens/PrivacyPolicyScreen").default}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="BlogsAndForum"
      getComponent={() => require("../screens/BlogsAndForumScreen").default}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Portfolio"
      getComponent={() => require("../screens/Portfolio").default}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="FreelancerJobHistory"
      getComponent={() => require("../screens/FreelancerJobHistory").default}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="ManageAddresses"
      getComponent={() => require("../screens/ManageAddresses").default}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="ClientSignup"
      getComponent={() => require("../screens/ClientSignup").default}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="FreelancerSignup"
      getComponent={() => require("../screens/FreelancerSignup").default}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

export default ProfileStack;
