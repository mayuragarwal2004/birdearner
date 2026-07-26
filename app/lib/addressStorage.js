import AsyncStorage from "@react-native-async-storage/async-storage";
import apiService from "./apiService";

const STORAGE_KEY = "client_delivery_addresses_v1";
const SELECTED_KEY = "client_selected_address_id_v1";
const MIGRATED_KEY = "client_delivery_addresses_migrated_v1";

/** Prefer last-used if still within this distance of GPS (km) */
export const LAST_USED_NEAR_KM = 3;

const storageKeyForUser = (userId) => `${STORAGE_KEY}:${userId || "guest"}`;
const selectedKeyForUser = (userId) => `${SELECTED_KEY}:${userId || "guest"}`;
const migratedKeyForUser = (userId) => `${MIGRATED_KEY}:${userId || "guest"}`;

const isLocalOnlyId = (id) =>
  typeof id === "string" &&
  (id.startsWith("addr_") || id.startsWith("gps_") || id.startsWith("profile_"));

export const formatAddressLine = (address) => {
  if (!address) return "";
  const parts = [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.zipcode,
  ].filter(Boolean);
  return parts.join(", ");
};

export const formatShortAddress = (address) => {
  if (!address) return "Select delivery address";
  const primary = address.line1 || address.city || address.label || "Saved address";
  const secondary = [address.city, address.zipcode].filter(Boolean).join(", ");
  if (secondary && secondary !== primary) return `${primary}, ${secondary}`;
  return primary;
};

/** Haversine distance in kilometers */
export const distanceKm = (lat1, lon1, lat2, lon2) => {
  if (
    lat1 == null ||
    lon1 == null ||
    lat2 == null ||
    lon2 == null ||
    Number.isNaN(Number(lat1)) ||
    Number.isNaN(Number(lon1)) ||
    Number.isNaN(Number(lat2)) ||
    Number.isNaN(Number(lon2))
  ) {
    return Number.POSITIVE_INFINITY;
  }
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

async function getLocalAddresses(userId) {
  try {
    const raw = await AsyncStorage.getItem(storageKeyForUser(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveAddresses(userId, addresses) {
  await AsyncStorage.setItem(
    storageKeyForUser(userId),
    JSON.stringify(addresses || [])
  );
}

export async function getSelectedAddressId(userId) {
  try {
    return await AsyncStorage.getItem(selectedKeyForUser(userId));
  } catch {
    return null;
  }
}

export async function setSelectedAddressId(userId, addressId) {
  if (!addressId) {
    await AsyncStorage.removeItem(selectedKeyForUser(userId));
    return;
  }
  await AsyncStorage.setItem(selectedKeyForUser(userId), addressId);
}

async function migrateLocalAddressesIfNeeded(userId, remoteList) {
  if (!userId || remoteList.length > 0) return remoteList;

  const alreadyMigrated = await AsyncStorage.getItem(migratedKeyForUser(userId));
  if (alreadyMigrated === "1") return remoteList;

  const local = await getLocalAddresses(userId);
  if (!local.length) {
    await AsyncStorage.setItem(migratedKeyForUser(userId), "1");
    return remoteList;
  }

  const uploaded = [];
  for (const item of local) {
    try {
      const created = await apiService.createAddress({
        label: item.label || "Home",
        line1: item.line1 || item.city || "Saved location",
        line2: item.line2 || "",
        city: item.city || "",
        state: item.state || "",
        zipcode: item.zipcode != null ? String(item.zipcode) : "",
        country: item.country || "India",
        latitude: item.latitude ?? null,
        longitude: item.longitude ?? null,
        isDefault: false,
        lastUsedAt: item.lastUsedAt || null,
      });
      if (created) uploaded.push(created);
    } catch (error) {
      console.warn("Failed to migrate local address:", error?.message);
    }
  }

  await AsyncStorage.setItem(migratedKeyForUser(userId), "1");
  if (uploaded.length) {
    await saveAddresses(userId, uploaded);
    return uploaded;
  }
  return remoteList;
}

export async function getSavedAddresses(userId) {
  if (!userId) return [];

  try {
    await apiService.init();
    let remote = await apiService.getAddresses();
    remote = await migrateLocalAddressesIfNeeded(userId, remote || []);
    await saveAddresses(userId, remote);
    return remote;
  } catch (error) {
    console.warn("Address API unavailable, using local cache:", error?.message);
    return getLocalAddresses(userId);
  }
}

export async function upsertAddress(userId, address) {
  if (!userId) return null;

  const payload = {
    label: address.label || "Home",
    line1: address.line1 || address.city || "Saved location",
    line2: address.line2 || "",
    city: address.city || "",
    state: address.state || "",
    zipcode: address.zipcode != null ? String(address.zipcode) : "",
    country: address.country || "India",
    latitude: address.latitude ?? null,
    longitude: address.longitude ?? null,
    isDefault: Boolean(address.isDefault),
    lastUsedAt: address.lastUsedAt ?? Date.now(),
  };

  try {
    await apiService.init();
    let saved;
    if (address.id && !isLocalOnlyId(address.id)) {
      saved = await apiService.updateAddress(address.id, payload);
    } else {
      saved = await apiService.createAddress(payload);
    }

    const list = await getLocalAddresses(userId);
    const withoutLocalDupes = list.filter(
      (item) => item.id !== saved.id && item.id !== address.id
    );
    withoutLocalDupes.unshift(saved);
    await saveAddresses(userId, withoutLocalDupes);
    return saved;
  } catch (error) {
    console.warn("Address upsert failed, saving locally:", error?.message);
    const list = await getLocalAddresses(userId);
    const next = {
      ...payload,
      id: address.id || `addr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: address.createdAt || Date.now(),
      lastUsedAt: payload.lastUsedAt,
    };
    const index = list.findIndex((item) => item.id === next.id);
    if (index >= 0) list[index] = { ...list[index], ...next };
    else list.unshift(next);
    await saveAddresses(userId, list);
    return next;
  }
}

export async function deleteAddress(userId, addressId) {
  if (!userId) return [];

  try {
    if (addressId && !isLocalOnlyId(addressId)) {
      await apiService.init();
      await apiService.deleteAddress(addressId);
    }
  } catch (error) {
    console.warn("Address delete API failed:", error?.message);
  }

  const list = await getLocalAddresses(userId);
  const next = list.filter((item) => item.id !== addressId);
  await saveAddresses(userId, next);
  const selected = await getSelectedAddressId(userId);
  if (selected === addressId) {
    await setSelectedAddressId(userId, next[0]?.id || null);
  }
  return next;
}

export async function markAddressUsed(userId, addressId) {
  if (!userId || !addressId) return null;

  try {
    if (!isLocalOnlyId(addressId)) {
      await apiService.init();
      const updated = await apiService.markAddressUsed(addressId);
      const list = await getLocalAddresses(userId);
      const next = list.map((item) => (item.id === addressId ? { ...item, ...updated } : item));
      if (!next.find((item) => item.id === addressId) && updated) {
        next.unshift(updated);
      }
      await saveAddresses(userId, next);
      await setSelectedAddressId(userId, addressId);
      return updated;
    }
  } catch (error) {
    console.warn("markAddressUsed API failed:", error?.message);
  }

  const list = await getLocalAddresses(userId);
  const next = list.map((item) =>
    item.id === addressId ? { ...item, lastUsedAt: Date.now(), isDefault: true } : item
  );
  await saveAddresses(userId, next);
  await setSelectedAddressId(userId, addressId);
  return next.find((item) => item.id === addressId) || null;
}

/**
 * Blinkit/Zepto-style default:
 * 1) Explicitly selected address (if still saved)
 * 2) Last-used if near current GPS
 * 3) Nearest saved address to GPS
 * 4) Last-used / most recent saved
 */
export function pickDefaultAddress(addresses, currentCoords, selectedId) {
  if (!addresses?.length) return null;

  if (selectedId) {
    const selected = addresses.find((a) => a.id === selectedId);
    if (selected) return selected;
  }

  const defaulted = addresses.find((a) => a.isDefault);
  if (defaulted) return defaulted;

  const withDistance = addresses.map((address) => ({
    address,
    distance: distanceKm(
      currentCoords?.latitude,
      currentCoords?.longitude,
      address.latitude,
      address.longitude
    ),
    lastUsedAt: address.lastUsedAt || 0,
  }));

  const lastUsed = [...withDistance].sort((a, b) => b.lastUsedAt - a.lastUsedAt)[0];

  if (
    currentCoords?.latitude != null &&
    lastUsed &&
    Number.isFinite(lastUsed.distance) &&
    lastUsed.distance <= LAST_USED_NEAR_KM
  ) {
    return lastUsed.address;
  }

  if (currentCoords?.latitude != null) {
    const nearest = [...withDistance].sort((a, b) => a.distance - b.distance)[0];
    if (nearest && Number.isFinite(nearest.distance)) return nearest.address;
  }

  if (lastUsed?.lastUsedAt) return lastUsed.address;
  return addresses[0];
}

export function buildAddressFromProfile(client, coords = null) {
  if (!client) return null;
  const line1 = [client.companyName, client.city].filter(Boolean).join(", ");
  if (!client.city && !client.zipcode && !client.state && !coords) return null;

  return {
    label: "Home",
    line1: line1 || client.city || "Saved location",
    line2: "",
    city: client.city || "",
    state: client.state || "",
    zipcode: client.zipcode != null ? String(client.zipcode) : "",
    country: client.country || "India",
    latitude: coords?.latitude ?? null,
    longitude: coords?.longitude ?? null,
    lastUsedAt: Date.now(),
    source: "profile",
  };
}

export function buildAddressFromGeocode(geocode, coords, label = "Home") {
  const street = [geocode?.name, geocode?.street, geocode?.streetNumber]
    .filter(Boolean)
    .join(" ");
  const line1 =
    street ||
    geocode?.district ||
    geocode?.subregion ||
    geocode?.city ||
    "Current location";

  return {
    label,
    line1,
    line2: geocode?.district || "",
    city: geocode?.city || geocode?.subregion || "",
    state: geocode?.region || "",
    zipcode: geocode?.postalCode || "",
    country: geocode?.country || "India",
    latitude: coords?.latitude ?? null,
    longitude: coords?.longitude ?? null,
    lastUsedAt: Date.now(),
    source: "gps",
  };
}
