import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import apiService from "../lib/apiService";
import { useTheme } from "../context/ThemeContext";

const PURPLE = "#7B2CFF";
const placeholderImageURL = "https://picsum.photos/seed/";

const getStartsAt = (service) => {
  const min = service?.birdFee?.minimumBudget;
  if (min == null || Number.isNaN(Number(min))) return null;
  return `Starts at ₹${Number(min).toLocaleString("en-IN")}`;
};

const ClientHomeServiceFinder = forwardRef(({ search = "" }, ref) => {
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const isDark = theme === "dark";
  const styles = useMemo(
    () => getStyles(currentTheme, isDark),
    [currentTheme, isDark]
  );
  const navigation = useNavigation();

  const [freelanceServices, setFreelanceServices] = useState([]);
  const [householdServices, setHouseholdServices] = useState([]);

  const fetchServices = async () => {
    try {
      const services = await apiService.getAllServices();
      const list = Array.isArray(services) ? services : [];
      setFreelanceServices(list.filter((s) => s.category === "FREELANCE"));
      setHouseholdServices(list.filter((s) => s.category === "HOUSEHOLD"));
    } catch (error) {
      if (!error?.isAuthError) {
        console.error("Error fetching services:", error);
      }
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  useImperativeHandle(ref, () => ({
    refreshCard: fetchServices,
  }));

  const lowerSearch = (search || "").trim().toLowerCase();

  const filteredFreelance = useMemo(() => {
    if (!lowerSearch) return freelanceServices;
    return freelanceServices.filter(
      (s) =>
        s.name?.toLowerCase().includes(lowerSearch) ||
        s.description?.toLowerCase().includes(lowerSearch)
    );
  }, [freelanceServices, lowerSearch]);

  const filteredHousehold = useMemo(() => {
    if (!lowerSearch) return householdServices;
    return householdServices.filter(
      (s) =>
        s.name?.toLowerCase().includes(lowerSearch) ||
        s.description?.toLowerCase().includes(lowerSearch)
    );
  }, [householdServices, lowerSearch]);

  const handleCardPress = async (id, name, category) => {
    try {
      await AsyncStorage.setItem(
        "selectedService",
        JSON.stringify({
          serviceId: id,
          serviceName: name,
          serviceType: category.toLowerCase(),
        })
      );
      navigation.navigate("Job Requirements");
    } catch (error) {
      console.error("Failed to save service selection:", error);
    }
  };

  const renderServiceCard = ({ item, rounded }) => {
    const priceLabel = getStartsAt(item);
    return (
      <TouchableOpacity
        onPress={() => handleCardPress(item.id, item.name, item.category)}
        activeOpacity={0.85}
        style={styles.serviceCard}
      >
        <Image
          source={{
            uri: item.imageUrl
              ? apiService.loadImageURI(item.imageUrl)
              : `${placeholderImageURL}${encodeURIComponent(item.name)}/160/160`,
          }}
          style={[styles.serviceImage, rounded && styles.serviceImageRound]}
        />
        <Text style={styles.serviceText} numberOfLines={2}>
          {item.name}
        </Text>
        {!!priceLabel && <Text style={styles.servicePrice}>{priceLabel}</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <View>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Freelance Services</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Job Requirements")}>
          <Text style={styles.viewAll}>View all</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={filteredFreelance}
        renderItem={({ item }) => renderServiceCard({ item, rounded: true })}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carousel}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No freelance services found</Text>
        }
      />

      <View style={[styles.sectionHeader, styles.sectionHeaderSpaced]}>
        <Text style={styles.sectionTitle}>Household Services</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Job Requirements")}>
          <Text style={styles.viewAll}>View all</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={filteredHousehold}
        renderItem={({ item }) => renderServiceCard({ item, rounded: false })}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carousel}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No household services found</Text>
        }
      />
    </View>
  );
});

const getStyles = (theme, isDark) => {
  const text = theme.text || "#101114";
  const muted = theme.subText || "#656B7A";
  const border = theme.border || "#E7E1EF";
  const soft = isDark ? "#2A2034" : "#F3EAFF";

  return StyleSheet.create({
    sectionHeader: {
      marginTop: 8,
      marginBottom: 12,
      paddingHorizontal: 20,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    sectionHeaderSpaced: {
      marginTop: 22,
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
    carousel: {
      paddingHorizontal: 16,
      gap: 4,
    },
    serviceCard: {
      width: 118,
      marginHorizontal: 6,
      alignItems: "flex-start",
    },
    serviceImage: {
      width: 118,
      height: 118,
      borderRadius: 16,
      backgroundColor: soft,
      borderWidth: 1,
      borderColor: border,
    },
    serviceImageRound: {
      borderRadius: 28,
    },
    serviceText: {
      marginTop: 10,
      fontSize: 13,
      fontWeight: "800",
      color: text,
      lineHeight: 17,
    },
    servicePrice: {
      marginTop: 4,
      fontSize: 12,
      fontWeight: "700",
      color: muted,
    },
    emptyText: {
      color: muted,
      paddingHorizontal: 8,
      paddingVertical: 18,
      fontWeight: "600",
    },
  });
};

export default ClientHomeServiceFinder;
