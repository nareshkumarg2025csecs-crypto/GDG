const app = require('./app');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`========================================`);
  console.log(`🚀 College Club Backend running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  console.log(`========================================`);
});


// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

// Process-level crash prevention against unhandled promise rejections & uncaught exceptions
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 [CRASH-GUARD] Unhandled Promise Rejection at:', promise, 'reason:', reason);
  // Do not crash the entire Node.js runtime on background promise failures
});

process.on('uncaughtException', (err) => {
  console.error('🚨 [CRASH-GUARD] Uncaught Exception:', err);
  // Log full stack trace so it can be monitored without bringing down concurrent users
});
