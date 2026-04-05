import { Image, StyleSheet, Text, View } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { TouchableOpacity } from "react-native";

const Role = ({navigation}) => {

    const navigateToSignup = (role) => {
      if (role === "CLIENT") {
        navigation.navigate("OtpVerification", { role: "CLIENT" });
      } else {
        navigation.navigate("OtpVerification", { role: "FREELANCER" });
      }
    };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.main}>
        <Text style={styles.text}>You are a</Text>
        <View style={styles.roleBox}>
          <View style={styles.box}>
            <TouchableOpacity style={styles.logoBox} onPress={() => {
                navigateToSignup("CLIENT")
            }}>
              <Image source={require("../assets/client.png")} style={styles.logo} />
            </TouchableOpacity>
            <Text style={styles.roleText}>Client</Text>
          </View>
          <View style={styles.box}>
            <TouchableOpacity style={styles.logoBox} onPress={() => {
                navigateToSignup("FREELANCER")
            }}>
              <Image source={require("../assets/freelancer.png")} style={styles.logo} />
            </TouchableOpacity>
            <Text style={styles.roleText}>Freelancer</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Role;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  main: {
    display: "flex",
    alignItems: "center",
    // justifyContent: "center",
    padding: 20,
    gap: 30
  },
  text: {
    fontSize: 32,
    fontWeight: "600",
  },
  roleBox: {
    display: "flex",
    flexDirection: "row",
    gap: 40
  },
  box: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 20
  },
  logoBox: {
    backgroundColor: "#4B0082",
    width: 130,
    height: 130,
    borderRadius: 100,
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },
  
  roleText: {
    fontSize: 24,
    fontWeight: "600"
  }
});
