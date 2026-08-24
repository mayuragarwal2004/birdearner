import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import SafeSpinner from "./SafeSpinner";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import {
  House,
  MapPin,
  NavigationArrow,
  PencilSimple,
  PlusCircle,
  Trash,
} from "phosphor-react-native";
import { distanceKm, formatAddressLine } from "../lib/addressStorage";
import { useTheme } from "../context/ThemeContext";

const PURPLE = "#7B2CFF";
const LABELS = ["Home", "Work", "Other"];
const DEFAULT_REGION = {
  latitude: 20.5937,
  longitude: 78.9629,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const emptyForm = () => ({
  id: null,
  label: "Home",
  line1: "",
  city: "",
  state: "",
  zipcode: "",
  country: "India",
  latitude: null,
  longitude: null,
});

const AddressPickerModal = ({
  visible,
  onClose,
  addresses = [],
  selectedAddress,
  coords,
  locating,
  onSelect,
  onAdd,
  onUseCurrentLocation,
  onDelete,
  startInForm = false,
  editingAddress = null,
}) => {
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const isDark = theme === "dark";
  const styles = useMemo(
    () => getStyles(currentTheme, isDark),
    [currentTheme, isDark]
  );

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);

  const hasPin =
    form.latitude != null &&
    form.longitude != null &&
    !Number.isNaN(Number(form.latitude)) &&
    !Number.isNaN(Number(form.longitude));

  const mapRegion = hasPin
    ? {
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : coords?.latitude != null
      ? {
          latitude: Number(coords.latitude),
          longitude: Number(coords.longitude),
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }
      : DEFAULT_REGION;

  const resetForm = () => {
    setForm(emptyForm());
    setShowForm(false);
    setPinLoading(false);
  };

  useEffect(() => {
    if (!visible) {
      resetForm();
      return;
    }
    if (editingAddress) {
      openEditForm(editingAddress);
      return;
    }
    if (startInForm) {
      setShowForm(true);
      setForm(emptyForm());
    }
  }, [visible, startInForm, editingAddress]);

  const handleClose = () => {
    resetForm();
    onClose?.();
  };

  const openAddForm = () => {
    setForm(emptyForm());
    setShowForm(true);
  };

  const openEditForm = (address) => {
    setForm({
      id: address.id,
      label: address.label || "Home",
      line1: address.line1 || "",
      city: address.city || "",
      state: address.state || "",
      zipcode: address.zipcode != null ? String(address.zipcode) : "",
      country: address.country || "India",
      latitude: address.latitude != null ? Number(address.latitude) : null,
      longitude: address.longitude != null ? Number(address.longitude) : null,
    });
    setShowForm(true);
  };

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const fillFromGeocode = (place, nextCoords) => {
    const street = [place?.name, place?.street, place?.streetNumber]
      .filter(Boolean)
      .join(" ");
    setForm((prev) => ({
      ...prev,
      line1: street || prev.line1 || place?.district || place?.city || prev.line1,
      city: place?.city || place?.subregion || prev.city,
      state: place?.region || prev.state,
      zipcode: place?.postalCode || prev.zipcode,
      country: place?.country || prev.country || "India",
      latitude: nextCoords.latitude,
      longitude: nextCoords.longitude,
    }));
  };

  const requestPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Allow location access to set coordinates for this address."
      );
      return false;
    }
    return true;
  };

  const useCurrentLocationOnForm = async () => {
    const ok = await requestPermission();
    if (!ok) return;
    setPinLoading(true);
    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const nextCoords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      const places = await Location.reverseGeocodeAsync(nextCoords);
      fillFromGeocode(places?.[0], nextCoords);
    } catch (error) {
      Alert.alert("Location error", error.message || "Could not fetch location.");
    } finally {
      setPinLoading(false);
    }
  };

  const locateFromTypedAddress = async () => {
    const query = [form.line1, form.city, form.state, form.zipcode]
      .filter(Boolean)
      .join(", ")
      .trim();
    if (!query) {
      Alert.alert("Add details", "Enter house/street and city first.");
      return;
    }
    const ok = await requestPermission();
    if (!ok) return;
    setPinLoading(true);
    try {
      const results = await Location.geocodeAsync(query);
      const result = results?.[0];
      if (!result) {
        Alert.alert("Not found", "Could not locate that address. Try adjusting the text.");
        return;
      }
      setForm((prev) => ({
        ...prev,
        latitude: result.latitude,
        longitude: result.longitude,
      }));
    } catch (error) {
      Alert.alert(
        "Locate error",
        "Could not find coordinates for this address. Try using current location or tap the map to drop a pin."
      );
    } finally {
      setPinLoading(false);
    }
  };

  const onMapPress = async (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setForm((prev) => ({ ...prev, latitude, longitude }));
    setPinLoading(true);
    try {
      const places = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (places?.[0]) {
        fillFromGeocode(places[0], { latitude, longitude });
      }
    } catch {
      // Keep pin even if reverse geocode fails
    } finally {
      setPinLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.line1.trim() || !form.city.trim()) {
      Alert.alert("Missing details", "House/street and city are required.");
      return;
    }
    if (!hasPin) {
      Alert.alert(
        "Map pin required",
        "Use current location, locate from address, or tap the map to set a pin."
      );
      return;
    }

    setSaving(true);
    try {
      await onAdd?.({
        id: form.id || undefined,
        label: form.label,
        line1: form.line1.trim(),
        line2: "",
        city: form.city.trim(),
        state: form.state.trim(),
        zipcode: form.zipcode.trim(),
        country: form.country || "India",
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        lastUsedAt: Date.now(),
        source: form.id ? "edit" : "manual",
      });
      resetForm();
      onClose?.();
    } finally {
      setSaving(false);
    }
  };

  const isEditing = Boolean(form.id);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={handleClose}>
        <TouchableOpacity style={styles.sheet} activeOpacity={1}>
          <View style={styles.handle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>
              {showForm
                ? isEditing
                  ? "Edit address"
                  : "Add address"
                : "Select delivery address"}
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={currentTheme.text} />
            </TouchableOpacity>
          </View>

          {showForm ? (
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.fieldLabel}>Save as</Text>
              <View style={styles.labelRow}>
                {LABELS.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[styles.labelChip, form.label === item && styles.labelChipActive]}
                    onPress={() => updateField("label", item)}
                  >
                    <Text
                      style={[
                        styles.labelChipText,
                        form.label === item && styles.labelChipTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>House / Street</Text>
              <TextInput
                style={styles.input}
                placeholder="Flat, street, landmark"
                placeholderTextColor={styles.placeholder.color}
                value={form.line1}
                onChangeText={(v) => updateField("line1", v)}
              />
              <Text style={styles.fieldLabel}>City</Text>
              <TextInput
                style={styles.input}
                placeholder="City"
                placeholderTextColor={styles.placeholder.color}
                value={form.city}
                onChangeText={(v) => updateField("city", v)}
              />
              <View style={styles.row}>
                <View style={styles.half}>
                  <Text style={styles.fieldLabel}>State</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="State"
                    placeholderTextColor={styles.placeholder.color}
                    value={form.state}
                    onChangeText={(v) => updateField("state", v)}
                  />
                </View>
                <View style={styles.half}>
                  <Text style={styles.fieldLabel}>Pincode</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Pincode"
                    placeholderTextColor={styles.placeholder.color}
                    keyboardType="number-pad"
                    value={form.zipcode}
                    onChangeText={(v) => updateField("zipcode", v)}
                  />
                </View>
              </View>

              <Text style={styles.fieldLabel}>Location pin</Text>
              <View style={styles.coordActions}>
                <TouchableOpacity
                  style={styles.coordBtn}
                  onPress={useCurrentLocationOnForm}
                  disabled={pinLoading}
                >
                  {pinLoading ? (
                    <SafeSpinner color={PURPLE} size={18} />
                  ) : (
                    <NavigationArrow size={16} color={PURPLE} weight="fill" />
                  )}
                  <Text style={styles.coordBtnText}>Current location</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.coordBtn}
                  onPress={locateFromTypedAddress}
                  disabled={pinLoading}
                >
                  <MapPin size={16} color={PURPLE} weight="fill" />
                  <Text style={styles.coordBtnText}>Locate address</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.mapWrap}>
                <MapView
                  key={`addr-map-${form.latitude}-${form.longitude}`}
                  style={StyleSheet.absoluteFill}
                  initialRegion={mapRegion}
                  onPress={onMapPress}
                  provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
                >
                  {hasPin && (
                    <Marker
                      coordinate={{
                        latitude: Number(form.latitude),
                        longitude: Number(form.longitude),
                      }}
                      draggable
                      onDragEnd={(e) => onMapPress(e)}
                    />
                  )}
                </MapView>
                {!hasPin && (
                  <View style={styles.mapHint}>
                    <Text style={styles.mapHintText}>Tap map to drop a pin</Text>
                  </View>
                )}
              </View>

              {!hasPin && (
                <Text style={styles.coordsMissing}>
                  Drop a pin on the map, or use current location / locate address.
                </Text>
              )}

              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  (!form.line1.trim() || !form.city.trim() || !hasPin || saving) &&
                    styles.disabled,
                ]}
                onPress={handleSave}
                disabled={!form.line1.trim() || !form.city.trim() || !hasPin || saving}
              >
                {saving ? (
                  <SafeSpinner color="#fff" size={18} />
                ) : (
                  <Text style={styles.primaryBtnText}>
                    {isEditing ? "Update address" : "Save address"}
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={resetForm}>
                <Text style={styles.secondaryBtnText}>Back to list</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={async () => {
                  const added = await onUseCurrentLocation?.();
                  if (added) handleClose();
                }}
                disabled={locating}
              >
                <View style={styles.actionIcon}>
                  {locating ? (
                    <SafeSpinner color={PURPLE} size={20} />
                  ) : (
                    <NavigationArrow size={20} color={PURPLE} weight="fill" />
                  )}
                </View>
                <View style={styles.actionTextWrap}>
                  <Text style={styles.actionTitle}>Use current location</Text>
                  <Text style={styles.actionSub}>Detect nearest spot and save it</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard} onPress={openAddForm}>
                <View style={styles.actionIcon}>
                  <PlusCircle size={20} color={PURPLE} weight="fill" />
                </View>
                <View style={styles.actionTextWrap}>
                  <Text style={styles.actionTitle}>Add new address</Text>
                  <Text style={styles.actionSub}>Set details and choose map pin</Text>
                </View>
              </TouchableOpacity>

              <Text style={styles.listHeading}>Saved addresses</Text>
              {addresses.length === 0 ? (
                <Text style={styles.emptyText}>No saved addresses yet.</Text>
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
                  const pinned =
                    address.latitude != null && address.longitude != null;
                  return (
                    <View
                      key={address.id}
                      style={[styles.addressCard, selected && styles.addressCardActive]}
                    >
                      <TouchableOpacity
                        style={styles.addressTapArea}
                        onPress={async () => {
                          await onSelect?.(address.id);
                          handleClose();
                        }}
                      >
                        <View style={styles.addressIcon}>
                          {address.label === "Home" ? (
                            <House size={18} color={PURPLE} weight="fill" />
                          ) : (
                            <MapPin size={18} color={PURPLE} weight="fill" />
                          )}
                        </View>
                        <View style={styles.addressBody}>
                          <View style={styles.addressTitleRow}>
                            <Text style={styles.addressLabel}>
                              {address.label || "Address"}
                            </Text>
                            {selected && (
                              <View style={styles.selectedPill}>
                                <Text style={styles.selectedPillText}>Selected</Text>
                              </View>
                            )}
                            {Number.isFinite(km) && km < 1000 && (
                              <Text style={styles.distanceText}>
                                {km < 1
                                  ? `${Math.round(km * 1000)} m`
                                  : `${km.toFixed(1)} km`}
                              </Text>
                            )}
                          </View>
                          <Text style={styles.addressLine} numberOfLines={2}>
                            {formatAddressLine(address)}
                          </Text>
                          {!pinned && (
                            <Text style={styles.coordsMeta}>No map pin yet — tap edit</Text>
                          )}
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.iconBtn}
                        onPress={() => openEditForm(address)}
                      >
                        <PencilSimple size={18} color={PURPLE} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.iconBtn}
                        onPress={() => onDelete?.(address.id)}
                      >
                        <Trash size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}
            </ScrollView>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const getStyles = (theme, isDark) => {
  const surface = theme.background || "#fff";
  const card = theme.cardBackground || (isDark ? "#1A1A1A" : "#fff");
  const text = theme.text || "#101114";
  const muted = theme.subText || "#656B7A";
  const border = theme.border || "#E7E1EF";
  const soft = isDark ? "#2A2034" : "#F7F2FF";
  const inputBg = isDark ? theme.background3 || "#2A2A2A" : "#FAFAFC";

  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "flex-end",
    },
    sheet: {
      maxHeight: "92%",
      backgroundColor: card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 18,
      paddingBottom: 28,
      paddingTop: 10,
    },
    handle: {
      alignSelf: "center",
      width: 42,
      height: 4,
      borderRadius: 2,
      backgroundColor: border,
      marginBottom: 12,
    },
    sheetHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 14,
    },
    sheetTitle: {
      color: text,
      fontSize: 18,
      fontWeight: "900",
    },
    closeBtn: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
    },
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
      backgroundColor: isDark ? "#1B1028" : "#FFFFFF",
    },
    actionTextWrap: {
      flex: 1,
    },
    actionTitle: {
      color: text,
      fontSize: 15,
      fontWeight: "900",
    },
    actionSub: {
      color: muted,
      fontSize: 12,
      marginTop: 2,
      fontWeight: "600",
    },
    listHeading: {
      color: muted,
      fontSize: 12,
      fontWeight: "800",
      marginTop: 8,
      marginBottom: 10,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    emptyText: {
      color: muted,
      fontSize: 14,
      fontWeight: "600",
      marginBottom: 20,
    },
    addressCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 4,
      borderWidth: 1,
      borderColor: border,
      borderRadius: 14,
      padding: 12,
      marginBottom: 10,
      backgroundColor: surface === "#000000" ? "#111" : "#FFFFFF",
    },
    addressCardActive: {
      borderColor: PURPLE,
      backgroundColor: soft,
    },
    addressTapArea: {
      flex: 1,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      minWidth: 0,
    },
    addressIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: soft,
    },
    addressBody: {
      flex: 1,
      minWidth: 0,
    },
    addressTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flexWrap: "wrap",
    },
    addressLabel: {
      color: text,
      fontSize: 15,
      fontWeight: "900",
    },
    selectedPill: {
      backgroundColor: PURPLE,
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    selectedPillText: {
      color: "#fff",
      fontSize: 10,
      fontWeight: "900",
    },
    distanceText: {
      color: muted,
      fontSize: 11,
      fontWeight: "700",
    },
    addressLine: {
      color: muted,
      fontSize: 13,
      fontWeight: "600",
      marginTop: 4,
      lineHeight: 18,
    },
    coordsMeta: {
      color: muted,
      fontSize: 11,
      fontWeight: "700",
      marginTop: 4,
    },
    iconBtn: {
      padding: 6,
    },
    fieldLabel: {
      color: text,
      fontSize: 13,
      fontWeight: "800",
      marginBottom: 8,
      marginTop: 4,
    },
    labelRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 12,
    },
    labelChip: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: border,
      paddingHorizontal: 14,
      paddingVertical: 8,
      backgroundColor: inputBg,
    },
    labelChipActive: {
      backgroundColor: PURPLE,
      borderColor: PURPLE,
    },
    labelChipText: {
      color: text,
      fontWeight: "800",
      fontSize: 13,
    },
    labelChipTextActive: {
      color: "#fff",
    },
    input: {
      borderWidth: 1,
      borderColor: border,
      backgroundColor: inputBg,
      borderRadius: 12,
      minHeight: 48,
      paddingHorizontal: 12,
      color: text,
      fontWeight: "600",
      marginBottom: 10,
    },
    placeholder: {
      color: muted,
    },
    row: {
      flexDirection: "row",
      gap: 10,
    },
    half: {
      flex: 1,
    },
    coordActions: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 10,
    },
    coordBtn: {
      flex: 1,
      minHeight: 42,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#E9D5FF",
      backgroundColor: soft,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingHorizontal: 8,
    },
    coordBtnText: {
      color: PURPLE,
      fontSize: 12,
      fontWeight: "800",
    },
    mapWrap: {
      height: 180,
      borderRadius: 14,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: border,
      marginBottom: 8,
    },
    mapHint: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(0,0,0,0.25)",
    },
    mapHintText: {
      color: "#fff",
      fontWeight: "800",
      fontSize: 13,
    },
    coordsMissing: {
      color: "#B45309",
      fontSize: 12,
      fontWeight: "700",
      marginBottom: 8,
    },
    primaryBtn: {
      marginTop: 8,
      minHeight: 50,
      borderRadius: 14,
      backgroundColor: PURPLE,
      alignItems: "center",
      justifyContent: "center",
    },
    primaryBtnText: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "900",
    },
    secondaryBtn: {
      marginTop: 10,
      minHeight: 46,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: soft,
      marginBottom: 12,
    },
    secondaryBtnText: {
      color: PURPLE,
      fontSize: 14,
      fontWeight: "900",
    },
    disabled: {
      opacity: 0.55,
    },
  });
};

export default AddressPickerModal;
