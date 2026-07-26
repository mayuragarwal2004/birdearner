import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  House,
  MapPin,
  NavigationArrow,
  PencilSimple,
  PlusCircle,
  Trash,
} from "phosphor-react-native";
import { useAuth } from "../context/NewAuthContext";
import { useTheme } from "../context/ThemeContext";
import { useDeliveryAddress } from "../hooks/useDeliveryAddress";
import AddressPickerModal from "../components/AddressPickerModal";
import { distanceKm, formatAddressLine } from "../lib/addressStorage";

const PURPLE = "#7B2CFF";

const ManageAddressesScreen = ({ navigation }) => {
  const { userData } = useAuth();
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const isDark = theme === "dark";
  const styles = useMemo(() => getStyles(currentTheme, isDark), [currentTheme, isDark]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [startInForm, setStartInForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  const {
    addresses,
    selectedAddress,
    coords,
    loading,
    locating,
    selectAddress,
    addAddress,
    removeAddress,
    useCurrentLocationAsAddress,
    refresh,
  } = useDeliveryAddress(userData?.id, userData?.client);

  const openAdd = () => {
    setEditingAddress(null);
    setStartInForm(true);
    setPickerOpen(true);
  };

  const openEdit = (address) => {
    setStartInForm(false);
    setEditingAddress(address);
    setPickerOpen(true);
  };

  const closePicker = () => {
    setPickerOpen(false);
    setStartInForm(false);
    setEditingAddress(null);
  };

  const confirmDelete = (addressId) => {
    Alert.alert("Delete address", "Remove this saved address?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => removeAddress(addressId),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color={currentTheme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Addresses</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={refresh}>
          <Ionicons name="refresh" size={20} color={PURPLE} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={async () => {
            await useCurrentLocationAsAddress();
          }}
          disabled={locating}
        >
          <View style={styles.actionIcon}>
            {locating ? (
              <ActivityIndicator color={PURPLE} />
            ) : (
              <NavigationArrow size={20} color={PURPLE} weight="fill" />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>Use current location</Text>
            <Text style={styles.actionSub}>Save your GPS spot with coordinates</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={openAdd}>
          <View style={styles.actionIcon}>
            <PlusCircle size={20} color={PURPLE} weight="fill" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>Add new address</Text>
            <Text style={styles.actionSub}>Details + map pin required</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>Saved addresses</Text>
        {loading ? (
          <ActivityIndicator color={PURPLE} style={{ marginTop: 20 }} />
        ) : addresses.length === 0 ? (
          <Text style={styles.empty}>No addresses saved yet.</Text>
        ) : (
          addresses.map((address) => {
            const selected = selectedAddress?.id === address.id;
            const km =
              coords?.latitude != null
                ? distanceKm(
                    coords.latitude,
                    coords.longitude,
                    address.latitude,
                    address.longitude
                  )
                : null;
            const pinned = address.latitude != null && address.longitude != null;
            return (
              <View key={address.id} style={[styles.card, selected && styles.cardActive]}>
                <TouchableOpacity
                  style={styles.cardMain}
                  onPress={() => selectAddress(address.id)}
                >
                  <View style={styles.cardIcon}>
                    {address.label === "Home" ? (
                      <House size={18} color={PURPLE} weight="fill" />
                    ) : (
                      <MapPin size={18} color={PURPLE} weight="fill" />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.titleRow}>
                      <Text style={styles.label}>{address.label || "Address"}</Text>
                      {selected && (
                        <View style={styles.pill}>
                          <Text style={styles.pillText}>Default</Text>
                        </View>
                      )}
                      {Number.isFinite(km) && km < 1000 && (
                        <Text style={styles.distance}>
                          {km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.line}>{formatAddressLine(address)}</Text>
                    {!pinned && (
                      <Text style={styles.coords}>No map pin yet — tap edit to add</Text>
                    )}
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn} onPress={() => openEdit(address)}>
                  <PencilSimple size={18} color={PURPLE} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => confirmDelete(address.id)}
                >
                  <Trash size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>

      <AddressPickerModal
        visible={pickerOpen}
        onClose={closePicker}
        addresses={addresses}
        selectedAddress={selectedAddress}
        coords={coords}
        locating={locating}
        startInForm={startInForm}
        editingAddress={editingAddress}
        onSelect={selectAddress}
        onAdd={addAddress}
        onUseCurrentLocation={useCurrentLocationAsAddress}
        onDelete={confirmDelete}
      />
    </SafeAreaView>
  );
};

const getStyles = (theme, isDark) => {
  const surface = theme.background || "#fff";
  const card = theme.cardBackground || surface;
  const text = theme.text || "#101114";
  const muted = theme.subText || "#666";
  const border = theme.border || "#E7E1EF";
  const soft = isDark ? "#2A2034" : "#F7F2FF";

  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: surface },
    header: {
      minHeight: 64,
      paddingHorizontal: 18,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    backBtn: { width: 40, height: 40, justifyContent: "center" },
    headerTitle: { color: text, fontSize: 20, fontWeight: "900" },
    refreshBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: soft,
    },
    content: { paddingHorizontal: 18, paddingBottom: 40 },
    actionCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderWidth: 1,
      borderColor: border,
      borderRadius: 14,
      padding: 14,
      marginBottom: 10,
      backgroundColor: soft,
    },
    actionIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "#1B1028" : "#fff",
    },
    actionTitle: { color: text, fontSize: 15, fontWeight: "900" },
    actionSub: { color: muted, fontSize: 12, marginTop: 2, fontWeight: "600" },
    sectionLabel: {
      marginTop: 14,
      marginBottom: 10,
      color: muted,
      fontSize: 12,
      fontWeight: "800",
      textTransform: "uppercase",
    },
    empty: { color: muted, fontWeight: "600" },
    card: {
      flexDirection: "row",
      gap: 4,
      borderWidth: 1,
      borderColor: border,
      borderRadius: 14,
      padding: 12,
      marginBottom: 10,
      backgroundColor: card,
      alignItems: "flex-start",
    },
    cardActive: { borderColor: PURPLE, backgroundColor: soft },
    cardMain: {
      flex: 1,
      flexDirection: "row",
      gap: 10,
      minWidth: 0,
    },
    cardIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: soft,
    },
    titleRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
    label: { color: text, fontSize: 15, fontWeight: "900" },
    pill: {
      backgroundColor: PURPLE,
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    pillText: { color: "#fff", fontSize: 10, fontWeight: "900" },
    distance: { color: muted, fontSize: 11, fontWeight: "700" },
    line: { color: muted, fontSize: 13, fontWeight: "600", marginTop: 4, lineHeight: 18 },
    coords: { color: muted, fontSize: 11, fontWeight: "700", marginTop: 4 },
    iconBtn: { padding: 6 },
  });
};

export default ManageAddressesScreen;
