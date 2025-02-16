import { useState } from "react";
import { useFocusEffect } from "expo-router";
import { Alert, StyleSheet, View, Modal, Pressable, ActivityIndicator, ScrollView, Dimensions } from "react-native";
import Constants from "expo-constants";
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { getCurrentPositionAsync, LocationObject, requestForegroundPermissionsAsync } from "expo-location";
import { Image } from 'expo-image';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCallback } from 'react';

interface SightingData {
  image: string;
  type: string;
  species: string;
  description: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CameraScreen() {
  const router = useRouter();
  const [location, setLocation] = useState<LocationObject | null>(null);
  const [modalVisible, setModalVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  const [currentSighting, setCurrentSighting] = useState<SightingData | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setModalVisible(true);
    }, [])
  );

  const handleClose = () => {
    setModalVisible(false);
    setTimeout(() => {
      router.push('/');
    }, 300);
  };

  async function requestLocationPermission() {
    const { granted } = await requestForegroundPermissionsAsync();
    if (granted) {
      const currentPosition = await getCurrentPositionAsync();
      setLocation(currentPosition);
    }
  }

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setBase64Image(result.assets[0].base64);
      await requestLocationPermission();
      analyzeImage(result.assets[0].base64);
    }
  };

  const analyzeImage = async (base64Image: string) => {
    setLoading(true);
    
    try {
      const host = Constants.expoConfig?.hostUri?.split(':')[0];
      const response = await fetch(`http://${host}:9874/analyze-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image }),
      });

      const data = await response.json();
      
      if (data.error) {
        Alert.alert('Error', data.error);
        return;
      }

      setCurrentSighting({
        image: `data:image/jpeg;base64,${base64Image}`,
        type: data.analysis.type,
        species: data.analysis.species,
        description: data.analysis.description
      });
    } catch (error) {
      console.error('Error analyzing image:', error);
      Alert.alert('Error', 'Failed to analyze image');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!currentSighting || !base64Image) return;

    try {
      const host = Constants.expoConfig?.hostUri?.split(':')[0];
      const userInfo = await SecureStore.getItemAsync('userInfo');
      
      if (!userInfo) {
        Alert.alert('Error', 'User not logged in');
        return;
      }

      const response = await fetch(`http://${host}:9874/submit-sighting`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64Image,
          latitude: location?.coords.latitude,
          longitude: location?.coords.longitude,
          email: JSON.parse(userInfo).email,
          type: currentSighting.type,
          species: currentSighting.species,
          description: currentSighting.description
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit sighting');
      }

      Alert.alert('Success', 'Sighting submitted successfully!');
      setCurrentSighting(null);
      setBase64Image(null);
    } catch (error) {
      console.error('Error submitting sighting:', error);
      Alert.alert('Error', 'Failed to submit sighting');
    }
  };

  return (
    <View style={styles.container}>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleClose}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Pressable 
              onPress={handleClose}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#666" />
            </Pressable>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0a7ea4" />
                <ThemedText style={styles.loadingText}>Analyzing image...</ThemedText>
              </View>
            ) : (
              <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {currentSighting?.image ? (
                  <Image 
                    source={{ uri: currentSighting.image }} 
                    style={styles.image} 
                    contentFit="cover"
                    transition={200}
                  />
                ) : (
                  <View style={styles.emptyImageContainer}>
                    <IconSymbol name="camera.fill" size={40} color="#0a7ea4" />
                    <ThemedText style={styles.instructions}>
                      Take a photo or upload an image of wildlife to get started
                    </ThemedText>
                  </View>
                )}
                
                <View style={styles.contentContainer}>
                  <View style={styles.header}>
                    <ThemedText style={styles.species}>{currentSighting?.species || 'Unknown Species'}</ThemedText>
                    <ThemedText style={styles.type}>{currentSighting?.type || 'Upload an image to identify'}</ThemedText>
                  </View>

                  <View style={styles.descriptionContainer}>
                    <ThemedText style={styles.descriptionLabel}>About</ThemedText>
                    <ThemedText style={styles.description}>
                      {currentSighting?.description || 'A detailed description will appear here after you upload an image.'}
                    </ThemedText>
                  </View>

                  <View style={styles.buttonContainer}>
                    {currentSighting?.species && (
                      <Button onPress={handleSubmit} className="bg-primary w-full">
                        <ThemedText className="text-white">Submit Sighting</ThemedText>
                      </Button>
                    )}
                    <Button onPress={pickImage} variant="outline" className="w-full">
                      <ThemedText>Upload Image</ThemedText>
                    </Button>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    backgroundColor: 'white',
    borderRadius: 24,
    width: SCREEN_WIDTH - 32,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  scrollView: {
    width: '100%',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyImageContainer: {
    height: 300,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  instructions: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    maxWidth: '80%',
  },
  image: {
    width: '100%',
    height: 300,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  contentContainer: {
    padding: 24,
  },
  header: {
    marginBottom: 24,
  },
  species: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  type: {
    fontSize: 18,
    color: '#666',
    textTransform: 'capitalize',
  },
  descriptionContainer: {
    marginBottom: 32,
  },
  descriptionLabel: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#444',
  },
  buttonContainer: {
    gap: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
    padding: 8,
  },
}); 