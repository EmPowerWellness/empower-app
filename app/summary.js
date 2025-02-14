import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Text, TextInput, Button, Dialog, Portal, Provider } from 'react-native-paper';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { BarChart, LineChart } from 'react-native-gifted-charts';
import { GoogleGenerativeAI } from '@google/generative-ai';

const SummaryPage = () => {
    const barData = [
        { value: 250, label: 'M' },
        { value: 500, label: 'T', frontColor: '#177AD5' },
        { value: 745, label: 'W', frontColor: '#177AD5' },
        { value: 320, label: 'T' },
        { value: 600, label: 'F', frontColor: '#177AD5' },
        { value: 256, label: 'S' },
        { value: 300, label: 'S' },
    ];
    return (<View style={styles.container}>
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
            color="#0BA5A4" />
        <Text>page is to be made</Text>
    </View>);
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
});

export default SummaryPage;
