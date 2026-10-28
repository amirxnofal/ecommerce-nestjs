import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { env } from './config/env.service.js';
import { Logger } from '@nestjs/common';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	const port = env.port ?? 3000;

	app.enableCors({
		origin: 'http://localhost:4200',
		credentials: true,
	});
	
	await app.listen(port, () => {
		const logger = new Logger('Bootstrap');
		logger.log(`Server is running on http://localhost:${port}`);
	});
}
await bootstrap();
