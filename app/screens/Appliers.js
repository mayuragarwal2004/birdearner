import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/NewAuthContext";
import { useTheme } from "../context/ThemeContext";
import ApiService from "../lib/apiService";

const AppliersScreen = ({ navigation, route }) => {
  const { userData } = useAuth();
  const [freelancers, setFreelancers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { title, jobId } = route.params;
  const [refreshing, setRefreshing] = useState(false);
  const api = ApiService;

  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];

  const fetchApplicants = async () => {
    try {
      await api.init();
      const response = await api.makeRequest(`/jobs/${jobId}/applicants`);
      if (response.success) {
        setFreelancers(response.data);
      } else {
        Alert.alert("Error", "Failed to fetch applicants");
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchApplicants();
  }, [jobId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchApplicants();
  };

  const handleNavigateToChat = (freelancer) => {
    navigation.navigate("ClientChat", {
      jobId,
      full_name: freelancer.fullName,
      freelancer: freelancer,
      receiverId: freelancer.userId
    });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.freelancerCard}
      onPress={() => handleNavigateToChat(item)}
    >
      <View style={styles.freelancerInfo}>
        <Image
          source={
            item.profilePhoto
              ? { uri: item.profilePhoto }
              : require("../assets/logo.png")
          }
          style={styles.profileImage}
        />
        <View style={styles.textContainer}>
          <Text style={[styles.name, { color: currentTheme.text }]}>
            {item.fullName}
          </Text>
          <Text style={[styles.heading, { color: currentTheme.subText }]}>
            {item.profileHeading || "Freelancer"}
          </Text>
          <View style={styles.statsContainer}>
            <Text style={[styles.statsText, { color: currentTheme.subText }]}>
              Experience: {item.experience || 0} years
            </Text>
            <Text style={[styles.statsText, { color: currentTheme.subText }]}>
              Rating: {item.rating || 0}/5
            </Text>
            <Text style={[styles.statsText, { color: currentTheme.subText }]}>
              Level {item.level}
            </Text>
          </View>
          {item.isAccepted && (
            <View style={styles.acceptedBadge}>
              <Text style={styles.acceptedText}>Accepted</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: currentTheme.background }]}>
        <ActivityIndicator size="large" color="#4C0183" />
        <Text style={[styles.emptyText, { color: currentTheme.subText }]}>
          Loading freelancers...
        </Text>
      </View>
    );
  }

  if (freelancers.length === 0) {
    return (
      <View style={[styles.noAppliersContainer, { backgroundColor: currentTheme.background }]}>
        <Text style={[styles.noAppliersText, { color: currentTheme.text2 }]}>
          There are no appliers for this job.
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={currentTheme.text} />
          <Text style={[styles.goBackText, { color: currentTheme.text }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={currentTheme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: currentTheme.text }]}>{title}</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={freelancers}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={["#4C0183"]}
            progressBackgroundColor={currentTheme.cardBackground}
          />
        }
        ListEmptyComponent={() => (
          <Text style={[styles.emptyText, { color: currentTheme.text }]}>
            No applicants yet
          </Text>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  placeholder: {
    width: 24,
  },
  listContainer: {
    padding: 15,
  },
  freelancerCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  freelancerInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  heading: {
    fontSize: 14,
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statsText: {
    fontSize: 12,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    marginTop: 20,
  },
  acceptedBadge: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  acceptedText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noAppliersContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noAppliersText: {
    fontSize: 18,
    marginBottom: 20,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  goBackText: {
    fontSize: 16,
    marginLeft: 8,
  }
});

export default AppliersScreen;
