import React, {
  forwardRef,
  useImperativeHandle,
  useEffect,
  useState,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import apiService from "../lib/apiService";
import { useTheme } from "../context/ThemeContext";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const placeholderImageURL = "https://picsum.photos/seed/";

const ClientHomeServiceFinder = forwardRef((props, ref) => {
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const styles = getStyles(currentTheme);
  const navigation = useNavigation();

  const [search, setSearch] = useState("");
  const [freelanceServices, setFreelanceServices] = useState([]);
  const [householdServices, setHouseholdServices] = useState([]);

  const [filteredFreelance, setFilteredFreelance] = useState([]);
  const [filteredHousehold, setFilteredHousehold] = useState([]);

  const fetchServices = async () => {
    try {
      const services = await apiService.getAllServices();
      const freelance = services.filter((s) => s.category === "FREELANCE");
      const household = services.filter((s) => s.category === "HOUSEHOLD");

      setFreelanceServices(freelance);
      setHouseholdServices(household);
      setFilteredFreelance(freelance);
      setFilteredHousehold(household);
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  };
  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    const lowerSearch = search.toLowerCase();
    setFilteredFreelance(
      freelanceServices.filter(
        (s) =>
          s.name.toLowerCase().includes(lowerSearch) ||
          s.description?.toLowerCase().includes(lowerSearch)
      )
    );
    setFilteredHousehold(
      householdServices.filter(
        (s) =>
          s.name.toLowerCase().includes(lowerSearch) ||
          s.description?.toLowerCase().includes(lowerSearch)
      )
    );
  }, [search, freelanceServices, householdServices]);

  const handleCardPress = async (id, name, category) => {
    try {
      await AsyncStorage.setItem(
        "selectedService",
        JSON.stringify({
          serviceId: id,
          serviceName: name,
          serviceType: category.toLowerCase(), // "freelance" or "household"
        })
      );

      navigation.navigate("Job Requirements");
    } catch (error) {
      console.error("Failed to save service selection:", error);
    }
  };

  useImperativeHandle(ref, () => ({
    refreshCard: fetchServices, // expose this method to parent
  }));

  const renderServiceCard = ({ item, borderRadius }) => (
    <TouchableOpacity
      onPress={() => handleCardPress(item.id, item.name, item.category)}
      activeOpacity={0.7}
    >
      <View style={[styles.serviceCard, { borderRadius }]}>
        <Image
          source={{
            uri: item.imageUrl
              ? apiService.loadImageURI(item.imageUrl)
              : `${placeholderImageURL}${encodeURIComponent(
                  item.name
                )}/160/160`,
          }}
          style={[styles.serviceImage, { borderRadius }]}
        />
        <Text style={styles.serviceText}>{item.name}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          placeholderTextColor="#c4c4c4"
          value={search}
          onChangeText={setSearch}
        />
        <FontAwesome
          name="search"
          size={20}
          color={currentTheme.subText}
          style={styles.searchIcon}
        />
      </View>

      <FlatList
        data={filteredFreelance}
        renderItem={({ item }) => renderServiceCard({ item, borderRadius: 45 })}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.carousel}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No Freelance Services</Text>
        }
      />

      <FlatList
        data={filteredHousehold}
        renderItem={({ item }) => renderServiceCard({ item, borderRadius: 7 })}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.carousel}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No Household Services</Text>
        }
      />
    </View>
  );
});

const getStyles = (theme) =>
  StyleSheet.create({
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 20,
      shadowColor: theme.shadow || "#000000",
      shadowOffset: { width: 2, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 5,
      elevation: 5,
      borderRadius: 12,
      marginBottom: 24,
      backgroundColor: theme.background3 || "#ffffff",
      borderColor: theme.border || "#ddd",
      borderWidth: 1,
      paddingHorizontal: 12,
      height: 45,
    },
    searchInput: {
      flex: 1,
      color: theme.subText,
      fontSize: 16,
      marginLeft: 10,
    },
    searchIcon: {
      marginRight: 5,
    },
    carousel: {
      paddingHorizontal: 20,
    },
    serviceCard: {
      alignItems: "center",
      marginHorizontal: 10,
      marginVertical: 2,
      flexDirection: "column",
      width: 100,
      flexWrap: "wrap",
      gap: 5,
    },
    serviceImage: {
      width: 80,
      height: 80,
      borderRadius: 8,
      backgroundColor: "#e0e0e0",
      shadowColor: theme.shadow || "#000000",
      shadowOffset: { width: 2, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    serviceText: {
      marginTop: 8,
      textAlign: "center",
      fontSize: 13,
      color: theme.subText,
    },
    emptyText: {
      color: theme.subText,
      paddingHorizontal: 20,
      marginTop: 12,
    },
  });

export default ClientHomeServiceFinder;
