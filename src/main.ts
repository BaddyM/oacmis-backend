import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';

async function bootstrap() {
    // Disable Nest's built-in body parser so we can raise the size limit —
    // student/staff records can carry base64 profile photos in the JSON body.
    const app = await NestFactory.create(AppModule, { bodyParser: false });
    // Generous limit: base64 profile photos plus bulk report HTML (many pupils
    // in one PDF request) can make bodies large.
    app.use(json({ limit: '60mb' }));
    app.use(urlencoded({ extended: true, limit: '60mb' }));

    if (process.env.MODE == "Dev") {
        // Set up Swagger
        const config = new DocumentBuilder()
            .setTitle('Jubra Stock Management API')
            .setDescription('API documentation for Jubra')
            .setVersion('1.0')
            .addBearerAuth()
            .build();

        const document = SwaggerModule.createDocument(app, config);
        SwaggerModule.setup('api', app, document); // Swagger UI at /api
    }

    // whitelist strips properties that have no DTO decorator, so stray fields
    // (e.g. an `id` on create) never reach Prisma and cause validation errors.
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.enableCors();

    await app.listen(process.env.PORT ?? 3000);
    console.log(`🚀 Server running at http://localhost:${process.env.PORT}`);
    console.log(`📄 Swagger UI available at http://localhost:${process.env.PORT}/api`);
}
bootstrap();

