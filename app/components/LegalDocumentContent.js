import React from "react";
import { ScrollView, Text, View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";

export const LegalDocumentContent = ({ blocks }) => {
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const insets = useSafeAreaInsets();

  const text = currentTheme.text || "#101114";
  const sub = currentTheme.subText || "#666666";

  const renderBody = (item, key) => {
    if (typeof item === "string") {
      return (
        <Text key={key} style={[styles.bulletText, { color: text }]}>
          {item}
        </Text>
      );
    }
    return (
      <Text key={key} style={[styles.bulletText, { color: text }]}>
        <Text style={styles.bold}>{item.b}</Text>
        {item.x}
      </Text>
    );
  };

  const renderBlock = (block, index) => {
    switch (block.t) {
      case "h1":
        return (
          <Text key={index} style={[styles.h1, { color: text }]}>
            {block.x}
          </Text>
        );
      case "meta":
        return (
          <Text key={index} style={[styles.meta, { color: text }]}>
            {block.x}
          </Text>
        );
      case "h2":
        return (
          <Text key={index} style={[styles.h2, { color: text }]}>
            {block.x}
          </Text>
        );
      case "h3":
        return (
          <Text key={index} style={[styles.h3, { color: text }]}>
            {block.x}
          </Text>
        );
      case "h4":
        return (
          <Text key={index} style={[styles.h4, { color: text }]}>
            {block.x}
          </Text>
        );
      case "p":
        return (
          <Text key={index} style={[styles.p, { color: text }]}>
            {block.x}
          </Text>
        );
      case "ul":
        return (
          <View key={index} style={styles.list}>
            {block.items.map((item, i) => (
              <View key={i} style={styles.bulletRow}>
                <Text style={[styles.bulletDot, { color: text }]}>•</Text>
                <View style={styles.bulletBody}>{renderBody(item, i)}</View>
              </View>
            ))}
          </View>
        );
      case "footer":
        return (
          <Text key={index} style={[styles.footer, { color: sub }]}>
            {block.x}
          </Text>
        );
      default:
        return null;
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}
      showsVerticalScrollIndicator={false}
    >
      {blocks.map((block, index) => renderBlock(block, index))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  h1: {
    fontSize: 30,
    fontWeight: "800",
    marginTop: 16,
    marginBottom: 14,
    letterSpacing: -0.5,
  },
  meta: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 18,
  },
  h2: {
    fontSize: 23,
    fontWeight: "800",
    marginTop: 28,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 10,
  },
  h4: {
    fontSize: 15.5,
    fontWeight: "700",
    marginTop: 14,
    marginBottom: 8,
  },
  p: {
    fontSize: 13.5,
    lineHeight: 22,
    marginBottom: 12,
  },
  list: {
    marginBottom: 8,
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 10,
    paddingRight: 4,
  },
  bulletDot: {
    fontSize: 13.5,
    lineHeight: 22,
    width: 16,
  },
  bulletBody: {
    flex: 1,
  },
  bulletText: {
    fontSize: 13.5,
    lineHeight: 22,
  },
  bold: {
    fontWeight: "700",
  },
  footer: {
    fontSize: 11,
    marginTop: 26,
    marginBottom: 8,
  },
});

export default LegalDocumentContent;
