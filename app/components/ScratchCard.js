import React, { useEffect, useMemo, useRef, useState } from "react";
import { PanResponder, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../context/ThemeContext";

const COLS = 9;
const ROWS = 5;
const TOTAL_CELLS = COLS * ROWS;
const REVEAL_AT = Math.ceil(TOTAL_CELLS * 0.55); // must actually rub across ~55% of the foil
const FOIL_SHADES = ["#D7DAE2", "#C7CBD6", "#E4E7EE", "#BEC3CF", "#DFE2EA"];

// Google-Pay-style scratch card. The prize layer sits underneath, a grid of
// foil cells on top is erased with a PanResponder drag, and when enough of the
// grid is scratched the parent's async onReveal() is called (server claim).
// If onReveal() throws, the foil is restored so the user can try again.
const ScratchCard = ({ card, onReveal, width = 232, height = 132 }) => {
  const { theme, themeStyles } = useTheme();
  const isDark = theme === "dark";
  const [size, setSize] = useState({ w: width, h: height });
  const [erased, setErased] = useState(() => new Array(TOTAL_CELLS).fill(false));
  const [settling, setSettling] = useState(false);
  const [localCard, setLocalCard] = useState(null);
  const settledRef = useRef(false);

  const data = localCard || card;
  // Hard guarantee: a card the server marks masked:true can NEVER render the
  // prize — the foil stays until a claim succeeds in THIS session (localCard).
  const revealed = localCard
    ? true
    : data?.masked === true
      ? false
      : data?.revealed === true || data?.masked === false;

  const erasedCount = erased.reduce((n, e) => n + (e ? 1 : 0), 0);
  const hintOpacity = erasedCount > 0 ? 0 : 1;

  // radius 0 = single cell (tap feedback), radius 1 = 3x3 brush (drag)
  const eraseAt = (x, y, radius) => {
    if (settledRef.current || revealed) return;
    const cellW = size.w / COLS;
    const cellH = size.h / ROWS;
    const col = Math.floor(x / cellW);
    const row = Math.floor(y / cellH);
    if (col < -1 || row < -1 || col > COLS || row > ROWS) return;
    setErased((prev) => {
      const next = prev.slice();
      let changed = false;
      for (let r = row - radius; r <= row + radius; r++) {
        for (let c = col - radius; c <= col + radius; c++) {
          if (r < 0 || c < 0 || r >= ROWS || c >= COLS) continue;
          const i = r * COLS + c;
          if (!next[i]) {
            next[i] = true;
            changed = true;
          }
        }
      }
      return changed ? next : prev;
    });
  };

  // Latest-eraseAt bridge so the (once-created) PanResponder never uses a stale
  // closure over size/revealed state.
  const eraseRef = useRef(() => {});
  eraseRef.current = eraseAt;

  const panHandlers = useMemo(
    () =>
      PanResponder.create({
        // Claim on touch-DOWN: a plain tap must give feedback too (previously
        // only drags >2px claimed the responder, so taps did nothing at all).
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 2 || Math.abs(g.dy) > 2,
        // Keep the card's responder for taps and scratches; only yield to the
        // parent scroll views on a clear vertical swipe so the page still scrolls.
        onPanResponderTerminationRequest: (_e, g) =>
          Math.abs(g.dy) > 12 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderGrant: (e) =>
          eraseRef.current(e.nativeEvent.locationX, e.nativeEvent.locationY, 0),
        onPanResponderMove: (e) =>
          eraseRef.current(e.nativeEvent.locationX, e.nativeEvent.locationY, 1),
      }).panHandlers,
    []
  );

  // Threshold reached -> ask parent to claim, or restore foil on failure
  useEffect(() => {
    if (settledRef.current || revealed || settling) return;
    if (erasedCount < REVEAL_AT) return;
    settledRef.current = true;
    setSettling(true);
    let cancelled = false;
    (async () => {
      try {
        const claimed = onReveal ? await onReveal(card) : null;
        if (!cancelled && claimed) setLocalCard(claimed);
      } catch (err) {
        if (!cancelled) {
          settledRef.current = false;
          setErased(new Array(TOTAL_CELLS).fill(false));
        }
      } finally {
        if (!cancelled) setSettling(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [erasedCount]);

  // Reset when parent replaces the card with a fresh masked one
  useEffect(() => {
    if (card?.id && card.id !== data?.id) {
      setLocalCard(null);
      settledRef.current = false;
      setErased(new Array(TOTAL_CELLS).fill(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card?.id]);

  const cells = useMemo(() => {
    const cellW = size.w / COLS;
    const cellH = size.h / ROWS;
    return erased.map((isErased, i) => {
      if (isErased) return null;
      const r = Math.floor(i / COLS);
      const c = i % COLS;
      return (
        <View
          key={i}
          pointerEvents="none"
          style={{
            position: "absolute",
            left: c * cellW,
            top: r * cellH,
            width: cellW + 0.5,
            height: cellH + 0.5,
            backgroundColor: FOIL_SHADES[(r * COLS + c) % FOIL_SHADES.length],
          }}
        />
      );
    });
  }, [erased, size]);

  const discountText = (() => {
    if (!data?.amount) return null;
    return data.amountType === "LUMPSUM"
      ? `₹${data.amount} OFF`
      : `${data.amount}% OFF${data.maxDiscount ? ` (max ₹${data.maxDiscount})` : ""}`;
  })();

  const surfaceStyles = useMemo(() => getSurfaceStyles(isDark), [isDark]);

  return (
    <View
      style={[surfaceStyles.card, { width, height }]}
      // box-only: this View is always the touch target, so locationX/locationY
      // are card-relative (children can never hijack the coordinates)
      pointerEvents="box-only"
      {...panHandlers}
      onLayout={(e) =>
        setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })
      }
    >
      {/* Prize layer */}
      <LinearGradient
        colors={isDark ? ["#5B21B6", "#7C3AED"] : ["#6D28D9", "#9333EA"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      >
        <View style={surfaceStyles.prize} pointerEvents="none">
          {revealed ? (
            <>
              <View style={surfaceStyles.codeChip}>
                <Text style={surfaceStyles.codeText}>{data?.code || "—"}</Text>
              </View>
              <Text style={surfaceStyles.discountText}>{discountText}</Text>
              <Text style={surfaceStyles.caption}>
                Added to your coupons • {data?.serviceName}
              </Text>
            </>
          ) : (
            <>
              <Text style={surfaceStyles.serviceText}>{data?.serviceName}</Text>
              <Text style={surfaceStyles.caption}>Exclusive coupon inside</Text>
            </>
          )}
        </View>
      </LinearGradient>

      {/* Foil grid (cells disappear as the user scratches) */}
      {!revealed && cells}

      {/* Hint on top of the foil, fades on first scratch */}
      {!revealed && (
        <View style={surfaceStyles.hintWrap} pointerEvents="none">
          <Text style={[surfaceStyles.hint, { opacity: hintOpacity }]}>
            ✨ Scratch to reveal
          </Text>
        </View>
      )}

      {settling && !revealed && (
        <View style={surfaceStyles.overlay} pointerEvents="none">
          <Text style={surfaceStyles.overlayText}>Claiming…</Text>
        </View>
      )}
    </View>
  );
};

const getSurfaceStyles = (isDark) =>
  StyleSheet.create({
    card: {
      borderRadius: 18,
      overflow: "hidden",
      shadowColor: "#6D28D9",
      shadowOpacity: 0.25,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 5,
      backgroundColor: "#6D28D9",
    },
    prize: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 12,
    },
    serviceText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "700",
      textAlign: "center",
    },
    codeChip: {
      backgroundColor: "rgba(255,255,255,0.2)",
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.55)",
    },
    codeText: {
      color: "#FFFFFF",
      fontSize: 18,
      fontWeight: "800",
      letterSpacing: 2,
    },
    discountText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "700",
      marginTop: 6,
    },
    caption: {
      color: "rgba(255,255,255,0.85)",
      fontSize: 11,
      fontWeight: "600",
      marginTop: 4,
      textAlign: "center",
    },
    hintWrap: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      justifyContent: "center",
    },
    hint: {
      color: isDark ? "#3B3350" : "#6B7280",
      fontSize: 13,
      fontWeight: "800",
      letterSpacing: 0.5,
      textShadowColor: "rgba(255,255,255,0.65)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(0,0,0,0.18)",
    },
    overlayText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "700",
    },
  });

export default ScratchCard;
