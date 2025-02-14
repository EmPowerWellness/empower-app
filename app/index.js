import { GoogleGenerativeAI } from '@google/generative-ai';
import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { BarChart, LineChart } from 'react-native-gifted-charts';

export default function App() {
    const [prompt, setPrompt] = useState();
    const [text, setText] = useState('--something--');

    const barData = [
        { value: 250, label: 'M' },
        { value: 500, label: 'T', frontColor: '#177AD5' },
        { value: 745, label: 'W', frontColor: '#177AD5' },
        { value: 320, label: 'T' },
        { value: 600, label: 'F', frontColor: '#177AD5' },
        { value: 256, label: 'S' },
        { value: 300, label: 'S' },
    ];

    const handleClick = async () => {
        console.log('clicked [start]');
        setText(runPrompt(prompt));
        console.log('.. prompt end');
    };

    return (
        <View style={styles.container}>
            <BarChart
                
                barWidth={22}
                barBorderRadius={4}
                frontColor="lightgray"
                data={barData}
                yAxisThickness={0}
                xAxisThickness={0}
            />
            <LineChart
                curved
                initialSpacing={0}
                data={barData}
                spacing={50}
                hideDataPoints
                thickness={5}
                hideRules
                hideYAxisText
                yAxisColor="#0BA5A4"
                showVerticalLines
                verticalLinesColor="rgba(14,164,164,0.5)"
                xAxisColor="#0BA5A4"
                color="#0BA5A4"
            />
            <Link href="/journal">Journal</Link>
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
