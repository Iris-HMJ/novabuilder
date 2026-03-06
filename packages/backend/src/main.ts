import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  // CORS
  app.enableCors();

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`🚀 NovaBuilder Backend running on http://localhost:${port}`);
}

bootstrap();
