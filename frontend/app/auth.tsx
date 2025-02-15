import { StyleSheet, View, Image } from 'react-native';
import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as Google from 'expo-auth-session/providers/google';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function Auth() {
  const router = useRouter();
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: 'YOUR_ANDROID_CLIENT_ID',
    iosClientId: 'YOUR_IOS_CLIENT_ID',
    webClientId: 'YOUR_WEB_CLIENT_ID',
  });

  useEffect(() => {
    handleSignInResponse();
  }, [response]);

  const handleSignInResponse = async () => {
    if (response?.type === 'success') {
      try {
        const { authentication } = response;
        const host = Constants.expoConfig?.hostUri?.split(':')[0];
        
        const backendResponse = await fetch(`http://${host}:9874/auth/google`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: authentication?.accessToken,
          }),
        });

        if (!backendResponse.ok) {
          throw new Error('Authentication failed');
        }

        const { sessionToken } = await backendResponse.json();
        
        await SecureStore.setItemAsync('sessionToken', sessionToken);
        
        router.replace('/(tabs)');
      } catch (error) {
        console.error('Authentication error:', error);
      }
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Image 
        style={styles.logo} 
        source={require('@/assets/images/icon.png')} 
      />
      <ThemedText style={styles.title}>Welcome</ThemedText>
      <ThemedText 
        style={styles.button}
        onPress={() => promptAsync()}
      >
        Sign in with Google
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  button: {
    padding: 15,
    backgroundColor: '#0a7ea4',
    color: 'white',
    borderRadius: 5,
    overflow: 'hidden',
  }
}); 