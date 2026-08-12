import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const NegotiationPanel = ({
  role = "client", // 'client' or 'freelancer'
  otherPartyName = "Freelancer",
  clientOffer = "0",
  freelancerOffer = "0",
  agreedAmount = null,
  isNegotiable = true,
  onUpdateOffer,
  onRefresh,
  onViewProposalDetails,
}) => {
  const isClient = role === "client";

  // Identify top offer vs bottom offer based on role
  // Client View: Top = Freelancer/Mocha's Offer (Purple), Bottom = Your Offer (Red)
  // Freelancer View: Top = Client's Offer (Red), Bottom = Your Offer (Purple)
  
  const topTitle = isClient ? `${otherPartyName}'s Offer` : "Client's Offer";
  const topAmount = isClient ? freelancerOffer : clientOffer;
  const topColor = isClient ? "#6D28D9" : "#EF4444"; // Purple for Freelancer offer, Red for Client offer

  const bottomTitle = "Your Offer";
  const bottomAmount = isClient ? clientOffer : freelancerOffer;
  const bottomColor = isClient ? "#EF4444" : "#6D28D9"; // Red for Client's own offer, Purple for Freelancer's own offer

  const [bottomInput, setBottomInput] = useState(bottomAmount ? String(bottomAmount) : "0");
  const [topInput, setTopInput] = useState(topAmount ? String(topAmount) : "0");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setBottomInput(bottomAmount ? String(bottomAmount) : "0");
  }, [bottomAmount]);

  useEffect(() => {
    setTopInput(topAmount ? String(topAmount) : "0");
  }, [topAmount]);

  const handleUpdateOwnOffer = async () => {
    const val = parseFloat(bottomInput);
    if (isNaN(val) || val <= 0) return;
    setIsUpdating(true);
    try {
      if (onUpdateOffer) {
        await onUpdateOffer(val);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Negotiation</Text>
          <Text style={styles.subtitle}>Discuss and agree on the budget</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh-outline" size={20} color="#6D28D9" />
        </TouchableOpacity>
      </View>

      {/* Top Offer Section */}
      <View style={styles.offerBlock}>
        <View style={styles.offerTitleRow}>
          <View style={[styles.dot, { backgroundColor: topColor }]} />
          <Text style={styles.offerTitleText}>{topTitle}</Text>
        </View>
        <Text style={[styles.amountDisplay, { color: topColor }]}>
          ${topAmount || "0"}
        </Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={topInput}
            onChangeText={setTopInput}
            keyboardType="numeric"
            editable={false} // Only lower section represents user's own editable input
          />
        </View>
        <TouchableOpacity
          style={[styles.updateButton, { borderColor: topColor }]}
          disabled={true}
        >
          <Text style={[styles.updateButtonText, { color: topColor }]}>
            Update Offer
          </Text>
        </TouchableOpacity>
      </View>

      {/* VS Divider */}
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <View style={styles.vsBadge}>
          <Text style={styles.vsText}>vs</Text>
        </View>
        <View style={styles.dividerLine} />
      </View>

      {/* Bottom Offer Section (User's Own Offer) */}
      <View style={styles.offerBlock}>
        <View style={styles.offerTitleRow}>
          <View style={[styles.dot, { backgroundColor: bottomColor }]} />
          <Text style={styles.offerTitleText}>{bottomTitle}</Text>
        </View>
        <Text style={[styles.amountDisplay, { color: bottomColor }]}>
          ${bottomAmount || "0"}
        </Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={bottomInput}
            onChangeText={setBottomInput}
            keyboardType="numeric"
            editable={isNegotiable}
          />
        </View>
        <TouchableOpacity
          style={[
            styles.updateButton,
            { borderColor: bottomColor },
            (!isNegotiable || isUpdating) && styles.disabledButton,
          ]}
          onPress={handleUpdateOwnOffer}
          disabled={!isNegotiable || isUpdating}
        >
          {isUpdating ? (
            <ActivityIndicator size="small" color={bottomColor} />
          ) : (
            <Text style={[styles.updateButtonText, { color: bottomColor }]}>
              {isNegotiable ? "Update Offer" : "Locked"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Info Banner */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={18} color="#6D28D9" style={{ marginRight: 6 }} />
        <Text style={styles.infoText}>
          {isNegotiable
            ? "Agree on a budget to continue the project."
            : `Agreed final amount: $${agreedAmount || bottomAmount}`}
        </Text>
      </View>

      {/* View Proposal Details Button */}
      <TouchableOpacity
        style={styles.proposalButton}
        onPress={onViewProposalDetails}
      >
        <Text style={styles.proposalButtonText}>View Proposal Details</Text>
      </TouchableOpacity>
    </View>
  );
};

export default NegotiationPanel;

const styles = StyleSheet.create({
  container: {
    width: 170,
    backgroundColor: "#F8FAFC",
    borderRightWidth: 1,
    borderRightColor: "#E2E8F0",
    padding: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },
  subtitle: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 2,
  },
  refreshButton: {
    padding: 2,
  },
  offerBlock: {
    marginVertical: 4,
  },
  offerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  offerTitleText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
  },
  amountDisplay: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    marginVertical: 4,
  },
  inputContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 8,
  },
  textInput: {
    fontSize: 13,
    color: "#0F172A",
    textAlign: "center",
    padding: 2,
  },
  updateButton: {
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 6,
    alignItems: "center",
  },
  updateButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.5,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  vsBadge: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginHorizontal: 4,
  },
  vsText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748B",
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3E8FF",
    borderRadius: 8,
    padding: 8,
    marginTop: 12,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 10,
    color: "#5B21B6",
    flex: 1,
    lineHeight: 14,
  },
  proposalButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#6D28D9",
    paddingVertical: 8,
    alignItems: "center",
  },
  proposalButtonText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6D28D9",
  },
});
