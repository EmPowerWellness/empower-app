import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Text, TextInput, Button, Dialog, Portal, Provider } from 'react-native-paper';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';

// A fixed set of questions that can be asked.
const QUESTIONS = [
    "What is on your mind?",
    "How are you feeling today?",
    "What is your biggest challenge right now?",
    "What are you grateful for?",
];

const DailyQuestionsPage = () => {
    // Today’s key for storage (responses and rating are reset each day)
    const today = format(new Date(), 'yyyy-MM-dd');
    const responsesKey = `responses_${today}`;
    const ratingKey = `rating_${today}`;

    // Local state
    const [responses, setResponses] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [answer, setAnswer] = useState('');
    const [rating, setRating] = useState(5); // default mid-value rating
    const [loading, setLoading] = useState(true);

    // For editing an existing response:
    const [editDialogVisible, setEditDialogVisible] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);
    const [editingAnswer, setEditingAnswer] = useState('');

    // Load saved responses and rating for today
    useEffect(() => {
        const loadData = async () => {
            try {
                const storedResponses = await AsyncStorage.getItem(responsesKey);
                if (storedResponses !== null) {
                    setResponses(JSON.parse(storedResponses));
                }
                const storedRating = await AsyncStorage.getItem(ratingKey);
                if (storedRating !== null) {
                    setRating(Number(storedRating));
                }
            } catch (error) {
                console.error("Error loading data", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [responsesKey, ratingKey]);

    // Pick a random question from those not answered yet today
    useEffect(() => {
        const answeredQuestions = responses.map(r => r.question);
        const remainingQuestions = QUESTIONS.filter(q => !answeredQuestions.includes(q));
        if (remainingQuestions.length > 0) {
            const randomQuestion = remainingQuestions[Math.floor(Math.random() * remainingQuestions.length)];
            setCurrentQuestion(randomQuestion);
        } else {
            setCurrentQuestion(null);
        }
    }, [responses]);

    // Save a new response
    const submitAnswer = async () => {
        if (!answer.trim() || !currentQuestion) return;

        const newResponse = {
            question: currentQuestion,
            answer: answer.trim(),
            timestamp: new Date().toISOString(),
        };
        const updatedResponses = [...responses, newResponse];
        setResponses(updatedResponses);
        setAnswer('');
        try {
            await AsyncStorage.setItem(responsesKey, JSON.stringify(updatedResponses));
        } catch (error) {
            console.error("Error saving response", error);
        }
    };

    // Update rating (called when slider stops sliding)
    const updateRating = async (newRating) => {
        setRating(newRating);
        try {
            await AsyncStorage.setItem(ratingKey, String(newRating));
        } catch (error) {
            console.error("Error saving rating", error);
        }
    };

    // Open the edit dialog for a specific response
    const openEditDialog = (index) => {
        setEditingIndex(index);
        setEditingAnswer(responses[index].answer);
        setEditDialogVisible(true);
    };

    // Save the edited response
    const saveEdit = async () => {
        const updatedResponses = responses.map((item, index) => {
            if (index === editingIndex) {
                return {
                    ...item,
                    answer: editingAnswer,
                    edited: true,
                    editedAt: new Date().toISOString(),
                };
            }
            return item;
        });
        setResponses(updatedResponses);
        setEditDialogVisible(false);
        try {
            await AsyncStorage.setItem(responsesKey, JSON.stringify(updatedResponses));
        } catch (error) {
            console.error("Error saving edited response", error);
        }
    };

    // Render each response in the FlatList
    const renderResponse = ({ item, index }) => (
        <View style={styles.responseItem}>
            <Text style={styles.responseQuestion}>{item.question}</Text>
            <Text style={styles.responseAnswer}>{item.answer}</Text>
            <Button mode="text" onPress={() => openEditDialog(index)}>
                Edit
            </Button>
        </View>
    );

    return (
        <Provider>
            <View style={styles.container}>
                {currentQuestion && (
                    <View style={styles.questionSection}>
                        <Text style={styles.questionText}>{currentQuestion}</Text>
                        <TextInput
                            label="Your answer"
                            value={answer}
                            onChangeText={setAnswer}
                            multiline
                            style={styles.textInput}
                        />
                        <Button mode="contained" onPress={submitAnswer} style={styles.submitButton}>
                            Submit
                        </Button>
                    </View>
                )}

                <FlatList
                    data={responses}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={renderResponse}
                    ListHeaderComponent={<Text style={styles.header}>Today's Responses</Text>}
                    contentContainerStyle={styles.flatListContainer}
                />

                <View style={styles.ratingSection}>
                    <Text style={styles.ratingText}>Rate your feeling (1-10): {rating}</Text>
                    <Slider
                        style={styles.slider}
                        minimumValue={1}
                        maximumValue={10}
                        step={1}
                        value={rating}
                        onSlidingComplete={updateRating}
                    />
                </View>

                <Portal>
                    <Dialog visible={editDialogVisible} onDismiss={() => setEditDialogVisible(false)}>
                        <Dialog.Title>Edit Response</Dialog.Title>
                        <Dialog.Content>
                            <TextInput
                                label="Edit answer"
                                value={editingAnswer}
                                onChangeText={setEditingAnswer}
                                multiline
                            />
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => setEditDialogVisible(false)}>Cancel</Button>
                            <Button onPress={saveEdit}>Save</Button>
                        </Dialog.Actions>
                    </Dialog>
                </Portal>
            </View>
        </Provider>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    questionSection: { marginBottom: 16 },
    questionText: { fontSize: 18, marginBottom: 8 },
    textInput: { backgroundColor: 'white', marginBottom: 8 },
    submitButton: { marginBottom: 16 },
    header: { fontSize: 20, marginBottom: 8 },
    flatListContainer: { paddingBottom: 16 },
    responseItem: { padding: 8, borderBottomWidth: 1, borderColor: '#ccc' },
    responseQuestion: { fontWeight: 'bold' },
    responseAnswer: { marginVertical: 4 },
    ratingSection: { marginTop: 16 },
    ratingText: { marginBottom: 8 },
    slider: { width: '100%', height: 40 },
});

export default DailyQuestionsPage;
