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