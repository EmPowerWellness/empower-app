import React, { useEffect, useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { Surface, Text, Title, ActivityIndicator, Button, Icon } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { differenceInDays, format, parseISO } from 'date-fns';
import { GoogleGenerativeAI } from '@google/generative-ai';

const COLOR1 = '#0BA5A4';
const COLOR2 = '#651299';

const SummaryScreen = () => {
    const [report, setReport] = useState('');
    const [userRatings, setUserRatings] = useState([]);
    const [geminiScores, setGeminiScores] = useState([]);
    const [loading, setLoading] = useState(true);

    const [cachedReport, setCachedReport] = useState(null);
    const [shoundGenerate, setShouldGenerate] = useState(false);
    const [isReportExpired, setIsReportExpired] = useState(false);

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

                    // Add this before setting geminiScores:
                    const validatedScores = scores.sort(
                        (a, b) => parseISO(a.date) - parseISO(b.date)
                    );
                    // Update the userRatings mapping:
                    const validatedUserRatings = data.map(d => ({
                        value: d.rating,
                        date: d.date,
                        label: format(parseISO(d.date), 'MMM dd')
                    })).sort((a, b) => parseISO(a.date) - parseISO(b.date));

                    setReport(report);
                    setGeminiScores(validatedScores);
                    setUserRatings(validatedUserRatings);

                    // Modify the existing effect to save report after generation
                    // Inside the fetchDataAndGenerateReport function, after parsing the response:
                    const reportData = {
                        report,
                        scores: validatedScores,
                        userRatings: validatedUserRatings,
                        timestamp: new Date().toISOString()
                    };
                    await AsyncStorage.setItem('cachedReport', JSON.stringify(reportData));
                    setCachedReport(reportData);
                    setIsReportExpired(false);

                    setShouldGenerate(false);
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

        const loadCachedReport = async () => {
            try {
                const storedReport = await AsyncStorage.getItem('cachedReport');
                if (storedReport) {
                    const parsedReport = JSON.parse(storedReport);
                    const reportDate = parseISO(parsedReport.timestamp);
                    const daysOld = differenceInDays(new Date(), reportDate);

                    setCachedReport(parsedReport);
                    setIsReportExpired(daysOld > 7);
                    setLoading(false);
                }
                else {
                    setShouldGenerate(true);
                }
            } catch (error) {
                console.error('Failed to load cached report:', error);
            }
        };
        if (shoundGenerate) {
            fetchDataAndGenerateReport();
        }
        else {
            loadCachedReport();
        }
        
    }, [shoundGenerate]);

    // Add regeneration handler
    const handleRegenerate = async () => {
        setLoading(true);
        setCachedReport(null);
        setShouldGenerate(true);
        await AsyncStorage.removeItem('cachedReport');
    };

    if (loading) {
        return <ActivityIndicator style={{ flex: 1 }} />;
    }
    return (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
            {cachedReport && (
                <View style={{ alignItems: 'flex-end', marginBottom: 16 }}>
                    <Button
                        mode={isReportExpired ? 'contained' : 'outlined'}
                        onPress={handleRegenerate}
                        style={{ backgroundColor: isReportExpired ? '#ff4081' : undefined }}
                    >
                        Regenerate Report
                    </Button>
                    <Text style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                        Last generated: {format(parseISO(cachedReport.timestamp), 'MMM dd, yyyy - hh:mm a')}
                    </Text>
                </View>
            )}

            <Surface style={{ padding: 16, marginBottom: 16, borderRadius: 8, overflow: 'hidden' }}>
                <Title style={styles.titleText}>How you've felt last week</Title>
                <LineChart
                    curved
                    initialSpacing={20}
                    data={cachedReport ? cachedReport.userRatings : userRatings}
                    data2={cachedReport ? cachedReport.scores : geminiScores}
                    spacing={60}
                    thickness={2}
                    hideRules
                    showValuesAsDataPointsText
                    yAxisColor={COLOR1}
                    showVerticalLines
                    verticalLinesColor="rgba(14,164,164,0.5)"
                    xAxisColor={COLOR1}
                    color1={COLOR1}
                    color2={COLOR2}
                    dataPointsColor1={COLOR1}
                    dataPointsColor2={COLOR2}
                    maxValue={10}
                    xAxisLabelTexts={userRatings.map(r => format(parseISO(r.date), 'dd/MM'))} />
                    <View style={styles.legendKey}>
                        <Icon source="circle" color={COLOR1} size={10} />
                        <Text>Your Ratings</Text>
                    </View>
                    <View style={styles.legendKey}>
                        <Icon source="circle" color={COLOR2} size={10} />
                        <Text>Re-evaluated Ratings</Text>
                    </View>
            </Surface>

            <Surface style={{ padding: 16, marginBottom: 16, borderRadius: 8 }}>
                <Title style={styles.titleText}>Weekly Emotional Report</Title>
                <Text style={{ marginTop: 8 }}>{cachedReport ? cachedReport.report : report}</Text>
            </Surface>
        </ScrollView>
    );
};

export default SummaryScreen;


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 10,
        gap: 10,
    },
    titleText: {
        fontWeight: 'bold',
        marginBottom: 8,
    },
    legendKey: {
        flex:1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 10,
        marginTop: 8,
    }
});
