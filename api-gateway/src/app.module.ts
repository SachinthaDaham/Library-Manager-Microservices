import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { AuthMiddleware } from './auth.middleware';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 1. PUBLIC ROUTES (No Token Required)
    consumer
      .apply(createProxyMiddleware({ 
        target: 'http://localhost:3001', 
        changeOrigin: true,
        pathRewrite: { '^/api/auth': '/auth' }
      }))
      .forRoutes({ path: '/api/auth/*', method: RequestMethod.ALL });

    // 2. CENTRALIZED JWT VALIDATION
    consumer
      .apply(AuthMiddleware)
      .forRoutes(
        { path: '/api/members/*', method: RequestMethod.ALL },
        { path: '/api/books/*', method: RequestMethod.ALL },
        { path: '/api/borrows/*', method: RequestMethod.ALL },
        { path: '/api/fines/*', method: RequestMethod.ALL },
        { path: '/api/reservations/*', method: RequestMethod.ALL },
        { path: '/api/notifications/*', method: RequestMethod.ALL },
      );

    // 3. PROTECTED REVERSE PROXY ROUTES
    consumer.apply(createProxyMiddleware({ target: 'http://localhost:3001', changeOrigin: true, pathRewrite: { '^/api/members': '/members' } })).forRoutes('/api/members/*');
    consumer.apply(createProxyMiddleware({ target: 'http://localhost:3002', changeOrigin: true, pathRewrite: { '^/api/books': '/books' } })).forRoutes('/api/books/*');
    consumer.apply(createProxyMiddleware({ target: 'http://localhost:3003', changeOrigin: true, pathRewrite: { '^/api/borrows': '/borrows' } })).forRoutes('/api/borrows/*');
    consumer.apply(createProxyMiddleware({ target: 'http://localhost:3004', changeOrigin: true, pathRewrite: { '^/api/fines': '/fines' } })).forRoutes('/api/fines/*');
    consumer.apply(createProxyMiddleware({ target: 'http://localhost:3005', changeOrigin: true, pathRewrite: { '^/api/reservations': '/reservations' } })).forRoutes('/api/reservations/*');
    consumer.apply(createProxyMiddleware({ target: 'http://localhost:3006', changeOrigin: true, pathRewrite: { '^/api/notifications': '/notifications' } })).forRoutes('/api/notifications/*');
  }
}
