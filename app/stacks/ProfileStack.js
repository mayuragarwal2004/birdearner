import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import MyProfileScreen from "../screens/MyProfile";
import MyReviewScreen from "../screens/MyReview";
import AvailabilityScreen from "../screens/Availability";
import SettingsScreen from "../screens/Settings";
import PasswordUpdateScreen from "../screens/PasswordUpdate";
import EmailUpdateScreen from "../screens/EmailUpdate";
import WithdrawalEarningScreen from "../screens/WithdrawalEarning";
import BankAccountdetailsScreen from "../screens/BankAccountdetails";
import NotificationsSettingScreen from "../screens/NotificationsSetting";
import AppearanceScreen from "../screens/Appearance";
import PaymentScreen from "../screens/PaymentScreen";
import WalletClientScreen from "../screens/WalletClient";
import SecurityScreen from "../screens/SecurityScreen";
import TermsAndConditionsScreen from "../screens/TermsAndConditionsScreen";
import FeedbackScreen from "../screens/FeedbackScreen";
import PrivacyPolicyScreen from "../screens/PrivacyPolicyScreen";
import BlogsAndForumScreen from "../screens/BlogsAndForumScreen";
import PortfolioScreen from "../screens/Portfolio";
import DeleteAccountScreen from "../screens/DeleteAccount";
import WalletFreelancerScreen from "../screens/WalletFreelancer";
import ManageAddressesScreen from "../screens/ManageAddresses";

const Stack = createStackNavigator();

const ProfileStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="MyProfile"
      component={MyProfileScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="MyReview"
      component={MyReviewScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Settings"
      component={SettingsScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Availability"
      component={AvailabilityScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Password update"
      component={PasswordUpdateScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Email update"
      component={EmailUpdateScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Withdrawal Earning"
      component={WithdrawalEarningScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Bank Account details"
      component={BankAccountdetailsScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Notifications Setting"
      component={NotificationsSettingScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Appearance"
      component={AppearanceScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="WalletFreelancer"
      component={WalletFreelancerScreen}
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
    <Stack.Screen
      name="DeleteAccount"
      component={DeleteAccountScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Security"
      component={SecurityScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="TermsAndConditions"
      component={TermsAndConditionsScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Feedback"
      component={FeedbackScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="PrivacyPolicy"
      component={PrivacyPolicyScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="BlogsAndForum"
      component={BlogsAndForumScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Portfolio"
      component={PortfolioScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="ManageAddresses"
      component={ManageAddressesScreen}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

export default ProfileStack;
