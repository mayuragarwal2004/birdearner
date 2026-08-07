import React from "react";
import {
  Image,
  StyleSheet,
  Text,
  View,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PURPLE = "#5B1F96";
const CIRCLE_SIZE = Math.min(SCREEN_WIDTH * 0.38, 165);

const Role = ({ navigation }) => {
  const navigateToSignup = (role) => {
    navigation.navigate("OtpVerification", { role });
  };

  return (
    <View style={styles.container}>
      {/* Background Split: Left Purple, Right White */}
      <View style={styles.backgroundSplit}>
        <View style={styles.leftBackground} />
        <View style={styles.rightBackground} />
      </View>

      <SafeAreaView style={styles.contentContainer}>
        {/* Header Title: "You" (White) on Purple side | "are a" (Black) on White side */}
        <View style={styles.titleRow}>
          <View style={styles.titleHalfLeft}>
            <Text style={styles.titleTextLeft}>You</Text>
          </View>
          <View style={styles.titleHalfRight}>
            <Text style={styles.titleTextRight}>are a</Text>
          </View>
        </View>

        {/* Role Options Row */}
        <View style={styles.rolesRow}>
          {/* Client Option */}
          <TouchableOpacity
            style={styles.roleColumn}
            onPress={() => navigateToSignup("CLIENT")}
            activeOpacity={0.85}
          >
            <View style={styles.clientCircle}>
              <Image
                source={require("../assets/client1.jpg")}
                style={styles.clientImage}
              />
            </View>
            <Text style={styles.roleText}>Client</Text>
          </TouchableOpacity>

          {/* Freelancer Option */}
          <TouchableOpacity
            style={styles.roleColumn}
            onPress={() => navigateToSignup("FREELANCER")}
            activeOpacity={0.85}
          >
            <View style={styles.freelancerCircle}>
              <Image
                source={require("../assets/freelancer1.jpg")}
                style={styles.freelancerImage}
              />
            </View>
            <Text style={styles.roleText}>Freelancer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default Role;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    position: "relative",
  },
  backgroundSplit: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
  },
  leftBackground: {
    flex: 1,
    backgroundColor: PURPLE,
  },
  rightBackground: {
    flex: 1,
    backgroundColor: "#fff",
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  titleRow: {
    flexDirection: "row",
    width: "100%",
    marginBottom: 44,
    alignItems: "baseline",
  },
  titleHalfLeft: {
    flex: 1,
    alignItems: "flex-end",
    paddingRight: 4,
  },
  titleHalfRight: {
    flex: 1,
    alignItems: "flex-start",
    paddingLeft: 4,
  },
  titleTextLeft: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  titleTextRight: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#000000",
  },
  rolesRow: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-around",
    alignItems: "center",
  },
  roleColumn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  clientCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  clientImage: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    resizeMode: "cover",
    transform: [{ scale: 1.25 }],
  },
  freelancerCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: PURPLE,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  freelancerImage: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    resizeMode: "cover",
    transform: [{ scale: 1.28 }],
  },
  roleText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000000",
    marginTop: 20,
    textAlign: "center",
  },
});

