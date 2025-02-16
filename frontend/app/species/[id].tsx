import { View, StyleSheet, Image, ScrollView } from 'react-native';
import {Link, useLocalSearchParams} from 'expo-router';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { ThemedText } from '@/components/ThemedText';
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import { Image as ExpoImage } from 'expo-image';

interface SpeciesItem {
  id: string;
  image: string;
  species: string;
  location: string;
  latest_time: string;
  frequency: number;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default function SpeciesDetailScreen() {
  const { id } = useLocalSearchParams();
  const [speciesData, setSpeciesData] = useState<SpeciesItem[]>([]);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);

  const getTypeTitle = (id: string) => {
    switch (id) {
      case '1': return 'Animal';
      case '2': return 'Bird';
      case '3': return 'Plant';
      case '4': return 'Insect';
      default: return 'Species';
    }
  };

  useEffect(() => {
    const getLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation(location);
      }
    };
    getLocation();
  }, []);

  useEffect(() => {
    const fetchSpeciesData = async () => {
      if (!userLocation) return;

      try {
        const host = Constants.expoConfig?.hostUri?.split(':')[0];
        const response = await fetch(`http://${host}:9874/get-species-by-type`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: getTypeTitle(id as string).toLowerCase(),
            latitude: userLocation.coords.latitude,
            longitude: userLocation.coords.longitude,
          }),
        });

        const data = await response.json();
        console.log(data);
        console.log('Raw image URL:', data.species[0]?.image);
        
        // Clean the URL if needed
        const cleanedData = data.species.map((item: SpeciesItem) => ({
          ...item,
          image: item.image.replace(/([^:]\/)\/+/g, "$1") // Remove any double slashes except after protocol
        }));
        
        console.log('Cleaned image URL:', cleanedData[0]?.image);
        setSpeciesData(cleanedData);
      } catch (error) {
        console.error('Error fetching species data:', error);
      }
    };

    fetchSpeciesData();
  }, [id, userLocation]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <ThemedText className={'text-4xl font-bold mt-4 mb-2'} style={styles.title}>{getTypeTitle(id as string)}</ThemedText>
      </View>

      {speciesData.map((item) => (
        <Card key={item.id} className="w-full mb-4">
          <Link href={{
            pathname: `/species/specie/${item.id}`,
            params: {
              id: item.id,
              species: item.species,
              image: item.image,
              frequency: item.frequency,
              location: item.location,
              description: 'description goes here!?'
            }
          }}>
            <View style={styles.cardContent}>
              <ExpoImage
                  source={{ uri: item.image }}
                  style={styles.image}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  transition={200}
                  onError={(error) => {
                    console.error('Image loading error:', error);
                    console.log('Failed URL:', item.image);
                  }}
                  placeholder={require('../../assets/images/favicon.png')}
              />
              <View style={styles.infoContainer}>
                <ThemedText style={styles.speciesName}>{item.species}</ThemedText>
                <ThemedText style={styles.location}>{item.location}</ThemedText>
                <ThemedText style={styles.time}>Last seen: {item.latest_time}</ThemedText>
                <ThemedText style={styles.frequency}>
                  Spotted {item.frequency} times nearby
                </ThemedText>
              </View>
            </View>
          </Link>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  cardContent: {
    flexDirection: 'row',
    padding: 12,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  speciesName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  location: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  time: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  frequency: {
    fontSize: 14,
    color: '#0a7ea4',
  },
});