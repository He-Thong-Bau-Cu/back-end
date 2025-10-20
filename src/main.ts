import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/middleware/http-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
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
    // .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  await app.listen(process.env.PORT ?? 443);
  Logger.log(`Server run at port ${process.env.PORT ?? 3000} 😍😍😍`, 'Server');
}
bootstrap();
