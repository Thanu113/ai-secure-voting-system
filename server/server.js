const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const env = require('./src/config/env');
const connectDB = require('./src/config/db');
const { globalLimiter } = require('./src/middlewares/rateLimiter');
const { notFoundHandler, errorHandler } = require('./src/middlewares/errorHandler');

const authRoutes = require('./src/routes/authRoutes');
const electionRoutes = require('./src/routes/electionRoutes');
const voteRoutes = require('./src/routes/voteRoutes');
const adminRoutes = require('./src/routes/adminRoutes');

const app = express();

// 1. Core Security Middlewares
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman or health checks)
      if (!origin) return callback(null, true);
      const allowedOrigins = [env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'];
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.onrender.com')
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// 2. Request Parsing with generous limit for webcam base64 frames
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// 3. Cookie parser simulation (simple cookie extractor helper)
app.use((req, res, next) => {
  const cookieHeader = req.headers.cookie;
  req.cookies = {};
  if (cookieHeader) {
    cookieHeader.split(';').forEach((cookie) => {
      const parts = cookie.split('=');
      const name = parts[0].trim();
      const value = parts.slice(1).join('=').trim();
      req.cookies[name] = decodeURIComponent(value);
    });
  }
  next();
});

// 4. Activity Logger
if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// 5. Global Rate Limiter
app.use('/api', globalLimiter);

// 6. Health & Status
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'AI Secure Voting Backend API',
    nodeEnv: env.NODE_ENV,
  });
});

// 7. API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/elections', electionRoutes);
app.use('/api/v1/votes', voteRoutes);
app.use('/api/v1/admin', adminRoutes);

// 8. Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server if not imported by tests
if (process.env.NODE_ENV !== 'test') {
  const startServer = async () => {
    try {
      await connectDB();
      const server = app.listen(env.PORT, () => {
        console.log(`[Backend API] Server running on http://127.0.0.1:${env.PORT} (${env.NODE_ENV})`);
      });

      // Graceful shutdown handlers
      const shutdown = () => {
        console.log('[Server] Gracefully shutting down...');
        server.close(() => {
          console.log('[Server] Closed remaining connections.');
          process.exit(0);
        });
      };

      process.on('SIGTERM', shutdown);
      process.on('SIGINT', shutdown);
    } catch (err) {
      console.error('[Server] Fatal startup error:', err.message);
      // Don't kill process immediately so logs can be inspected
      setTimeout(() => process.exit(1), 1000);
    }
  };

  startServer();
}

module.exports = app;

