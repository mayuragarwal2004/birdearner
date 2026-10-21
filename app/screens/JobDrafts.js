import React, { useCallback, useState } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { ArrowLeft, FloppyDisk, Trash, CaretRight } from "phosphor-react-native";
import { getJobDrafts, deleteJobDraft } from "../lib/jobDrafts";
import { useTheme } from "../context/ThemeContext";

const PURPLE = "#762BAD";

const formatSavedAt = (value) => {
  if (!value) return "Saved draft";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "Saved draft";
  return `Saved ${date.toLocaleString()}`;
};

const JobDraftsScreen = ({ navigation }) => {
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme] || themeStyles.light;
  const styles = getStyles(currentTheme);

  const [drafts, setDrafts] = useState([]);

  // Reload every time the page is shown, so drafts saved or posted elsewhere are up to date
  useFocusEffect(
    useCallback(() => {
      let active = true;
      getJobDrafts()
        .then((list) => {
          if (active) setDrafts(list);
        })
        .catch((error) => console.error("Failed to load drafts:", error));
      return () => {
        active = false;
      };
    }, [])
  );

  const openDraft = (draft) => {
    navigation.navigate("JobRequirements", { draftId: draft.id });
  };

  const confirmDelete = (draft) => {
    Alert.alert("Delete draft?", `"${draft.jobTitle || "Untitled job"}" will be removed.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteJobDraft(draft.id);
          setDrafts((prev) => prev.filter((item) => item.id !== draft.id));
        },
      },
    ]);
  };

  const renderDraft = ({ item: draft }) => {
    const budget = draft.budget ? `₹${Number(draft.budget).toFixed(2)}` : "No budget";
    const duration = draft.workDurationDays ? ` · ${draft.workDurationDays} day${draft.workDurationDays > 1 ? "s" : ""}` : "";
    return (
      <TouchableOpacity style={styles.card} onPress={() => openDraft(draft)} activeOpacity={0.8}>
        <View style={styles.iconBox}>
          <FloppyDisk size={20} color={PURPLE} weight="fill" />
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.jobTitle} numberOfLines={2}>
            {draft.jobTitle || "Untitled job"}
          </Text>
          <Text style={styles.meta}>
            {budget} · {draft.jobType || "Remote"}
            {duration}
          </Text>
          <Text style={styles.savedAt}>{formatSavedAt(draft.savedAt)}</Text>
        </View>
        <TouchableOpacity onPress={() => confirmDelete(draft)} style={styles.deleteButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Trash size={18} color="#DC2626" />
        </TouchableOpacity>
        <CaretRight size={16} color={currentTheme.subText || "#6B7280"} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton} activeOpacity={0.7}>
          <ArrowLeft size={22} color={currentTheme.text || "#000"} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Drafts</Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={drafts}
        keyExtractor={(item) => item.id}
        renderItem={renderDraft}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <FloppyDisk size={36} color="#A78BFA" />
            <Text style={styles.emptyText}>
              No drafts yet. Fill in a job on Create Job and tap Save Draft to keep it here.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const getStyles = (currentTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background || "#fff",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 10,
    },
    headerButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: currentTheme.isDark ? "#2A2A2A" : "#F3E8FF",
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: currentTheme.text || "#000",
    },
    headerSpacer: {
      width: 44,
    },
    listContent: {
      paddingHorizontal: 20,
      paddingBottom: 32,
      flexGrow: 1,
    },
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: currentTheme.cardBackground || (currentTheme.isDark ? "#1E1E1E" : "#FFFFFF"),
      borderRadius: 14,
      borderWidth: 1,
      borderColor: currentTheme.border || "#F3E8FF",
      padding: 12,
      marginBottom: 12,
    },
    iconBox: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: "#F3E8FF",
      alignItems: "center",
      justifyContent: "center",
    },
    cardBody: {
      flex: 1,
    },
    jobTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: currentTheme.text || "#000",
    },
    meta: {
      fontSize: 12,
      color: currentTheme.subText || "#666",
      marginTop: 3,
    },
    savedAt: {
      fontSize: 11,
      color: "#9CA3AF",
      marginTop: 3,
    },
    deleteButton: {
      padding: 6,
    },
    emptyBox: {
      alignItems: "center",
      paddingVertical: 60,
      paddingHorizontal: 32,
      gap: 12,
    },
    emptyText: {
      fontSize: 14,
      color: currentTheme.subText || "#666",
      textAlign: "center",
      lineHeight: 20,
    },
  });

export default JobDraftsScreen;
