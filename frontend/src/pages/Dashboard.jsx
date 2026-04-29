import React from 'react';
import { Link } from 'react-router-dom';
import { Droplet, Radio, Signal, Zap, BarChart3, Clock, MapPin, Battery } from 'lucide-react';
import './Dashboard.css';

import { useLanguage } from '../contexts/LanguageContext';

const Dashboard = ({ nodes }) => {
    const { t } = useLanguage();

    const getStatusColor = (status) => {
        const s = (status || '').toLowerCase();
        if (s === 'excellent') return 'var(--color-success)';
        if (s === 'good') return 'var(--color-warning)';
        return 'var(--color-error)';
    };

    const getPhColor = (ph) => {
        if (ph === null || ph === undefined) return 'var(--text-secondary)';
        if (ph < 6.5) return '#f59e0b'; // acidic - yellow/orange
        if (ph > 8.5) return '#ef4444'; // alkaline - red
        return '#10b981';               // neutral - green
    };

    return (
        <div className="dashboard-page">
            <header className="page-header">
                <h1>{t('dashboard.header')}</h1>
                <p className="text-muted">
                    Monitoring {nodes.length} Active Modules • {t('dashboard.networkHealth')}: Excellent
                </p>
            </header>

            <div className="nodes-grid">
                {nodes.map(node => (
                    <Link key={node.id} to={`/node/${node.id}`} className="node-card">
                        <div className={`card-header ${node.status}`}>
                            <h3>{node.name}</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                {node.batteryLevel && (
                                    <span className="battery-badge" title="Battery Level">
                                        <Battery size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                        {node.batteryLevel}%
                                    </span>
                                )}
                                <span className="status-badge" style={{ color: getStatusColor(node.loraStatus) }}>
                                    {node.loraStatus || (node.status === 'online' ? t('dashboard.online') : t('dashboard.offline'))}
                                </span>
                            </div>
                        </div>

                        <div className="card-body">
                            <div className="sensor-primary-row">
                                <span className="primary-label">{t('nodeDetail.sensors.sensorData')}</span>
                                <div className="primary-sensor-value" style={{ color: getPhColor(node.sensors.sensorData) }}>
                                    <Droplet size={28} />
                                    <span>
                                        {node.sensors.sensorData !== null && node.sensors.sensorData !== undefined 
                                            ? parseFloat(node.sensors.sensorData).toFixed(2) 
                                            : '--'}
                                    </span>
                                    <span className="unit">pH</span>
                                </div>
                            </div>

                            <div className="network-footer-label">Network Diagnostics</div>
                            <div className="sensor-grid small-grid">
                                <div className="sensor-item mini">
                                    <span>RSSI</span>
                                    <strong>{node.sensors.rssi}</strong>
                                </div>
                                <div className="sensor-item mini">
                                    <span>SNR</span>
                                    <strong>{node.sensors.snr}</strong>
                                </div>
                                <div className="sensor-item mini">
                                    <span>PDR</span>
                                    <strong>{node.sensors.pdr}%</strong>
                                </div>
                                <div className="sensor-item mini">
                                    <span>Latency</span>
                                    <strong>{node.latency}ms</strong>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default Dashboard;
