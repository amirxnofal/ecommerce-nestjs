import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { env } from './config/env.service.js';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	const port = env.port ?? 3000;

	app.enableCors({
		origin: 'http://localhost:4200',
		credentials: true,
	});

	app.useGlobalPipes(
		new ValidationPipe({ whitelist: true, transform: true }),
	);
	
	await app.listen(port, () => {
		const logger = new Logger('Bootstrap');
		logger.log(`Server is running on http://localhost:${port}`);
	});
}
await bootstrap();
