import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import apiService from "../../lib/apiService";

const NegotiationPanel = ({
  role = "client",
  otherPartyName = "Freelancer",
  clientOffer = "0",
  freelancerOffer = "0",
  agreedAmount = null,
  isNegotiable = true,
  onUpdateOffer,
  onRefresh,
  onViewProposalDetails,
  jobId = null,
}) => {
  const isClient = role === "client";

  const topTitle = isClient ? `${otherPartyName}'s Offer` : "Client's Offer";
  const topAmount = isClient ? freelancerOffer : clientOffer;
  const topColor = isClient ? "#6D28D9" : "#EF4444";

  const bottomTitle = "Your Offer";
  const bottomAmount = isClient ? clientOffer : freelancerOffer;
  const bottomColor = isClient ? "#EF4444" : "#6D28D9";

  const [bottomInput, setBottomInput] = useState(bottomAmount ? String(bottomAmount) : "0");
  const [topInput, setTopInput] = useState(topAmount ? String(topAmount) : "0");
  const [isUpdating, setIsUpdating] = useState(false);

  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMessage, setCouponMessage] = useState(null);
  const [showCoupons, setShowCoupons] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);

  const agreedAmt = parseFloat(agreedAmount || bottomAmount || "0");

  useEffect(() => {
    setBottomInput(bottomAmount ? String(bottomAmount) : "0");
  }, [bottomAmount]);

  useEffect(() => {
    setTopInput(topAmount ? String(topAmount) : "0");
  }, [topAmount]);

  useEffect(() => {
    if (isClient && jobId) {
      fetchCoupons();
      checkAppliedCoupon();
    }
  }, [jobId, isClient]);

  const fetchCoupons = async () => {
    try {
      const response = await apiService.getOffersData(jobId);
      setAvailableCoupons(response.discoveredOffers || []);
    } catch (error) {
      console.error("Error fetching coupons:", error);
    }
  };

  const checkAppliedCoupon = async () => {
    try {
      const job = await apiService.getJobById(jobId);
      if (job?.cashbackOfferId) {
        const allOffers = await apiService.getOffersData(jobId);
        const found = (allOffers.discoveredOffers || []).find(o => o.id === job.cashbackOfferId);
        if (found) setAppliedCoupon(found);
      }
    } catch (error) {
      console.error("Error checking applied coupon:", error);
    }
  };

  const handleApplyCoupon = async (coupon) => {
    if (!jobId) return;
    setCouponLoading(true);
    try {
      const result = await apiService.applyCoupon(jobId, coupon.id);
      if (result.success) {
        setAppliedCoupon(coupon);
        setCouponMessage(result.message);
        setShowCoupons(false);
      }
    } catch (error) {
      console.error("Error applying coupon:", error);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = async () => {
    if (!jobId) return;
    setCouponLoading(true);
    try {
      const result = await apiService.removeCoupon(jobId);
      if (result.success) {
        setAppliedCoupon(null);
        setCouponMessage(null);
      }
    } catch (error) {
      console.error("Error removing coupon:", error);
    } finally {
      setCouponLoading(false);
    }
  };

  const getDiscount = (coupon, amount) => {
    if (coupon.amountType === "LUMPSUM") return coupon.amount;
    return Math.min((amount * coupon.amount) / 100, coupon.maxDiscount || Infinity);
  };

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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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
          ₹{topAmount || "0"}
        </Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={topInput}
            onChangeText={setTopInput}
            keyboardType="numeric"
            editable={false}
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

      {/* Bottom Offer Section */}
      <View style={styles.offerBlock}>
        <View style={styles.offerTitleRow}>
          <View style={[styles.dot, { backgroundColor: bottomColor }]} />
          <Text style={styles.offerTitleText}>{bottomTitle}</Text>
        </View>
        <Text style={[styles.amountDisplay, { color: bottomColor }]}>
          ₹{bottomAmount || "0"}
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
            : `Agreed final amount: ₹${agreedAmount || bottomAmount}`}
        </Text>
      </View>

      {/* Coupon Section (Client Only) */}
      {isClient && jobId && (
        <View style={styles.couponSection}>
          <TouchableOpacity
            style={styles.couponToggle}
            onPress={() => setShowCoupons(!showCoupons)}
          >
            <Ionicons name="gift-outline" size={16} color="#6D28D9" />
            <Text style={styles.couponToggleText}>
              {appliedCoupon
                ? "Coupon Applied"
                : isNegotiable
                  ? "See Available Coupons"
                  : "Apply Coupon"}
            </Text>
            <Ionicons
              name={showCoupons ? "chevron-up" : "chevron-down"}
              size={14}
              color="#6D28D9"
            />
          </TouchableOpacity>

          {appliedCoupon && (
            <View style={styles.appliedCouponCard}>
              <View style={styles.appliedCouponInfo}>
                <Text style={styles.appliedCouponText}>
                  {appliedCoupon.amountType === "LUMPSUM"
                    ? `₹${appliedCoupon.amount} OFF`
                    : `${appliedCoupon.amount}% OFF`}
                </Text>
                <Text style={styles.appliedCouponMin}>
                  Min ₹{appliedCoupon.minBooking}+
                </Text>
              </View>
              <TouchableOpacity onPress={handleRemoveCoupon} disabled={couponLoading}>
                <Ionicons name="close-circle" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}

          {couponMessage && (
            <View style={styles.couponMessageCard}>
              <Ionicons name="checkmark-circle" size={14} color="#059669" style={{ marginRight: 4 }} />
              <Text style={styles.couponMessageText}>{couponMessage}</Text>
            </View>
          )}

          {showCoupons && !appliedCoupon && (
            <View style={styles.couponList}>
              {availableCoupons.length === 0 ? (
                <Text style={styles.noCoupons}>No coupons available</Text>
              ) : (
                availableCoupons.map((coupon) => {
                  const isEligible = agreedAmt >= coupon.minBooking;
                  const discount = getDiscount(coupon, agreedAmt);
                  const canApply = isEligible && !isNegotiable;
                  return (
                    <TouchableOpacity
                      key={coupon.id}
                      style={[styles.couponItem, !isEligible && styles.couponItemDisabled]}
                      onPress={() => canApply && handleApplyCoupon(coupon)}
                      disabled={!canApply || couponLoading}
                    >
                      <View>
                        <Text style={[styles.couponItemTitle, !isEligible && styles.couponItemTextDisabled]}>
                          {coupon.amountType === "LUMPSUM"
                            ? `₹${coupon.amount} OFF`
                            : `${coupon.amount}% OFF (max ₹${coupon.maxDiscount})`}
                        </Text>
                        <Text style={[styles.couponItemMin, !isEligible && styles.couponItemTextDisabled]}>
                          Min ₹{coupon.minBooking}+ | Save ₹{discount.toFixed(0)}
                          {!isNegotiable && isEligible ? " - Tap to apply" : ""}
                          {isNegotiable && isEligible ? " - Available after finalization" : ""}
                        </Text>
                      </View>
                      {couponLoading && <ActivityIndicator size="small" color="#6D28D9" />}
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          )}
        </View>
      )}

      {/* View Proposal Details Button */}
      <TouchableOpacity
        style={styles.proposalButton}
        onPress={onViewProposalDetails}
      >
        <Text style={styles.proposalButtonText}>View Proposal Details</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default NegotiationPanel;

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  couponSection: {
    marginTop: 8,
    marginBottom: 10,
  },
  couponToggle: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3E8FF",
    borderRadius: 8,
    padding: 8,
    gap: 4,
  },
  couponToggleText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6D28D9",
    flex: 1,
  },
  appliedCouponCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ECFDF5",
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#10B981",
  },
  appliedCouponInfo: {
    flex: 1,
  },
  appliedCouponText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#059669",
  },
  appliedCouponMin: {
    fontSize: 10,
    color: "#6B7280",
    marginTop: 2,
  },
  couponMessageCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#10B981",
  },
  couponMessageText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#059669",
    flex: 1,
    lineHeight: 14,
  },
  couponList: {
    marginTop: 6,
  },
  couponItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 8,
    marginBottom: 6,
  },
  couponItemDisabled: {
    opacity: 0.5,
  },
  couponItemTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6D28D9",
  },
  couponItemMin: {
    fontSize: 9,
    color: "#6B7280",
    marginTop: 2,
  },
  couponItemTextDisabled: {
    color: "#9CA3AF",
  },
  noCoupons: {
    fontSize: 11,
    color: "#9CA3AF",
    textAlign: "center",
    padding: 8,
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
