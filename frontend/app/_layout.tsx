import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import 'react-native-reanimated';
import 'global.css';

import { useColorScheme } from '@/hooks/useColorScheme';

export default function RootLayout() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // const router = useRouter();

  // useEffect(() => {
  //   if (loaded) {
  //     SplashScreen.hideAsync();
  //   }
  //   checkAuth();
  // }, [loaded, router]);

  // const checkAuth = async () => {
  //   const userInfo = await AsyncStorage.getItem('userInfo');
  //   if (!userInfo) {
  //     router.replace('/auth');
  //   }
  // };

  // if (!loaded) {
  //   return null;
  // }

  // Check for user info in SecureStore and redirect to /auth if not found.
  useEffect(() => {
    async function checkAuth() {
      try {
        const userInfo = await SecureStore.getItemAsync('userInfo');
        if (!userInfo) {
          router.replace('/');
        }
      } catch (error) {
        console.error('Error retrieving user info:', error);
        router.replace('/');
      }
    }
    checkAuth();
  }, [router]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="/" options={{ headerShown: false }} />
        <Stack.Screen name="/home" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="species/[id]" 
          options={{ 
            headerShown: true,
            headerTitle: "Species Details",
            headerBackTitle: "Back",
          }} 
        />
        <Stack.Screen
            name="species/specie/[sId]"
            options={{
              headerShown: true,
              headerTitle: "Specie Detail",
              headerBackTitle: "Back",
            }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
