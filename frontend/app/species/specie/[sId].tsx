import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image as ExpoImage } from 'expo-image';
import { ThemedText } from '@/components/ThemedText';
import Constants from "expo-constants";
import {Icon} from "react-native-elements";

interface SpeciesItem {
    id: string;
    image: string;
    species: string;
    location: string;
    latest_time: string;
    frequency: number;
}

export default function IndividualSpeciesDetail() {
    const params = useLocalSearchParams();
    console.log(params)

    return (
        <ScrollView style={styles.container} className={'px-4'}>
            <View className='relative mt-4'>
                <ExpoImage
                    source={{ uri: params.image }}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    transition={200}
                    className={'w-full'}
                    style={styles.image}
                    onError={(error) => {
                        console.error('Image loading error:', error);
                        console.log('Failed URL:', params.image);
                    }}
                    placeholder={require('../../../assets/images/favicon.png')}
                />
                <View className={'absolute bottom-0 px-4 blur-2xl bg-stone-950/25 w-[400px]'}>
                    <Text className={'text-2xl font-bold my-8 text-white'}>{params.species}</Text>
                    <View className={'flex-row items-center gap-2 mb-8'}>
                        <Icon name={'pin-drop'} color={'white'} />
                        <Text className={'text-lg text-white'}>{params.location}</Text>
                    </View>
                </View>
            </View>

            <Text className={'text-2xl font-bold mt-8 mb-4'}>Overview</Text>

            <View className={'flex-row items-center gap-2 mb-8'}>
                <View className={'bg-[#EDEDED] p-4 rounded-md'}>
                    <Icon name={'access-time-filled'} color={'#3F3F3F'} />
                </View>
                <Text>{params.frequency} found in your area.</Text>
            </View>

            <Text>
                {params.description}
            </Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerImage: {
        width: '100%',
        height: 300,
    },
    content: {
        padding: 16,
    },
    image: {
        width: 400,
        height: 400 ,
        borderRadius: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
    },
});