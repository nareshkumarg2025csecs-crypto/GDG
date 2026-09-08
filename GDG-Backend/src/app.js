const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const hpp = require('hpp');
const dotenv = require('dotenv');
const routes = require('./routes');
const securityConfig = require('./config/securityConfig');
const { sanitizeInput } = require('./middleware/cleanInput');
const { generalApiLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

dotenv.config();

const app = express();

// Enable reverse proxy trust (prevents IP spoofing behind proxies like Nginx/Cloudflare/Heroku)
app.set('trust proxy', 1);

// 1. Security HTTP Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// 2. Strict CORS Configuration
const allowedOrigins = securityConfig.getAllowedOrigins();
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server, unit tests)
      if (!origin) return callback(null, true);

      const isAllowed = allowedOrigins.some(
        (allowed) => allowed === origin || allowed === '*'
      );

      if (isAllowed) {
        return callback(null, true);
      } else {
        return callback(new Error(`CORS origin '${origin}' is not allowed by access policy.`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Forwarded-For', 'X-Real-IP'],
  })
);

// 3. Request Payload Size Limits (Supports high-res Base64 event banners)
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// 4. HTTP Parameter Pollution Protection
app.use(hpp());

// 5. Prototype Pollution Input Sanitizer
app.use(sanitizeInput);

// Root Welcome Route
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'GDG College Club API',
    version: '1.0.0',
    documentation: '/README.md',
    health: '/api/health',
  });
});

// Mount Main API Routes under /api (with general rate limiter)
app.use('/api', generalApiLimiter, routes);

// 404 Fallback Handler
app.use(notFoundHandler);

// Global Error Handler (Sanitizes errors)
app.use(errorHandler);

module.exports = app;
