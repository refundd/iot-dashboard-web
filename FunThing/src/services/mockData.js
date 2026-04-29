// ===== Google Apps Script Polling Backend =====
const DEFAULT_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyTKYQ-UjwRj1AOlnGA6oxJ56VJl12dDvsvqs6yYlNu4S-ZNw1eZCNZE6vGBpiBGefz/exec';

// Read URL from localStorage, fallback to default
let APPS_SCRIPT_URL = localStorage.getItem('apps_script_url') || DEFAULT_APPS_SCRIPT_URL;

export const getAppsScriptUrl = () => APPS_SCRIPT_URL;

export const updateAppsScriptUrl = (newUrl) => {
    APPS_SCRIPT_URL = newUrl;
    localStorage.setItem('apps_script_url', newUrl);
    // Reset data and re-fetch immediately with new URL
    lastFetchHash = '';
    nodes = [];
    notify();
    fetchData();
};

// In-memory array of nodes, grouped by device
let nodes = [];
const listeners = new Set();
let inMemoryMeta = {};
let isPolling = false;
let lastFetchHash = '';

const notify = () => {
    listeners.forEach(cb => cb([...nodes]));
};

const loadSavedMeta = () => {
    try {
        return JSON.parse(localStorage.getItem('nodes_meta')) || {};
    } catch {
        return {};
    }
};

const savedMeta = loadSavedMeta();
inMemoryMeta = { ...savedMeta };

// Hash the data to avoid unnecessary re-renders
const hashData = (rows) => {
    try {
        return JSON.stringify(rows);
    } catch {
        return '';
    }
};

// Helper to safely parse strings with comma decimals (e.g. "8,5" -> 8.5)
const parseSafeFloat = (val) => {
    if (val === undefined || val === null || val === '') return null;
    if (typeof val === 'number') return val;
    const str = String(val).replace(',', '.');
    const num = parseFloat(str);
    return isNaN(num) ? null : num;
};

// Helper to check multiple possible keys from the spreadsheet payload
const getVal = (row, ...keys) => {
    for (const key of keys) {
        if (row[key] !== undefined && row[key] !== '') return row[key];
        // fallback to lowercase without spaces (Apps Script default behavior)
        const lowerKey = key.toLowerCase().replace(/\s/g, '');
        if (row[lowerKey] !== undefined && row[lowerKey] !== '') return row[lowerKey];
        // fallback to lowercase with spaces
        const lowerSpaceKey = key.toLowerCase();
        if (row[lowerSpaceKey] !== undefined && row[lowerSpaceKey] !== '') return row[lowerSpaceKey];
    }
    return undefined;
};

// Process rows from the Google Sheets API into node format
const processSheetData = (rows) => {
    const newHash = hashData(rows);
    if (newHash === lastFetchHash && nodes.length > 0) {
        return; // Data hasn't changed, skip re-render
    }
    lastFetchHash = newHash;

    // Group rows by device
    const deviceMap = {};
    rows.forEach(row => {
        const deviceId = getVal(row, 'Device', 'device') || 'unknown';
        if (!deviceMap[deviceId]) {
            deviceMap[deviceId] = [];
        }
        deviceMap[deviceId].push(row);
    });

    // Convert each device group into a node
    const newNodes = Object.keys(deviceMap).map(deviceId => {
        const deviceRows = deviceMap[deviceId];
        const latestRow = deviceRows[deviceRows.length - 1];
        const meta = inMemoryMeta[deviceId] || {};

        const history = deviceRows.map(row => {
            const rawFreq = parseSafeFloat(getVal(row, 'Frequency', 'frequency', 'Freq', 'freq'));
            return {
                timestamp: new Date(getVal(row, 'Timestamp', 'timestamp', 'Waktu', 'waktu')),
                batteryLevel: getVal(row, 'Battery Level', 'batteryLevel', 'batterylevel', 'Location ID', 'locationId', 'locationid') || '',
                counter: parseSafeFloat(getVal(row, 'Counter', 'counter')),
                txTimestamp: parseSafeFloat(getVal(row, 'txTimestamp', 'TX Timestamp (Unix)', 'tx Timestamp', 'TX Timestamp', 'uptimeMs', 'uptime')),
                latency: parseSafeFloat(getVal(row, 'Latency (ms)', 'latencyMs', 'latency')),
                note: getVal(row, 'Note', 'note') || '',
                sensors: {
                    rssi: parseSafeFloat(getVal(row, 'RSSI', 'rssi')),
                    snr: parseSafeFloat(getVal(row, 'SNR', 'snr')),
                    sf: parseSafeFloat(getVal(row, 'SF', 'sf')),
                    freq: rawFreq !== null ? (rawFreq > 1000 ? rawFreq : rawFreq * 1e6) : null, // normalize if not in Hz 
                    sensorData: (() => {
                        let val = parseSafeFloat(getVal(row, 'Sensor Value', 'sensorValue', 'sensorData', 'ph'));
                        if (val !== null && val > 14) return val / 100;
                        return val;
                    })(),
                    pdr: parseSafeFloat(getVal(row, 'PDR (%)', 'pdr', 'PDR')),
                },
                status: getVal(row, 'Signal Status', 'status', 'Status') || 'Unknown',
            };
        });

        const latestParsed = history[history.length - 1];
        const lastSeenTime = latestParsed.timestamp;
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const isStale = lastSeenTime < oneHourAgo;
        const statusText = (latestParsed.status || '').toLowerCase();

        return {
            id: deviceId,
            device_id: deviceId,
            name: meta.name || deviceId,
            order: meta.order !== undefined ? meta.order : 0,
            status: isStale ? 'offline' : (['excellent', 'good'].includes(statusText) ? 'online' : 'offline'),
            lastSeen: lastSeenTime,
            batteryLevel: latestParsed.batteryLevel,
            counter: latestParsed.counter,
            txTimestamp: latestParsed.txTimestamp,
            latency: latestParsed.latency,
            note: latestParsed.note,
            sensors: latestParsed.sensors,
            connection: {
                rssi: latestParsed.sensors.rssi,
                snr: latestParsed.sensors.snr,
                pdr: latestParsed.sensors.pdr,
            },
            loraStatus: latestParsed.status,
            battery: 100,
            history: history,
        };
    });

    nodes = newNodes;
    notify();
};

// Poll the Google Apps Script Web App
const fetchData = async () => {
    try {
        const response = await fetch(APPS_SCRIPT_URL);
        if (!response.ok) {
            console.error('Apps Script returned status:', response.status);
            return;
        }
        const text = await response.text();
        try {
            const data = JSON.parse(text);
            if (data && Array.isArray(data.rows)) {
                processSheetData(data.rows);
            }
        } catch (parseErr) {
            console.error('Failed to parse Apps Script response as JSON:', text.substring(0, 200));
        }
    } catch (err) {
        console.error('Error fetching from Apps Script:', err);
    }
};

// Start polling every 5 seconds
const startPolling = () => {
    if (isPolling) return;
    isPolling = true;
    fetchData();
    setInterval(fetchData, 5000);
};

startPolling();

// ===== Exports =====

export const updateNodeMeta = (id, meta) => {
    inMemoryMeta[id] = { ...(inMemoryMeta[id] || {}), ...meta };

    const currentMeta = loadSavedMeta();
    currentMeta[id] = { ...currentMeta[id], ...meta };
    localStorage.setItem('nodes_meta', JSON.stringify(currentMeta));

    nodes = nodes.map(n => {
        if (n.id === id || n.device_id === id) {
            return { ...n, ...meta };
        }
        return n;
    });

    if (meta.order !== undefined) {
        nodes.sort((a, b) => a.order - b.order);
    }

    notify();
};

export const removeNode = (id) => {
    nodes = nodes.filter(n => n.id !== id && n.device_id !== id);
    delete inMemoryMeta[id];

    const currentMeta = loadSavedMeta();
    delete currentMeta[id];
    localStorage.setItem('nodes_meta', JSON.stringify(currentMeta));

    notify();
};

export const subscribeToNodes = (cb) => {
    listeners.add(cb);
    cb([...nodes]);
    return () => listeners.delete(cb);
};

export const getNodes = () => [...nodes];
export const getNodeById = (id) => nodes.find(n => n.id === id || n.device_id === id);

export const processIncomingPacket = (payload) => {
    return { success: true, message: 'Apps Script backend is now used. Please add data to your Google Sheet.' };
};
