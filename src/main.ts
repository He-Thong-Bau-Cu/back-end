import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/middleware/http-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import * as cookieParser from 'cookie-parser';
import * as csurf from 'csurf';
import compression from 'compression';
import * as dotenv from 'dotenv';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  dotenv.config();
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginOpenerPolicy: false,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );
  app.setGlobalPrefix('api');
  app.use(
    rateLimit({
      windowMs: 10 * 60 * 1000,
      max: 3000,
      message: 'Quá nhiều request từ IP này. Vui lòng thử lại sau.',
    }),
  );
  // app.use(cookieParser());
  // app.use(
  //   csurf({
  //     cookie: {
  //       httpOnly: true,
  //       sameSite: 'strict',
  //       secure: true,
  //     },
  //   }),
  // );
  app.use(
    compression({
      level: 6,
      threshold: 1024,
    }),
  );
  const u = path.join(process.cwd(), 'uploads');
  const c = path.join(process.cwd(), 'certs');
  if (!fs.existsSync(u)) fs.mkdirSync(u);
  if (!fs.existsSync(c)) fs.mkdirSync(c);
  const config = new DocumentBuilder()
    .setTitle('Election System API')
    .setDescription('API docs cho hệ thống bầu cử')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token',
        in: 'header',
      },
      'access-token')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // nhớ token sau khi bạn Authorize
    },
  });
  await app.listen(process.env.PORT ?? 3000);
  Logger.log(`Server run at port ${process.env.PORT ?? 3000} 😍😍😍`, 'Server');
}
bootstrap();
