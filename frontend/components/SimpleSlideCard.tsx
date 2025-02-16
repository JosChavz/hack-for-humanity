import Animated, {
    useAnimatedStyle,
    withSpring,
    useSharedValue
} from 'react-native-reanimated';
import {View, Text} from "react-native";

const SimpleSlideCard = () => {
    const translateY = useSharedValue(0);

    const cardStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: withSpring(translateY.value) }],
    }));

    return (
        <Animated.View
            style={cardStyle}
            className="absolute bottom-0 w-full bg-white rounded-t-3xl p-4 shadow-lg"
        >
            <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-4" />
            <Text className="text-lg font-bold">Card Title</Text>
            {/* Card content */}
        </Animated.View>
    );
};