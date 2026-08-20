import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";

const DeadlineTimer = ({ deadline, jobCompleted, jobCancelled, style }) => {
  const [timeLeft, setTimeLeft] = useState("00d 00h 00m 00s");

  useEffect(() => {
    if (!deadline || jobCompleted || jobCancelled) return;

    const timer = setInterval(() => {
      const deadlineDate = new Date(deadline);
      const now = new Date();
      const diff = deadlineDate - now;

      if (diff <= 0) {
        setTimeLeft("00d 00h 00m 00s");
        clearInterval(timer);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline, jobCompleted, jobCancelled]);

  if (jobCompleted) {
    return (
      <View style={[styles.timeContainer, style?.timeContainer]}>
        <Text style={[styles.completedText, style?.completedText]}>
          Project Completed
        </Text>
      </View>
    );
  }

  if (jobCancelled) {
    return (
      <View style={[styles.timeContainer, style?.timeContainer]}>
        <Text style={[styles.cancelledText, style?.cancelledText]}>
          Job Cancelled
        </Text>
      </View>
    );
  }

  return (
    <View style={[{ width: "100%", alignItems: "center" }, style?.container]}>
      <Text style={[styles.label, style?.label]}>Deadline Timer</Text>
      <View style={[styles.timeContainer, style?.timeContainer]}>
        {timeLeft.split(" ").map((timePart, index) => {
          const unit = timePart.slice(-1);
          const value = timePart.slice(0, -1);
          return (
            <View key={index} style={[styles.timeBox, style?.timeBox]}>
              <Text
                style={[styles.timeText, style?.timeText]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
              >
                {value}
              </Text>
              <Text
                style={[styles.unitText, style?.unitText]}
                numberOfLines={1}
              >
                {unit.toUpperCase()}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 5,
    textAlign: "center",
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "center",
    gap: 6,
  },
  timeBox: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4C0183",
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 4,
    overflow: "hidden",
  },
  timeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  unitText: {
    color: "#fff",
    fontSize: 9,
    marginTop: 2,
  },
  completedText: {
    color: "#4C0183",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelledText: {
    color: "#DC2626",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default DeadlineTimer;
