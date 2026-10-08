import React from "react";
import { Dimensions, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ScratchCard from "./ScratchCard";

// Popup opened by tapping a scratch offer card on Client Home.
// Hosts the ScratchCard in a focused sheet with close / Done actions.
const ScratchOfferModal = ({ card, visible, onClose, onReveal }) => {
  const winW = Dimensions.get("window").width;
  const cardW = Math.min(300, winW - 72);
  const revealed = !!card?.revealed || card?.masked === false;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={s.backdrop}>
        <View style={s.sheet}>
          <View style={s.header}>
            <View style={s.headerText}>
              <Text style={s.title}>
                {card?.serviceName ? `${card.serviceName} Offer` : "Scratch Card Offer"}
              </Text>
              <Text style={s.subtitle}>
                {revealed ? "Your coupon has been revealed" : "Scratch below to reveal your coupon"}
              </Text>
            </View>
            <TouchableOpacity
              style={s.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={22} color="#4B5563" />
            </TouchableOpacity>
          </View>

          {card ? (
            <ScratchCard key={card.id} card={card} width={cardW} height={150} onReveal={onReveal} />
          ) : null}

          <Text style={s.hint}>
            {revealed
              ? "Coupon added to your list — pick it in Available Coupons."
              : "Drag your finger across the card to scratch"}
          </Text>

          {revealed && (
            <TouchableOpacity style={s.doneBtn} onPress={onClose} activeOpacity={0.85}>
              <Text style={s.doneText}>Done</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(17, 12, 32, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  sheet: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000000",
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  headerText: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1F1135",
  },
  subtitle: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#6B7280",
    textAlign: "center",
    marginTop: 14,
  },
  doneBtn: {
    marginTop: 16,
    backgroundColor: "#6D28D9",
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
  },
  doneText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});

export default ScratchOfferModal;
