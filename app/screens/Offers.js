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
} from "react-native";
import React, { useState, useEffect, useRef } from "react";
import offerBackground from "../assets/offerBackground.png";
import egg from "../assets/egg.png";
import nest from "../assets/nest.png";
import tree from "../assets/tree.png";
import brEgg from "../assets/brEgg.png";
import { useAuth } from "../context/NewAuthContext";
import { useAppwrite } from "../context/AppwriteContext";
import { Query } from "react-native-appwrite";
import { useTheme } from "../context/ThemeContext";

const offers = [10, 50, 0, 25, 15];

const OffersScreen = ({ navigation }) => {
  const { appwriteConfig, databases } = useAppwrite();
  const [eggStatus, setEggStatus] = useState([
    false,
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
  const [showOfferPopup, setShowOfferPopup] = useState(false);
  const [showRulesPopup, setShowRulesPopup] = useState(false);
  const [showVideoPopup, setShowVideoPopup] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const { userData } = useAuth();
  const userId = userData?.$id;

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
    checkUserOfferStatus();
  }, []);

  useEffect(() => {
    Animated.timing(slideAnimation, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [showRulesPopup]);

  const checkUserOfferStatus = async () => {
    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.userEggsCollectionId,
        [Query.equal("userId", userId)]
      );

      if (response.documents.length === 0) {
        const currentDate = new Date();
        const eggStatusInitial = [false, false, false, false, false];
        const brokenEggInitial = [false, false, false, false, false];
        setShowRulesPopup(true);
        await createOfferDocument(
          eggStatusInitial,
          brokenEggInitial,
          currentDate
        );
      } else {
        const userEggData = response.documents[0];
        const { eggStatus, brokenEggs, lastRefreshDate } = userEggData;

        eggStatus.forEach((status, index) => {
          if (status) {
            startShakeAnimation(index);
          }
        });

        let lastRefreshMonth = -1;
        if (lastRefreshDate) {
          const lastDate = new Date(lastRefreshDate);
          lastRefreshMonth = lastDate.getMonth();
        }

        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();

        if (currentMonth !== lastRefreshMonth) {
          const newEggStatus = [false, false, false, false, false];
          const newBrokenEggs = [false, false, false, false, false];
          setEggStatus(newEggStatus);
          setBrokenEggs(newBrokenEggs);

          await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userEggsCollectionId,
            userEggData?.$id,
            {
              eggStatus: newEggStatus,
              brokenEggs: newBrokenEggs,
              lastRefreshDate: currentDate.toISOString(),
            }
          );
        } else {
          setEggStatus(eggStatus || [false, false, false, false, false]);
          setBrokenEggs(brokenEggs || [false, false, false, false, false]);
        }
      }
    } catch (error) {
      console.error("Error checking user offer status:", error);
    }
  };

  const createOfferDocument = async (
    eggStatusInitial,
    brokenEggInitial,
    currentDate
  ) => {
    try {
      await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.userEggsCollectionId,
        "unique()",
        {
          userId,
          eggStatus: eggStatusInitial,
          brokenEggs: brokenEggInitial,
          lastRefreshDate: currentDate.toISOString(),
        }
      );
      setEggStatus(eggStatusInitial);
      setBrokenEggs(brokenEggInitial);
    } catch (error) {
      console.error("Error creating offer document:", error);
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
    if (eggStatus[index]) {
      const randomOffer = offers[Math.floor(Math.random() * offers.length)];
      setSelectedOffer(randomOffer);
      setShowOfferPopup(true);

      const updatedBrokenEggs = [...brokenEggs];
      updatedBrokenEggs[index] = true;
      setBrokenEggs(updatedBrokenEggs);

      try {
        const clientCollectionId = appwriteConfig.clientCollectionId;
        const paymentHistoryCollectionId =
          appwriteConfig.paymentHistoryCollectionId;

        // Fetch user document to get the current wallet amount
        const userDoc = await databases.getDocument(
          appwriteConfig.databaseId,
          clientCollectionId,
          userId
        );

        const currentWallet = userDoc?.wallet || 0;
        const newWalletAmount = currentWallet + parseFloat(randomOffer);

        // Update wallet amount in the user's document
        await databases.updateDocument(
          appwriteConfig.databaseId,
          clientCollectionId,
          userId,
          {
            wallet: newWalletAmount,
          }
        );

        // Add a new payment history document
        await databases.createDocument(
          appwriteConfig.databaseId,
          paymentHistoryCollectionId,
          "unique()",
          {
            userId: userId,
            paymentId: "Cashback Amount",
            amount: parseFloat(randomOffer),
            status: "Recieved",
            date: new Date().toISOString(),
          }
        );

        const response = await databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.userEggsCollectionId,
          [Query.equal("userId", userId)]
        );

        if (response.documents.length > 0) {
          const userEggData = response.documents[0];

          await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userEggsCollectionId,
            userEggData.$id,
            {
              brokenEggs: updatedBrokenEggs,
            }
          );

          stopShakeAnimation(index);
        }
      } catch (error) {
        console.error("Error updating document:", error);
      }
    } else {
      setShowVideoPopup(true);
    }
  };

  const closePopup = () => {
    setShowOfferPopup(false);
    setShowVideoPopup(false);
  };

  const closeRulesPopup = () => {
    setShowRulesPopup(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={offerBackground}
        style={styles.offerBackground}
        resizeMode="cover"
      >
        <Image source={tree} style={styles.tree} />
        {eggStatus.map((status, index) => (
          <React.Fragment key={index}>
            <Image source={nest} style={styles[`nest${index + 1}`]} />
            <Animated.View
              style={[
                styles[`egg${index + 1}`],
                brokenEggs[index] && styles[`brokenEgg${index + 1}`],
                {
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
              >
                <Image
                  source={brokenEggs[index] ? brEgg : egg}
                  style={brokenEggs[index] ? styles.sizeB : styles.size}
                />
              </TouchableOpacity>
            </Animated.View>
          </React.Fragment>
        ))}
      </ImageBackground>

      {/* Offer Popup */}
      <Modal visible={showOfferPopup} transparent={true} animationType="fade">
        <View style={styles.popupOverlay}>
          <View style={styles.popupContent}>
            <Text style={styles.popupTitle}>Congratulations!</Text>
            <Text style={styles.popupText}>
              You've earned a cashback of ₹{selectedOffer}!
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
    tree: {
      position: "absolute",
      left: 110,
      top: 200,
    },
    size: {
      width: 50,
      resizeMode: "contain",
    },
    sizeB: {
      width: 70,
      resizeMode: "contain",
    },
    nest1: {
      position: "absolute",
      bottom: 160,
      left: 170,
    },
    egg1: {
      position: "absolute",
      bottom: 221,
      right: 98,
    },
    nest2: {
      position: "absolute",
      bottom: 250,
      left: 30,
    },
    egg2: {
      position: "absolute",
      bottom: 311,
      left: 105,
    },
    nest3: {
      position: "absolute",
      bottom: 340,
      left: 170,
    },
    egg3: {
      position: "absolute",
      bottom: 401,
      right: 98,
    },
    nest4: {
      position: "absolute",
      bottom: 430,
      left: 30,
    },
    egg4: {
      position: "absolute",
      bottom: 491,
      left: 106,
    },
    nest5: {
      position: "absolute",
      top: 105,
      left: 100,
    },
    egg5: {
      position: "absolute",
      top: 126,
      left: 175,
    },
    activeEgg: {
      opacity: 1,
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

    brokenEgg1: {
      position: "absolute",
      bottom: 170,
      right: 89,
    },
    brokenEgg2: {
      position: "absolute",
      bottom: 260,
      left: 94,
    },
    brokenEgg3: {
      position: "absolute",
      bottom: 350,
      right: 89,
    },
    brokenEgg4: {
      position: "absolute",
      bottom: 440,
      left: 94,
    },
    brokenEgg5: {
      position: "absolute",
      top: 90,
      left: 164,
    },

    popupOverlay1: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.7)",
    },
    popupContent1: {
      backgroundColor: currentTheme.background || "#ffffff",
      // padding: 30,
      paddingVertical: 35,
      paddingHorizontal: 25,
      borderRadius: 15,
      width: "80%",
      // height: "80%",
      // justifyContent: "center",
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
