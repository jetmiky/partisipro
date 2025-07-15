/**
 * Simple test functions for Firebase Functions
 */

import * as functions from 'firebase-functions';

// Simple hello world function
export const hello = functions.https.onRequest((req, res) => {
  res.status(200).json({
    message: 'Hello from Partisipro Firebase Functions!',
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
  });
});

// Health check function
export const health = functions.https.onRequest((req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'partisipro-backend',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});
