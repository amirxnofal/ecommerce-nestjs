import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { env } from './config/env.service.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(env.port ?? 3000, () => {
    console.log(
      `\x1b[1;36m[SERVER]\x1b[0m Server is running on http://localhost:${env.port}`,
    );
  });
}
await bootstrap();
