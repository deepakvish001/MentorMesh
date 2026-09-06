import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule, DomainExceptionFilter } from "./app.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new DomainExceptionFilter());
  app.setGlobalPrefix("api");
  const allowedOrigins = (process.env.CORS_ORIGINS ?? "").split(",").map((origin) => origin.trim()).filter(Boolean);
  app.enableCors({ origin: allowedOrigins.length ? allowedOrigins : false, methods: ["GET", "POST", "PUT"] });
  app.enableShutdownHooks();
  await app.listen(Number(process.env.PORT ?? 3000));
}
void bootstrap();
