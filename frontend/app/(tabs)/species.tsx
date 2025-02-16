import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { ThemedText } from '@/components/ThemedText';
import { useState, useEffect } from 'react';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

interface Sighting {
  id: string;
  type: 'animal' | 'bird' | 'plant';
  species: string;
  latitude: string;
  longitude: string;
}

export default function SpeciesScreen() {
  const router = useRouter();
  const [sightings, setSightings] = useState<Sighting[]>([]);
  
  useEffect(() => {
    fetchSightings();
  }, []);

  const fetchSightings = async () => {
    try {
      const host = Constants.expoConfig?.hostUri?.split(':')[0];
      const response = await fetch(`http://${host}:9874/get-sightings`);
      
      // Check if response is ok
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Try to parse JSON
      const data = await response.json();
      setSightings(data.sightings);
    } catch (error) {
      console.error('Error fetching sightings:', error);
      // Set empty array as fallback
      setSightings([]);
    }
  };

  const groupedSightings = {
    animal: sightings.filter(s => s.type === 'animal'),
    bird: sightings.filter(s => s.type === 'bird'),
    plant: sightings.filter(s => s.type === 'plant')
  };

  const CategoryCard = ({ title, count, color }: { title: string; count: number; color: string }) => (
    <Pressable onPress={() => router.push('/camera')}>
      <Card className="w-full mb-4">
        <CardHeader style={{ backgroundColor: color, borderRadius: 12 }}>
          <CardTitle className="text-white">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <ThemedText>{count} species recorded</ThemedText>
          <View style={styles.speciesList}>
            {groupedSightings[title.toLowerCase() as keyof typeof groupedSightings]
              ?.map(sighting => (
                <ThemedText key={sighting.id} style={styles.speciesItem}>
                  {sighting.species}
                </ThemedText>
              )) || []}
          </View>
        </CardContent>
      </Card>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <CategoryCard title="Animals" count={groupedSightings.animal.length} color="#2D3250" />
      <CategoryCard title="Birds" count={groupedSightings.bird.length} color="#424769" />
      <CategoryCard title="Plants" count={groupedSightings.plant.length} color="#7077A1" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  speciesList: {
    marginTop: 8,
  },
  speciesItem: {
    fontSize: 14,
    marginVertical: 2,
  }
}); 