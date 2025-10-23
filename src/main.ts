import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { Logger, ValidationPipe } from "@nestjs/common";
import { HttpExceptionFilter } from "./common/middleware/http-exception.filter";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import * as fs from "fs";
import * as path from "path";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "https://hethongbaucu.netlify.app/",
    ],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  });
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    })
  );
  app.use(
    rateLimit({
      windowMs: 10 * 60 * 1000,
      max: 3000,
      message: "Quá nhiều request từ IP này. Vui lòng thử lại sau.",
    })
  );
  const u = path.join(process.cwd(), "uploads");
  const c = path.join(process.cwd(), "certs");
  if (!fs.existsSync(u)) fs.mkdirSync(u);
  if (!fs.existsSync(c)) fs.mkdirSync(c);
  const config = new DocumentBuilder()
    .setTitle("Election System API")
    .setDescription("API docs cho hệ thống bầu cử")
    .setVersion("1.0")
    .addBearerAuth(
      { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      "access-token"
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);
  await app.listen(process.env.PORT ?? 3000);
  Logger.log(`Server run at port ${process.env.PORT ?? 3000} 😍😍😍`, "Server");
}
bootstrap();
