import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter, TransformInterceptor } from './common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security middleware
  app.use(helmet());

  // CORS configuration
  app.enableCors({
    origin: configService.get('app.corsOrigin'),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      disableErrorMessages: configService.get('app.nodeEnv') === 'production',
    })
  );

  // Global filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(new TransformInterceptor());

  // API prefix
  app.setGlobalPrefix(configService.get('app.apiPrefix'));

  // Swagger documentation
  if (configService.get('app.nodeEnv') !== 'production') {
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

  const port = configService.get('app.port');
  await app.listen(port);

  console.log(`
🚀 Partisipro Backend is running on: http://localhost:${port}
📚 API Documentation: http://localhost:${port}/api/docs
🔥 Environment: ${configService.get('app.nodeEnv')}
  `);
}
bootstrap();
