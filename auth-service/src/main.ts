import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Allow requests from the React frontend
  app.enableCors({ origin: '*' });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  // ─── Swagger ──────────────────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('Auth Service API')
    .setDescription(
      `## Library Management System — Auth Service\n\nHandles **user registration and login** with role-based JWT tokens.\n\n### Roles\n| Role | Access |\n|---|---|\n| **ADMIN** | Full system control |\n| **LIBRARIAN** | Manage borrows & returns |\n| **MEMBER** | View own records |\n\n### How to use\n1. Register via \`POST /auth/register\`\n2. Login via \`POST /auth/login\` — get \`access_token\`\n3. Paste token in **Authorize** to test protected endpoints`
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT-auth',
    )
    .addTag('Auth', 'Register, Login, and Profile endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
    customSiteTitle: 'Auth Service — Swagger UI',
  });

  const PORT = process.env.PORT || 3007;
  await app.listen(PORT);

  console.log(`\n✅  Auth Service running on http://localhost:${PORT}`);
  console.log(`📖  Swagger UI at http://localhost:${PORT}/api/docs\n`);
}

bootstrap();
