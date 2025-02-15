import {View} from "react-native";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "~/components/ui/card";
import { Text } from "~/components/ui/text";

export default function Index() {

    return (
        <View className={'py-4'} style={{ flex: 1 }}>
            <Card className='w-full max-w-sm'>
                <CardHeader>
                    <CardTitle>Card Title</CardTitle>
                    <CardDescription>Card Description</CardDescription>
                </CardHeader>
                <CardContent>
                    <Text>Card Content</Text>
                </CardContent>
                <CardFooter>
                    <Text>Card Footer</Text>
                </CardFooter>
            </Card>
        </View>
    );
}