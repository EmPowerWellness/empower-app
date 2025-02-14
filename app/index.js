import { GoogleGenerativeAI } from '@google/generative-ai';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';

export default function App() {
    const [prompt, setPrompt] = useState();
    const [text, setText] = useState('--something--');

    const handleClick = async() => {
        console.log('clicked [start]');
        setText(runPrompt(prompt));
        console.log('.. prompt end');
    };

    return (
        <View style={styles.container}>
            <TextInput
                placeholder='enter prompt'
                value={prompt}
                onChangeText={setPrompt} />
            <Button
                title='click here'
                onPress={handleClick}
            />
            <Text>heres something: {text}</Text>
            <StatusBar style="auto" />
        </View>
    );
}

const runPrompt = async (prompt) => {
    try {
        const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_API_KEY); // Replace with your actual API key
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const result = await model.generateContent(prompt);

        // Adjust according to the actual response structure
        return result.response.text();
    } catch (error) {
        console.error('Error fetching data:', error);
        // Alert.alert('Summary fetch error', 'Error fetching data, please try again');
        return;
    }
    // finally {
    //     setLoading(false);
    // }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
