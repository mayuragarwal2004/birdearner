import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";

const DeadlineTimer = ({ deadline, jobCompleted, style }) => {
  const [timeLeft, setTimeLeft] = useState("00d 00h 00m 00s");

  useEffect(() => {
    if (!deadline) return;

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
  }, [deadline]);

  if (jobCompleted) {
    return (
      <View style={[styles.timeContainer, style?.timeContainer]}>
        <Text style={[styles.completedText, style?.completedText]}>
          Project Completed
        </Text>
      </View>
    );
  }

  return (
    <View>
      Deadline Timer
      <View style={[styles.timeContainer, style?.timeContainer]}>
        {timeLeft.split(" ").map((timePart, index) => {
          const unit = timePart.slice(-1);
          const value = timePart.slice(0, -1);
          return (
            <View key={index} style={[styles.timeBox, style?.timeBox]}>
              <Text style={[styles.timeText, style?.timeText]}>{value}</Text>
              <Text style={[styles.unitText, style?.unitText]}>
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
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  timeBox: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4C0183",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 45,
  },
  timeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  unitText: {
    color: "#fff",
    fontSize: 10,
  },
  completedText: {
    color: "#4C0183",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default DeadlineTimer;
