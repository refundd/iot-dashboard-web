import React from 'react';
import { Download } from 'lucide-react';
import { format } from 'date-fns';
import './DataLogTable.css';

const DataLogTable = ({ history }) => {
    const displayData = [...history].reverse().slice(0, 50);

    const downloadCSV = () => {
        const headers = ['Timestamp,Battery Level,Counter,TX Timestamp,RSSI,SNR,SF,Freq(Hz),Sensor Value,PDR(%),Latency(ms),Status,Note'];
        const rows = history.map(row => {
            return [
                `"${new Date(row.timestamp).toISOString()}"`,
                `"${row.batteryLevel || ''}"`,
                row.counter ?? '',
                row.txTimestamp ?? '',
                row.sensors?.rssi ?? '',
                row.sensors?.snr ?? '',
                row.sensors?.sf ?? '',
                row.sensors?.freq ?? '',
                row.sensors?.sensorData ?? '',
                row.sensors?.pdr ?? '',
                row.latency ?? '',
                `"${row.status || ''}"`,
                `"${row.note || ''}"`
            ].join(',');
        });

        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `lora_data_log_${new Date().toISOString()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="datalog-container">
            <div className="datalog-header">
                <h3>Data Log (Last 50)</h3>
                <button onClick={downloadCSV} className="export-btn">
                    <Download size={16} />
                    Export All (CSV)
                </button>
            </div>

            <div className="table-wrapper">
                <table className="datalog-table">
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>Battery</th>
                            <th>Count</th>
                            <th>TX Timestamp</th>
                            <th>RSSI</th>
                            <th>SNR</th>
                            <th>SF</th>
                            <th>Freq(MHz)</th>
                            <th>Value</th>
                            <th>PDR(%)</th>
                            <th>Latency(ms)</th>
                            <th>Status</th>
                            <th>Note</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayData.map((row, idx) => (
                            <tr key={idx}>
                                <td>{format(new Date(row.timestamp), 'HH:mm:ss')}</td>
                                <td>{row.batteryLevel || '-'}</td>
                                <td>{row.counter ?? '-'}</td>
                                <td>{row.txTimestamp ? new Date(row.txTimestamp > 100000000000 ? row.txTimestamp : row.txTimestamp * 1000).toLocaleTimeString() : '-'}</td>
                                <td>{row.sensors?.rssi ?? '-'}</td>
                                <td>{row.sensors?.snr ?? '-'}</td>
                                <td>{row.sensors?.sf ?? '-'}</td>
                                <td>{row.sensors?.freq ? (row.sensors.freq / 1e6).toFixed(1) : '-'}</td>
                                <td>{row.sensors?.sensorData ?? '-'}</td>
                                <td>{row.sensors?.pdr ?? '-'}</td>
                                <td>{row.latency ?? '-'}</td>
                                <td>{row.status || '-'}</td>
                                <td className="truncate-note" title={row.note}>{row.note || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DataLogTable;
