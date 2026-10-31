export default {
    expo: {
        owner: "birdearner",
        name: "BirdEarner",
        slug: "birdearner",
        scheme: "birdearner",
        version: "1.1.2",
        orientation: "portrait",
        icon: "./assets/logo.png",
        userInterfaceStyle: "light",
        // Keep the native root view branded while JS boots (avoids black flash)
        backgroundColor: "#4B0082",
        splash: {
            image: "./assets/splash-logo-name.png",
            resizeMode: "contain",
            backgroundColor: "#4B0082",
        },
        ios: {
            bundleIdentifier: "com.birdearner.birdearner",
            supportsTablet: false,
            usesAppleSignIn: true,
            googleServicesFile: "./GoogleService-Info.plist",
            entitlements: {
                "aps-environment": "production",
                "com.apple.developer.applesignin": ["Default"],
            },
            infoPlist: {
                ITSAppUsesNonExemptEncryption: false,
                UIBackgroundModes: ["remote-notification"],
                NSLocationWhenInUseUsageDescription:
                    "This app needs access to your location to display maps so that it can show you nearby jobs.",
                NSPhotoLibraryUsageDescription:
                    "This app needs access to your photo library to allow you to select and upload images for your profile, job submissions, and feedback attachments.",
                NSCameraUsageDescription:
                    "This app needs access to your camera to allow you to take photos for your profile, job submissions, and feedback attachments.",
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
                "POST_NOTIFICATIONS",
            ],
            package: "com.birdearner",
        },
        web: {
            favicon: "./assets/logo.png",
        },
        plugins: [
            // Must stay before other plugins so forceStaticLinking is written correctly.
            [
                "expo-build-properties",
                {
                    ios: {
                        useFrameworks: "static",
                        deploymentTarget: "16.4",
                        // Required for App Store review on newer iOS versions.
                        enableSceneSupport: true,
                        // RNFirebase pods need static linking under use_frameworks.
                        forceStaticLinking: ["RNFBApp", "RNFBMessaging"],
                    },
                    android: {
                        compileSdkVersion: 36,
                        targetSdkVersion: 36,
                    },
                },
            ],
            // Firebase iOS SDK SPM products are dynamic-only; disable SPM when using static frameworks.
            [
                "@react-native-firebase/app",
                {
                    ios: {
                        disableSPM: true,
                    },
                },
            ],
            "@react-native-firebase/messaging",
            "@react-native-community/datetimepicker",
            "expo-asset",
            [
                "expo-audio",
                {
                    microphonePermission:
                        "Allow BirdEarner to use the microphone for voice input when creating a job.",
                },
            ],
            "expo-font",
            "expo-image",
            "expo-location",
            "expo-notifications",
            "expo-status-bar",
            "expo-web-browser",
            "expo-apple-authentication",
            "react-native-video",
            "expo-speech-recognition",
            [
                "expo-splash-screen",
                {
                    image: "./assets/splash-logo-name.png",
                    resizeMode: "contain",
                    backgroundColor: "#4B0082",
                },
            ],
        ],
        extra: {
            eas: {
                projectId: "e9ba2ff2-13a3-4a7a-b07b-e184de3972f7",
            },
        },
    },
};
