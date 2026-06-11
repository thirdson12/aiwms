import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { runDeployMigrations } from './migrate-on-start';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: config.get<string>('CORS_ORIGIN', 'http://localhost:3000'),
    credentials: true,
  });

  const port = Number(process.env.PORT ?? config.get('API_PORT') ?? 3001);
  const onRender = Boolean(process.env.RENDER);

  await app.listen(port, '0.0.0.0');
  console.log(`API listening on port ${port}`);

  if (onRender) {
    console.log('Running database migrations...');
    await runDeployMigrations();
    console.log('Database ready');
  }
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
