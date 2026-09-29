import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const DeadlineTimer = ({ deadline, jobCompleted, jobCancelled, isDisputed, graceExpiresAt, style }) => {
  const [timeLeft, setTimeLeft] = useState("00d 00h 00m 00s");
  const [graceTimeLeft, setGraceTimeLeft] = useState("12:00:00");
  const [phase, setPhase] = useState("normal");

  useEffect(() => {
    if (!deadline || jobCompleted || jobCancelled || isDisputed) return;

    const tick = () => {
      const deadlineDate = new Date(deadline);
      const now = new Date();
      const diff = deadlineDate - now;

      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);

        setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
        setPhase("normal");
        return;
      }

      // Deadline passed: freeze the normal timer at zero
      setTimeLeft("00d 00h 00m 00s");

      // Show 12h grace period states when grace info is provided (remote jobs)
      if (graceExpiresAt) {
        const graceDiff = new Date(graceExpiresAt).getTime() - now.getTime();
        if (graceDiff > 0) {
          const gHours = Math.floor(graceDiff / (1000 * 60 * 60));
          const gMinutes = Math.floor((graceDiff / (1000 * 60)) % 60);
          const gSeconds = Math.floor((graceDiff / 1000) % 60);
          setGraceTimeLeft(
            `${String(gHours).padStart(2, "0")}:${String(gMinutes).padStart(2, "0")}:${String(gSeconds).padStart(2, "0")}`
          );
          setPhase("grace");
        } else {
          setPhase("graceOver");
        }
      }
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [deadline, jobCompleted, jobCancelled, isDisputed, graceExpiresAt]);

  if (isDisputed) {
    return (
      <View style={[styles.timeContainer, style?.timeContainer]}>
        <Text style={[styles.disputedText, style?.disputedText]}>
          Timer Paused (Dispute Under Review)
        </Text>
      </View>
    );
  }

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

  const normalTimer = (
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

  if (phase === "graceOver") {
    return (
      <View style={styles.stackContainer}>
        {normalTimer}
        <Text style={[styles.graceOverText, style?.graceOverText]}>
          Grace Period Over
        </Text>
      </View>
    );
  }

  if (phase === "grace") {
    return (
      <View style={styles.stackContainer}>
        {normalTimer}
        <View style={[styles.graceCard, style?.graceCard]}>
          <View style={styles.graceHeaderRow}>
            <Ionicons name="time-outline" size={14} color="#D97706" />
            <Text style={styles.graceTitle}>Grace Period Timer</Text>
            <View style={styles.graceBadge}>
              <Text style={styles.graceBadgeText}>Grace Period</Text>
            </View>
          </View>
          <View style={styles.graceInnerBox}>
            <Text style={styles.graceInnerLabel}>Extended time remaining</Text>
            <Text style={styles.graceInnerTime}>{graceTimeLeft}</Text>
            <Text style={styles.graceInnerHint}>Final opportunity to submit your work.</Text>
          </View>
          <View style={styles.graceWarningRow}>
            <Ionicons name="alert-circle-outline" size={12} color="#B45309" style={styles.graceWarningIcon} />
            <Text style={styles.graceWarningText}>
              Failure to submit within the grace period may result in automatic cancellation and applicable consequences.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return normalTimer;
};

const styles = StyleSheet.create({
  stackContainer: {
    width: "100%",
    gap: 8,
  },
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
  disputedText: {
    color: "#D97706",
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "center",
  },
  graceCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FDE68A",
    padding: 8,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  graceHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  graceTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  graceBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  graceBadgeText: {
    color: "#B45309",
    fontSize: 10,
    fontWeight: "800",
  },
  graceInnerBox: {
    backgroundColor: "#FFFBEB",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 0,
  },
  graceInnerLabel: {
    color: "#B45309",
    fontSize: 11,
    fontWeight: "700",
  },
  graceInnerTime: {
    color: "#D97706",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 1,
  },
  graceInnerHint: {
    color: "#B45309",
    fontSize: 11,
  },
  graceWarningRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 4,
  },
  graceWarningIcon: {
    marginTop: 1,
  },
  graceWarningText: {
    flex: 1,
    color: "#6B7280",
    fontSize: 10.5,
    lineHeight: 14,
  },
  graceOverText: {
    color: "#DC2626",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default DeadlineTimer;
