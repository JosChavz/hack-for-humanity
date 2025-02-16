import { View, StyleSheet, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { Card, CardHeader, CardTitle } from '~/components/ui/card';
import { SearchBar } from '../../components/SearchBar';
import { useState, useEffect } from 'react';
import Constants from 'expo-constants';
import { Image as ExpoImage } from 'expo-image';
import { ThemedText } from '@/components/ThemedText';

interface SearchResult {
  id: string;
  species: string;
  image: string;
  location: string;
  latest_time: string;
  description: string;
  score: number;
}

export default function SpeciesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const host = Constants.expoConfig?.hostUri?.split(':')[0];
      const response = await fetch(`http://${host}:9874/vector-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();
      setSearchResults(data.species);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(debounceTimeout);
  }, [searchQuery]);

  return (
    <View style={styles.container}>
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        loading={loading}
        results={searchResults}
        onResultPress={(result) => {
          setSearchQuery('');
          setSearchResults([]);
          // Handle result selection here
        }}
      />
      <ScrollView style={styles.content}>
        {searchResults.length > 0 ? (
          <View style={styles.searchResults}>
            {searchResults.map((result) => (
              <Card key={result.id} className="w-full mb-4">
                <View style={styles.cardContent}>
                  <ExpoImage
                    source={{ uri: result.image }}
                    style={styles.image}
                    contentFit="cover"
                    transition={200}
                  />
                  <View style={styles.infoContainer}>
                    <ThemedText style={styles.speciesName}>{result.species}</ThemedText>
                    <ThemedText style={styles.location}>{result.location}</ThemedText>
                    <ThemedText style={styles.time}>Last seen: {result.latest_time}</ThemedText>
                    <ThemedText style={styles.description} numberOfLines={2}>
                      {result.description}
                    </ThemedText>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        ) : (
          <View>
            <Link href="/species/1">
              <Card className="w-full mb-4">
                <CardHeader style={{ backgroundColor: '#2D3250', borderRadius: 12 }}>
                  <CardTitle className="text-white">Animals</CardTitle>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/species/2">
              <Card className="w-full mb-4">
                <CardHeader style={{ backgroundColor: '#424769', borderRadius: 12 }}>
                  <CardTitle className="text-white">Birds</CardTitle>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/species/3" >
              <Card className="w-full mb-4">
                <CardHeader style={{ backgroundColor: '#7077A1', borderRadius: 12 }}>
                  <CardTitle className="text-white">Plants</CardTitle>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/species/4">
              <Card className="w-full mb-4">
                <CardHeader style={{ backgroundColor: '#576CBC', borderRadius: 12 }}>
                  <CardTitle className="text-white">Insects</CardTitle>
                </CardHeader>
              </Card>
            </Link>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  content: {
    flex: 1,
    marginTop: 8,
  },
  searchResults: {
    marginTop: 8,
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
  description: {
    fontSize: 14,
    color: '#444',
  }
});
