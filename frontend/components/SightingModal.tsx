import React from 'react';
import { Modal, View, StyleSheet, ActivityIndicator, ScrollView, Dimensions, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { ThemedText } from './ThemedText';
import { Button } from './ui/button';
import { IconSymbol } from './ui/IconSymbol';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface SightingModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  onSelectImage: () => Promise<void>;
  loading: boolean;
  sighting: {
    image: string;
    type: string;
    species: string;
    description: string;
  } | null;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function SightingModal({ visible, onClose, onSubmit, onSelectImage, loading, sighting }: SightingModalProps) {
  const router = useRouter();

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      router.push('/');
    }, 300);
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
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
              {sighting?.image ? (
                <Image 
                  source={{ uri: sighting.image }} 
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
                  <ThemedText style={styles.species}>{sighting?.species || 'Unknown Species'}</ThemedText>
                  <ThemedText style={styles.type}>{sighting?.type || 'Upload an image to identify'}</ThemedText>
                </View>

                <View style={styles.descriptionContainer}>
                  <ThemedText style={styles.descriptionLabel}>About</ThemedText>
                  <ThemedText style={styles.description}>
                    {sighting?.description || 'A detailed description will appear here after you upload an image.'}
                  </ThemedText>
                </View>

                <View style={styles.buttonContainer}>
                  {sighting?.species && (
                    <Button onPress={onSubmit} className="bg-primary w-full">
                      <ThemedText className="text-white">Submit Sighting</ThemedText>
                    </Button>
                  )}
                  <Button onPress={onSelectImage} variant="outline" className="w-full">
                    <ThemedText>Upload Image</ThemedText>
                  </Button>
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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