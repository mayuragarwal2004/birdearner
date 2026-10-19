import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, ArrowRight, MagnifyingGlass, X, Check, Info } from "phosphor-react-native";
import Toast from "react-native-toast-message";
import { useAuth } from "../context/NewAuthContext";
import apiService from "../lib/apiService";
import SafeSpinner from "../components/SafeSpinner";
import {
  normalizeWorkType,
  filterServicesByWorkType,
  serviceWorkTypeOf,
} from "../utils/marketplaceUtils";

const MIN_SERVICES = 1;
const MAX_SERVICES = 5;

const EditServicesScreen = ({ navigation }) => {
  const { userData, userProfile, refreshUserData } = useAuth();
  const workType = normalizeWorkType(userData?.freelancer?.workType);

  const [catalog, setCatalog] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  // Services of the other work type are kept as they are when saving
  const [otherTypeIds, setOtherTypeIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [allServices, savedServices] = await Promise.all([
          apiService.getAllServices(),
          apiService.loadServicesFromSelected(userProfile || userData),
        ]);
        if (!active) return;
        const saved = Array.isArray(savedServices) ? savedServices : [];
        const currentType = filterServicesByWorkType(saved, workType);
        setCatalog(filterServicesByWorkType(allServices, workType));
        setSelectedIds(currentType.map((s) => String(s.id)));
        setOtherTypeIds(
          saved
            .filter((s) => workType && serviceWorkTypeOf(s) !== workType)
            .map((s) => String(s.id))
        );
      } catch (error) {
        console.warn("Could not load services:", error?.message);
        Toast.show({ type: "error", text1: "Error", text2: "Failed to load services", position: "top" });
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const selectedServices = useMemo(
    () => selectedIds.map((id) => catalog.find((s) => String(s.id) === id)).filter(Boolean),
    [selectedIds, catalog]
  );

  const filteredCatalog = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return catalog.filter((s) => String(s.name || "").toLowerCase().includes(q));
  }, [catalog, searchQuery]);

  const showError = (text2) =>
    Toast.show({ type: "error", text1: "Can't change services", text2, position: "top" });

  const toggleService = (service) => {
    const id = String(service.id);
    if (selectedIds.includes(id)) {
      if (selectedIds.length <= MIN_SERVICES) {
        showError(`You need at least ${MIN_SERVICES} service.`);
        return;
      }
      setSelectedIds((prev) => prev.filter((x) => x !== id));
      return;
    }
    if (selectedIds.length >= MAX_SERVICES) {
      showError(`You can select up to ${MAX_SERVICES} services.`);
      return;
    }
    setSelectedIds((prev) => [...prev, id]);
  };

  const handleSave = async () => {
    if (selectedIds.length < MIN_SERVICES || selectedIds.length > MAX_SERVICES) {
      showError(`Select between ${MIN_SERVICES} and ${MAX_SERVICES} services.`);
      return;
    }
    const freelancerId = userProfile?.id || userData?.freelancer?.id;
    if (!freelancerId) {
      showError("Freelancer profile not found.");
      return;
    }
    setSaving(true);
    try {
      await apiService.updateFreelancerProfile(freelancerId, {
        selectedServices: [...otherTypeIds, ...selectedIds],
      });
      if (refreshUserData) await refreshUserData();
      Toast.show({ type: "success", text1: "Services Updated", text2: "Your services were saved.", position: "top" });
      navigation.goBack();
    } catch (error) {
      showError(error?.message || "Could not save services. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const canSave = !loading && !saving && selectedIds.length >= MIN_SERVICES && selectedIds.length <= MAX_SERVICES;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#2E0854" }}>
      <LinearGradient colors={["#2B0855", "#3B0A75", "#160233"]} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.headerNavSection}>
            <TouchableOpacity style={styles.backIconButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
              <ArrowLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add Your Services</Text>
            <Text style={styles.headerSubtitle}>
              Add up to {MAX_SERVICES} services (minimum {MIN_SERVICES} required)
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.subFieldLabel}>
              Choose up to {MAX_SERVICES} services you want to offer (minimum {MIN_SERVICES} required):
            </Text>

            <View style={styles.inputContainer}>
              <View style={styles.iconBox}>
                <MagnifyingGlass size={20} color="#7C3AED" />
              </View>
              <TextInput
                placeholderTextColor="#A098AE"
                style={styles.textInput}
                placeholder="Search services (e.g. Graphic Design, Web Dev)..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
              />
            </View>

            {selectedServices.length > 0 && (
              <View style={styles.selectedServicesContainer}>
                <Text style={styles.selectedServicesTitle}>
                  Selected Services ({selectedIds.length}/{MAX_SERVICES})
                </Text>
                <View style={styles.tagsWrapper}>
                  {selectedServices.map((service) => (
                    <View key={String(service.id)} style={styles.purpleTagBadge}>
                      <Text style={styles.purpleTagText}>{service.name}</Text>
                      <TouchableOpacity onPress={() => toggleService(service)} style={styles.tagRemoveBtn}>
                        <X size={12} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {loading ? (
              <SafeSpinner size="large" color="#6D28D9" style={{ marginVertical: 20 }} />
            ) : (
              <ScrollView style={{ maxHeight: 320, marginVertical: 10 }} nestedScrollEnabled showsVerticalScrollIndicator>
                {searchQuery.trim() === "" ? (
                  <View style={styles.infoBannerBox}>
                    <Info size={18} color="#7C3AED" style={{ marginRight: 8 }} />
                    <Text style={styles.infoBannerText}>
                      {workType === "onsite"
                        ? "Showing on-site (Household) services. Type keywords to search and add services to your profile."
                        : "Showing remote (Freelance) services. Type keywords to search and add services to your profile."}
                    </Text>
                  </View>
                ) : filteredCatalog.length === 0 ? (
                  <View style={styles.noResultsBox}>
                    <Text style={styles.noResultsTitle}>No services found for "{searchQuery}"</Text>
                  </View>
                ) : (
                  filteredCatalog.map((service) => {
                    const isSelected = selectedIds.includes(String(service.id));
                    return (
                      <TouchableOpacity
                        key={String(service.id)}
                        style={[styles.serviceCardItem, isSelected && styles.serviceCardItemSelected]}
                        onPress={() => toggleService(service)}
                        activeOpacity={0.7}
                      >
                        <View style={{ flex: 1, marginRight: 10 }}>
                          <Text style={[styles.serviceItemName, isSelected && styles.purpleTextBold]}>
                            {service.name}
                          </Text>
                          {!!service.description && (
                            <Text style={styles.serviceItemDesc} numberOfLines={2}>
                              {service.description}
                            </Text>
                          )}
                        </View>
                        <View style={[styles.checkboxCircle, isSelected && styles.checkboxCircleSelected]}>
                          {isSelected && <Check size={14} color="#FFFFFF" />}
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>
            )}

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.secondaryHalfButton} onPress={() => navigation.goBack()}>
                <ArrowLeft size={18} color="#6D28D9" style={{ marginRight: 6 }} />
                <Text style={styles.secondaryHalfButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryHalfButton, !canSave && styles.disabledButton]}
                onPress={handleSave}
                disabled={!canSave}
              >
                {saving ? (
                  <SafeSpinner size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.primaryHalfButtonText}>Save</Text>
                    <ArrowRight size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },
  headerNavSection: {
    alignItems: "center",
    marginBottom: 16,
    marginTop: Platform.OS === "android" ? (StatusBar.currentHeight || 24) + 8 : 16,
    position: "relative",
    paddingHorizontal: 36,
  },
  backIconButton: {
    position: "absolute",
    left: 0,
    top: 2,
    padding: 6,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#D4C5ED",
    textAlign: "center",
    lineHeight: 18,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 14,
  },
  subFieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1F1D2B",
    marginTop: 6,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAFAFC",
    borderWidth: 1,
    borderColor: "#E9E3F4",
    borderRadius: 12,
    paddingHorizontal: 8,
    minHeight: 48,
    marginBottom: 14,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F3E8FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 13.5,
    color: "#1F1D2B",
    paddingVertical: 8,
  },
  selectedServicesContainer: {
    marginVertical: 10,
  },
  selectedServicesTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1F1D2B",
    marginBottom: 6,
  },
  tagsWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginVertical: 4,
  },
  purpleTagBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6D28D9",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  purpleTagText: {
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "500",
    marginRight: 6,
  },
  tagRemoveBtn: {
    padding: 2,
  },
  infoBannerBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3E8FF",
    borderRadius: 14,
    padding: 14,
    marginVertical: 12,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12,
    color: "#6D28D9",
    lineHeight: 17,
  },
  noResultsBox: {
    padding: 20,
    alignItems: "center",
  },
  noResultsTitle: {
    fontSize: 14,
    color: "#8E8EA9",
  },
  serviceCardItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAFAFC",
    borderWidth: 1,
    borderColor: "#E9E3F4",
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  serviceCardItemSelected: {
    borderColor: "#6D28D9",
    backgroundColor: "#F5F0FF",
  },
  serviceItemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F1D2B",
  },
  purpleTextBold: {
    color: "#6D28D9",
    fontWeight: "700",
  },
  serviceItemDesc: {
    fontSize: 12,
    color: "#8E8EA9",
    marginTop: 2,
  },
  checkboxCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "#D4C5ED",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxCircleSelected: {
    backgroundColor: "#6D28D9",
    borderColor: "#6D28D9",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  primaryHalfButton: {
    flex: 1,
    height: 48,
    backgroundColor: "#6D28D9",
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6D28D9",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryHalfButtonText: {
    color: "#FFFFFF",
    fontSize: 14.5,
    fontWeight: "600",
  },
  secondaryHalfButton: {
    flex: 1,
    height: 48,
    borderWidth: 1.5,
    borderColor: "#6D28D9",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryHalfButtonText: {
    color: "#6D28D9",
    fontSize: 14.5,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default EditServicesScreen;
