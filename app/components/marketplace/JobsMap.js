import React from 'react';
import { StyleSheet, Platform, View, Text } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker, Circle } from 'react-native-maps';
import { Briefcase } from 'phosphor-react-native';
import { MARKETPLACE_CONSTANTS } from '../../utils/marketplaceUtils';

const JobsMap = ({ 
  location, 
  distance, 
  jobs, 
  mapRef 
}) => {
  const region = location
    ? {
        latitude: location.latitude,
        longitude: location.longitude,
        ...MARKETPLACE_CONSTANTS.ZOOM_REGION,
      }
    : MARKETPLACE_CONSTANTS.DEFAULT_REGION;

  // Custom colors for map circle matching the UI
  const CIRCLE_STROKE = "#762BAD";
  const CIRCLE_FILL = "rgba(118, 43, 173, 0.1)";

  // Helper to get color based on priority
  const getMarkerColor = (priority) => {
    switch (priority) {
      case 'Immediate': return "#FF3B30"; // Red/Pink
      case 'High': return "#FFCC00"; // Yellow/Orange
      default: return "#762BAD"; // Default purple
    }
  };

  const renderJobMarkers = (jobList, priority) => {
    const markerColor = getMarkerColor(priority);

    return jobList.map((job, index) =>
      job.latitude && job.longitude ? (
        <Marker
          key={`${priority.toLowerCase()}-${job.id}-${index}`}
          coordinate={{
            latitude: parseFloat(job.latitude),
            longitude: parseFloat(job.longitude),
          }}
          tracksViewChanges={false} // Performance optimization for custom markers
        >
          <View style={styles.customMarkerContainer}>
            <View style={styles.markerBubble}>
              <View style={[styles.iconContainer, { backgroundColor: markerColor }]}>
                <Briefcase size={12} color="#FFF" weight="fill" />
              </View>
              {job.title && (
                <Text style={[styles.markerText, { color: markerColor }]} numberOfLines={2}>
                  {job.title}
                </Text>
              )}
            </View>
            <View style={[styles.markerTriangle, { borderTopColor: '#FFF' }]} />
            <View style={[styles.markerDot, { backgroundColor: markerColor }]} />
          </View>
        </Marker>
      ) : null
    );
  };

  return (
    <View style={styles.mapContainer}>
      <MapView
        style={styles.map}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        showsUserLocation
        showsMyLocationButton
        ref={mapRef}
        onMapReady={() => console.log("Map is ready")}
        onError={(e) => {
          console.error("Map error:", e.nativeEvent);
        }}
        region={region}
      >
        {/* User location circle */}
        {location && (
          <Circle
            key={(location.latitude + location.longitude).toString()}
            center={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            radius={distance * 1000}
            strokeWidth={1.5}
            strokeColor={CIRCLE_STROKE}
            fillColor={CIRCLE_FILL}
          />
        )}

        {/* Job markers by priority */}
        {renderJobMarkers(jobs.Immediate, 'Immediate')}
        {renderJobMarkers(jobs.High, 'High')}
        {renderJobMarkers(jobs.Standard, 'Standard')}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#E5E5EA', // Placeholder while map loads
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  map: {
    width: "100%",
    height: MARKETPLACE_CONSTANTS.MAP_HEIGHT || 300,
  },
  customMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
    maxWidth: 120, // Keep title contained
  },
  iconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  markerText: {
    fontSize: 10,
    fontWeight: 'bold',
    flexShrink: 1,
  },
  markerTriangle: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    marginTop: -1, // Overlap slightly to fix gaps
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  markerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  }
});

export default JobsMap;