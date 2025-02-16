import { Image, StyleSheet, Platform } from 'react-native';
import * as Network from 'expo-network';
import {LocationObject, requestForegroundPermissionsAsync, getCurrentPositionAsync, watchPositionAsync, LocationAccuracy } from 'expo-location';

import { ThemedView } from '@/components/ThemedView';
import MapView, {Marker, PROVIDER_GOOGLE}  from 'react-native-maps';
import {useEffect, useRef, useState} from 'react';
import Constants from 'expo-constants';
import {ObjectMap} from "@sinclair/typebox";
import Map = ObjectMap.Map;

export default function HomeScreen() {
  // user location and stops state
  const [location, setLocation] = useState<LocationObject | null>(null);
  const mapRef = useRef<MapView>(null);

  // useEffect(() => {
  //   // Fetch the test route from Flask
  //   const fetchTestRoute = async () => {
  //     try {
  //       // const ip = await Network.getIpAddressAsync();
  //       const host = Constants.expoConfig?.hostUri?.split(':')[0];
  //       const response = await fetch(`http://${host}:9874/test-route`);
  //       const data = await response.json();
  //       console.log('API Response:', data);
  //     } catch (error) {
  //       console.error('Error calling Flask API:', error);
  //     }
  //   };
  //
  //   fetchTestRoute();
  // }, []);

  return (
    <MapView
        provider={PROVIDER_GOOGLE}
        ref={mapRef}
        initialRegion={{
          latitude: location?.coords.latitude ?? 37.3489,
          longitude: location?.coords.longitude ?? 121.9368,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005
        }}>
    </MapView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
