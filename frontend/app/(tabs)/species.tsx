import { View, Text, StyleSheet } from 'react-native';

export default function SpeciesScreen() {
  return (
    <View style={styles.container}>
      <Text>Species Screen</Text>
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