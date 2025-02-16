import { StyleSheet, View, Image, Platform, Pressable, Text } from 'react-native';
import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as Google from 'expo-auth-session/providers/google';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import * as WebBrowser from 'expo-web-browser';       
import { makeRedirectUri } from 'expo-auth-session';
import { LinearGradient } from 'expo-linear-gradient';
import { AntDesign } from '@expo/vector-icons';

export default function Auth() {
  const router = useRouter();

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
        console.log('Access token:', authentication?.accessToken);

        const host = Platform.select({
          web: 'localhost',
          default: Constants.expoConfig?.hostUri?.split(':')[0]
        });
        
        const url = `http://${host}:9874/auth/google`;

        const backendResponse = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: authentication?.accessToken }),
        });

        if (!backendResponse.ok) {
          const errorData = await backendResponse.json();
          console.error('Backend error:', errorData);
          throw new Error(errorData.error || 'Authentication failed');
        }

        const { sessionToken, user } = await backendResponse.json();
        await SecureStore.setItemAsync('sessionToken', sessionToken);
        await SecureStore.setItemAsync('userInfo', JSON.stringify(user));

        router.replace('/home');
      } catch (error) {
        console.log('Authentication error:', error);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Climacs</Text>
      <View style={styles.content}>
        <Image style={styles.logo} source={require('@/assets/images/climacs.png')} />
        <Text style={styles.title}>Sign in to continue</Text>
        <Pressable style={styles.button} onPress={() => promptAsync()}>
          <AntDesign name="google" size={20} color="#EA4335" style={styles.googleIcon} />
          <Text style={styles.buttonText}>Sign in with Google</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6DBD6D',
    paddingHorizontal: 20,
  },
  header: {
    fontSize: 64,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 40,
    textAlign: 'center',
  },
  content: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    width: '100%',
    maxWidth: 350,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
    tintColor: 'white'
  },
  title: {
    marginTop: 40,
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 40,
    textAlign: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
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
  },
  googleIcon: {
    marginRight: 12,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
});
