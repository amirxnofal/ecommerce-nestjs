import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000, () => {
    console.log(
      '\x1b[1;36m[SERVER]\x1b[0m Server is running on http://localhost:3000',
    );
  });
}
await bootstrap();
