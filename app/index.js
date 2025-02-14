import { GoogleGenerativeAI } from '@google/generative-ai';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';

// Random function with 80% chance to return 6-10, 15% for 3-5, and 5% for 1-2
const randomRating = () => Math.random() < 0.8
    ? Math.floor(Math.random() * 5) + 6  // 80% chance between 6-10
    : Math.random() < 0.95
        ? Math.floor(Math.random() * 3) + 3  // 15% chance between 3-5
        : Math.floor(Math.random() * 2) + 1; // 5% chance between 1-2

const generatedQNAs = [
    { "question": "What is on your mind?", "answer": "I've been thinking a lot about my goals and how to stay consistent with my efforts. It's always a balance between ambition and discipline." },
    { "question": "How are you feeling today?", "answer": "I'm feeling quite motivated today! I have a few things lined up, and I'm excited to tackle them one by one." },
    { "question": "What is your biggest challenge right now?", "answer": "Time management is my biggest challenge at the moment. There\'s so much I want to do, and finding the right balance is tricky." },
    { "question": "What are you grateful for?", "answer": "I'm grateful for the opportunities I have to learn and grow every day. Also, for the support of friends and family who keep me going." },
    { "question": "What is one thing you want to improve about yourself?", "answer": "I want to become more consistent in my daily habits, especially when it comes to productivity and self-care." },
    { "question": "What excites you the most right now?", "answer": "Right now, I'm excited about the projects I'm working on. Building something meaningful always gives me a sense of purpose." },
    { "question": "What is something you\'ve recently learned?", "answer": "I recently learned more about the accelerometer sensor in Android apps and how it can be used to detect motion patterns." },
    { "question": "What is one habit you\'d like to develop?", "answer": "I\'d like to develop a habit of reading consistently every day, even if it\'s just for 20 minutes." },
    { "question": "What\'s one thing you\'ve accomplished recently that you\'re proud of?", "answer": "I successfully implemented a feature in an app that detects sudden jerks using motion sensors, and it felt great to see it working!" },
    { "question": "What inspires you to keep going?", "answer": "Knowing that every small step I take is bringing me closer to my goals keeps me motivated." },
    { "question": "How do you handle stress?", "answer": "I usually take a short break, listen to music, or do a quick workout session to clear my mind." },
    { "question": "What\'s something you\'re looking forward to?", "answer": "I'm looking forward to visiting the main campus of JU and meeting new people from different departments." },
    { "question": "If you could achieve one thing this year, what would it be?", "answer": "I\'d love to build a successful project that solves a real-world problem and gain recognition for it." },
    { "question": "What\'s a personal rule you always follow?", "answer": "I try to always give my best effort in whatever I do, whether it\'s academics, coding, or fitness." },
    { "question": "How do you usually start your day?", "answer": "I start my day with a quick workout, followed by planning my tasks for the day." },
    { "question": "What do you do when you feel unmotivated?", "answer": "I remind myself why I started and look at the progress I\'ve already made. Sometimes, watching an inspiring video helps too." },
    { "question": "What\'s something you value the most?", "answer": "I value discipline and consistency. Talent is great, but without consistency, it doesn\'t go far." },
    { "question": "If you had unlimited time and resources, what would you do?", "answer": "I\'d work on building innovative tech solutions, travel the world, and support educational initiatives." },
    { "question": "What\'s a lesson you\'ve learned from failure?", "answer": "Failure has taught me that persistence is key. Every setback is just a setup for a bigger comeback." },
    { "question": "What is one thing that always makes you happy?", "answer": "Working on a passion project and seeing it come to life always makes me happy." }
];

const popRandomElement = arr => {
    const randomIndex = Math.floor(Math.random() * arr.length);
    const randomElement = arr[randomIndex];
    arr.splice(randomIndex, 1); // Remove the element at randomIndex
    return randomElement;
}

const saveDataIfDateDoesNotExist = async (date, responses, rating) => {
    const jDate = format(date, 'yyyy-MM-dd');
    const responsesKey = `responses_${jDate}`;
    const ratingKey = `rating_${jDate}`;

    date.setHours(17, 0, 0, 0); // Set to 5:00:00.000 PM
    for (let r of responses) {
        r.timestamp = date.toISOString();
        date.setMinutes(date.getMinutes() + 12);
    }
    
    try {
        AsyncStorage.setItem(responsesKey, JSON.stringify(responses));
        AsyncStorage.setItem(ratingKey, JSON.stringify(rating));
    } catch (error) {
        console.error("Error saving data for date " + jDate, error);
    } finally {
        console.log("Saved data for date " + jDate);
    }
};

const generateResponsesForLast6Days = async (setJournalDates) => {
    const _generatedQNAs = generatedQNAs.slice();
    const today = new Date();
    
    const datesKey = `dates`;
    let dates = [];

    try {
        const _datesJSON = await AsyncStorage.getItem(datesKey);
        console.log(_datesJSON);
        if (_datesJSON){
            dates = JSON.parse(_datesJSON);
            console.log('dates-json are not null, hence parsed: ', dates);}
    } catch (error) {
        console.error("Error getting dates " + JSON.stringify(dates), error);
    } finally {
        console.log("'finally' of getting dates", dates);
    }
    
    // Loop through the last 6 days
    for (let i = 1; i <= 6; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i); // Subtract i days from today
        const _jDate = format(date, 'yyyy-MM-dd');

        
        if (dates.includes(_jDate)) {
            console.log(_jDate +' date already exists, not adding data!');
            continue;
        }
        dates.push(_jDate);

        const responses = [];
        const rating = randomRating();

        for (let i=1; i<=3; i++) {
            responses.push(popRandomElement(_generatedQNAs));
        }
        saveDataIfDateDoesNotExist(date, responses, rating);
    }

    try {
        AsyncStorage.setItem(datesKey, JSON.stringify(dates));
    } catch (error) {
        console.error("Error saving dates " + JSON.stringify(dates), error);
    } finally {
        console.log("'finally' of saving dates", dates);
    }

    setJournalDates(dates);
}

const viewAsyncStorage = async (setJournalDates) => {
    console.log(AsyncStorage.getAllKeys());
    AsyncStorage.getAllKeys((err, keys) => {
        AsyncStorage.multiGet(keys, (error, stores) => {
            stores.map((result, i, store) => {
                console.log({ [store[i][0]]: store[i][1] });
            });
        });
    });

    const datesKey = `dates`;
    let dates = [];

    try {
        const _datesJSON = await AsyncStorage.getItem(datesKey);
        console.log(_datesJSON);
        if (_datesJSON){
            dates = JSON.parse(_datesJSON);
            console.log('dates-json are not null, hence parsed: ', dates);}
    } catch (error) {
        console.error("Error getting dates " + JSON.stringify(dates), error);
    } finally {
        console.log("'finally' of getting dates", dates);
        setJournalDates(dates);
    }
};

export default function App() {
    const [prompt, setPrompt] = useState('Whats up?');
    const [text, setText] = useState('--something--');
    const [journalDates, setJournalDates] = useState([]);
    const router = useRouter();

    const handleClick = () => {
        console.log('clicked');
        runPrompt(prompt)
            .then(setText)
            .catch((err) => {
                console.error(err);
            });
    };

    const renderItem = ({ item }) => (
        <Button onPress={() => router.push({pathname:'/journal', params:{jDate:item}})} mode='outlined'>{item}</Button>
      );

    return (
        <View style={styles.container}>
            <Button onPress={() => AsyncStorage.clear()} mode='contained-tonal'>Test - Clear Async Storage</Button>
            <Button onPress={() => generateResponsesForLast6Days(setJournalDates)} mode='contained-tonal'>Test - Generate Responses for last 6 days</Button>
            <Button onPress={() => viewAsyncStorage(setJournalDates)} mode='contained-tonal'>Test - View Async Storage</Button>
            <FlatList
                data={journalDates}
                renderItem={renderItem}
                keyExtractor={x=>x} // Unique key for each item
            />
            <TextInput
                mode='outlined'
                label='enter prompt'
                value={prompt}
                onChangeText={setPrompt} />
            <Button onPress={handleClick} mode='elevated'>Run Prompt</Button>
            <Text style={styles.responseBox}>{text ? text : '..prompt response to be shown here'}</Text>
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
        padding: 10,
        gap: 10,
    },
    responseBox: {
        borderWidth: 0.5,
        borderRadius: 6,
        padding: 8,
    }
});
