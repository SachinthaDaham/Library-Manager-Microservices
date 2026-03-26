import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { AuthMiddleware } from './auth.middleware';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 1. PUBLIC ROUTES â€” Auth and public book browsing (no token needed)
    consumer
      .apply(createProxyMiddleware({
        target: 'http://auth-service:3007',
        changeOrigin: true,
        pathRewrite: { '^/api/auth': '/auth' }
      }))
      .forRoutes(
        { path: '/api/auth', method: RequestMethod.ALL },
        { path: '/api/auth/*', method: RequestMethod.ALL },
      );

    // Public GET for books (catalog browsing by guests)
    consumer
      .apply(createProxyMiddleware({ target: 'http://book-service:3002', changeOrigin: true, pathRewrite: { '^/api/books': '/books' } }))
      .forRoutes(
        { path: '/api/books', method: RequestMethod.GET },
        { path: '/api/books/*', method: RequestMethod.GET },
      );

    // 2. JWT validation on protected routes
    consumer.apply(AuthMiddleware).forRoutes(
      { path: '/api/books', method: RequestMethod.POST },
      { path: '/api/books/*', method: RequestMethod.PUT },
      { path: '/api/books/*', method: RequestMethod.DELETE },
      { path: '/api/borrows', method: RequestMethod.ALL },
      { path: '/api/borrows/*', method: RequestMethod.ALL },
      { path: '/api/fines', method: RequestMethod.ALL },
      { path: '/api/fines/*', method: RequestMethod.ALL },
      { path: '/api/reservations', method: RequestMethod.ALL },
      { path: '/api/reservations/*', method: RequestMethod.ALL },
      { path: '/api/notifications', method: RequestMethod.ALL },
      { path: '/api/notifications/*', method: RequestMethod.ALL },
      { path: '/api/members', method: RequestMethod.ALL },
      { path: '/api/members/*', method: RequestMethod.ALL },
    );

    // 3. Protected reverse-proxy routes (base + wildcard)
    consumer.apply(createProxyMiddleware({ target: 'http://book-service:3002', changeOrigin: true, pathRewrite: { '^/api/books': '/books' } }))
      .forRoutes(
        { path: '/api/books', method: RequestMethod.POST },
        { path: '/api/books/*', method: RequestMethod.ALL },
      );
    consumer.apply(createProxyMiddleware({ target: 'http://auth-service:3007', changeOrigin: true, pathRewrite: { '^/api/members': '/members' } }))
      .forRoutes('/api/members', '/api/members/*');
    consumer.apply(createProxyMiddleware({ target: 'http://borrow-service:3003', changeOrigin: true, pathRewrite: { '^/api/borrows': '/borrows' } }))
      .forRoutes('/api/borrows', '/api/borrows/*');
    consumer.apply(createProxyMiddleware({ target: 'http://fine-service:3004', changeOrigin: true, pathRewrite: { '^/api/fines': '/fines' } }))
      .forRoutes('/api/fines', '/api/fines/*');
    consumer.apply(createProxyMiddleware({ target: 'http://reservation-service:3005', changeOrigin: true, pathRewrite: { '^/api/reservations': '/reservations' } }))
      .forRoutes('/api/reservations', '/api/reservations/*');
    consumer.apply(createProxyMiddleware({ target: 'http://notification-service:3006', changeOrigin: true, pathRewrite: { '^/api/notifications': '/notifications' } }))
      .forRoutes('/api/notifications', '/api/notifications/*');
  }
}

