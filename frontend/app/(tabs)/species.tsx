import React from 'react';
import { View, StyleSheet, TextInput, ActivityIndicator, Text } from 'react-native';
import { Link } from 'expo-router';
import { Card, CardHeader, CardTitle } from '~/components/ui/card';
import { useState, useCallback } from 'react';
import { Image as ExpoImage } from 'expo-image';
import Constants from 'expo-constants';
import debounce from 'lodash/debounce';
import { ThemedText } from '@/components/ThemedText';
import {Icon} from "react-native-elements";

interface SearchResult {
  species: string;
  type: string;
  image: string;
  description: string;
  location_name: string;
  created_at: string;
  score: number;
}

export default function SpeciesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const performSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      setIsLoading(true);
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
        setSearchResults(data.results || []);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  return (
    <View style={styles.container}>
      <Text className={'text-4xl mt-4'}>Welcome to Climacs! 🌍</Text>
      <Text className={'my-8'}>Scan your surroundings to identify plants and animals, learn about their climate impact, and contribute to conservation efforts.</Text>
      <View className={'mb-8'} style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search any wildlife..."
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            performSearch(text);
          }}
        />
        {isLoading && (
          <ActivityIndicator 
            style={styles.searchSpinner} 
            size="small" 
            color="#0a7ea4" 
          />
        )}
      </View>

      {searchResults.length > 0 ? (
        <View style={styles.resultsContainer}>
          {searchResults.map((result, index) => (
            <Card key={index} className="w-full mb-4">
              <View style={styles.cardContent}>
                <ExpoImage
                  source={{ uri: result.image }}
                  style={styles.resultImage}
                  contentFit="cover"
                  transition={200}
                />
                <View style={styles.resultInfo}>
                  <ThemedText style={styles.resultSpecies}>{result.species}</ThemedText>
                  <ThemedText style={styles.resultType}>{result.type}</ThemedText>
                  <ThemedText style={styles.resultDescription} numberOfLines={2}>
                    {result.description}
                  </ThemedText>
                </View>
              </View>
            </Card>
          ))}
        </View>
      ) : (
        <View className={'gap-4 mt-8'}>
          <Link href="/species/1">
            <Card className="w-full">
              <CardHeader style={{ backgroundColor: '#2D3250', borderRadius: 12 }}>
                <CardTitle>
                  <View className="w-full flex flex-row content-center text-white items-center justify-between">
                    <Text className={'text-2xl font-bold text-white'}>Animals</Text>
                    <Icon size={35} className={'ml-auto'} name={'arrow-right'} color={'white'} />
                  </View>
                </CardTitle>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/species/2">
            <Card className="w-full">
              <CardHeader style={{ backgroundColor: '#424769', borderRadius: 12 }}>
                <CardTitle className="text-white">
                  <View className="w-full flex flex-row content-center text-white items-center justify-between">
                    <Text className={'text-2xl font-bold text-white'}>Birds</Text>
                    <Icon size={35} className={'ml-auto'} name={'arrow-right'} color={'white'} />
                  </View>
                </CardTitle>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/species/3" >
            <Card className="w-full">
              <CardHeader style={{ backgroundColor: '#7077A1', borderRadius: 12 }}>
                <CardTitle className="text-white">
                  <View className="w-full flex flex-row content-center text-white items-center justify-between">
                    <Text className={'text-2xl font-bold text-white'}>Plants</Text>
                    <Icon size={35} className={'ml-auto'} name={'arrow-right'} color={'white'} />
                  </View>

                </CardTitle>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/species/4">
            <Card className="w-full">
              <CardHeader style={{ backgroundColor: '#576CBC', borderRadius: 12 }}>
                <CardTitle className="text-white">
                  <View className="w-full flex flex-row content-center text-white items-center justify-between">
                    <Text className={'text-2xl font-bold text-white'}>Insects</Text>
                    <Icon size={35} className={'ml-auto'} name={'arrow-right'} color={'white'} />
                  </View>
                </CardTitle>
              </CardHeader>
            </Card>
          </Link>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  searchInput: {
    flex: 1,
    height: 46,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 23,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  searchSpinner: {
    position: 'absolute',
    right: 16,
  },
  resultsContainer: {
    flex: 1,
  },
  cardContent: {
    flexDirection: 'row',
    padding: 12,
  },
  resultImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  resultInfo: {
    flex: 1,
    marginLeft: 12,
  },
  resultSpecies: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  resultType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  resultDescription: {
    fontSize: 14,
    color: '#888',
  },
});
