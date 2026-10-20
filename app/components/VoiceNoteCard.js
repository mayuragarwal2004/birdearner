import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";

// Play / pause control for a voice note attached to a job
const VoiceNoteCard = ({ url, label = "Voice note" }) => {
  const player = useAudioPlayer({ uri: url });
  const status = useAudioPlayerStatus(player);

  const togglePlay = () => {
    if (status.playing) {
      player.pause();
      return;
    }
    if (status.didJustFinish) player.seekTo(0);
    player.play();
  };

  return (
    <View style={styles.row}>
      <View style={styles.iconCircle}>
        <Ionicons name="mic-outline" size={18} color="#6B21A8" />
      </View>
      <View style={styles.textCol}>
        <Text style={styles.title}>{label}</Text>
        <Text style={styles.subtext}>{status.playing ? "Playing..." : "Tap play to listen"}</Text>
      </View>
      <TouchableOpacity onPress={togglePlay} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name={status.playing ? "pause-circle" : "play-circle"} size={32} color="#6B21A8" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#F5F0FF",
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EDE9FE",
    alignItems: "center",
    justifyContent: "center",
  },
  textCol: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
  },
  subtext: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
});

export default VoiceNoteCard;
