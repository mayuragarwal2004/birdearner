import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Shown to the party that did not make the latest offer. Lets them accept it or reopen negotiation.
const OfferUpdatedModal = ({ visible, otherPartyName, amount, days, onAccept, onSuggest, onClose, busy = false }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.backdrop}>
      <View style={styles.card}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close" size={20} color="#6B7280" />
        </TouchableOpacity>

        <View style={styles.iconCircle}>
          <Ionicons name="create-outline" size={30} color="#6D28D9" />
        </View>

        <Text style={styles.title}>Offer Updated</Text>
        <Text style={styles.subtitle}>{otherPartyName} has changed the offer.</Text>
        <Text style={styles.body}>
          Your previous agreement is no longer valid. Please review the latest budget and duration and confirm if you want to accept this offer.
        </Text>

        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Budget</Text>
            <Text style={styles.summaryValue}>₹{amount}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Project Duration</Text>
            <Text style={styles.summaryValue}>{days ? `${days} day${days > 1 ? "s" : ""}` : "Not set"}</Text>
          </View>
          <View style={styles.awaiting}>
            <Text style={styles.awaitingText}>Awaiting your confirmation</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.acceptButton} onPress={onAccept} disabled={busy} activeOpacity={0.85}>
          {busy ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
              <Text style={styles.acceptText}>Accept This Offer</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.suggestButton} onPress={onSuggest} disabled={busy} activeOpacity={0.85}>
          <Ionicons name="pencil-outline" size={18} color="#6D28D9" />
          <Text style={styles.suggestText}>Suggest Changes</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 20,
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#EDE9FE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1E1B4B",
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E1B4B",
    marginTop: 6,
    textAlign: "center",
  },
  body: {
    fontSize: 13,
    color: "#4B5563",
    textAlign: "center",
    lineHeight: 19,
    marginTop: 8,
    marginBottom: 16,
  },
  summary: {
    width: "100%",
    backgroundColor: "#F5F3FF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#4B5563",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#4C1D95",
  },
  awaiting: {
    marginTop: 8,
    backgroundColor: "#FDE68A",
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
  },
  awaitingText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#92400E",
  },
  acceptButton: {
    width: "100%",
    height: 50,
    borderRadius: 14,
    backgroundColor: "#6D28D9",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  acceptText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  suggestButton: {
    width: "100%",
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#6D28D9",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 10,
  },
  suggestText: {
    color: "#6D28D9",
    fontSize: 15,
    fontWeight: "700",
  },
});

export default OfferUpdatedModal;
