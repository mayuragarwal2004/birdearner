// Marketplace constants and configurations
export const MARKETPLACE_CONSTANTS = {
  MAX_DISTANCE: 20,
  DEFAULT_DISTANCE: 3,
  MIN_DISTANCE: 0.5,
  DISTANCE_STEP: 0.5,
  MAP_HEIGHT: 220,
  ANIMATION_DURATION: 150,
  DEBOUNCE_DELAY: 250,
  SLIDER_WIDTH: 300,
  SLIDER_HEIGHT: 32,
  
  PRIORITIES: ["Immediate", "High", "Standard"],
  
  PRIORITY_COLORS: {
    Immediate: ["#7C1313", "#E22323"],
    High: ["#896D08", "#EFBE0E"],
    Standard: ["#34660C", "#77CB35"],
  },
  
  DEFAULT_REGION: {
    latitude: 22.886473,
    longitude: 79.610891,
    latitudeDelta: 1.0,
    longitudeDelta: 1.0,
  },
  
  ZOOM_REGION: {
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  },
};

// Helper function to calculate distance between two coordinates
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};

// Create debounced function
export const debounce = (func, delay) => {
  let timer;
  return (...args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
};

// Snap distance to nearest step
export const snapDistance = (distance, step, maxDistance) => {
  // Validate inputs
  if (typeof distance !== 'number' || isNaN(distance)) return MARKETPLACE_CONSTANTS.DEFAULT_DISTANCE;
  if (typeof step !== 'number' || isNaN(step) || step <= 0) return distance;
  if (typeof maxDistance !== 'number' || isNaN(maxDistance)) return distance;
  
  const boundedDistance = Math.min(maxDistance, Math.max(0, distance));
  const snapped = Math.round(boundedDistance / step) * step;
  
  // Ensure result is valid
  return isNaN(snapped) ? MARKETPLACE_CONSTANTS.DEFAULT_DISTANCE : snapped;
};

// Get pin color for priority
export const getPinColor = (priority) => {
  const colors = {
    Immediate: "red",
    High: "orange", 
    Standard: "green"
  };
  return colors[priority] || "red";
};

// Generate slider lines for visual effect
export const generateSliderLines = () => {
  const lines = [];
  for (let i = 0; i < 50; i++) {
    lines.push(i);
  }
  return lines;
};