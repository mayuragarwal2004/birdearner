import {
  ImageBackground,
  StyleSheet,
  SafeAreaView,
  Image,
  View,
  TouchableOpacity,
  Text,
  Modal,
  Animated,
  Dimensions,
} from "react-native";
import React, { useState, useEffect, useRef } from "react";
import offerBackground from "../assets/offerBackground.png";
import egg from "../assets/egg.png";
import nest from "../assets/nest.png";
import tree from "../assets/tree.png";
import brEgg from "../assets/brEgg.png";
import { useAuth } from "../context/NewAuthContext";
import { useTheme } from "../context/ThemeContext";
import apiService from "../lib/apiService";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Fixed coordinate system for design fidelity
const DESIGN_WIDTH = 1000;
const DESIGN_HEIGHT = 1400;

// Helper to scale coordinates/dimensions to current screen
const scaleRect = (rect) => {
  const scaleX = SCREEN_WIDTH / DESIGN_WIDTH;
  const scaleY = SCREEN_HEIGHT / DESIGN_HEIGHT;
  // Use 'cover' like scaling to fill screen or 'contain' to fit?
  // User wants robust UI. Let's use standard scaling relative to screen size.
  // Actually, we should probably stick to width-based scaling for positions to maintain aspect ratios, 
  // or simple percentage mapping.
  // Let's use the explicit scaling factors for x/y to match the background exactly if it stretches,
  // or preserve aspect ratio if we want to be safe.
  
  // Since ImageBackground is "cover", we should try to match that logic or just scale proportionally.
  // Let's scale relative to the screen dimensions directly for a "responsive" layout.
  
  return {
    left: (rect.x / DESIGN_WIDTH) * SCREEN_WIDTH,
    top: (rect.y / DESIGN_HEIGHT) * SCREEN_HEIGHT,
    width: (rect.width / DESIGN_WIDTH) * SCREEN_WIDTH,
    height: (rect.height / DESIGN_HEIGHT) * SCREEN_HEIGHT,
  };
};

// Tree position
// Made tree wider (600) and taller (1100) and moved up (150)
const TREE = { x: 200, y: 150, width: 600, height: 1100 };

// Nest positions (alternating left/right)
// Tree Center X is now 500 (200 + 600/2)
// Nest Width: 400
// Strategy: Overlap nests with tree trunk/branches more aggressively
// Right Nests X: Previous 580 -> Now 520 (closer to center 500)
// Left Nests X: Previous 20 -> Now 80 (closer to center 500)
const NESTS = [
  { x: 520, y: 950, width: 400, height: 280 }, // nest1 (right bottom)
  { x: 80, y: 800, width: 400, height: 280 },  // nest2 (left)
  { x: 520, y: 650, width: 400, height: 280 }, // nest3 (right)
  { x: 80, y: 500, width: 400, height: 280 },  // nest4 (left)
  { x: 300, y: 70, width: 400, height: 280 }, // nest5 (top center)
];

// Egg positions (centered on nests)
const getEggPosition = (nestIndex, isBroken = false) => {
  const nest = NESTS[nestIndex];
  const eggSize = isBroken ? 140 : 110;
  
  // Adjust Y offset slightly higher to look like it's sitting IN the nest
  const yOffset = -30; 

  return {
    x: nest.x + (nest.width / 2) - (eggSize / 2),
    y: nest.y + (nest.height / 2) - (eggSize / 2) + yOffset,
    width: eggSize,
    height: eggSize,
  };
};

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const OffersScreen = ({ navigation }) => {
  // const { appwriteConfig, databases } = useAppwrite();
  const [eggStatus, setEggStatus] = useState([
    true,
    false,
    false,
    false,
    false,
  ]);
  const [brokenEggs, setBrokenEggs] = useState([
    false,
    false,
    false,
    false,
    false,
  ]);
  const [loading, setLoading] = useState(false);
  const [availableOffers, setAvailableOffers] = useState([]);
  const [showOfferPopup, setShowOfferPopup] = useState(false);
  const [showRulesPopup, setShowRulesPopup] = useState(false);
  const [showVideoPopup, setShowVideoPopup] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const { userData } = useAuth();
  const userId = userData?.id;

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];

  const styles = getStyles(currentTheme);

  const [slideAnimation] = useState(new Animated.Value(300));

  const shakeAnimations = useRef(
    Array(5)
      .fill()
      .map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const checkRules = async () => {
      const rulePopUpShown = await AsyncStorage.getItem("offer-rules-shown");

      if (rulePopUpShown) {
        setShowRulesPopup(false);
      } else {
        setShowRulesPopup(true);
      }
    };
    checkRules();
    checkUserOfferStatus();
  }, []);

  console.log({ showRulesPopup });

  useEffect(() => {
    Animated.timing(slideAnimation, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [showRulesPopup]);

  const checkUserOfferStatus = async () => {
    try {
      const response = await apiService.getOffersData();
      console.log({ response });

      setAvailableOffers(response.availableOffers || []);
      const { discoveredOffers } = response;

      let updatedBrokenEggs = [...brokenEggs];

      for (let i = 0; i < updatedBrokenEggs.length; i++) {
        if (discoveredOffers[i]) updatedBrokenEggs[i] = true;
      }
      setBrokenEggs(updatedBrokenEggs);
      setEggStatus(updatedBrokenEggs);
    } catch (error) {
      console.error(error);
    }
  };

  const startShakeAnimation = (index) => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shakeAnimations[index], {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimations[index], {
          toValue: -1,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimations[index], {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopShakeAnimation = (index) => {
    shakeAnimations[index].stopAnimation();
  };

  const handleEggClick = async (index) => {
    console.log({ index });

    const firstAvailableEggIndex = brokenEggs.indexOf(false);

    if (firstAvailableEggIndex === -1) {
      console.log({ firstAvailableEggIndex });
      // should never happen
      return;
    }

    if (firstAvailableEggIndex !== index || availableOffers.length == 0) {
      startShakeAnimation(index);
      // timeout and stop
      await wait(2000);
      stopShakeAnimation(index);
      return;
    }

    let waitingPromise;

    try {
      if (firstAvailableEggIndex === index && availableOffers.length > 0) {
        startShakeAnimation(index);
        // timeout and stop
        waitingPromise = wait(2000);

        if (availableOffers.keys()) {
          const offer =
            availableOffers[Math.floor(Math.random() * availableOffers.length)];

          const response = await apiService.updateOfferData({
            offerId: offer.id,
            index,
          });

          console.log({ updatedresponse: response });

          Promise.resolve(waitingPromise);
          stopShakeAnimation(index);

          if (response.success && offer) {
            if (offer.amount > 0) {
              const updatedBrokenEggs = [...brokenEggs];
              updatedBrokenEggs[index] = true;
              setBrokenEggs(updatedBrokenEggs);
              setShowOfferPopup(true);
              setSelectedOffer(offer);
            } else {
              setShowVideoPopup(true);
            }
          } else {
            console.log({ error: response.error });
            Toast.show({
              type: "error",
              text1: "Error updating offer data",
              text2: "Please try again later",
            });
          }
        }
      }
    } catch (error) {
      console.error(error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Couldn't open the Egg. Please try again later.",
      });
    } finally {
      Promise.resolve(waitingPromise);
      stopShakeAnimation(index);
    }
  };

  const closePopup = () => {
    setShowOfferPopup(false);
    setShowVideoPopup(false);
  };

  const closeRulesPopup = async () => {
    await AsyncStorage.setItem("offer-rules-shown", "true");

    setShowRulesPopup(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={offerBackground}
        style={styles.offerBackground}
        resizeMode="cover"
      >
        <View style={StyleSheet.absoluteFill}>
          {/* Tree */}
          <Image
            source={tree}
            style={[styles.absoluteImage, scaleRect(TREE)]}
            resizeMode="contain"
          />

          {/* Nests */}
          {NESTS.map((nestPos, index) => (
            <Image
              key={`nest-${index}`}
              source={nest}
              style={[styles.absoluteImage, scaleRect(nestPos)]}
              resizeMode="contain"
            />
          ))}

          {/* Eggs */}
          {eggStatus.map((status, index) => {
            const eggPos = getEggPosition(index, brokenEggs[index]);
            const scaledEgg = scaleRect(eggPos);

            return (
              <Animated.View
                key={`egg-${index}`}
                style={[
                  styles.eggContainer,
                  {
                    left: scaledEgg.left,
                    top: scaledEgg.top,
                    width: scaledEgg.width,
                    height: scaledEgg.height,
                    transform: [
                      {
                        translateX: brokenEggs[index]
                          ? 0
                          : shakeAnimations[index].interpolate({
                              inputRange: [-1, 1],
                              outputRange: [-5, 5],
                            }),
                      },
                    ],
                  },
                ]}
              >
                <TouchableOpacity
                  onPress={() => handleEggClick(index)}
                  disabled={brokenEggs[index]}
                  style={{ width: "100%", height: "100%" }}
                >
                  <Image
                    source={brokenEggs[index] ? brEgg : egg}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      </ImageBackground>

      {/* Offer Popup */}
      <Modal visible={showOfferPopup} transparent={true} animationType="fade">
        <View style={styles.popupOverlay}>
          <View style={styles.popupContent}>
            <Text style={styles.popupTitle}>Congratulations!</Text>
            <Text style={styles.popupText}>
              {selectedOffer?.amountType === "LUMPSUM"
                ? `You have earned a cashback of ₹${selectedOffer.amount}`
                : selectedOffer?.amountType === "PERCENT"
                ? `You have won cashback of ${selectedOffer.amount}% on your next job!`
                : null}
            </Text>
            <TouchableOpacity style={styles.popupButton} onPress={closePopup}>
              <Text style={styles.popupButtonText}>Claim Cashback</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* No offer Popup */}
      <Modal visible={showVideoPopup} transparent={true} animationType="fade">
        <View style={styles.popupOverlay}>
          <View style={styles.popupContent}>
            <Text style={styles.popupTitle}>No Offer Available!</Text>
            <Text style={styles.popupText}>Stay tuned for more offers!</Text>
            <TouchableOpacity style={styles.popupButton} onPress={closePopup}>
              <Text style={styles.popupButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Rules Popup (First-time Visit) */}
      <Modal visible={showRulesPopup} transparent={true} animationType="slide">
        <View style={styles.popupOverlay1}>
          <Animated.View
            style={[
              styles.popupContent1,
              { transform: [{ translateY: slideAnimation }] },
            ]}
          >
            <Text style={styles.popupTitle1}>How Offers Work</Text>
            <Text style={styles.popupDetails1}>
              Unlock eggs by completing orders. Each egg holds a surprise offer,
              ranging cashback money! 🎁
            </Text>
            <Text style={styles.popupDetails1}>
              The eggs reset every month, so check back regularly to unlock new
              surprises. 🗓️
            </Text>
            <Text style={styles.popupDetails1}>
              Tap on each egg to crack it open and reveal your reward! 🥚💰
            </Text>
            <TouchableOpacity
              style={styles.popupButton1}
              onPress={closeRulesPopup}
            >
              <Text style={styles.popupButtonText1}>Got It!</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default OffersScreen;

const getStyles = (currentTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    unlockAllButton: {
      position: "absolute",
      bottom: 20,
      alignSelf: "center",
      backgroundColor: "#4C0183",
      padding: 15,
      borderRadius: 10,
    },
    unlockAllButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
    },

    offerBackground: {
      flex: 1,
      width: "100%",
      height: "100%",
    },

    // Standard absolute positioning for scaled images
    absoluteImage: {
      position: "absolute",
    },
    
    // Egg container for absolute positioning over SVG
    eggContainer: {
      position: "absolute",
    },
    
    popupOverlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.7)",
    },
    popupContent: {
      backgroundColor: currentTheme.background || "#fff",
      padding: 20,
      borderRadius: 10,
      alignItems: "center",
      elevation: 5,
      borderColor: currentTheme.border || "#fff",
      borderWidth: 2,
    },
    popupTitle: {
      fontSize: 20,
      fontWeight: "bold",
      marginBottom: 10,
      color: currentTheme.text,
    },
    popupText: {
      fontSize: 16,
      marginBottom: 20,
      color: currentTheme.subText,
    },
    popupButton: {
      backgroundColor: "#4C0183",
      padding: 10,
      borderRadius: 5,
    },
    popupButtonText: {
      color: "#fff",
      fontSize: 16,
    },

    popupOverlay1: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.7)",
    },
    popupContent1: {
      backgroundColor: currentTheme.background || "#ffffff",
      paddingVertical: 35,
      paddingHorizontal: 25,
      borderRadius: 15,
      width: "80%",
      alignItems: "center",
      elevation: 5,
      borderColor: currentTheme.border || "#fff",
      borderWidth: 2,
    },
    popupTitle1: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 15,
      color: currentTheme.text || "#4C0183",
      textAlign: "center",
    },
    popupDetails1: {
      fontSize: 16,
      color: currentTheme.subText || "#333",
      marginBottom: 15,
      textAlign: "center",
      lineHeight: 28,
    },
    popupButton1: {
      backgroundColor: "#4C0183",
      padding: 12,
      borderRadius: 8,
      width: "50%",
      alignItems: "center",
    },
    popupButtonText1: {
      color: "#fff",
      fontSize: 18,
      fontWeight: "bold",
    },
  });
