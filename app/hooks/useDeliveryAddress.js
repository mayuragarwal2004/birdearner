import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import * as Location from "expo-location";
import {
  buildAddressFromGeocode,
  buildAddressFromProfile,
  deleteAddress,
  formatShortAddress,
  getSavedAddresses,
  getSelectedAddressId,
  markAddressUsed,
  pickDefaultAddress,
  upsertAddress,
} from "../lib/addressStorage";

export const useDeliveryAddress = (userId, clientProfile) => {
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) {
      setAddresses([]);
      setSelectedAddress(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let list = await getSavedAddresses(userId);
      let current = null;

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const position = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          current = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setCoords(current);
        }
      } catch (gpsError) {
        console.warn("Delivery address GPS unavailable:", gpsError?.message);
      }

      // Seed from profile once if book is empty
      if (!list.length) {
        const seeded = buildAddressFromProfile(clientProfile, current);
        if (seeded) {
          const saved = await upsertAddress(userId, seeded);
          list = [saved];
        }
      }

      const selectedId = await getSelectedAddressId(userId);
      const picked = pickDefaultAddress(list, current, selectedId);
      if (picked) {
        const used = await markAddressUsed(userId, picked.id);
        setSelectedAddress(used || picked);
        list = await getSavedAddresses(userId);
      } else {
        setSelectedAddress(null);
      }
      setAddresses(list);
    } finally {
      setLoading(false);
    }
  }, [userId, clientProfile?.id, clientProfile?.city, clientProfile?.zipcode]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const selectAddress = useCallback(
    async (addressId) => {
      if (!userId || !addressId) return;
      const used = await markAddressUsed(userId, addressId);
      // Keep existing list order — only update the selected item in place
      setAddresses((prev) => {
        const next = prev.map((item) =>
          item.id === addressId
            ? { ...item, ...(used || {}), lastUsedAt: used?.lastUsedAt ?? Date.now() }
            : item
        );
        setSelectedAddress(
          used || next.find((item) => item.id === addressId) || null
        );
        return next;
      });
    },
    [userId]
  );

  const addAddress = useCallback(
    async (address) => {
      if (!userId) return null;
      const saved = await upsertAddress(userId, address);
      if (!saved) return null;
      const used = await markAddressUsed(userId, saved.id);
      const list = await getSavedAddresses(userId);
      setAddresses(list);
      setSelectedAddress(used || saved);
      return used || saved;
    },
    [userId]
  );

  const removeAddress = useCallback(
    async (addressId) => {
      if (!userId) return;
      const list = await deleteAddress(userId, addressId);
      setAddresses(list);
      if (selectedAddress?.id === addressId) {
        const next = pickDefaultAddress(list, coords, null);
        if (next) {
          const used = await markAddressUsed(userId, next.id);
          setSelectedAddress(used || next);
        } else {
          setSelectedAddress(null);
        }
      }
    },
    [userId, selectedAddress?.id, coords]
  );

  const useCurrentLocationAsAddress = useCallback(
    async (label = "Home") => {
      if (!userId) return null;
      setLocating(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission needed",
            "Allow location access to use your current address."
          );
          return null;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        const current = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setCoords(current);

        const places = await Location.reverseGeocodeAsync(current);
        const built = buildAddressFromGeocode(places?.[0], current, label);
        return addAddress(built);
      } catch (error) {
        Alert.alert("Location error", error.message || "Could not fetch location.");
        return null;
      } finally {
        setLocating(false);
      }
    },
    [userId, addAddress]
  );

  const displayLabel = useMemo(
    () => selectedAddress?.label || "Delivering service at",
    [selectedAddress?.label]
  );

  const displayAddress = useMemo(
    () => formatShortAddress(selectedAddress),
    [selectedAddress]
  );

  return {
    addresses,
    selectedAddress,
    coords,
    loading,
    locating,
    displayLabel,
    displayAddress,
    refresh,
    selectAddress,
    addAddress,
    removeAddress,
    useCurrentLocationAsAddress,
  };
};

export default useDeliveryAddress;
