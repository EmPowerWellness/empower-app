import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';

export default function HomeLayout() {
    return <View style={styles.container}>
        <Tabs screenOptions={{
            tabBarActiveTintColor: 'blue',
            tabBarStyle: { height: 58 },
        }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color }) => <Icon size={28} source="home" color={color} />,
                }} account-circle
            />
            <Tabs.Screen
                name="journal"
                options={{
                    title: 'Journal',
                    tabBarIcon: ({ color }) => <Icon size={28} source="notebook-edit" color={color} />,
                }}
            />
            <Tabs.Screen
                name="summary"
                options={{
                    title: 'Summary',
                    tabBarIcon: ({ color }) => <Icon size={28} source="chart-arc" color={color} />,
                }}
            />
            {/* <Tabs.Screen
                name="history"
                options={{
                    title: 'History',
                    tabBarIcon: ({ color }) => <Icon size={28} source="history" color={color} />,
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Settings',
                    tabBarIcon: ({ color }) => <Icon size={28} source="cog" color={color} />,
                }}
            /> */}
        </Tabs>
    </View>;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
});
