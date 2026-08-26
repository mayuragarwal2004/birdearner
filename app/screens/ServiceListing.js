import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import apiService from "../lib/apiService";
import { useTheme } from "../context/ThemeContext";

const PURPLE = "#7B2CFF";
const placeholderImageURL = "https://picsum.photos/seed/";

const getStartsAt = (service) => {
  const min = service?.birdFee?.minimumBudget;
  if (min == null || Number.isNaN(Number(min))) return null;
  return `Starts at ₹${Number(min).toLocaleString("en-IN")}`;
};

const ServiceListingScreen = ({ navigation, route }) => {
  const category = route?.params?.category || "FREELANCE";
  const isFreelance = category === "FREELANCE";
  const screenTitle = isFreelance ? "Freelance Services" : "Household Services";

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const isDark = theme === "dark";
  const styles = useMemo(
    () => getStyles(currentTheme, isDark),
    [currentTheme, isDark]
  );

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const fetchServices = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const data = await apiService.getServicesByCategory(category);
      setServices(Array.isArray(data) ? data : []);
    } catch (error) {
      if (!error?.isAuthError) {
        console.error("Error fetching services:", error);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [category]);

  const lowerSearch = search.trim().toLowerCase();

  const filteredServices = useMemo(() => {
    if (!lowerSearch) return services;
    return services.filter(
      (s) =>
        s.name?.toLowerCase().includes(lowerSearch) ||
        s.description?.toLowerCase().includes(lowerSearch)
    );
  }, [services, lowerSearch]);

  const handleServicePress = async (service) => {
    try {
      await AsyncStorage.setItem(
        "selectedService",
        JSON.stringify({
          serviceId: service.id,
          serviceName: service.name,
          serviceType: category.toLowerCase(),
        })
      );
      navigation.navigate("Job Requirements");
    } catch (error) {
      console.error("Failed to save service selection:", error);
    }
  };

  const renderServiceCard = ({ item }) => {
    const priceLabel = getStartsAt(item);
    return (
      <TouchableOpacity
        onPress={() => handleServicePress(item)}
        activeOpacity={0.85}
        style={styles.card}
      >
        <Image
          source={{
            uri: item.imageUrl
              ? apiService.loadImageURI(item.imageUrl)
              : `${placeholderImageURL}${encodeURIComponent(item.name)}/200/200`,
          }}
          style={styles.cardImage}
        />
        <Text style={styles.cardName} numberOfLines={2}>
          {item.name}
        </Text>
        {!!priceLabel && <Text style={styles.cardPrice}>{priceLabel}</Text>}
        {!!item.description && (
          <Text style={styles.cardDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color={currentTheme.text || "#101114"} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{screenTitle}</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={currentTheme.subText || "#656B7A"} />
        <TextInput
          style={styles.searchInput}
          placeholder={`Search ${isFreelance ? "freelance" : "household"} services...`}
          placeholderTextColor={currentTheme.subText || "#656B7A"}
          value={search}
          onChangeText={setSearch}
        />
        {!!search && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color={currentTheme.subText || "#656B7A"} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredServices}
        renderItem={renderServiceCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchServices(true)} tintColor={PURPLE} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No services found</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
};

const getStyles = (theme, isDark) => {
  const text = theme.text || "#101114";
  const muted = theme.subText || "#656B7A";
  const border = theme.border || "#E7E1EF";
  const soft = isDark ? "#2A2034" : "#F3EAFF";
  const bg = isDark ? "#1A1023" : "#FFFFFF";

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: bg,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "900",
      color: text,
    },
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: soft,
      borderRadius: 14,
      marginHorizontal: 16,
      marginBottom: 12,
      paddingHorizontal: 14,
      height: 46,
      borderWidth: 1,
      borderColor: border,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      fontWeight: "600",
      color: text,
      marginLeft: 10,
      paddingVertical: 0,
    },
    listContent: {
      paddingHorizontal: 12,
      paddingBottom: 20,
    },
    row: {
      justifyContent: "space-between",
      paddingHorizontal: 4,
    },
    card: {
      width: "48%",
      backgroundColor: bg,
      borderRadius: 16,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: border,
      overflow: "hidden",
    },
    cardImage: {
      width: "100%",
      height: 130,
      backgroundColor: soft,
    },
    cardName: {
      marginTop: 10,
      marginHorizontal: 10,
      fontSize: 13,
      fontWeight: "800",
      color: text,
      lineHeight: 17,
    },
    cardPrice: {
      marginTop: 4,
      marginHorizontal: 10,
      fontSize: 12,
      fontWeight: "700",
      color: PURPLE,
    },
    cardDescription: {
      marginTop: 4,
      marginHorizontal: 10,
      marginBottom: 10,
      fontSize: 11,
      fontWeight: "500",
      color: muted,
      lineHeight: 15,
    },
    emptyContainer: {
      flex: 1,
      alignItems: "center",
      marginTop: 60,
    },
    emptyText: {
      fontSize: 15,
      fontWeight: "600",
      color: muted,
    },
  });
};

export default ServiceListingScreen;
