'use client';
import React, { useEffect, useRef } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    RadialLinearScale,
    Filler,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { useStreamContext } from "@langchain/langgraph-sdk/react-ui";


// Registra i componenti Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    RadialLinearScale,
    Filler,
    Title,
    Tooltip,
    Legend
);

interface ChartViewerProps {
    type?: 'bar' | 'line' | 'pie' | 'doughnut' | 'radar' | 'polarArea' | 'scatter' | 'bubble';
    data?: any;
    options?: any;
    title?: string;
    description?: string;
}

export const ChartViewerComponent: React.FC<ChartViewerProps> = ({
    type = 'bar',
    data,
    options = {},
    title, description
}) => {
    const chartRef = useRef<ChartJS>(null);
    const streamContext = useStreamContext();

    useEffect(() => {
        return () => {
            if (chartRef.current) {
                chartRef.current.destroy();
            }
        };
    }, []);

    // Colori predefiniti per i dataset
    const defaultColors = [
        {
            backgroundColor: 'rgba(54, 162, 235, 0.8)',
            borderColor: 'rgb(54, 162, 235)',
            hoverBackgroundColor: 'rgba(54, 162, 235, 1)',
        },
        {
            backgroundColor: 'rgba(255, 99, 132, 0.8)',
            borderColor: 'rgb(255, 99, 132)',
            hoverBackgroundColor: 'rgba(255, 99, 132, 1)',
        },
        {
            backgroundColor: 'rgba(255, 206, 86, 0.8)',
            borderColor: 'rgb(255, 206, 86)',
            hoverBackgroundColor: 'rgba(255, 206, 86, 1)',
        },
        {
            backgroundColor: 'rgba(75, 192, 192, 0.8)',
            borderColor: 'rgb(75, 192, 192)',
            hoverBackgroundColor: 'rgba(75, 192, 192, 1)',
        },
        {
            backgroundColor: 'rgba(153, 102, 255, 0.8)',
            borderColor: 'rgb(153, 102, 255)',
            hoverBackgroundColor: 'rgba(153, 102, 255, 1)',
        },
    ];

    // Applica colori ai dataset se non già presenti
    const enrichedData = data ? {
        ...data,
        datasets: data.datasets?.map((dataset: any, index: number) => ({
            ...dataset,
            backgroundColor: dataset.backgroundColor || defaultColors[index % defaultColors.length].backgroundColor,
            borderColor: dataset.borderColor || defaultColors[index % defaultColors.length].borderColor,
            hoverBackgroundColor: dataset.hoverBackgroundColor || defaultColors[index % defaultColors.length].hoverBackgroundColor,
            borderWidth: dataset.borderWidth || 2,
            ...(type === 'line' && { tension: dataset.tension || 0.4, fill: dataset.fill !== undefined ? dataset.fill : false }),
        }))
    } : null;

    const defaultOptions: any = {
        responsive: true,
        maintainAspectRatio: true,
        animation: {
            duration: 750,
            easing: 'easeInOutQuart'
        },
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    color: '#e0e0e0',
                    font: { size: 13, weight: '500' },
                    padding: 15,
                    usePointStyle: true,
                    pointStyle: 'circle',
                },
            },
            title: {
                display: !!title,
                text: title || '',
                color: '#ffffff',
                font: { size: 18, weight: 'bold' },
                padding: { top: 10, bottom: 20 },
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                titleColor: '#ffffff',
                bodyColor: '#e0e0e0',
                borderColor: '#4a5568',
                borderWidth: 1,
                padding: 12,
                displayColors: true,
                boxPadding: 6,
            },
        },
        scales: type !== 'pie' && type !== 'doughnut' && type !== 'polarArea' && type !== 'radar' ? {
            x: {
                ticks: {
                    color: '#a0aec0',
                    font: { size: 11 }
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.08)',
                    drawBorder: false,
                },
            },
            y: {
                ticks: {
                    color: '#a0aec0',
                    font: { size: 11 }
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.08)',
                    drawBorder: false,
                },
                beginAtZero: true,
            },
        } : undefined,
    };

    const mergedOptions = {
        ...defaultOptions,
        ...options,
        plugins: {
            ...defaultOptions.plugins,
            ...options?.plugins,
        },
    };

    if (!enrichedData) {
        return (
            <div className="w-full max-w-4xl mx-auto my-5 p-5 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-2xl border border-gray-700">
                <div className="relative w-full min-h-[300px] bg-black bg-opacity-20 rounded-lg p-5 flex items-center justify-center">
                    <div className="text-gray-400 text-center py-10">
                        <div className="text-6xl mb-4">📊</div>
                        <div>Nessun dato disponibile per il grafico</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto my-5 p-6 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-2xl border border-gray-700">
            {/* Chart Container */}
            <div className="relative w-full min-h-[400px] bg-black bg-opacity-20 rounded-lg p-6 mb-4">
                <Chart
                    ref={chartRef}
                    type={type}
                    data={enrichedData}
                    options={mergedOptions}
                    onClick={(evt) => {
                        console.log('Chart clicked', evt);
                        const points = chartRef.current?.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, true);
                        if (points && points.length) {
                            const firstPoint = points[0];
                            const label = enrichedData.labels[firstPoint.index];
                            const value = enrichedData.datasets[firstPoint.datasetIndex].data[firstPoint.index];
                            console.log(`Clicked on: ${label} - Value: ${value}`);

                            const newMessage = {
                                type: "human",
                                content: `Rendi il grafico più granulare alla data ${label}`,
                            };

                            streamContext.submit({ messages: [newMessage] });
                        }
                    }}
                />
            </div>
            {/* Description */}
            {/* {description && (
                <div className="p-4 bg-white bg-opacity-5 rounded-lg border-l-4 border-blue-500">
                    <p className="m-0 text-gray-300 text-sm leading-relaxed">{description}</p>
                </div>
            )} */}
        </div>
    );
};