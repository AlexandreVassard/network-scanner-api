import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import helmet from '@fastify/helmet';
import fastifyCsrf from '@fastify/csrf-protection';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    { cors: true },
  );
  const configService = app.get<ConfigService>(ConfigService);
  const port = parseInt(configService.get('API_PORT') || '3000');
  await app.register(helmet);
  await app.register(fastifyCsrf);
  await app.listen(port, '0.0.0.0');
}
bootstrap();
