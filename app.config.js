import "dotenv/config";

export default {
  expo: {
    owner: "birdearner",
    name: "BirdEarner",
    slug: "birdearner",
    newArchEnabled: true,
    scheme: "birdearner",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/logo.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      bundleIdentifier: "com.birdearner",
      buildNumber: "1.0.0",
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          "This app needs access to your location to display maps.",
      },
    },
    android: {
      googleServicesFile: process.env.GOOGLE_SERVICES_FILE,
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY,
        },
      },
      adaptiveIcon: {
        foregroundImage: "./assets/favicon.png",
        backgroundColor: "#ffffff",
      },
      permissions: [
        "INTERNET",
        "ACCESS_NETWORK_STATE",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
      ],
      package: "com.birdearner",
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: ["expo-router", "react-native-video"],
    extra: {
      router: {
        origin: false,
      },
      eas: {
        projectId: process.env.EAS_PROJECT_ID,
      },
    },
  },
};
