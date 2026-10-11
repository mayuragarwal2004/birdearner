import {
  StyleSheet,
  Image,
  View,
  TouchableOpacity,
  Text,
  Modal,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState, useEffect, useRef } from "react";
import eggImage from "../assets/offers/egg.png";
import hatchlingImage from "../assets/offers/hatchling.jpg";
import hatchedEggImage from "../assets/offers/hatched-egg.png";
import bird1 from "../assets/offers/bird-1.png";
import bird2 from "../assets/offers/bird-2.png";
import bird3 from "../assets/offers/bird-3.png";
import bird4 from "../assets/offers/bird-4.png";
import bird5 from "../assets/offers/bird-5.png";
import leaf1 from "../assets/offers/leaf-1.png";
import leaf2 from "../assets/offers/leaf-2.png";
import leaf3 from "../assets/offers/leaf-3.png";
import leaf4 from "../assets/offers/leaf-4.png";
import leaf5 from "../assets/offers/leaf-5.png";
import leaf6 from "../assets/offers/leaf-6.png";
import leaf7 from "../assets/offers/leaf-7.png";
import band00 from "../assets/offers/tree-bands/band-00.jpg";
import band01 from "../assets/offers/tree-bands/band-01.jpg";
import band02 from "../assets/offers/tree-bands/band-02.jpg";
import band03 from "../assets/offers/tree-bands/band-03.jpg";
import band04 from "../assets/offers/tree-bands/band-04.jpg";
import band05 from "../assets/offers/tree-bands/band-05.jpg";
import band06 from "../assets/offers/tree-bands/band-06.jpg";
import band07 from "../assets/offers/tree-bands/band-07.jpg";
import band08 from "../assets/offers/tree-bands/band-08.jpg";
import band09 from "../assets/offers/tree-bands/band-09.jpg";
import band10 from "../assets/offers/tree-bands/band-10.jpg";
import band11 from "../assets/offers/tree-bands/band-11.jpg";
import { useAuth } from "../context/NewAuthContext";
import { useTheme } from "../context/ThemeContext";
import apiService from "../lib/apiService";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";

// All positions are in the artwork's own pixel space (the tree is 941 x 1672).
// The stage is scaled to fit the screen, so the layout stays correct on any device.
const ART = { width: 941, height: 1672 };
const STAGE_RATIO = ART.width / ART.height;

// Egg size in artwork pixels
const EGG = { w: 118, h: 162 };

// Horizontal padding (artwork px) on each tree band so the sway never shows an empty edge
const BAND_PAD = 24;

// Rows (artwork px) each tree band extends below its own edge, hiding seams between bands
const BAND_OVERLAP = 4;

// Tree sway: max sideways travel at the top of the tree, as a fraction of stage width.
// The trunk base does not move; the amount grows toward the top.
const SWAY_MAX = 0.012;

// Each nest: centre point in the artwork and which perched bird sits on it.
// Egg index order matches the previous layout.
const NESTS = [
  { x: 727, y: 1071, bird: 4 },
  { x: 234, y: 1038, bird: 3 },
  { x: 709, y: 700, bird: 2 },
  { x: 234, y: 683, bird: 1 },
  { x: 485, y: 368, bird: 0 },
];

// Perched birds cut from the artwork, placed at their original spots
const BIRDS = [
  { source: bird1, x: 481, y: 171, w: 164, h: 163 },
  { source: bird2, x: 120, y: 431, w: 158, h: 186 },
  { source: bird3, x: 684, y: 481, w: 169, h: 163 },
  { source: bird4, x: 58, y: 846, w: 144, h: 162 },
  { source: bird5, x: 737, y: 863, w: 155, h: 145 },
];

// Tree split into horizontal bands; each band sways by the same amount as its height
const TREE_BANDS = [
  band00, band01, band02, band03, band04, band05,
  band06, band07, band08, band09, band10, band11,
];

// Falling leaves cut from the canopy. x/y are start fractions of the stage,
// drift is sideways sway as a fraction of stage width.
const LEAVES = [
  { source: leaf1, x: 0.18, y: 0.05, drift: 0.035, fallMs: 11000, delay: 0, spinMs: 4200 },
  { source: leaf2, x: 0.42, y: 0.1, drift: 0.028, fallMs: 13000, delay: 2600, spinMs: 5200 },
  { source: leaf3, x: 0.7, y: 0.03, drift: 0.04, fallMs: 10500, delay: 5200, spinMs: 3800 },
  { source: leaf4, x: 0.84, y: 0.16, drift: 0.03, fallMs: 12500, delay: 7800, spinMs: 4700 },
  { source: leaf5, x: 0.3, y: 0.2, drift: 0.032, fallMs: 11800, delay: 9400, spinMs: 4400 },
  { source: leaf6, x: 0.58, y: 0.22, drift: 0.026, fallMs: 13500, delay: 4100, spinMs: 5600 },
  { source: leaf7, x: 0.1, y: 0.14, drift: 0.03, fallMs: 12000, delay: 6800, spinMs: 3900 },
];
const LEAF_FALL_END = 0.9;
const LEAF_SIZE = 0.05;

const CRACK_LINES = [
  { angle: "-30deg", length: 0.46 },
  { angle: "18deg", length: 0.4 },
  { angle: "62deg", length: 0.32 },
  { angle: "-80deg", length: 0.28 },
];

const SPARKLES = [0, 1, 2, 3, 4, 5, 6, 7];

const fitStage = (box) => {
  const width = Math.min(box.width, box.height * STAGE_RATIO);
  return { width, height: width / STAGE_RATIO };
};

const toStage = (rect, stage) => ({
  left: (rect.x / ART.width) * stage.width,
  top: (rect.y / ART.height) * stage.height,
  width: (rect.w / ART.width) * stage.width,
  height: (rect.h / ART.height) * stage.height,
});

// Egg sits inside its nest, slightly above the nest centre
const getEggRect = (nest) => ({
  x: nest.x - EGG.w / 2,
  y: nest.y - EGG.h * 0.62,
  w: EGG.w,
  h: EGG.h,
});

// Sideways sway (in px) for something at a given height in the stage
const swayAmount = (yFraction, stageWidth) =>
  SWAY_MAX * stageWidth * Math.pow(1 - yFraction, 1.6);

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const OffersScreen = ({ navigation }) => {
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
  const [revealCode, setRevealCode] = useState(null);
  const [crackingIndex, setCrackingIndex] = useState(null);
  const [isOpening, setIsOpening] = useState(false);
  const [showNoCouponPopup, setShowNoCouponPopup] = useState(false);
  const [stageBox, setStageBox] = useState(null);
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

  const swayAnimation = useRef(new Animated.Value(0)).current;
  const birdBobAnimations = useRef(BIRDS.map(() => new Animated.Value(0))).current;
  const birdHopAnimations = useRef(BIRDS.map(() => new Animated.Value(0))).current;
  const leafAnimations = useRef(
    LEAVES.map(() => ({
      fall: new Animated.Value(0),
      sway: new Animated.Value(0),
      spin: new Animated.Value(0),
    }))
  ).current;
  const crackProgress = useRef(new Animated.Value(0)).current;
  const burstProgress = useRef(new Animated.Value(0)).current;
  const revealAnimation = useRef(new Animated.Value(0)).current;
  const hatchAnimation = useRef(new Animated.Value(0)).current;
  const sparkleAnimation = useRef(new Animated.Value(0)).current;

  // Blocks a second tap while an egg is already being opened, so one offer can't be requested twice
  const openingRef = useRef(false);
  const claimedOfferIds = useRef(new Set());

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

  useEffect(() => {
    const loopTiming = (value, toValue, duration, easing = Easing.linear) =>
      Animated.timing(value, {
        toValue,
        duration,
        easing,
        useNativeDriver: true,
      });

    const sway = Animated.loop(
      Animated.sequence([
        loopTiming(swayAnimation, 1, 3200, Easing.inOut(Easing.sin)),
        loopTiming(swayAnimation, 0, 3200, Easing.inOut(Easing.sin)),
      ])
    );

    const bobs = birdBobAnimations.map((anim, i) =>
      Animated.loop(
        Animated.sequence([
          loopTiming(anim, 1, 1100 + i * 130, Easing.inOut(Easing.sin)),
          loopTiming(anim, 0, 1100 + i * 130, Easing.inOut(Easing.sin)),
        ])
      )
    );

    const leaves = leafAnimations.flatMap((anim, i) => {
      const config = LEAVES[i];
      return [
        Animated.loop(
          Animated.sequence([
            Animated.delay(config.delay),
            loopTiming(anim.fall, 1, config.fallMs),
            Animated.timing(anim.fall, { toValue: 0, duration: 0, useNativeDriver: true }),
          ])
        ),
        Animated.loop(
          Animated.sequence([
            loopTiming(anim.sway, 1, 1500, Easing.inOut(Easing.sin)),
            loopTiming(anim.sway, 0, 1500, Easing.inOut(Easing.sin)),
          ])
        ),
        Animated.loop(loopTiming(anim.spin, 1, config.spinMs)),
      ];
    });

    const loops = [sway, ...bobs, ...leaves];
    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
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

      claimedOfferIds.current.clear();
      setAvailableOffers(response.availableOffers || []);
      // discoveredOffers also holds admin scratch coupons (they carry a serviceId).
      // Only egg coupons should mark eggs as cracked.
      const eggCoupons = (response.discoveredOffers || []).filter((offer) => !offer.serviceId);

      let updatedBrokenEggs = [...brokenEggs];

      for (let i = 0; i < updatedBrokenEggs.length; i++) {
        if (eggCoupons[i]) updatedBrokenEggs[i] = true;
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

  // Crack lines grow out from the egg centre, then a burst of light releases the chick
  const playCrackSequence = (index) =>
    new Promise((resolve) => {
      crackProgress.setValue(0);
      burstProgress.setValue(0);
      setCrackingIndex(index);
      Animated.sequence([
        Animated.timing(crackProgress, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(burstProgress, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCrackingIndex(null);
        resolve();
      });
    });

  const hopBird = (birdIndex) => {
    Animated.sequence([
      Animated.timing(birdHopAnimations[birdIndex], {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(birdHopAnimations[birdIndex], {
        toValue: 0,
        duration: 280,
        easing: Easing.bounce,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const startRevealAnimation = () => {
    revealAnimation.setValue(0);
    hatchAnimation.setValue(0);
    sparkleAnimation.setValue(0);
    Animated.parallel([
      Animated.spring(revealAnimation, {
        toValue: 1,
        friction: 7,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.spring(hatchAnimation, {
        toValue: 1,
        friction: 5,
        tension: 70,
        useNativeDriver: true,
      }),
      Animated.timing(sparkleAnimation, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleEggClick = async (index) => {
    console.log({ index });

    // Blocks a second tap while an egg is being opened
    if (openingRef.current) return;

    const firstAvailableEggIndex = brokenEggs.indexOf(false);

    if (firstAvailableEggIndex === -1) {
      console.log({ firstAvailableEggIndex });
      // should never happen
      return;
    }

    openingRef.current = true;
    setIsOpening(true);

    try {
      if (firstAvailableEggIndex !== index || availableOffers.length == 0) {
        startShakeAnimation(index);
        await wait(2000);
        stopShakeAnimation(index);
        setShowNoCouponPopup(true);
        return;
      }

      startShakeAnimation(index);

      const unclaimedOffers = availableOffers.filter(o => !claimedOfferIds.current.has(o.id));
      if (unclaimedOffers.length === 0) {
        await wait(2000);
        stopShakeAnimation(index);
        setShowNoCouponPopup(true);
        return;
      }

      const offer = unclaimedOffers[Math.floor(Math.random() * unclaimedOffers.length)];
      claimedOfferIds.current.add(offer.id);

      const response = await apiService.updateOfferData({
        offerId: offer.id,
        index,
      });

      console.log({ updatedresponse: response });

      stopShakeAnimation(index);

      if (response.success && offer) {
        setAvailableOffers((prev) => prev.filter((o) => o.id !== offer.id));
        if (offer.amount > 0) {
          setSelectedOffer(offer);
          setRevealCode(response.offer?.code || offer.code || null);
          await playCrackSequence(index);
          setBrokenEggs((prev) => prev.map((broken, i) => (i === index ? true : broken)));
          hopBird(NESTS[index].bird);
          setShowOfferPopup(true);
        } else {
          setShowVideoPopup(true);
        }
      } else {
        claimedOfferIds.current.delete(offer.id);
        console.log({ error: response.error });
        Toast.show({
          type: "error",
          text1: "Error updating offer data",
          text2: "Please try again later",
        });
      }
    } catch (error) {
      console.error(error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Couldn't open the Egg. Please try again later.",
      });
    } finally {
      stopShakeAnimation(index);
      openingRef.current = false;
      setIsOpening(false);
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

  const stage = stageBox ? fitStage(stageBox) : null;

  const swayFor = (yFraction) =>
    swayAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [-swayAmount(yFraction, stage.width), swayAmount(yFraction, stage.width)],
    });

  const renderCrackLines = (rect, progress) => (
    <View pointerEvents="none" style={[styles.fill, styles.crackLayer]}>
      {CRACK_LINES.map((line, i) => (
        <Animated.View
          key={`crack-${i}`}
          style={[
            styles.crackLine,
            {
              height: rect.height * line.length,
              marginTop: -(rect.height * line.length) / 2,
              transform: [{ rotate: line.angle }, { scaleY: progress }],
            },
          ]}
        />
      ))}
    </View>
  );

  const renderEgg = (nest, index) => {
    const rect = toStage(getEggRect(nest), stage);
    const broken = brokenEggs[index];
    const isCracking = crackingIndex === index;
    const yFraction = (rect.top + rect.height / 2) / stage.height;

    return (
      <Animated.View
        key={`egg-${index}`}
        style={[
          styles.eggContainer,
          {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
            transform: [
              {
                translateX: shakeAnimations[index].interpolate({
                  inputRange: [-1, 1],
                  outputRange: [-5, 5],
                }),
              },
              {
                rotate: shakeAnimations[index].interpolate({
                  inputRange: [-1, 1],
                  outputRange: ["-4deg", "4deg"],
                }),
              },
              { translateX: swayFor(yFraction) },
            ],
          },
        ]}
      >
        {broken ? (
          <Image source={hatchedEggImage} style={styles.fill} resizeMode="contain" />
        ) : (
          <TouchableOpacity
            onPress={() => handleEggClick(index)}
            disabled={isOpening}
            activeOpacity={0.85}
            style={styles.eggTouch}
          >
            <Image source={eggImage} style={styles.fill} resizeMode="contain" />
          </TouchableOpacity>
        )}

        {isCracking && (
          <>
            {renderCrackLines(rect, crackProgress)}
            <View pointerEvents="none" style={[styles.fill, styles.crackLayer]}>
              <Animated.View
                style={[
                  styles.burst,
                  {
                    width: rect.width,
                    height: rect.width,
                    borderRadius: rect.width / 2,
                    opacity: burstProgress.interpolate({
                      inputRange: [0, 0.3, 1],
                      outputRange: [0, 0.9, 0],
                    }),
                    transform: [
                      {
                        scale: burstProgress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.4, 2.4],
                        }),
                      },
                    ],
                  },
                ]}
              />
            </View>
          </>
        )}
      </Animated.View>
    );
  };

  const rewardText =
    selectedOffer?.amountType === "LUMPSUM"
      ? `You have earned cashback of ₹${selectedOffer.amount} on minimum job booking ₹${selectedOffer.minBooking}+`
      : selectedOffer?.amountType === "PERCENT"
      ? `You have earned ${selectedOffer.amount}% cashback (up to ₹${selectedOffer.maxDiscount}) on minimum job booking ₹${selectedOffer.minBooking}+`
      : null;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#EEF8F1", "#F4EEFF"]}
        style={styles.screen}
        onLayout={(event) => setStageBox(event.nativeEvent.layout)}
      >
        {stage && (
          <View style={[styles.stage, { width: stage.width, height: stage.height }]}>
            {/* Tree: horizontal bands sway by an amount that grows toward the top */}
            {TREE_BANDS.map((band, b) => {
              const bandHeight = stage.height / TREE_BANDS.length;
              const overlap = (BAND_OVERLAP / ART.height) * stage.height;
              const boxHeight = bandHeight + overlap;
              const bandPad = (BAND_PAD / ART.width) * stage.width;
              const yFraction = (b + 0.5) / TREE_BANDS.length;
              const amount = swayAmount(yFraction, stage.width);
              return (
                <View
                  key={`band-${b}`}
                  style={{
                    position: "absolute",
                    left: 0,
                    top: b * bandHeight,
                    width: stage.width,
                    height: boxHeight,
                    overflow: "hidden",
                  }}
                >
                  <Animated.Image
                    source={band}
                    resizeMode="stretch"
                    style={{
                      position: "absolute",
                      left: -bandPad,
                      top: 0,
                      width: stage.width + bandPad * 2,
                      height: boxHeight,
                      transform: [
                        {
                          translateX: swayAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-amount, amount],
                          }),
                        },
                      ],
                    }}
                  />
                </View>
              );
            })}

            {/* Falling leaves */}
            {LEAVES.map((leaf, i) => {
              const size = LEAF_SIZE * stage.width;
              const anim = leafAnimations[i];
              const fallDistance = (LEAF_FALL_END - leaf.y) * stage.height;
              return (
                <Animated.View
                  key={`leaf-${i}`}
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    left: leaf.x * stage.width - size / 2,
                    top: leaf.y * stage.height,
                    width: size,
                    height: size,
                    opacity: anim.fall.interpolate({
                      inputRange: [0, 0.08, 0.92, 1],
                      outputRange: [0, 1, 1, 0],
                    }),
                    transform: [
                      {
                        translateX: anim.sway.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-leaf.drift * stage.width, leaf.drift * stage.width],
                        }),
                      },
                      {
                        translateY: anim.fall.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, fallDistance],
                        }),
                      },
                      {
                        rotate: anim.spin.interpolate({
                          inputRange: [0, 1],
                          outputRange: ["0deg", "360deg"],
                        }),
                      },
                    ],
                  }}
                >
                  <Image source={leaf.source} style={styles.fill} resizeMode="contain" />
                </Animated.View>
              );
            })}

            {/* Perched birds, moving with the branch they sit on */}
            {BIRDS.map((bird, i) => {
              const rect = toStage(bird, stage);
              const yFraction = (rect.top + rect.height / 2) / stage.height;
              return (
                <Animated.View
                  key={`bird-${i}`}
                  pointerEvents="none"
                  style={[
                    styles.birdContainer,
                    {
                      left: rect.left,
                      top: rect.top,
                      width: rect.width,
                      height: rect.height,
                      transform: [
                        { translateX: swayFor(yFraction) },
                        {
                          translateY: birdBobAnimations[i].interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, -6],
                          }),
                        },
                        {
                          translateY: birdHopAnimations[i].interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, -18],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <Image source={bird.source} style={styles.fill} resizeMode="contain" />
                </Animated.View>
              );
            })}

            {NESTS.map((nest, index) => renderEgg(nest, index))}
          </View>
        )}
      </LinearGradient>

      {/* Offer Popup: the baby bird reveal */}
      <Modal
        visible={showOfferPopup}
        transparent={true}
        animationType="fade"
        onShow={startRevealAnimation}
        onRequestClose={closePopup}
      >
        <View style={styles.popupOverlay}>
          <Animated.View
            style={[
              styles.revealCard,
              {
                opacity: revealAnimation,
                transform: [
                  {
                    scale: revealAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.85, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.hatchFrame}>
              <Animated.Image
                source={hatchlingImage}
                resizeMode="cover"
                style={[
                  styles.fill,
                  {
                    transform: [
                      {
                        scale: hatchAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.2, 1],
                        }),
                      },
                      {
                        translateY: hatchAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [40, 0],
                        }),
                      },
                    ],
                  },
                ]}
              />
              {SPARKLES.map((i) => {
                const angle = (i / SPARKLES.length) * Math.PI * 2;
                return (
                  <Animated.View
                    key={`sparkle-${i}`}
                    pointerEvents="none"
                    style={[
                      styles.sparkle,
                      {
                        opacity: sparkleAnimation.interpolate({
                          inputRange: [0, 0.4, 1],
                          outputRange: [0, 1, 0],
                        }),
                        transform: [
                          {
                            translateX: sparkleAnimation.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, Math.cos(angle) * 110],
                            }),
                          },
                          {
                            translateY: sparkleAnimation.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, Math.sin(angle) * 110],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                );
              })}
            </View>

            <Text style={styles.revealKicker}>Your baby bird has hatched!</Text>
            <Text style={styles.popupTitle}>Congratulations!</Text>
            <Text style={styles.popupText}>{rewardText}</Text>

            {revealCode ? (
              <View style={styles.codeBox}>
                <Text style={styles.codeLabel}>Coupon code</Text>
                <Text style={styles.codeText} selectable>
                  {revealCode}
                </Text>
              </View>
            ) : null}

            <TouchableOpacity style={styles.popupButton} onPress={closePopup}>
              <Text style={styles.popupButtonText}>Claim Cashback</Text>
            </TouchableOpacity>
          </Animated.View>
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

      {/* No coupon yet Popup */}
      <Modal visible={showNoCouponPopup} transparent={true} animationType="fade">
        <View style={styles.popupOverlay}>
          <View style={styles.popupContent}>
            <Text style={styles.popupTitle}>No Coupon Code Available!</Text>
            <Text style={styles.popupText}>Complete more jobs to get coupons</Text>
            <TouchableOpacity
              style={styles.popupButton}
              onPress={() => setShowNoCouponPopup(false)}
            >
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
    screen: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    stage: {
      overflow: "hidden",
    },
    fill: {
      width: "100%",
      height: "100%",
    },

    birdContainer: {
      position: "absolute",
    },

    eggContainer: {
      position: "absolute",
    },
    eggTouch: {
      width: "100%",
      height: "100%",
    },

    crackLayer: {
      position: "absolute",
      left: 0,
      top: 0,
    },
    crackLine: {
      position: "absolute",
      top: "50%",
      left: "50%",
      marginLeft: -1.5,
      width: 3,
      borderRadius: 2,
      backgroundColor: "#7A5A3A",
    },
    burst: {
      position: "absolute",
      backgroundColor: "#FFF6CC",
      shadowColor: "#FFD86B",
      shadowOpacity: 0.9,
      shadowRadius: 18,
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
      textAlign: "center",
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

    revealCard: {
      width: "86%",
      maxWidth: 380,
      backgroundColor: currentTheme.background || "#ffffff",
      paddingBottom: 24,
      paddingHorizontal: 20,
      borderRadius: 24,
      alignItems: "center",
      elevation: 8,
      shadowColor: "#4C0183",
      shadowOpacity: 0.25,
      shadowRadius: 20,
      borderColor: currentTheme.border || "#fff",
      borderWidth: 2,
    },
    hatchFrame: {
      width: 220,
      height: 300,
      marginTop: 20,
      marginBottom: 14,
      borderRadius: 20,
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
    },
    sparkle: {
      position: "absolute",
      width: 9,
      height: 9,
      borderRadius: 5,
      backgroundColor: "#FFD86B",
    },
    revealKicker: {
      fontSize: 13,
      fontWeight: "600",
      letterSpacing: 0.5,
      color: "#4C0183",
      textTransform: "uppercase",
      marginBottom: 4,
    },
    codeBox: {
      marginTop: 6,
      marginBottom: 16,
      paddingVertical: 10,
      paddingHorizontal: 18,
      borderRadius: 12,
      borderWidth: 1.5,
      borderStyle: "dashed",
      borderColor: "#4C0183",
      backgroundColor: "#F4EEFF",
      alignItems: "center",
    },
    codeLabel: {
      fontSize: 12,
      color: currentTheme.subText || "#555",
    },
    codeText: {
      fontSize: 20,
      fontWeight: "bold",
      letterSpacing: 2,
      color: "#4C0183",
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
