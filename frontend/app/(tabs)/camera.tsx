import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import { useEffect, useRef, useState } from "react";
import { Alert, Button, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { FontAwesome6 } from "@expo/vector-icons";
import Constants from "expo-constants";
import { getCurrentPositionAsync, LocationObject, requestForegroundPermissionsAsync } from "expo-location";

export default function CameraScreen() {
  const ref = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [uri, setUri] = useState<string | null>(null);
  const [facing, setFacing] = useState<CameraType>("back");
  const [location, setLocation] = useState<LocationObject | null>(null);

   async function requestLocationPermission() { 
      const {granted} = await requestForegroundPermissionsAsync();
  
      if(granted) {
          const currentPosition = await getCurrentPositionAsync();
          setLocation(currentPosition);
  
        }
   }
   useEffect(()=> {
    requestLocationPermission();
  }, []);


  if (!permission) {
    return null;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: "center" }}>
          We need your permission to use the camera
        </Text>
        <Button onPress={requestPermission} title="Grant permission" />
      </View>
    );
  }

  const takePicture = async () => {
    const photo = await ref.current?.takePictureAsync({ base64: true });
    if (photo?.base64) {
      setUri(`data:image/jpeg;base64,${photo.base64}`);
      uploadImage(photo.base64)
    }
  };

  const uploadImage = async (base64Image: string) => {
    try {
      const host = Constants.expoConfig?.hostUri?.split(':')[0];
      const response = await fetch(`http://${host}:9874/upload-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image, latitude: location?.coords.latitude, longitude: location?.coords.latitude, email: "aostrom@ucsc.edu" }),
      });

      const data = await response.json();
      Alert.alert('Sighting uploaded!', `It looks like you saw a ${data.species}`);
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const toggleFacing = () => {
    setFacing((prev) => (prev === "back" ? "front" : "back"));
  };

  const renderPicture = () => {
    return (
      <View>
        <Image
          source={{ uri }}
          contentFit="contain"
          style={{ width: 300, aspectRatio: 1 }}
        />
        <Button onPress={() => setUri(null)} title="Take another picture" />
      </View>
    );
  };

  const renderCamera = () => {
    return (
      <CameraView
        style={styles.camera}
        ref={ref}
        mode={'picture'}
        facing={facing}
        mute={false}
        responsiveOrientationWhenOrientationLocked
      >
        <View style={styles.shutterContainer}>
          <View style={{ width: 50 }}>
          <Text style={{ color: "white", fontSize: 14, textAlign: "center" }}>Please center object</Text>
          </View>
          <Pressable onPress={takePicture}>
            {({ pressed }) => (
              <View
                style={[
                  styles.shutterBtn,
                  {
                    opacity: pressed ? 0.5 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.shutterBtnInner,
                    {
                      backgroundColor: "white"
                    },
                  ]}
                />
              </View>
            )}
          </Pressable>
          <Pressable onPress={toggleFacing}>
            <FontAwesome6 name="rotate-left" size={32} color="white" />
          </Pressable>
        </View>
      </CameraView>
    );
  };

  return (
    <View style={styles.container}>
      {uri ? renderPicture() : renderCamera()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 60,
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  camera: {
    flex: 1,
    width: "100%",
  },
  shutterContainer: {
    position: "absolute",
    bottom: 44,
    left: 0,
    width: "100%",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 30,
  },
  shutterBtn: {
    backgroundColor: "transparent",
    borderWidth: 5,
    borderColor: "white",
    width: 85,
    height: 85,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterBtnInner: {
    width: 70,
    height: 70,
    borderRadius: 50,
  },
}); 