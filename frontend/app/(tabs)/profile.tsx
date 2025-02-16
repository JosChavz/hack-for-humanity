import { View, Text, StyleSheet, Pressable } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Button } from "~/components/ui/button";
import { useRouter } from "expo-router";
import { useEffect, useState } from 'react';
import { Avatar } from "react-native-elements";

export default function ProfileScreen() {
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

  const logout = async () => {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync('sessionToken'),
        SecureStore.deleteItemAsync('userInfo')
      ]);

      router.replace('/');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{userInfo?.name || "User"}</Text>
      <View style={styles.content}>
        <Avatar
          rounded
          size="xlarge"
          containerStyle={styles.avatar}
          source={{ uri: userInfo?.profilePicture || undefined }}
          icon={!userInfo?.profilePicture ? { name: 'user', type: 'font-awesome', color: 'gray' } : undefined}
        />
        <Text style={styles.contributions}>
          Thank you for your {userInfo?.contributionNumber ?? 0} contributions! 🎉
        </Text>

        <Pressable style={styles.button} onPress={logout}>
          <Text style={styles.buttonText}>Logout</Text>
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
    fontSize: 64,
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
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
});
