import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const DEVICE_ID_KEY = "deviceId";

// Readable label for "Manage Trusted Devices", e.g. "Samsung SM-S911B (Android 14)"
const getDeviceName = () => {
  const osLabel = Platform.OS === "ios" ? `iOS ${Platform.Version}` : `Android ${Platform.Version}`;
  const model = Platform.OS === "android" ? Platform.constants?.Model : null;
  return model ? `${model} (${osLabel})` : osLabel;
};

// Stable per-install id, so the backend can recognise this device on later logins
export const getDeviceInfo = async () => {
  let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);

  if (!deviceId) {
    deviceId = `${Platform.OS}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
  }

  return {
    deviceId,
    deviceName: getDeviceName(),
    platform: Platform.OS,
  };
};
