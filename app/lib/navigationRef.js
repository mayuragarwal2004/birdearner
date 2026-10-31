import { CommonActions, createNavigationContainerRef } from "@react-navigation/native";

export const navigationRef = createNavigationContainerRef();

export function resetToLogin() {
  if (!navigationRef.isReady()) return;

  try {
    navigationRef.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "Login" }],
      })
    );
  } catch (error) {
    console.warn("Failed to reset navigation to Login:", error?.message || error);
  }
}

export function resetToAttachPhone() {
  if (!navigationRef.isReady()) return;

  try {
    navigationRef.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "OtpVerification", params: { mode: "attach" } }],
      })
    );
  } catch (error) {
    console.warn("Failed to reset navigation to phone verification:", error?.message || error);
  }
}

export function resetToMainApp() {
  if (!navigationRef.isReady()) return;

  try {
    navigationRef.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "MainTabs" }],
      })
    );
  } catch (error) {
    console.warn("Failed to reset navigation to MainTabs:", error?.message || error);
  }
}

export function resetToRoleSelect() {
  if (!navigationRef.isReady()) return;

  try {
    navigationRef.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "Role" }],
      })
    );
  } catch (error) {
    console.warn("Failed to reset navigation to Role:", error?.message || error);
  }
}
