import { StyleSheet, View, Image, Platform } from 'react-native';
import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as Google from 'expo-auth-session/providers/google';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import {Text} from "~/components/ui/text";
import {H1, H2} from "~/components/ui/typography";
import {Button} from "~/components/ui/button";
import {Input} from "~/components/ui/input";

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
        console.log('Full response:', response);
        console.log('Authentication object:', authentication);
        console.log('Access token:', authentication?.accessToken);

        const host = Platform.select({
          web: 'localhost',
          default: Constants.expoConfig?.hostUri?.split(':')[0]
        });
        
        console.log('Using host:', host);
        const url = `http://${host}:9874/auth/google`;
        console.log('Calling backend URL:', url);

        const backendResponse = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: authentication?.accessToken,
          }),
        });

        // Add error logging
        if (!backendResponse.ok) {
          const errorData = await backendResponse.json();
          console.error('Backend error:', errorData);
          throw new Error(errorData.error || 'Authentication failed');
        }

        const { sessionToken, user } = await backendResponse.json();

        await SecureStore.setItemAsync('sessionToken', sessionToken);
        await SecureStore.setItemAsync('userInfo', JSON.stringify(user));

        console.log("User info:", user);
        router.replace('/(tabs)');
      } catch (error) {
        console.log('Authentication error details:', error);
      }
    }
  };

  return (
    <View style={styles.container} className={'px-14 py-16 bg-[#EAFFF24D]'}>
      <H1 className={'mt-4'}>CLIMACS</H1>
      <View className={'px-4 py-6 bg-[#F5FFF5] rounded-lg my-6'}>
        <Text className={'text-lg font-black no-underline'}>SCAN, LEARN, and PROTECT</Text>
      </View>

      {/* Log In that does not work lol */}
      <View className={'my-8 gap-4'}>
        <Text className={'font-bold m-auto'}>Log in</Text>

        <Input
            placeholder='Email'
            aria-labelledby='inputLabel'
            aria-errormessage='inputError'
            className={'bg-[#2E5E49] placeholder:text-white'}
        />
        <Input
            placeholder='Password'
            aria-labelledby='inputLabel'
            aria-errormessage='inputError'
            className={'bg-[#2E5E49] placeholder:text-white'}
        />
      </View>

      <Text className={'mx-auto'}>or</Text>

      <View className={'my-8 gap-4'}>
        <Button
            size={'lg'}
            className={'bg-white rounded-lg flex flex-row gap-8 items-center justify-center'}
            onPress={() => promptAsync()}
        >
          <Image className={'w-[32px] h-[32px]'} source={require('assets/images/facebook-icon.png')} />
          <Text className={'text-black'}>Sign in with Facebook</Text>
        </Button>

        <Button
            size={'lg'}
            className={'bg-white rounded-lg flex flex-row gap-8 items-center justify-center'}
            onPress={() => promptAsync()}
        >
          <Image className={'w-[32px] h-[32px]'} source={require('assets/images/apple.png')} />
          <Text className={'text-black'}>Sign in with Apple</Text>
        </Button>

        <Button
            size={'lg'}
            className={'bg-white rounded-lg flex flex-row gap-8 items-center justify-center'}
            onPress={() => promptAsync()}
        >
          <Image className={'w-[32px] h-[32px]'} source={require('assets/images/google-icon.png')} />
          <Text className={'text-black'}>Sign in with Google</Text>
        </Button>
      </View>

      <Text className={'text-sm mt-auto mb-4'}>
        By logging in with your Google, Apple, Facebook, or Microsoft account, you agree to: the Climacs Terms and Conditions and the Climacs Privacy Policy BedBooking.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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