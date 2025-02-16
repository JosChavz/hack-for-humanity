import { View, TextInput, ActivityIndicator, StyleSheet, ScrollView, Pressable } from 'react-native';
import { IconSymbol } from './ui/IconSymbol';
import { ThemedText } from './ThemedText';
import { Image as ExpoImage } from 'expo-image';

interface SearchResult {
  id: string;
  species: string;
  image: string;
  description: string;
}

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  loading?: boolean;
  results?: SearchResult[];
  onResultPress?: (result: SearchResult) => void;
}

export function SearchBar({ value, onChangeText, loading, results, onResultPress }: SearchBarProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <IconSymbol name="magnifyingglass" size={20} color="#666" />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder="Search wildlife..."
          placeholderTextColor="#666"
        />
        {loading && <ActivityIndicator size="small" color="#0a7ea4" />}
      </View>
      
      {results && results.length > 0 && (
        <ScrollView style={styles.resultsContainer}>
          {results.map((result) => (
            <Pressable
              key={result.id}
              style={styles.resultItem}
              onPress={() => onResultPress?.(result)}
            >
              <ExpoImage
                source={{ uri: result.image }}
                style={styles.resultImage}
                contentFit="cover"
              />
              <View style={styles.resultInfo}>
                <ThemedText style={styles.resultTitle}>{result.species}</ThemedText>
                <ThemedText 
                  style={styles.resultDescription}
                  numberOfLines={2}
                >
                  {result.description}
                </ThemedText>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    zIndex: 1000,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    padding: 0,
  },
  resultsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 12,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  resultItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  resultInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  resultDescription: {
    fontSize: 14,
    color: '#666',
  }
}); 