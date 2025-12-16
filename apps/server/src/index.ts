import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { setupRoutes } from './http/routes/index.js';
import { setupSocketIO } from './sockets/index.js';
import { createLogger } from '@vibe-ltp/shared';

const logger = createLogger({ module: 'server' });

// Load .env from workspace root
// Note: override: false ensures environment variables passed via CLI take precedence
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '../../../.env');
dotenv.config({ path: envPath, override: false });

logger.info({ envPath }, '🔧 Loading .env');
logger.info({ hasApiKey: !!process.env.OPENROUTER_API_KEY }, '🔑 OPENROUTER_API_KEY present');
logger.info({ port: process.env.BACKEND_PORT || 4000 }, '🔌 BACKEND_PORT');
logger.info({ port: process.env.FRONTEND_PORT || 3000 }, '🌐 FRONTEND_PORT');
logger.info({ origin: process.env.CORS_ORIGIN || 'auto-generated' }, '🔒 CORS_ORIGIN');

const app = express();
const httpServer = createServer(app);

// Configure allowed origins
const frontendPort = process.env.FRONTEND_PORT || 3000;
const defaultOrigin = `http://localhost:${frontendPort}`;
const allowedOrigins = (
  process.env.CORS_ORIGIN || defaultOrigin
).split(',').map(origin => origin.trim());

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST'],
  },
  transports: ['websocket'],
  pingTimeout: 60000,
  pingInterval: 25000,
});

logger.info({
  transports: ['websocket'],
  allowedOrigins,
}, '🔌 Socket.IO configured');

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Setup routes and socket handlers
setupRoutes(app);
setupSocketIO(io);

const PORT = process.env.BACKEND_PORT || 4000;

httpServer.listen(PORT, () => {
  logger.info({ url: `http://localhost:${PORT}` }, '🚀 Server running');
});
