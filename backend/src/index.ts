import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { initializeDatabase, closeDatabase } from './services/database';
import { initializeBot } from './bot';
import { logError, logRequest } from './services/logger';
import { responseTimeMiddleware, startMonitoring, stopMonitoring } from './services/monitoring';
import authRoutes from './routes/auth';
import caseRoutes from './routes/cases';
import userRoutes from './routes/user';
import adminRoutes from './routes/admin';
import verifyRoutes from './routes/verify';
import setupRoutes from './routes/setup';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

console.log('Telegram NFT Case Opener - Backend');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Port:', PORT);

// Initialize application
async function startServer() {
  try {
    // Initialize database connection
    console.log('Initializing database...');
    await initializeDatabase();
    console.log('Database connected successfully');

    // Initialize Telegram bot
    console.log('Initializing Telegram bot...');
    await initializeBot();
    console.log('Telegram bot initialized');

    // Create Express app
    const app = express();

    // HTTPS redirect middleware (production only)
    if (process.env.NODE_ENV === 'production') {
      app.use((req: Request, res: Response, next: NextFunction) => {
        if (req.header('x-forwarded-proto') !== 'https') {
          res.redirect(`https://${req.header('host')}${req.url}`);
        } else {
          next();
        }
      });
    }

    // Security headers middleware
    app.use((req: Request, res: Response, next: NextFunction) => {
      // HSTS - Force HTTPS for 1 year
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

      // Content Security Policy - Restrict resource loading
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline' https://telegram.org; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.telegram.org; frame-ancestors 'none';"
      );

      // Prevent clickjacking
      res.setHeader('X-Frame-Options', 'DENY');

      // Prevent MIME type sniffing
      res.setHeader('X-Content-Type-Options', 'nosniff');

      // XSS Protection (legacy browsers)
      res.setHeader('X-XSS-Protection', '1; mode=block');

      next();
    });

    // Middleware setup (in order)
    app.use(compression());

    // CORS configuration - allow Vercel preview URLs
    const corsOptions = {
      origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) {
          return callback(null, true);
        }

        // Allow main frontend URL
        if (origin === FRONTEND_URL) {
          return callback(null, true);
        }

        // Allow Vercel preview URLs (*.vercel.app)
        if (origin.endsWith('.vercel.app')) {
          return callback(null, true);
        }

        // Allow localhost for development
        if (origin.includes('localhost')) {
          return callback(null, true);
        }

        // Reject other origins
        callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    };

    app.use(cors(corsOptions));
    app.use(express.json());

    // Response time tracking middleware
    app.use(responseTimeMiddleware);

    // Request logging middleware
    app.use((req: Request, res: Response, next: NextFunction) => {
      logRequest(req);
      next();
    });

    // Cache-control headers middleware
    app.use((req: Request, res: Response, next: NextFunction) => {
      // Set no-cache for API responses
      if (req.path.startsWith('/api')) {
        res.setHeader('Cache-Control', 'no-cache');
      }
      // Set long-term cache for static assets
      else if (/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i.test(req.path)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000');
      }
      next();
    });

    // Health check endpoint (for monitoring services like Render)
    app.get('/api/health', (req: Request, res: Response) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      });
    });

    // Setup endpoint (no authentication or rate limiting)
    app.use('/api/setup', setupRoutes);

    // Rate limiting configuration
    const authLimiter = rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 50, // 50 requests per minute
      message: { error: 'Too many authentication attempts, please try again later' },
      standardHeaders: true,
      legacyHeaders: false,
    });

    const caseOpeningLimiter = rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 10, // 10 requests per minute
      message: { error: 'Too many case opening attempts, please try again later' },
      standardHeaders: true,
      legacyHeaders: false,
    });

    const adminLimiter = rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 20, // 20 requests per minute
      message: { error: 'Too many admin requests, please try again later' },
      standardHeaders: true,
      legacyHeaders: false,
    });

    // Mount route handlers with rate limiting
    app.use('/api/auth', authLimiter, authRoutes);
    app.use('/api/cases', caseOpeningLimiter, caseRoutes);
    app.use('/api/user', userRoutes);
    app.use('/api/admin', adminLimiter, adminRoutes);
    app.use('/api/verify', verifyRoutes);

    // 404 handler
    app.use((req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.url} not found`
      });
    });

    // Error handling middleware
    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      // Log error with full context
      logError(err.message || 'Internal Server Error', req, err);

      // Also log to console for immediate visibility
      console.error('Error:', err);

      res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
      });
    });

    // Start server
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
      console.log('Server ready');

      // Start resource monitoring
      startMonitoring();
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
async function shutdown() {
  console.log('\nShutting down gracefully...');
  try {
    stopMonitoring();
    await closeDatabase();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start the server
startServer();

export { };