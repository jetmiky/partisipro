/**
 * Firebase Functions Entry Point for NestJS Backend
 * This file adapts the NestJS application to work with Firebase Functions
 */

import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter, TransformInterceptor } from './common';
import * as functions from 'firebase-functions';
import express from 'express';
import helmet from 'helmet';

// Create Express server
const server = express();

// Global variables to cache the NestJS app
let cachedApp: any = null;

const createNestServer = async (expressInstance: express.Express) => {
  // Use cached app if available (for warm starts)
  if (cachedApp) {
    return cachedApp;
  }

  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressInstance),
    {
      logger:
        process.env.NODE_ENV === 'production'
          ? ['error', 'warn']
          : ['error', 'warn', 'log', 'debug'],
    }
  );

  // Get config service
  const configService = app.get(ConfigService);

  // Security middleware
  app.use(
    helmet({
      contentSecurityPolicy: false, // Firebase Functions may need this disabled
    })
  );

  // CORS configuration for Firebase Functions
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://partisipro-frontend.vercel.app',
      'https://partisipro.id',
      'https://partisipro-staging.vercel.app',
      configService?.get('app.corsOrigin') || 'http://localhost:3000',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      disableErrorMessages: process.env.NODE_ENV === 'production',
    })
  );

  // Global filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(new TransformInterceptor());

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger documentation (only in development)
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Partisipro API')
      .setDescription(
        'Blockchain-based Platform for Public Private Partnership Funding'
      )
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Authentication', 'User authentication and authorization')
      .addTag('Users', 'User management and profiles')
      .addTag('Projects', 'Project creation and management')
      .addTag('Investments', 'Investment tracking and management')
      .addTag('KYC', 'Know Your Customer verification')
      .addTag('Payments', 'Payment processing and management')
      .addTag('Profits', 'Profit distribution and claims')
      .addTag('Blockchain', 'Blockchain interactions')
      .addTag('Admin', 'Administrative functions')
      .addTag('Governance', 'Governance proposals and voting')
      .addTag('Notifications', 'User notifications and alerts')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  await app.init();

  // Cache the app for warm starts
  cachedApp = app;

  return app;
};

// Initialize the NestJS app
createNestServer(server)
  .then(() => {
    console.log('✅ NestJS app initialized for Firebase Functions');
  })
  .catch(err => {
    console.error('❌ Failed to initialize NestJS app:', err);
  });

// Export Firebase Function
export const api = functions.https.onRequest(server);

// Health check function (lightweight)
export const healthCheck = functions.https.onRequest((req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
  });
});

// Background function for warming (to prevent cold starts)
// Note: Scheduled functions will be added later with proper Firebase Functions v2 configuration
export const keepWarm = functions.https.onRequest((req, res) => {
  console.log('🔥 Warming function to prevent cold starts');
  res.status(200).json({
    status: 'warm',
    timestamp: new Date().toISOString(),
    message: 'Function warmed successfully',
  });
});
