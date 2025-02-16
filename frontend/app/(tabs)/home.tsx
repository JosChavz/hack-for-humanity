

import { LocationObject, requestForegroundPermissionsAsync, getCurrentPositionAsync, watchPositionAsync, LocationAccuracy } from 'expo-location';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text, Animated, Easing, Alert } from 'react-native';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

interface Sighting {
  id: string;
  type: 'animal' | 'bird' | 'plant';
  image: string;
  species: string;
  latitude: string;
  longitude: string;
}

export default function HomeScreen() {
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [location, setLocation] = useState<LocationObject | null>(null);
  const [userInfo, setUserInfo] = useState<any | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const [region, setRegion] = useState<{latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number}>({
    latitude: 37.29633, 
    longitude: -121.91360, 
    latitudeDelta: 0.005, 
    longitudeDelta: 0.005,
  });
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    fetchSightings();
    requestLocationPermission();
  }, []);

  useEffect(() => {
    // console.log(userInfo?.favoriteSpecies, sightings)
    if (!userInfo?.favoriteSpecies || sightings.length === 0) return;
  
    const favoriteSightings = sightings.filter(sighting =>
      userInfo.favoriteSpecies.includes(sighting.species)
    );

    console.log(userInfo?.favoriteSpecies, favoriteSightings)
  
    if (favoriteSightings.length > 0) {
      const uniqueSpecies = Array.from(new Set(favoriteSightings.map(s => s.species)));
      Alert.alert(
        'Favorite Species Nearby!',
        `You have favorite species nearby: ${uniqueSpecies}. Check the map!`,
        [{ text: 'OK' }]
      );
    }
  }, [sightings, userInfo]);


  useEffect(() => {
    const fetchUserInfo = async () => {
      const storedUserInfo = await SecureStore.getItemAsync('userInfo');
      if (storedUserInfo) {
        setUserInfo(JSON.parse(storedUserInfo));
      }
    };

    fetchUserInfo();
  }, []);

  const fetchSightings = async () => {
    try {
      /**
      const dummySightings: Sighting[] = [
        {
          id: "67b1812d472ca212c797ace3",
          image: "https://imgur.com/a/Zrn948W",
          latitude: '37.296230179327111', // Convert to number
          longitude: '-121.913901256111', 
          species: "Lampranthus",
          type: "plant"
        },
        {
          id: "67b1812d472ca212c797ace4",
          image: "https://imgur.com/a/example2",
          latitude: '37.29623017932222', 
          longitude: '-121.91390125612222', 
          species: "Bald Eagle",
          type: "bird"
        },
        {
          id: "67b1812d472ca212c797ace5",
          image: "https://imgur.com/a/example3",
          latitude: '37.296230179327075', 
          longitude: '-121.91390125612696', 
          species: "Red Fox",
          type: "animal"
        }
      ];
      setSightings(dummySightings);
      */
      const host = Constants.expoConfig?.hostUri?.split(':')[0];
      const response = await fetch(`http://${host}:9874/get-sightings`);
      const data = await response.json();
      setSightings(data.sightings);
    } catch (error) {
      console.error('Error fetching sightings:', error);
    }
  };

  async function requestLocationPermission() { 
    const { granted } = await requestForegroundPermissionsAsync();
    if (granted) {
      const currentPosition = await getCurrentPositionAsync();
      setLocation(currentPosition);
      setRegion({
        latitude: currentPosition.coords.latitude,
        longitude: currentPosition.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    }
  }

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0, 
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (!location) return;

    watchPositionAsync(
      {
        accuracy: LocationAccuracy.Highest, 
        distanceInterval: 10000, 
      }, 
      (response) => {
        setLocation(response);
        setRegion({
          latitude: response.coords.latitude,
          longitude: response.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
        mapRef.current?.animateCamera({ center: response.coords });
      }
    );

  }, []); 

  return (
    <View style={styles.container}>
      {region && location?.coords ? ( 
        <MapView
          style={styles.map}
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          region={region} 
        >
          <Marker coordinate={{
  latitude: location?.coords.latitude,
  longitude: location?.coords.longitude,
}}>
  <View style={styles.markerContainer}>
    {/* Pulsing Effect */}
    <Animated.View style={[styles.markerOuter, { transform: [{ scale: pulseAnim }], opacity: opacityAnim }]} />
    
    {/* Inner Static Marker */}
    <View style={styles.markerInner} />
  </View>
</Marker>


          {sightings?.map((sighting) => (
            <Marker
              key={sighting.id}
              coordinate={{
                latitude: parseFloat(sighting.latitude), // No need for parseFloat
                longitude: parseFloat(sighting.longitude),
              }}
              title={sighting.species}
              description={`Type: ${sighting.type}`}
              style={{zIndex: 5}}
            />
          ))}
        </MapView>
      ) : (
        <Text>Loading Map...</Text>
      )}
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
  markerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    width: 100,
    height: 100,
    overflow: 'visible',
  },
  markerOuter: {
    position: 'absolute', 
    width: 40,
    height: 40,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 122, 255, 0.3)',
    overflow: 'visible'
  },
  markerInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'blue',
    borderWidth: 2,
    borderColor: 'white',
    position: 'absolute',
  },
});