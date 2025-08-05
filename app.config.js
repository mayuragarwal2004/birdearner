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
      bundleIdentifier: "com.birdearner.birdearner",
      supportsTablet: false,
      googleServicesFile: "./GoogleService-Info.plist",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSLocationWhenInUseUsageDescription:
          "This app needs access to your location to display maps so that it can show you nearby jobs.",
      },
    },
    android: {
      googleServicesFile: "./google-services.json",
      config: {
        googleMaps: {
          apiKey: "AIzaSyDk_drKIe9VsU3mi-muwYZJ5FYvHRak2fI",
        },
      },
      adaptiveIcon: {
        foregroundImage: "./assets/logo.png",
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
      favicon: "./assets/logo.png",
    },
    plugins: [
      "expo-router",
      "react-native-video",
      [
        "expo-build-properties",
        {
          ios: {
            useFrameworks: "static",
          },
        },
      ],
    ],
    extra: {
      router: {
        origin: false,
      },
      eas: {
        projectId: "e9ba2ff2-13a3-4a7a-b07b-e184de3972f7",
      },
    },
  },
};
