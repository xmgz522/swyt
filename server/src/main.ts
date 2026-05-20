import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuditInterceptor } from './interceptors/audit.interceptor';
import { AuditService } from './modules/audit/audit.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors();
  app.setGlobalPrefix('api');
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useGlobalGuards(new JwtAuthGuard(app.get(JwtService), app.get(Reflector)));
  app.useGlobalInterceptors(new AuditInterceptor(app.get(AuditService)));
  await app.listen(3000);
  console.log('服务已启动: http://localhost:3000');
}
bootstrap();
