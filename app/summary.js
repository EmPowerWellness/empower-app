import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { Surface, Text, Title, ActivityIndicator } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { subDays, format, parseISO } from 'date-fns';
import { GoogleGenerativeAI } from '@google/generative-ai';

const SummaryScreen = () => {
    const [report, setReport] = useState('');
    const [userRatings, setUserRatings] = useState([]);
    const [geminiScores, setGeminiScores] = useState([]);
    const [loading, setLoading] = useState(true);

    const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_API_KEY);

    useEffect(() => {
        const fetchDataAndGenerateReport = async () => {
            try {
                // Get last 7 days dates
                const dates = JSON.parse(await AsyncStorage.getItem('dates')) || [];
                const sortedDates = [...dates].sort((a, b) => a.localeCompare(b)); // Add sorting
                const last7Days = sortedDates.slice(-7);

                // Fetch responses and ratings for these dates
                const data = await Promise.all(last7Days.map(async (date) => {
                    const responses = JSON.parse(await AsyncStorage.getItem(`responses_${date}`)) || [];
                    const rating = parseInt(await AsyncStorage.getItem(`rating_${date}`)) || 0;
                    return { date, responses, rating };
                }));

                // console.log('Raw Gemini Response:', data);

                // Prepare data for Gemini
                const prompt = `Analyze this mental health data, reevaluate the scores provided by user, keeping the responses in mind and respond ONLY with valid JSON containing:
1. "report": "A comprehensive emotional well-being report (200 words)",
2. "scores": [{"date": "yyyy-MM-dd", "value": number}] 

Data:
${data.map(day => `
  Date: ${day.date}
  Rating: ${day.rating}
  Responses: ${day.responses.map(r => `${r.question}: ${r.answer}`).join('\n')}
`).join('\n')}

JSON Response:`;


                // console.log('Prompt:', prompt);

                // Get Gemini response
                const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();

                // Clean the response text
                const cleanText = text
                    .replace(/```json/g, '') // Remove markdown code blocks
                    .replace(/```/g, '')
                    .trim();

                // Remove control characters
                const sanitizedText = cleanText.replace(/[\u0000-\u001F]/g, '');

                // console.log('Raw Gemini Response:', text);
                // console.log('Sanitized Text:', sanitizedText);

                try {
                    const { report, scores } = JSON.parse(sanitizedText);

                    // After parsing, validate the structure
                    if (!report || !scores?.length) {
                        throw new Error('Invalid response structure from Gemini');
                    }
                    
                    setReport(report);
                    // Add this before setting geminiScores:
                    const validatedScores = scores.sort(
                        (a, b) => parseISO(a.date) - parseISO(b.date)
                    );
                    setGeminiScores(scores);
                    // Update the userRatings mapping:
                    setUserRatings(data.map(d => ({
                        value: d.rating,
                        date: d.date,
                        label: format(parseISO(d.date), 'MMM dd')
                    })).sort((a, b) => parseISO(a.date) - parseISO(b.date)));
                    setLoading(false);
                } catch (parseError) {
                    console.error('Failed to parse JSON:', sanitizedText, parseError);
                    setReport('Failed to generate report. Data might be insufficient or format is unexpected.');
                    setLoading(false);

                }
                
            } catch (error) {
                console.error(error);
                setLoading(false);
            }
        };

        fetchDataAndGenerateReport();
    }, []);

    if (loading) {
        return <ActivityIndicator style={{ flex: 1 }} />;
    }
    return (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
            <Surface style={{ padding: 16, marginBottom: 16, borderRadius: 8 }}>
                <Title>Weekly Emotional Report</Title>
                <Text style={{ marginTop: 8 }}>{report}</Text>
            </Surface>

            <Surface style={{ padding: 16, marginBottom: 16, borderRadius: 8, overflow:'hidden' }}>
                <Title>How you've felt last week</Title>
                <LineChart
                    curved
                    initialSpacing={20}
                    data={userRatings}
                    data2={geminiScores}
                    spacing={60}
                    thickness={2}
                    hideRules
                    showValuesAsDataPointsText
                    yAxisColor="#0BA5A4"
                    showVerticalLines
                    verticalLinesColor="rgba(14,164,164,0.5)"
                    xAxisColor="#0BA5A4"
                    color1="#0BA5A4"
                    color2="#651299"
                    dataPointsColor1='#0BA5A4'
                    dataPointsColor2='#651299'
                    maxValue={10}
                    xAxisLabelTexts={userRatings.map(r => format(parseISO(r.date), 'dd/MM'))} />
                    
            </Surface>
        </ScrollView>
    );
};

export default SummaryScreen;