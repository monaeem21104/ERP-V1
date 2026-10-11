import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = new Logger('Bootstrap');

  app.use(helmet());
  app.use(cookieParser());
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const origin = process.env.WEB_ORIGIN ?? 'http://localhost:5173';
  app.enableCors({
    origin,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'X-Company-Id'],
  });

  const swagger = new DocumentBuilder()
    .setTitle('Industrial ERP API')
    .setDescription('REST API for the industrial ERP modular monolith')
    .setVersion('1.0')
    .addCookieAuth('access_token')
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swagger));

  app.enableShutdownHooks();
  const port = Number(process.env.API_PORT ?? 3000);
  await app.listen(port);
  logger.log(`API listening on ${port}`);
}

bootstrap();
