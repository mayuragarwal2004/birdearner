import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import SafeSpinner from "../components/SafeSpinner";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  Bell,
  ChatCircleText,
  MagnifyingGlass,
  MapPin,
  Sparkle,
} from "phosphor-react-native";
import { format, isValid } from "date-fns";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/NewAuthContext";
import { useTheme } from "../context/ThemeContext";
import apiService from "../lib/apiService";
import ClientHomeServiceFinder from "../components/ClientHomeServiceFinder";
import AddressPickerModal from "../components/AddressPickerModal";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDeliveryAddress } from "../hooks/useDeliveryAddress";

const PURPLE = "#7B2CFF";
const DEEP_PURPLE = "#4B0082";
const placeholderImageURL = "https://picsum.photos/seed/";
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PROMO_WIDTH = SCREEN_WIDTH - 40;

const formatSchedule = (deadline) => {
  if (!deadline) return "Schedule not set";
  const date = new Date(deadline);
  if (!isValid(date)) return "Schedule not set";
  return `Due ${format(date, "d MMM, h:mm a")}`;
};

const getStatusMeta = (status, isDark) => {
  const value = (status || "").toUpperCase();
  if (value === "IN_PROGRESS" || value === "ASSIGNED" || value === "ACTIVE") {
    return {
      label: "In Progress",
      color: isDark ? "#B794FF" : PURPLE,
      bg: isDark ? "rgba(123,44,255,0.22)" : "#F3EAFF",
    };
  }
  if (value === "OPEN" || value === "PENDING") {
    return {
      label: "Open",
      color: isDark ? "#FBBF24" : "#D97706",
      bg: isDark ? "rgba(245,158,11,0.2)" : "#FFF6DF",
    };
  }
  if (value === "COMPLETED") {
    return {
      label: "Completed",
      color: isDark ? "#4ADE80" : "#16A34A",
      bg: isDark ? "rgba(34,197,94,0.18)" : "#EAF8EF",
    };
  }
  return {
    label: value || "Job",
    color: isDark ? "#94A3B8" : "#64748B",
    bg: isDark ? "rgba(148,163,184,0.18)" : "#F1F5F9",
  };
};

const ClientHomeScreen = () => {
  const [search, setSearch] = useState("");
  const [ongoingJobs, setOngoingJobs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [promoIndex, setPromoIndex] = useState(0);
  const [profilePercentage, setProfilePercentage] = useState(20);
  const [addressPickerOpen, setAddressPickerOpen] = useState(false);
  const [banners, setBanners] = useState([]);
  const [offerCards, setOfferCards] = useState([]);
  const [loadingPromos, setLoadingPromos] = useState(true);

  const servicesRef = useRef(null);
  const { userData } = useAuth();
  const navigation = useNavigation();
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const isDark = theme === "dark";
  const styles = useMemo(
    () => getStyles(currentTheme, isDark),
    [currentTheme, isDark]
  );

  const client = userData?.client;
  const {
    addresses,
    selectedAddress,
    coords,
    locating,
    displayLabel,
    displayAddress,
    selectAddress,
    addAddress,
    removeAddress,
    useCurrentLocationAsAddress,
    refresh: refreshAddresses,
  } = useDeliveryAddress(userData?.id, client);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  useEffect(() => {
    let percentage = 20;
    if (client?.fullName || userData?.fullName) percentage = 20;
    if (client?.country) percentage = 40;
    if (client?.profilePhoto) percentage = 70;
    if (client?.termsAccepted) percentage = 100;
    setProfilePercentage(percentage);
  }, [client, userData, refreshing]);

  const fetchNotifications = async () => {
    try {
      if (!userData?.id) return;
      const response = await apiService.getNotifications(userData.id, 1);
      if (response?.data) {
        setNotifications(response.data.slice(0, 5));
      }
    } catch (error) {
      if (!error?.isAuthError) {
        console.error("Error fetching notifications in ClientHome:", error);
      }
    }
  };

  const fetchOngoingJobs = async () => {
    try {
      if (userData?.role !== "CLIENT" || !userData?.client?.id) {
        setOngoingJobs([]);
        return;
      }
      setLoadingJobs(true);
      const ongoingJobsData = await apiService.getOngoingJobsByClientId(
        userData.client.id
      );
      setOngoingJobs(Array.isArray(ongoingJobsData) ? ongoingJobsData : []);
    } catch (error) {
      if (!error?.isAuthError) {
        console.error("Error fetching ongoing jobs:", error);
      }
      setOngoingJobs([]);
    } finally {
      setLoadingJobs(false);
    }
  };

  const fetchHomePromos = async () => {
    try {
      setLoadingPromos(true);
      const data = await apiService.getHomePromos();
      setBanners(Array.isArray(data?.banners) ? data.banners : []);
      setOfferCards(Array.isArray(data?.offers) ? data.offers : []);
    } catch (error) {
      console.warn("Home promos unavailable:", error?.message);
      setBanners([]);
      setOfferCards([]);
    } finally {
      setLoadingPromos(false);
    }
  };

  useEffect(() => {
    fetchOngoingJobs();
    fetchNotifications();
    fetchHomePromos();
  }, [userData?.client?.id, refreshing]);

  const onRefresh = async () => {
    setRefreshing(true);
    servicesRef.current?.refreshCard?.();
    await Promise.all([
      fetchOngoingJobs(),
      fetchNotifications(),
      refreshAddresses(),
      fetchHomePromos(),
    ]);
    setRefreshing(false);
  };

  const openJobRequirementsFromPromo = async (promo) => {
    try {
      const serviceType =
        promo?.serviceType ||
        (promo?.serviceCategory === "HOUSEHOLD"
          ? "household"
          : promo?.serviceCategory === "FREELANCE"
            ? "freelance"
            : null);

      if (promo?.serviceId && serviceType) {
        await AsyncStorage.setItem(
          "selectedService",
          JSON.stringify({
            serviceId: promo.serviceId,
            serviceName: promo.serviceName || promo.title,
            serviceType,
          })
        );
      }

      const prefill = {
        jobTitle: promo?.prefillJobTitle || "",
        jobDes: promo?.prefillJobDescription || "",
        budget: promo?.prefillBudget || "",
        jobType: promo?.prefillJobType || "",
        paymentMethod: promo?.prefillPaymentMethod || "",
        skills: Array.isArray(promo?.prefillSkills)
          ? promo.prefillSkills
          : typeof promo?.prefillSkills === "string"
            ? promo.prefillSkills.split(",").map((s) => s.trim()).filter(Boolean)
            : [],
        serviceId: promo?.serviceId || "",
        freelancerType: promo?.serviceName || "",
      };

      const hasPrefill = Object.values(prefill).some((v) =>
        Array.isArray(v) ? v.length > 0 : Boolean(v)
      );
      if (hasPrefill) {
        await AsyncStorage.setItem(
          "jobRequirementsPrefill",
          JSON.stringify(prefill)
        );
      }

      navigation.navigate("Job Requirements");
    } catch (error) {
      console.error("Failed to open job requirements from promo:", error);
      navigation.navigate("Job Requirements");
    }
  };

  const openInbox = () => {
    navigation.navigate("ClientChatList");
  };

  const openJobDetails = (item) => {
    const jobId = item?.jobDetails?.id || item?.jobDetails?.$id;
    if (!jobId) {
      navigation.navigate("Job Posted");
      return;
    }
    navigation.navigate("ClientChatList", {
      jobId,
      receiverId: item?.jobDetails?.assigned_freelancer,
      full_name: item?.full_name,
      profileImage: item?.profile_photo,
    });
  };

  const handleCompleteProfile = () => {
    if (userData?.role === "CLIENT") {
      navigation.navigate("ClientSignup");
    }
  };

  const onPromoScroll = (event) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / PROMO_WIDTH);
    setPromoIndex(index);
  };

  const renderOngoingJob = (item, index) => {
    const details = item.jobDetails;
    if (!details) return null;
    const status = getStatusMeta(details.jobStatus, isDark);
    const serviceImage =
      details.service?.imageUrl ||
      details.attachedFiles?.[0] ||
      null;
    const title = details.jobTitle || details.service?.name || "Ongoing job";

    return (
      <View key={details.id || index} style={styles.jobCard}>
        <Image
          source={{
            uri: serviceImage
              ? apiService.loadImageURI(serviceImage)
              : `${placeholderImageURL}job-${index}/120/120`,
          }}
          style={styles.jobImage}
        />
        <View style={styles.jobContent}>
          <View style={styles.jobTitleRow}>
            <Text style={styles.jobTitle} numberOfLines={1}>
              {title}
            </Text>
            <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
              <Text style={[styles.statusText, { color: status.color }]}>
                {status.label}
              </Text>
            </View>
          </View>
          <Text style={styles.jobSchedule}>{formatSchedule(details.deadline)}</Text>
          <View style={styles.freelancerRow}>
            <Image
              source={
                item.profile_photo
                  ? { uri: apiService.loadImageURI(item.profile_photo) }
                  : require("../assets/profile.png")
              }
              style={styles.freelancerAvatar}
            />
            <Text style={styles.freelancerName} numberOfLines={1}>
              {item.full_name || "Unassigned"}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.viewDetailsBtn}
          onPress={() => openJobDetails(item)}
        >
          <Text style={styles.viewDetailsText}>View Details</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={isDark ? "#1B1028" : DEEP_PURPLE}
      />
      <View style={styles.headerBand}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.locationBlock}
            onPress={() => setAddressPickerOpen(true)}
            activeOpacity={0.85}
          >
            <View style={styles.locationLabelRow}>
              <MapPin size={16} color="#FFFFFF" weight="fill" />
              <Text style={styles.locationEyebrow}>
                {selectedAddress?.label
                  ? `Delivering to ${selectedAddress.label}`
                  : displayLabel}
              </Text>
              <Ionicons name="chevron-down" size={14} color="#FFFFFF" />
            </View>
            <Text style={styles.locationText} numberOfLines={1}>
              {displayAddress}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bellButton}
            onPress={() => navigation.navigate("Notification")}
          >
            <Bell size={22} color="#FFFFFF" weight="fill" />
            {unreadCount > 0 && <View style={styles.bellDot} />}
          </TouchableOpacity>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <MagnifyingGlass size={18} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for services..."
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <TouchableOpacity
            style={styles.eggButton}
            onPress={() => navigation.navigate("Offers")}
            activeOpacity={0.85}
          >
            <Image
              source={require("../assets/egg.png")}
              style={styles.eggImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.mainScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[PURPLE]}
            tintColor={PURPLE}
            progressBackgroundColor={currentTheme.cardBackground || "#fff"}
          />
        }
      >
        {/* Promo carousel — admin-configured banners */}
        {loadingPromos && banners.length === 0 ? (
          <SafeSpinner color={PURPLE} size={24} style={{ marginVertical: 24 }} />
        ) : banners.length > 0 ? (
          <>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={onPromoScroll}
              scrollEventThrottle={16}
              contentContainerStyle={styles.promoPager}
              decelerationRate="fast"
              snapToInterval={PROMO_WIDTH + 12}
              snapToAlignment="start"
            >
              {banners.map((promo) => (
                <TouchableOpacity
                  key={promo.id}
                  activeOpacity={0.92}
                  onPress={() => openJobRequirementsFromPromo(promo)}
                  style={[
                    styles.promoCard,
                    {
                      width: PROMO_WIDTH,
                      backgroundColor: promo.backgroundColor || (isDark ? "#2A2034" : "#F3EAFF"),
                    },
                  ]}
                >
                  {promo.imageUrl ? (
                    <Image
                      source={{ uri: apiService.loadImageURI(promo.imageUrl) }}
                      style={styles.promoImage}
                      resizeMode="cover"
                    />
                  ) : null}
                  <View style={styles.promoCopy}>
                    <Text
                      style={[
                        styles.promoTitle,
                        promo.textColor ? { color: promo.textColor } : null,
                      ]}
                    >
                      {promo.title}
                    </Text>
                    {!!promo.subtitle && (
                      <Text
                        style={[
                          styles.promoSubtitle,
                          promo.textColor ? { color: promo.textColor, opacity: 0.85 } : null,
                        ]}
                      >
                        {promo.subtitle}
                      </Text>
                    )}
                    <View
                      style={[
                        styles.promoCta,
                        promo.accentColor
                          ? { backgroundColor: promo.accentColor }
                          : null,
                      ]}
                    >
                      <Text style={styles.promoCtaText}>
                        {promo.ctaLabel || "Book now"}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.dotsRow}>
              {banners.map((promo, index) => (
                <View
                  key={promo.id}
                  style={[styles.dot, index === promoIndex && styles.dotActive]}
                />
              ))}
            </View>
          </>
        ) : null}

        {/* Service lists */}
        <ClientHomeServiceFinder ref={servicesRef} search={search} />

        {/* Ongoing jobs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Ongoing Jobs</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Job Posted")}>
              <Text style={styles.viewAll}>View all</Text>
            </TouchableOpacity>
          </View>

          {loadingJobs ? (
            <View style={styles.loadingBox}>
              <SafeSpinner color={PURPLE} size={24} />
            </View>
          ) : ongoingJobs.length > 0 ? (
            ongoingJobs.slice(0, 3).map(renderOngoingJob)
          ) : (
            <View style={styles.emptyJobCard}>
              <Sparkle size={28} color={PURPLE} weight="fill" />
              <Text style={styles.emptyJobTitle}>No ongoing jobs</Text>
              <Text style={styles.emptyJobText}>
                Post a job to start working with freelancers.
              </Text>
              <TouchableOpacity
                style={styles.emptyJobBtn}
                onPress={() => navigation.navigate("Job Requirements")}
              >
                <Text style={styles.emptyJobBtnText}>Post a job</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Offers & Discounts — admin-configured; tap opens Job Requirements */}
        {offerCards.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Offers & Discounts</Text>
            </View>
            <View style={styles.offersRow}>
              {offerCards.map((offer, index) => (
                <TouchableOpacity
                  key={offer.id}
                  style={[
                    styles.offerCard,
                    index === 0 ? styles.offerWide : styles.offerNarrow,
                    {
                      backgroundColor:
                        offer.backgroundColor ||
                        (index === 0
                          ? isDark
                            ? "#2A2034"
                            : "#F3EAFF"
                          : isDark
                            ? "#1F2A24"
                            : "#EAF7F0"),
                    },
                  ]}
                  onPress={() => openJobRequirementsFromPromo(offer)}
                  activeOpacity={0.88}
                >
                  {offer.imageUrl ? (
                    <Image
                      source={{ uri: apiService.loadImageURI(offer.imageUrl) }}
                      style={styles.offerImage}
                      resizeMode="cover"
                    />
                  ) : null}
                  <Text
                    style={[
                      styles.offerTitle,
                      offer.textColor ? { color: offer.textColor } : null,
                    ]}
                  >
                    {offer.title}
                  </Text>
                  {!!offer.badge && (
                    <View
                      style={[
                        styles.offerBadge,
                        offer.accentColor
                          ? { backgroundColor: offer.accentColor }
                          : null,
                      ]}
                    >
                      <Text style={styles.offerBadgeText}>{offer.badge}</Text>
                    </View>
                  )}
                  {!!offer.subtitle && (
                    <Text
                      style={[
                        styles.offerDesc,
                        offer.textColor
                          ? { color: offer.textColor, opacity: 0.85 }
                          : null,
                      ]}
                    >
                      {offer.subtitle}
                    </Text>
                  )}
                  {!!offer.ctaLabel && (
                    <View style={styles.offerCta}>
                      <Text style={styles.offerCtaText}>{offer.ctaLabel}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Profile completion */}
        {!client?.termsAccepted && profilePercentage !== 100 && (
          <View style={styles.profileCard}>
            <Text style={styles.profileTitle}>Complete Your Profile</Text>
            <Text style={styles.profileSubtitle}>
              Your profile is {profilePercentage}% complete
            </Text>
            <View style={styles.progressTrack}>
              <View
                style={[styles.progressFill, { width: `${profilePercentage}%` }]}
              />
            </View>
            <TouchableOpacity
              style={styles.profileCta}
              onPress={handleCompleteProfile}
            >
              <Text style={styles.profileCtaText}>Complete Now</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={openInbox} activeOpacity={0.9}>
        <ChatCircleText size={26} color="#FFFFFF" weight="fill" />
      </TouchableOpacity>

      <AddressPickerModal
        visible={addressPickerOpen}
        onClose={() => setAddressPickerOpen(false)}
        addresses={addresses}
        selectedAddress={selectedAddress}
        coords={coords}
        locating={locating}
        onSelect={selectAddress}
        onAdd={addAddress}
        onUseCurrentLocation={useCurrentLocationAsAddress}
        onDelete={removeAddress}
      />
    </SafeAreaView>
  );
};

const getStyles = (currentTheme, isDark) => {
  const surface = currentTheme.background || "#FFFFFF";
  const card = currentTheme.cardBackground || (isDark ? "#1A1A1A" : "#FFFFFF");
  const text = currentTheme.text || "#101114";
  const muted = currentTheme.subText || "#656B7A";
  const border = currentTheme.border || "#E7E1EF";
  const soft = isDark ? "#2A2034" : "#F3EAFF";
  const softMint = isDark ? "#1F2A24" : "#EAF7F0";
  const softPeach = isDark ? "#2A221C" : "#FFF1E8";

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      // Match header so the status-bar / notch inset is purple, not white
      backgroundColor: isDark ? "#1B1028" : DEEP_PURPLE,
    },
    headerBand: {
      backgroundColor: isDark ? "#1B1028" : DEEP_PURPLE,
      paddingHorizontal: 20,
      paddingBottom: 18,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
    },
    headerTop: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      paddingTop: 6,
      marginBottom: 14,
    },
    locationBlock: {
      flex: 1,
      paddingRight: 12,
    },
    locationLabelRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    locationEyebrow: {
      color: "rgba(255,255,255,0.85)",
      fontSize: 12,
      fontWeight: "700",
    },
    locationText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "900",
      marginTop: 4,
    },
    bellButton: {
      width: 42,
      height: 42,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.16)",
    },
    bellDot: {
      position: "absolute",
      top: 10,
      right: 11,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#EF4444",
      borderWidth: 1.5,
      borderColor: DEEP_PURPLE,
    },
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    searchBox: {
      flex: 1,
      minHeight: 48,
      borderRadius: 14,
      backgroundColor: "#FFFFFF",
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      gap: 10,
    },
    searchInput: {
      flex: 1,
      color: "#0F172A",
      fontSize: 15,
      fontWeight: "600",
      paddingVertical: Platform.OS === "ios" ? 12 : 8,
    },
    eggButton: {
      width: 48,
      height: 48,
      borderRadius: 14,
      overflow: "hidden",
      backgroundColor: "rgba(255,255,255,0.18)",
      borderWidth: 2,
      borderColor: "rgba(255,255,255,0.45)",
      alignItems: "center",
      justifyContent: "center",
    },
    eggImage: {
      width: 30,
      height: 30,
    },
    scrollContent: {
      paddingBottom: Platform.OS === "ios" ? 140 : 120,
      paddingTop: 18,
    },
    mainScroll: {
      flex: 1,
      backgroundColor: surface,
    },
    promoPager: {
      paddingHorizontal: 20,
      gap: 12,
    },
    promoCard: {
      borderRadius: 20,
      overflow: "hidden",
      backgroundColor: soft,
      minHeight: 168,
    },
    promoImage: {
      ...StyleSheet.absoluteFillObject,
      width: "100%",
      height: "100%",
    },
    promoCopy: {
      padding: 20,
      minHeight: 168,
      justifyContent: "center",
    },
    promoTitle: {
      color: text,
      fontSize: 22,
      fontWeight: "900",
      lineHeight: 28,
      maxWidth: "90%",
    },
    promoSubtitle: {
      color: muted,
      fontSize: 14,
      fontWeight: "600",
      marginTop: 8,
      marginBottom: 16,
    },
    promoCta: {
      alignSelf: "flex-start",
      backgroundColor: PURPLE,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    promoCtaText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "900",
    },
    dotsRow: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 6,
      marginTop: 12,
      marginBottom: 10,
    },
    dot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: isDark ? "#3F3F46" : "#D6D3DE",
    },
    dotActive: {
      width: 18,
      backgroundColor: PURPLE,
    },
    section: {
      marginTop: 22,
      paddingHorizontal: 20,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    sectionTitle: {
      color: text,
      fontSize: 18,
      fontWeight: "900",
    },
    viewAll: {
      color: PURPLE,
      fontSize: 13,
      fontWeight: "800",
    },
    loadingBox: {
      minHeight: 90,
      alignItems: "center",
      justifyContent: "center",
    },
    jobCard: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: border,
      backgroundColor: card,
      padding: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 12,
    },
    jobImage: {
      width: 64,
      height: 64,
      borderRadius: 14,
      backgroundColor: soft,
    },
    jobContent: {
      flex: 1,
      minWidth: 0,
    },
    jobTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    jobTitle: {
      flexShrink: 1,
      color: text,
      fontSize: 15,
      fontWeight: "900",
    },
    statusPill: {
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    statusText: {
      fontSize: 10,
      fontWeight: "900",
    },
    jobSchedule: {
      color: muted,
      fontSize: 12,
      fontWeight: "600",
      marginTop: 4,
    },
    freelancerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 8,
    },
    freelancerAvatar: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: soft,
    },
    freelancerName: {
      flex: 1,
      color: text,
      fontSize: 12,
      fontWeight: "700",
    },
    viewDetailsBtn: {
      borderWidth: 1.5,
      borderColor: PURPLE,
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 10,
      backgroundColor: isDark ? "transparent" : "#FFFFFF",
    },
    viewDetailsText: {
      color: PURPLE,
      fontSize: 11,
      fontWeight: "900",
    },
    emptyJobCard: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: border,
      backgroundColor: card,
      padding: 20,
      alignItems: "center",
    },
    emptyJobTitle: {
      color: text,
      fontSize: 16,
      fontWeight: "900",
      marginTop: 10,
    },
    emptyJobText: {
      color: muted,
      fontSize: 13,
      textAlign: "center",
      marginTop: 6,
      lineHeight: 18,
    },
    emptyJobBtn: {
      marginTop: 14,
      backgroundColor: PURPLE,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    emptyJobBtnText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "900",
    },
    offersRow: {
      flexDirection: "row",
      gap: 12,
    },
    offerCard: {
      borderRadius: 18,
      padding: 16,
      minHeight: 150,
      overflow: "hidden",
    },
    offerImage: {
      position: "absolute",
      top: 0,
      right: 0,
      width: 72,
      height: 72,
      opacity: 0.35,
      borderBottomLeftRadius: 18,
    },
    offerWide: {
      flex: 1.25,
    },
    offerNarrow: {
      flex: 1,
      justifyContent: "center",
    },
    offerTitle: {
      color: text,
      fontSize: 18,
      fontWeight: "900",
    },
    offerBadge: {
      alignSelf: "flex-start",
      marginTop: 8,
      backgroundColor: PURPLE,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    offerBadgeText: {
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight: "900",
    },
    offerDesc: {
      color: muted,
      fontSize: 13,
      fontWeight: "600",
      marginTop: 10,
      lineHeight: 18,
    },
    offerCta: {
      marginTop: 14,
      alignSelf: "flex-start",
      backgroundColor: PURPLE,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    offerCtaText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "900",
    },
    profileCard: {
      marginTop: 22,
      marginHorizontal: 20,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: border,
      backgroundColor: card,
      padding: 18,
    },
    profileTitle: {
      color: text,
      fontSize: 17,
      fontWeight: "900",
    },
    profileSubtitle: {
      color: muted,
      fontSize: 13,
      fontWeight: "600",
      marginTop: 6,
      marginBottom: 12,
    },
    progressTrack: {
      height: 8,
      borderRadius: 999,
      backgroundColor: isDark ? "#2A2A2A" : "#EDE7F6",
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      backgroundColor: PURPLE,
      borderRadius: 999,
    },
    profileCta: {
      marginTop: 14,
      alignSelf: "flex-start",
      backgroundColor: PURPLE,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    profileCtaText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "900",
    },
    fab: {
      position: "absolute",
      right: 20,
      bottom: Platform.OS === "ios" ? 100 : 86,
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: DEEP_PURPLE,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#2C1B3F",
      shadowOpacity: 0.25,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
      zIndex: 20,
    },
  });
};

export default ClientHomeScreen;
