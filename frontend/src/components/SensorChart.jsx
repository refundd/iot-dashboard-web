import React from 'react';
import { Line } from 'react-chartjs-2';
import { format } from 'date-fns';

const getOptions = (tickColor) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: false,
        },
        tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            titleColor: '#f8fafc',
            bodyColor: '#e2e8f0',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8,
            callbacks: {
                label: function (context) {
                    let label = context.dataset.label || '';
                    if (label) {
                        label += ': ';
                    }
                    if (context.parsed.y !== null) {
                        label += Number(context.parsed.y).toFixed(2);
                    }
                    return label;
                }
            }
        },
    },
    scales: {
        x: {
            grid: {
                display: false,
            },
            ticks: {
                maxTicksLimit: 5,
                color: tickColor,
                font: {
                    family: "'Outfit', sans-serif",
                    size: 11,
                },
            },
            border: {
                display: false,
            },
        },
        y: {
            border: {
                display: false,
                dash: [4, 4],
            },
            grid: {
                color: tickColor + '20',
            },
            ticks: {
                color: tickColor,
                font: {
                    family: "'Outfit', sans-serif",
                    size: 11,
                },
                padding: 8,
            },
        },
    },
    interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
    },
    elements: {
        point: {
            radius: 0,
            hoverRadius: 5,
            hoverBorderWidth: 2,
            hoverBackgroundColor: '#fff',
        },
        line: {
            tension: 0.4,
            borderCapStyle: 'round',
        }
    }
});

export const SensorChart = ({ title, data, color = '#2563eb', unit = '' }) => {
    // Chart.js canvas can't read CSS variables — detect theme and use direct colors
    const isDark = document.body.className.includes('theme-dark');
    const tickColor = isDark ? '#94a3b8' : '#64748b';

    const chartData = {
        labels: data.map(d => format(d.timestamp, 'HH:mm:ss')),
        datasets: [
            {
                label: title,
                data: data.map(d => d.value),
                borderColor: color,
                backgroundColor: (context) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
                    gradient.addColorStop(0, color + '30');
                    gradient.addColorStop(1, color + '05');
                    return gradient;
                },
                fill: true,
                borderWidth: 2,
            },
        ],
    };

    const currentValue = data[data.length - 1]?.value;

    return (
        <div className="chart-container" style={{ height: '200px', width: '100%' }}>
            <h4 style={{
                margin: '0 0 10px 0',
                fontSize: '0.85rem',
                color: 'var(--chart-title, #6b7280)',
                fontWeight: 500,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <span>{title}</span>
                <span style={{
                    color: color,
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    fontVariantNumeric: 'tabular-nums'
                }}>
                    {currentValue != null ? Number(currentValue).toFixed(1) : '—'} {unit}
                </span>
            </h4>
            <Line options={getOptions(tickColor)} data={chartData} />
        </div>
    );
};
