const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const http = require('http');
const { Server: SocketIOServer } = require('socket.io');
const helmet = require('helmet');

dotenv.config();

const app = express();

app.use(helmet({
  contentSecurityPolicy: false,
}));

const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3000'];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  exposedHeaders: ['Content-Disposition'],
}));
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

const apiRoutes = require('./routes/apiRoutes');
const ytdlpService = require('./services/ytdlpService');

// Lightweight request logging for debugging.
app.use((req, _res, next) => {
  if (req.path.startsWith('/api/')) {
    // Avoid logging bodies here to keep logs readable/safe.
    console.log(`[api] ${req.method} ${req.path}`);
  }
  next();
});

app.use('/api', apiRoutes);

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Clients subscribe to a specific downloadId room to receive real-time updates.
io.on('connection', (socket) => {
  console.log('[socket] client connected', socket.id);
  socket.on('subscribe', (payload) => {
    const { downloadId } = payload || {};
    if (!downloadId) return;
    socket.join(downloadId);
    socket.emit('subscribed', { downloadId });
    console.log('[socket] subscribe', { downloadId, socketId: socket.id });
  });
});

async function startServer() {
  if (!MONGO_URI) {
    console.warn('MONGO_URI is not set. Skipping MongoDB connection.');
  } else {
    // No schemas/models required for initial connectivity setup.
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected');
  }

  ytdlpService.setSocketIO(io);

  server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

