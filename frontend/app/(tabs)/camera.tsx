import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import Constants from "expo-constants";
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { Button } from "~/components/ui/button";
import { getCurrentPositionAsync, LocationObject, requestForegroundPermissionsAsync } from "expo-location";

export default function CameraScreen() {
  const [uri, setUri] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationObject | null>(null);

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
      setUri(`data:image/jpeg;base64,${result.assets[0].base64}`);
      const userInfo = await SecureStore.getItemAsync('userInfo');
      if (!userInfo) {
        Alert.alert('Error', 'User not logged in');
        return;
      }
      await requestLocationPermission();
      uploadImage(result.assets[0].base64);
    }
  };

  const uploadImage = async (base64Image: string) => {
    try {
      const host = Constants.expoConfig?.hostUri?.split(':')[0];
      const response = await fetch(`http://${host}:9874/upload-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          image: base64Image, 
          latitude: location?.coords.latitude, 
          longitude: location?.coords.longitude,
          email: JSON.parse(await SecureStore.getItemAsync('userInfo') || '{}').email 
        }),
      });

      const data = await response.json();
      Alert.alert('Sighting uploaded!', `It looks like you saw a ${data.species}`);
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image');
    }
  };

  const renderImage = () => {
    return (
      <View>
        <Image
          source={{ uri }}
          contentFit="contain"
          style={{ width: 300, aspectRatio: 1 }}
        />
        <Button onPress={() => setUri(null)} className="mt-4">
          <Text className="text-white">Upload another image</Text>
        </Button>
      </View>
    );
  };

  const renderUploadButton = () => {
    return (
      <View style={styles.uploadContainer}>
        <Text style={styles.instructions}>
          Upload an image of wildlife to identify the species
        </Text>
        <Button onPress={pickImage} className="mt-4">
          <Text className="text-white">Select Image</Text>
        </Button>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {uri ? renderImage() : renderUploadButton()}
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
  uploadContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  instructions: {
    textAlign: "center",
    marginBottom: 20,
    color: "#666",
  },
}); 