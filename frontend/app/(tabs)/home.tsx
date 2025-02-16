import * as Network from 'expo-network';
import {LocationObject, requestForegroundPermissionsAsync, getCurrentPositionAsync, watchPositionAsync, LocationAccuracy } from 'expo-location';
import { ThemedView } from '@/components/ThemedView';
import MapView, {Marker, PROVIDER_GOOGLE}  from 'react-native-maps';
import {useEffect, useRef, useState} from 'react';
import Constants from 'expo-constants';
import {ObjectMap} from "@sinclair/typebox";
import { ThemedText } from '@/components/ThemedText';

import Map = ObjectMap.Map;
import { View, StyleSheet } from 'react-native';

interface Sighting {
  id: string;
  type: 'animal' | 'bird' | 'plant';
  species: string;
  latitude: string;
  longitude: string;
}

export default function HomeScreen() {
  const [sightings, setSightings] = useState<Sighting[]>([]);

  useEffect(() => {
    fetchSightings();
  }, []);

  const fetchSightings = async () => {
    try {
      const host = Constants.expoConfig?.hostUri?.split(':')[0];
      const response = await fetch(`http://${host}:9874/get-sightings`);
      const data = await response.json();
      setSightings(data.sightings);
    } catch (error) {
      console.error('Error fetching sightings:', error);
    }
  };

  return (
    <View style={styles.container}>
      <MapView style={styles.map}>
        {sightings.map((sighting) => (
          <Marker
            key={sighting.id}
            coordinate={{
              latitude: parseFloat(sighting.latitude),
              longitude: parseFloat(sighting.longitude),
            }}
            title={sighting.species}
            description={`Type: ${sighting.type}`}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
});