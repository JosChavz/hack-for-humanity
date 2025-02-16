import { View, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { Card, CardHeader, CardTitle } from '~/components/ui/card';

export default function SpeciesScreen() {
  return (
    <View style={styles.container}>
      <Link href="/species/1">
        <Card className="w-full mb-4">
          <CardHeader style={{ backgroundColor: '#2D3250', borderRadius: 12 }}>
            <CardTitle className="text-white">Animals</CardTitle>
          </CardHeader>
        </Card>
      </Link>

      <Link href="/species/2">
        <Card className="w-full mb-4">
          <CardHeader style={{ backgroundColor: '#424769', borderRadius: 12 }}>
            <CardTitle className="text-white">Birds</CardTitle>
          </CardHeader>
        </Card>
      </Link>

      <Link href="/species/3" >
        <Card className="w-full mb-4">
          <CardHeader style={{ backgroundColor: '#7077A1', borderRadius: 12 }}>
            <CardTitle className="text-white">Plants</CardTitle>
          </CardHeader>
        </Card>
      </Link>

      <Link href="/species/4">
        <Card className="w-full mb-4">
          <CardHeader style={{ backgroundColor: '#576CBC', borderRadius: 12 }}>
            <CardTitle className="text-white">Insects</CardTitle>
          </CardHeader>
        </Card>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  }
});
