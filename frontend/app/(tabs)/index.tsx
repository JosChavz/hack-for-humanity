import { Image, StyleSheet, Platform, View } from 'react-native';
import * as Network from 'expo-network';
import {LocationObject, requestForegroundPermissionsAsync, getCurrentPositionAsync, watchPositionAsync, LocationAccuracy } from 'expo-location';
import { ThemedView } from '@/components/ThemedView';
import MapView, {Marker, PROVIDER_GOOGLE}  from 'react-native-maps';
import {useEffect, useRef, useState} from 'react';
import Constants from 'expo-constants';
import {ObjectMap} from "@sinclair/typebox";
import Map = ObjectMap.Map;

export default function HomeScreen() {
  const [location, setLocation] = useState<LocationObject | null>(null);
  const mapRef = useRef<MapView>(null);

  async function requestLocationPermission() {
    const {granted} = await requestForegroundPermissionsAsync();

    if(granted) {
      const currentPosition = await getCurrentPositionAsync();
      setLocation(currentPosition);
        console.log(currentPosition);
    }
  }

  useEffect(()=> {
    requestLocationPermission();
  }, []);

  return (
    <View style={styles.container}>
      <MapView style={styles.map} ref={mapRef}
               initialRegion={{
                 latitude: location?.coords.latitude ?? 121.9552,
                 longitude: location?.coords.longitude ?? 37.3541,
                 latitudeDelta: 0.0922,
                 longitudeDelta: 0.005
               }}>
          <Marker coordinate={{
              latitude: location?.coords.latitude ?? 37.3541,
              longitude: location?.coords.longitude ?? 121.9552,
          }}
          title={'test'}
                  description={'test description'}
          ></Marker>
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