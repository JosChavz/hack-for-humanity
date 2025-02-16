import * as Network from 'expo-network';
import {LocationObject, requestForegroundPermissionsAsync, getCurrentPositionAsync, watchPositionAsync, LocationAccuracy } from 'expo-location';
import { Image, StyleSheet, Platform } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import MapView, {Marker, PROVIDER_GOOGLE}  from 'react-native-maps';
import {useEffect, useRef, useState} from 'react';
import Constants from 'expo-constants';
import {ObjectMap} from "@sinclair/typebox";
import Map = ObjectMap.Map;
import { View } from 'react-native';

export default function HomeScreen() {

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

  //   fetchTestRoute();
  // }, []);

  return (
    <View style={styles.container}>
      <MapView style={styles.map} />
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