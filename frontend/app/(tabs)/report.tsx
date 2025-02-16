import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from "expo-router";
import { useEffect, useState } from 'react';
import { Avatar } from "react-native-elements";
import { IconSymbol } from '~/components/ui/IconSymbol';
import { getCurrentPositionAsync, LocationObject, requestForegroundPermissionsAsync } from 'expo-location';
import Constants from 'expo-constants';

export default function ReportScreen() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<any | null>(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      const storedUserInfo = await SecureStore.getItemAsync('userInfo');
      if (storedUserInfo) {
        setUserInfo(JSON.parse(storedUserInfo));
      }
    };

    fetchUserInfo();
  }, []);

  const [location, setLocation] = useState<LocationObject | null>(null);

  useEffect(() => {
   async function requestLocationPermission() { 
      const { granted } = await requestForegroundPermissionsAsync();
      if (granted) {
        const currentPosition = await getCurrentPositionAsync();
        setLocation(currentPosition);
      }
    }
    requestLocationPermission();
  }, []);

  const submitReport = async (reportType: string) => {
   if (!location) {
     Alert.alert("Error", "Unable to retrieve location. Try again.");
     return;
   }

   if (!userInfo || !userInfo.email) {
     Alert.alert("Error", "User info not found.");
     return;
   }

   try {
      const host = Constants.expoConfig?.hostUri?.split(':')[0];
     const response = await fetch(`http://${host}:9874/submit-report`, {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
       },
       body: JSON.stringify({
         report_type: reportType,
         latitude: location.coords.latitude,
         longitude: location.coords.longitude,
         email: userInfo.email,
       }),
     });

     const result = await response.json();
     if (response.ok) {
       Alert.alert("Success", "Report submitted successfully!");
     } else {
       Alert.alert("Error", result.error || "Something went wrong.");
     }
   } catch (error) {
     console.error('Error submitting report:', error);
     Alert.alert("Error", "Failed to submit the report.");
   }
 };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Make a Report</Text>
      <View style={styles.content}>
        <Text style={styles.contributions}>Select from the options to alert others in the area</Text>

        <Pressable style={styles.button} onPress={() => submitReport('Fire')}>
          <IconSymbol size={28} name="flame.fill" color='black' />
          <Text style={styles.buttonText}>Fire</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={() => submitReport('Tsunami')}>
          <IconSymbol size={28} name="tropicalstorm" color='black' />
          <Text style={styles.buttonText}>Tsunami</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={() => submitReport('Earthquake')}>
          <IconSymbol size={28} name="tornado" color='black' />
          <Text style={styles.buttonText}>Earthquake</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={() => submitReport('Storm')}>
          <IconSymbol size={28} name="cloud.bolt.rain.fill" color='black' />
          <Text style={styles.buttonText}>Storm</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    marginTop: 20,
    // justifyContent: 'center',
    paddingHorizontal: 20,
  },
  header: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 40,
    textAlign: 'center',
  },
  content: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    width: '100%',
    maxWidth: 350,
  },
  avatar: {
    marginBottom: 20,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  contributions: {
    fontSize: 18,
    marginBottom: 30,
    textAlign: 'center',
  },
  button: {
    backgroundColor: 'white',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
});
