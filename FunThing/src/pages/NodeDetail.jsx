import React, { useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { Droplet, Wifi, Activity, Pencil, Check, X, Trash2, MapPin, Clock, Battery } from 'lucide-react';
import { SensorChart } from '../components/SensorChart';
import DataLogTable from '../components/DataLogTable';
import { updateNodeMeta, removeNode } from '../services/mockData';
import './NodeDetail.css';

import { useLanguage } from '../contexts/LanguageContext';

const NodeDetail = ({ nodes }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [timeRange, setTimeRange] = useState('all');
    const { t } = useLanguage();

    const node = nodes.find(n => n.id === id);

    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState('');

    useEffect(() => {
        if (node && !isEditing) setNewName(node.name);
    }, [node, isEditing]);

    if (!node) return <Navigate to="/" />;

    const handleSaveName = () => {
        if (newName.trim()) {
            updateNodeMeta(node.id, { name: newName });
            setIsEditing(false);
        }
    };

    const history = node.history || [];
    const getFilteredHistory = () => {
        if (!history.length) return [];
        if (timeRange === 'all') return history;
        // Use the LATEST data point as reference, not current time
        const latestTime = Math.max(...history.map(h => new Date(h.timestamp).getTime()));
        let minutesToKeep = 10;
        if (timeRange === '1h') minutesToKeep = 60;
        if (timeRange === '24h') minutesToKeep = 1440;
        const cutoff = new Date(latestTime - minutesToKeep * 60000);
        const filtered = history.filter(h => new Date(h.timestamp) > cutoff);
        return filtered.length > 0 ? filtered : history; // fallback to all data if filter is too narrow
    };
    const filteredHistory = getFilteredHistory();
    const getHistory = (path) => filteredHistory.map(h => {
        if (!path.includes('.')) return { timestamp: h.timestamp, value: h[path] };
        const [cat, key] = path.split('.');
        return { timestamp: h.timestamp, value: h[cat]?.[key] ?? 0 };
    });

    const handleDelete = () => {
        if (window.confirm(t('nodeDetail.confirmDelete'))) {
            removeNode(node.id);
            navigate('/');
        }
    };

    const formatTxTimestamp = (ts) => {
        if (!ts) return '-';
        const ms = ts > 100000000000 ? ts : ts * 1000;
        const date = new Date(ms);
        return date.toLocaleTimeString();
    };

    return (
        <div className="node-detail-page">
            <header className="detail-header">
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {isEditing ? (
                            <div className="rename-box">
                                <input
                                    className="rename-input"
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    autoFocus
                                    onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                                />
                                <button className="icon-btn-small" onClick={handleSaveName}><Check size={18} color="var(--color-success)" /></button>
                                <button className="icon-btn-small" onClick={() => { setIsEditing(false); setNewName(node.name); }}><X size={18} color="var(--color-error)" /></button>
                                <div style={{ width: '1px', height: '24px', background: 'var(--glass-border)', margin: '0 0.5rem' }}></div>
                                <button
                                    className="icon-btn-small"
                                    onClick={handleDelete}
                                    title={t('nodeDetail.deleteNode')}
                                    style={{ background: 'rgba(239, 68, 68, 0.1)' }}
                                >
                                    <Trash2 size={18} color="#ef4444" />
                                </button>
                            </div>
                        ) : (
                            <>
                                <h1>{node.name}</h1>
                                <button className="icon-btn-small" onClick={() => setIsEditing(true)}>
                                    <Pencil size={16} color="var(--text-secondary)" />
                                </button>
                            </>
                        )}
                    </div>
                    <div className="last-seen">
                        <span style={{ color: node.status === 'online' ? 'var(--color-success)' : 'var(--color-error)', textTransform: 'capitalize', fontWeight: 600 }}>{node.loraStatus || node.status}</span>
                        <span style={{ margin: '0 0.5rem' }}>•</span> 
                        {t('nodeDetail.lastSeen')}: {node.lastSeen instanceof Date ? node.lastSeen.toLocaleTimeString() : new Date(node.lastSeen).toLocaleTimeString()} 
                        <span style={{ margin: '0 0.5rem' }}>•</span>
                        <Clock size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
                        {t('nodeDetail.sensors.txTimestamp') || 'TX Timestamp'}: {formatTxTimestamp(node.txTimestamp)}
                        {node.batteryLevel && (
                            <>
                                <span style={{ margin: '0 0.5rem' }}>•</span>
                                <Battery size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
                                {node.batteryLevel}%
                            </>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div className="time-controls">
                        {['10m', '1h', '24h', 'all'].map(k => (
                            <button
                                key={k}
                                className={`time-btn ${timeRange === k ? 'active' : ''}`}
                                onClick={() => setTimeRange(k)}
                            >
                                {k === '10m' ? t('nodeDetail.timeRange.live') : k === '1h' ? t('nodeDetail.timeRange.hour') : k === '24h' ? t('nodeDetail.timeRange.day') : 'All'}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <section className="metrics-section">
                <h3><Droplet size={20} color="#10b981" /> Primary Sensor Reading (pH)</h3>
                <div className="charts-grid" style={{ gridTemplateColumns: 'minmax(0, 1fr)' }}>
                    <div className="chart-card featured" style={{ height: '350px' }}>
                        <SensorChart title={t('nodeDetail.sensors.sensorData')} data={getHistory('sensors.sensorData')} color="#10b981" />
                    </div>
                </div>
            </section>

            <section className="metrics-section">
                <h3><Activity size={20} color="#8b5cf6" /> Network Diagnostics</h3>
                <div className="charts-grid-network">
                    <div className="chart-card">
                        <SensorChart title="RSSI" data={getHistory('sensors.rssi')} unit="dBm" color="#8b5cf6" />
                    </div>
                    <div className="chart-card">
                        <SensorChart title="SNR" data={getHistory('sensors.snr')} unit="dB" color="#ec4899" />
                    </div>
                    <div className="chart-card">
                        <SensorChart title={t('nodeDetail.sensors.latency') || 'Latency'} data={getHistory('latency')} unit="ms" color="#eab308" />
                    </div>
                    <div className="chart-card">
                        <SensorChart title="PDR" data={getHistory('sensors.pdr')} unit="%" color="#10b981" />
                    </div>
                </div>
                
                <div className="charts-grid" style={{ marginTop: '1.5rem' }}>
                    <div className="chart-card">
                        <SensorChart title={t('nodeDetail.sensors.sf')} data={getHistory('sensors.sf')} color="#3b82f6" />
                    </div>
                    <div className="chart-card">
                        <SensorChart title={t('nodeDetail.sensors.freq')} data={getHistory('sensors.freq')} unit="Hz" color="#f97316" />
                    </div>
                </div>
            </section>

            <section className="metrics-section">
                <DataLogTable history={filteredHistory} />
            </section>
        </div>
    );
};

export default NodeDetail;
