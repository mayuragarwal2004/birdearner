import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker, Circle } from 'react-native-maps';
import { MARKETPLACE_CONSTANTS, getPinColor } from '../../utils/marketplaceUtils';

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

  const renderJobMarkers = (jobList, priority) => {
    return jobList.map((job, index) =>
      job.latitude && job.longitude ? (
        <Marker
          key={`${priority.toLowerCase()}-${job.id}-${index}`}
          coordinate={{
            latitude: parseFloat(job.latitude),
            longitude: parseFloat(job.longitude),
          }}
          title={job.title}
          description={job.description}
          pinColor={getPinColor(priority)}
        />
      ) : null
    );
  };

  return (
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
          strokeWidth={1}
          strokeColor={"#1a66ff"}
          fillColor={"rgba(230,238,255,0.5)"}
        />
      )}

      {/* Job markers by priority */}
      {renderJobMarkers(jobs.Immediate, 'Immediate')}
      {renderJobMarkers(jobs.High, 'High')}
      {renderJobMarkers(jobs.Standard, 'Standard')}
    </MapView>
  );
};

const styles = StyleSheet.create({
  map: {
    width: "100%",
    height: MARKETPLACE_CONSTANTS.MAP_HEIGHT,
    marginVertical: 20,
  },
});

export default JobsMap;