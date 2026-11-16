// Shared purple hero / header background design.
//
// The Freelancer Profile hero (MyProfile) and the Client Home header band
// (ClientHome) both fade from the brand deep purple (#4B0082) into the page
// background. Light Mode keeps each screen's original gradient byte-identical;
// Dark Mode uses this single designed counterpart — deep purple holding the top,
// then falling through deep violet into true black (#000000) — so both screens
// share one background design instead of a flat colour or a black overlay.

// Dark Mode: same 4-stop shape and locations as the profile hero. The top 60%
// stays brand deep purple (same as Light Mode, so white text/icons keep their
// contrast), then it transitions to deep violet and finally true black so it
// blends seamlessly into the #000000 page background.
const DARK_GRADIENT = {
  colors: ["#4B0082", "#4B0082", "#1B1028", "#000000"],
  locations: [0, 0.6, 0.85, 1],
  start: { x: 0.5, y: 0 },
  end: { x: 0.5, y: 1 },
};

// Light Mode profile hero — byte-identical to the gradient MyProfile shipped
// with inline (purple → lavender → near-white).
const LIGHT_PROFILE_HERO = {
  colors: ["#4B0082", "#4B0082", "#C4B5E8", "#F5F2FB"],
  locations: [0, 0.6, 0.85, 1],
  start: { x: 0.5, y: 0 },
  end: { x: 0.5, y: 1 },
};

// Light Mode client header — byte-identical to the gradient ClientHome shipped
// with inline (deep purple → soft lavender fade into the page).
const LIGHT_CLIENT_HEADER = {
  colors: ["#2A0B5C", "#3F1584", "#6A3BB8", "#8E63CC", "#C2AEE8", "#F7F5FB"],
  locations: [0, 0.4, 0.6, 0.74, 0.88, 1],
  start: { x: 0.5, y: 0 },
  end: { x: 0.5, y: 1 },
};

// Freelancer Profile hero background for the active theme.
export const getProfileHeroGradient = (isDark) =>
  isDark ? DARK_GRADIENT : LIGHT_PROFILE_HERO;

// Client Home header band background for the active theme.
export const getClientHeaderGradient = (isDark) =>
  isDark ? DARK_GRADIENT : LIGHT_CLIENT_HEADER;
