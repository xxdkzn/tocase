import fs from 'fs';
import path from 'path';
import { Request } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * Log levels for the logging service
 */
export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO'
}

/**
 * Logger configuration
 */
const LOGS_DIR = path.join(__dirname, '../../logs');

/**
 * Ensure logs directory exists
 */
function ensureLogsDirectory(): void {
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  }
}

/**
 * Get current date in YYYY-MM-DD format
 */
function getCurrentDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get log file path for current date
 */
function getLogFilePath(): string {
  const date = getCurrentDate();
  return path.join(LOGS_DIR, `error-${date}.log`);
}

/**
 * Format timestamp in ISO format
 */
function formatTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Extract user ID from request (if authenticated)
 */
function extractUserId(req: Request): string {
  const authReq = req as AuthenticatedRequest;
  return authReq.user?.userId?.toString() || 'anonymous';
}

/**
 * Extract IP address from request
 */
function extractIpAddress(req: Request): string {
  return req.ip || req.socket.remoteAddress || 'unknown';
}

/**
 * Write log entry to file
 * 
 * SECURITY: Never log sensitive data such as:
 * - Passwords or authentication tokens
 * - JWT secrets or API keys
 * - Personal identification numbers
 * - Credit card or payment information
 * - Full user session data
 */
function writeLog(level: LogLevel, message: string, req?: Request, error?: Error): void {
  ensureLogsDirectory();
  
  const timestamp = formatTimestamp();
  const userId = req ? extractUserId(req) : 'system';
  const method = req?.method || '-';
  const endpoint = req?.url || '-';
  const ip = req ? extractIpAddress(req) : '-';
  
  let logEntry = `[${timestamp}] [${level}] [${userId}] [${method}] [${endpoint}] [${ip}] ${message}\n`;
  
  // Add stack trace for errors
  if (error && error.stack) {
    logEntry += `${error.stack}\n`;
  }
  
  logEntry += '\n'; // Add blank line between entries
  
  const logFilePath = getLogFilePath();
  
  try {
    fs.appendFileSync(logFilePath, logEntry, 'utf8');
  } catch (err) {
    // Fallback to console if file writing fails
    console.error('Failed to write to log file:', err);
    console.error('Original log entry:', logEntry);
  }
}

/**
 * Log an error with full context
 * @param message - Error message
 * @param req - Express request object (optional)
 * @param error - Error object (optional)
 */
export function logError(message: string, req?: Request, error?: Error): void {
  writeLog(LogLevel.ERROR, message, req, error);
}

/**
 * Log a warning
 * @param message - Warning message
 * @param req - Express request object (optional)
 */
export function logWarn(message: string, req?: Request): void {
  writeLog(LogLevel.WARN, message, req);
}

/**
 * Log an informational message
 * @param message - Info message
 * @param req - Express request object (optional)
 */
export function logInfo(message: string, req?: Request): void {
  writeLog(LogLevel.INFO, message, req);
}

/**
 * Log an incoming request
 * @param req - Express request object
 */
export function logRequest(req: Request): void {
  const userId = extractUserId(req);
  const message = `Request received from user ${userId}`;
  writeLog(LogLevel.INFO, message, req);
}
