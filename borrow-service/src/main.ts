import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  // ─── Swagger ──────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('Borrow Service API')
    .setDescription(
      `## Library Management System — Borrow Service\n\nHandle borrowing, returning, and user authentication with role-based access.\n\n### Roles\n- **ADMIN** — Full access\n- **LIBRARIAN** — Manage borrows\n- **MEMBER** — View own borrows\n\n### How to Authenticate\n1. Register via \`POST /auth/register\`\n2. Login via \`POST /auth/login\` — get \`access_token\`\n3. Click **Authorize** and enter: \`Bearer <access_token>\``
    )
    .setVersion('1.0.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Enter: Bearer <token>' }, 'JWT-auth')
    .addTag('Auth', 'Register, Login, and user profile endpoints')
    .addTag('Borrows', 'Borrow and return book transactions (requires authentication)')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
    customSiteTitle: 'Borrow Service — Swagger UI',
  });

  const PORT = process.env.PORT || 3003;
  await app.listen(PORT);

  console.log(`\n🚀  Borrow Service running at http://localhost:${PORT}`);
  console.log(`📖  Swagger UI at http://localhost:${PORT}/api/docs\n`);
}

bootstrap();
