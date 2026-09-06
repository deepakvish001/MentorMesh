import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule, DomainExceptionFilter } from "./app.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new DomainExceptionFilter());
  app.setGlobalPrefix("api");
  await app.listen(Number(process.env.PORT ?? 3000));
}
void bootstrap();
