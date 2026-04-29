const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Enable CORS for all routes (so the React frontend can fetch/connect from a different port)
app.use(cors());
// Middleware to parse incoming JSON payloads
app.use(express.json());

// Set up Socket.io for real-time WebSocket communication
const io = new Server(server, {
    cors: {
        origin: "*", // allow any origin for development
        methods: ["GET", "POST"]
    }
});

// A simple in-memory cache to store the latest known state of nodes
// This way, when a new frontend client connects, we can send them the latest info
const latestData = {};

// Handle incoming HTTP POST requests (Webhooks from the Google Spreadsheet)
app.post('/api/telemetry', (req, res) => {
    try {
        const payload = req.body;
        console.log('Received payload:', payload);

        // Expecting a payload format something like:
        // { device_id: 'node-1', ph: 7.2, turbidity: 5, ... }

        if (!payload || !payload.device_id) {
            return res.status(400).json({ error: 'Missing device_id in payload' });
        }

        const deviceId = payload.device_id;
        
        // Structure the data to match what the frontend expects
        const timestamp = new Date().toISOString();
        const formattedData = {
            device_id: deviceId,
            timestamp: timestamp,
            locationId: payload.locationId || 'Simulated-Location',
            counter: parseFloat(payload.counter) || 1,
            uptime: parseFloat(payload.uptime) || 1000,
            latency: parseFloat(payload.latency) || 50,
            note: payload.note || 'Simulated Data',
            sensors: {
                rssi: parseFloat(payload.rssi) || -90,
                snr: parseFloat(payload.snr) || 5,
                sf: parseFloat(payload.sf) || 7,
                freq: parseFloat(payload.frequency) || 923000000,
                sensorData: parseFloat(payload.sensorValue) || 7.0,
                pdr: parseFloat(payload.pdr) || 100,
            },
            battery: 100,
            connection: {
                rssi: parseFloat(payload.rssi) || -90,
                snr: parseFloat(payload.snr) || 5,
                pdr: parseFloat(payload.pdr) || 100,
            },
            loraStatus: payload.signalStatus || 'Good'
        };

        // Update the in-memory cache
        latestData[deviceId] = formattedData;

        // Broadcast the new data to all connected WebSocket clients (the React frontend)
        io.emit('telemetry_update', formattedData);

        res.status(200).json({ success: true, message: 'Telemetry received and broadcasted' });
    } catch (error) {
        console.error('Error processing telemetry:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Handle WebSocket connections
io.on('connection', (socket) => {
    console.log('A frontend client connected:', socket.id);

    // Send the currently known latest data to the new client so it's not empty
    socket.emit('initial_data', Object.values(latestData));

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 IoT Backend Server is running on http://localhost:${PORT}`);
    console.log(`Waiting for Webhook data at http://localhost:${PORT}/api/telemetry...`);
});
