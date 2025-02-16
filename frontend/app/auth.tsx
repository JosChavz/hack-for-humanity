import { StyleSheet, View, Image } from 'react-native';
import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as Google from 'expo-auth-session/providers/google';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import * as WebBrowser from 'expo-web-browser';       
import { makeRedirectUri } from 'expo-auth-session';

export default function Auth() {
  const router = useRouter();

  // Create a redirectUri that points back to the app and stays in the same tab.
  WebBrowser.maybeCompleteAuthSession();

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: "766337482799-gnrqdh1dqdf7k42nv48g2sipprj2emsb.apps.googleusercontent.com",
    webClientId: "766337482799-l6rqqhjb7ujb4kvp3rdiof9jiepboo7b.apps.googleusercontent.com",
    scopes: ['profile', 'email']
  });

  useEffect(() => {
    if (response) {
      handleSignInResponse();
    }
  }, [response]);

  const handleSignInResponse = async () => {
    if (response?.type === 'success') {
      try {
        const { authentication } = response;
        const backendResponse = await fetch('http://localhost:9874/auth/google', {
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

        const { sessionToken, user } = await backendResponse.json();

        await SecureStore.setItemAsync('sessionToken', sessionToken);
        await SecureStore.setItemAsync('userInfo', JSON.stringify(user));

        console.log("User info:", user);
        router.replace('/(tabs)');
      } catch (error) {
        console.log('Authentication error:', error);
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