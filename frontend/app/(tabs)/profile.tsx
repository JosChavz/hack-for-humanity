import { View, Text, StyleSheet } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import {Button} from "~/components/ui/button";
import {useRouter} from "expo-router";

export default function ProfileScreen() {
  const router = useRouter();

  const logout = async () => {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync('sessionToken'),
        SecureStore.deleteItemAsync('userInfo')
      ]);

      router.replace('/auth');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text>Profile Screen</Text>
      <Button variant={'outline'} onPress={logout}>
        <Text>Logout</Text>
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 