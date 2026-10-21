import KeyboardAwareScrollView from "../KeyboardAwareScrollView";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Modal,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import apiService from "../../lib/apiService";
import { useTheme } from "../../context/ThemeContext";

// Input row styled like the offer fields: a light icon box on the left, the value on the right
const FieldRow = ({ icon, isDark, children }) => (
  <View
    style={[
      fieldStyles.row,
      { backgroundColor: isDark ? "#2A2A3D" : "#FFFFFF", borderColor: isDark ? "#444458" : "#E5E7EB" },
    ]}
  >
    <View style={[fieldStyles.iconBox, { backgroundColor: isDark ? "#343449" : "#EEF0F5" }]}>{icon}</View>
    <View style={fieldStyles.body}>{children}</View>
  </View>
);

const RupeeIcon = ({ color }) => <Text style={{ fontSize: 20, fontWeight: "600", color }}>₹</Text>;

const fieldStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 10,
  },
  iconBox: {
    width: 32,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  input: {
    fontSize: 16,
    color: "#111827",
    padding: 0,
  },
});

// Shows the amount as a plain number (the server sends "10.00"), so the field is not reformatted while typing
const formatAmountValue = (value) => {
  const num = Number(value);
  return value && !isNaN(num) ? String(Math.round(num)) : "0";
};

const NegotiationPanel = ({
  role = "client",
  otherPartyName = "Freelancer",
  clientOffer = "0",
  freelancerOffer = "0",
  agreedAmount = null,
  clientDays = null,
  freelancerDays = null,
  agreedDays = null,
  isNegotiable = true,
  onUpdateOffer,
  onRefresh,
  onViewProposalDetails,
  jobId = null,
  jobDays = null,
  threadId = null,
  confirmation = null,
  onOfferChanged = null,
  onClose = null,
}) => {
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme] || themeStyles.light;
  const isDark = theme === "dark";
  const styles = getStyles(currentTheme, isDark);

  const isClient = role === "client";

  // Offer confirmation state (from the chat's negotiation history)
  const myRoleKey = isClient ? "CLIENT" : "FREELANCER";
  const offerLatest = confirmation?.latest || null;
  const iConfirmed = isClient ? !!confirmation?.clientConfirmed : !!confirmation?.freelancerConfirmed;
  // The offer is locked while it is pending from this side, or after it has been accepted
  const offerLocked = Boolean(offerLatest) && (Boolean(confirmation?.ready) || iConfirmed || offerLatest.senderType === myRoleKey);
  const canEdit = isNegotiable && !offerLocked;

  const topTitle = isClient ? `${otherPartyName}'s Offer` : "Client's Offer";
  const topAmount = isClient ? freelancerOffer : clientOffer;
  const topDays = isClient ? freelancerDays : clientDays;
  const topColor = isClient ? "#6D28D9" : "#EF4444";

  const bottomTitle = "Your Offer";
  const bottomAmount = isClient ? clientOffer : freelancerOffer;
  const bottomDays = isClient ? clientDays : freelancerDays;
  const bottomColor = isClient ? "#EF4444" : "#6D28D9";

  const [bottomInput, setBottomInput] = useState(formatAmountValue(bottomAmount));
  // Amount editor dialog (opened by tapping the amount)
  const [amountEditorVisible, setAmountEditorVisible] = useState(false);
  const [amountDraft, setAmountDraft] = useState("");
  const [bottomDaysInput, setBottomDaysInput] = useState(String(bottomDays || jobDays || ""));
  const [topInput, setTopInput] = useState(topAmount ? String(topAmount) : "0");
  const [topDaysInput, setTopDaysInput] = useState(topDays ? String(topDays) : "");
  const [isUpdating, setIsUpdating] = useState(false);

  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMessage, setCouponMessage] = useState(null);
  const [showCoupons, setShowCoupons] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);

  const agreedAmt = parseFloat(agreedAmount || bottomAmount || "0");

  useEffect(() => {
    setBottomInput(formatAmountValue(bottomAmount));
  }, [bottomAmount]);

  useEffect(() => {
    setBottomDaysInput(String(bottomDays || jobDays || ""));
  }, [bottomDays]);

  useEffect(() => {
    setTopInput(topAmount ? String(topAmount) : "0");
  }, [topAmount]);

  useEffect(() => {
    setTopDaysInput(topDays ? String(topDays) : "");
  }, [topDays]);

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
    const daysVal = bottomDaysInput ? parseInt(bottomDaysInput, 10) : undefined;
    if (bottomDaysInput && (isNaN(daysVal) || daysVal <= 0)) return;
    setIsUpdating(true);
    try {
      if (onUpdateOffer) {
        await onUpdateOffer(val, daysVal);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <KeyboardAwareScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.headerRow}>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color={currentTheme.text || "#000"} />
          </TouchableOpacity>
        )}
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Negotiation</Text>
          <Text style={styles.subtitle}>Discuss budget & timeline</Text>
        </View>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={20} color={currentTheme.text || "#000"} />
          </TouchableOpacity>
        )}
      </View>

      {/* Top Offer Section */}
      <View
        style={[
          styles.offerCard,
          {
            backgroundColor:
              topColor === "#6D28D9"
                ? isDark ? "#2A2144" : "#F5F3FF"
                : isDark ? "#3A2229" : "#FEF2F2",
          },
        ]}
      >
        <View style={styles.offerTitleRow}>
          <View style={[styles.dot, { backgroundColor: topColor }]} />
          <Text style={styles.offerTitleText}>{topTitle}</Text>
          <View style={styles.latestPill}>
            <Text style={styles.latestPillText}>Latest</Text>
          </View>
        </View>
        <Text style={[styles.amountDisplay, { color: topColor }]}>
          ₹{topAmount || "0"}
        </Text>
        {topDays ? (
          <Text style={[styles.daysDisplay, { color: topColor }]}>
            {topDays} day{topDays > 1 ? 's' : ''}
          </Text>
        ) : null}
        <FieldRow icon={<RupeeIcon color={topColor} />} isDark={isDark}>
          <TextInput
            style={fieldStyles.input}
            value={topInput}
            onChangeText={setTopInput}
            keyboardType="numeric"
            editable={false}
          />
        </FieldRow>
        {topDays !== null && topDays !== undefined ? (
          <FieldRow icon={<Ionicons name="calendar-outline" size={20} color={topColor} />} isDark={isDark}>
            <TextInput
              style={fieldStyles.input}
              value={topDaysInput}
              onChangeText={setTopDaysInput}
              keyboardType="numeric"
              editable={false}
              placeholder="Days"
              placeholderTextColor="#9CA3AF"
            />
          </FieldRow>
        ) : null}
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
      <View
        style={[
          styles.offerCard,
          {
            backgroundColor:
              bottomColor === "#6D28D9"
                ? isDark ? "#2A2144" : "#F5F3FF"
                : isDark ? "#3A2229" : "#FEF2F2",
          },
        ]}
      >
        <View style={styles.offerTitleRow}>
          <View style={[styles.dot, { backgroundColor: bottomColor }]} />
          <Text style={styles.offerTitleText}>{bottomTitle}</Text>
        </View>
        <Text style={[styles.amountDisplay, { color: bottomColor }]}>
          ₹{bottomAmount || "0"}
        </Text>
        {bottomDays ? (
          <Text style={[styles.daysDisplay, { color: bottomColor }]}>
            {bottomDays} day{bottomDays > 1 ? 's' : ''}
          </Text>
        ) : null}
        {/* Amount: tap to edit in a dialog, where the cursor can be placed between digits */}
        <TouchableOpacity
          onPress={() => {
            if (!canEdit) return;
            setAmountDraft(bottomInput);
            setAmountEditorVisible(true);
          }}
          activeOpacity={canEdit ? 0.7 : 1}
          disabled={!canEdit}
        >
          <FieldRow icon={<RupeeIcon color={bottomColor} />} isDark={isDark}>
            <Text style={fieldStyles.input}>{bottomInput}</Text>
          </FieldRow>
        </TouchableOpacity>

        <Modal
          visible={amountEditorVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setAmountEditorVisible(false)}
        >
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 24 }}>
            <View style={{ backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF", borderRadius: 16, padding: 20 }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: currentTheme.text || "#111827", marginBottom: 12 }}>
                Update your offer
              </Text>
              <FieldRow icon={<RupeeIcon color={bottomColor} />} isDark={isDark}>
                <TextInput
                  style={[fieldStyles.input, { textAlign: "center" }]}
                  value={amountDraft}
                  onChangeText={(text) => setAmountDraft(text.replace(/\D/g, ""))}
                  keyboardType="number-pad"
                  autoFocus
                />
              </FieldRow>
              <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 12 }}>
                <TouchableOpacity onPress={() => setAmountEditorVisible(false)} style={{ paddingVertical: 10, paddingHorizontal: 16 }}>
                  <Text style={{ color: "#6B7280", fontWeight: "600" }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setBottomInput(amountDraft || "0");
                    setAmountEditorVisible(false);
                  }}
                  style={{ backgroundColor: "#6D28D9", paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10 }}
                >
                  <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        <FieldRow icon={<Ionicons name="calendar-outline" size={20} color={bottomColor} />} isDark={isDark}>
          <TextInput
            style={fieldStyles.input}
            value={bottomDaysInput}
            onChangeText={setBottomDaysInput}
            keyboardType="numeric"
            editable={canEdit}
            placeholder="Days to complete"
            placeholderTextColor="#9CA3AF"
          />
        </FieldRow>
        <TouchableOpacity
          style={[
            styles.updateButton,
            { borderColor: bottomColor },
            (!canEdit || isUpdating) && styles.disabledButton,
          ]}
          onPress={handleUpdateOwnOffer}
          disabled={!canEdit || isUpdating}
        >
          {isUpdating ? (
            <ActivityIndicator size="small" color={bottomColor} />
          ) : (
            <Text style={[styles.updateButtonText, { color: bottomColor }]}>
              {canEdit ? "Update Offer" : "Locked"}
            </Text>
          )}
        </TouchableOpacity>

        {/* Offer confirmation: both parties must confirm the same latest offer */}
        {offerLatest && isNegotiable ? (
          confirmation?.ready ? (
            <Text style={{ textAlign: "center", color: bottomColor, fontWeight: "600", marginTop: 8, fontSize: 12 }}>
              Offer accepted. Both parties have the same amount and duration.
            </Text>
          ) : offerLatest.senderType === myRoleKey ? (
            <Text style={{ textAlign: "center", color: bottomColor, fontWeight: "600", marginTop: 8, fontSize: 12 }}>
              Waiting for {otherPartyName} to accept your offer
            </Text>
          ) : null
        ) : null}
      </View>

      {/* Info Banner */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={18} color="#6D28D9" style={{ marginRight: 6 }} />
        <Text style={styles.infoText}>
          {isNegotiable
            ? "Agree on budget & timeline to continue the project."
            : `Agreed: ₹${agreedAmount || bottomAmount}${agreedDays ? ` in ${agreedDays} day${agreedDays > 1 ? 's' : ''}` : ''}`}
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
    </KeyboardAwareScrollView>
  );
};

export default NegotiationPanel;

const getStyles = (currentTheme, isDark) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: currentTheme.surface || "#F8FAFC",
    borderRightWidth: 1,
    borderRightColor: currentTheme.border || "#E2E8F0",
    padding: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
    color: currentTheme.text || "#1E293B",
  },
  subtitle: {
    fontSize: 9,
    textAlign: "center",
    color: currentTheme.subText || "#64748B",
    marginTop: 1,
  },
  backButton: {
    padding: 2,
    marginRight: 4,
    justifyContent: "center",
  },
  refreshButton: {
    padding: 2,
  },
  closeButton: {
    padding: 2,
    marginLeft: 6,
  },
  offerCard: {
    borderRadius: 12,
    padding: 10,
    marginBottom: 4,
  },
  offerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  offerTitleText: {
    flex: 1,
    fontSize: 11,
    fontWeight: "600",
    color: currentTheme.text || "#334155",
  },
  latestPill: {
    backgroundColor: isDark ? "#3B2D63" : "#EDE9FE",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 6,
  },
  latestPillText: {
    fontSize: 9,
    fontWeight: "700",
    color: isDark ? "#C4B5FD" : "#6D28D9",
  },
  amountDisplay: {
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
    marginVertical: 2,
  },
  daysDisplay: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 2,
  },
  inputContainer: {
    backgroundColor: isDark ? "#2A2A3D" : "#FFFFFF",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: isDark ? "#444458" : "#CBD5E1",
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginBottom: 6,
  },
  textInput: {
    fontSize: 12,
    color: currentTheme.text || "#0F172A",
    textAlign: "center",
    padding: 2,
  },
  updateButton: {
    borderRadius: 6,
    borderWidth: 1,
    paddingVertical: 5,
    alignItems: "center",
  },
  updateButtonText: {
    fontSize: 11,
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
    backgroundColor: currentTheme.border || "#E2E8F0",
  },
  vsBadge: {
    backgroundColor: isDark ? "#2A2A3D" : "#F1F5F9",
    borderWidth: 1,
    borderColor: isDark ? "#444458" : "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginHorizontal: 4,
  },
  vsText: {
    fontSize: 10,
    fontWeight: "600",
    color: currentTheme.subText || "#64748B",
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: isDark ? "#3A2A55" : "#F3E8FF",
    borderRadius: 8,
    padding: 8,
    marginTop: 12,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 10,
    color: isDark ? "#E9D5FF" : "#5B21B6",
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
    backgroundColor: isDark ? "#3A2A55" : "#F3E8FF",
    borderRadius: 8,
    padding: 8,
    gap: 4,
  },
  couponToggleText: {
    fontSize: 11,
    fontWeight: "600",
    color: isDark ? "#C4B5FD" : "#6D28D9",
    flex: 1,
  },
  appliedCouponCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: isDark ? "#064E3B" : "#ECFDF5",
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
    color: isDark ? "#6EE7B7" : "#059669",
  },
  appliedCouponMin: {
    fontSize: 10,
    color: isDark ? "#A7F3D0" : "#6B7280",
    marginTop: 2,
  },
  couponMessageCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: isDark ? "#064E3B" : "#ECFDF5",
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#10B981",
  },
  couponMessageText: {
    fontSize: 10,
    fontWeight: "600",
    color: isDark ? "#6EE7B7" : "#059669",
    flex: 1,
    lineHeight: 14,
  },
  couponList: {
    marginTop: 6,
  },
  couponItem: {
    backgroundColor: isDark ? "#2A2A3D" : "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: isDark ? "#444458" : "#E2E8F0",
    padding: 8,
    marginBottom: 6,
  },
  couponItemDisabled: {
    opacity: 0.5,
  },
  couponItemTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: isDark ? "#C4B5FD" : "#6D28D9",
  },
  couponItemMin: {
    fontSize: 9,
    color: isDark ? "#9CA3AF" : "#6B7280",
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
    borderColor: isDark ? "#A855F7" : "#6D28D9",
    paddingVertical: 8,
    alignItems: "center",
  },
  proposalButtonText: {
    fontSize: 11,
    fontWeight: "600",
    color: isDark ? "#C4B5FD" : "#6D28D9",
  },
});
