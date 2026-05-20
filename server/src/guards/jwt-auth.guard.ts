import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const auth = request.headers.authorization;
    const queryToken = request.query?.token;

    let token: string | null = null;
    if (auth && auth.startsWith('Bearer ')) {
      token = auth.split(' ')[1];
    } else if (queryToken) {
      token = queryToken;
    }

    if (!token) {
      throw new UnauthorizedException('请先登录');
    }

    try {
      const payload = this.jwtService.verify(token);
      request.user = payload;
      const roles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
      if (roles?.length && !roles.includes(payload.role)) {
        throw new ForbiddenException('无权限访问');
      }
      return true;
    } catch (e) {
      if (e instanceof ForbiddenException) throw e;
      throw new UnauthorizedException('登录已过期，请重新登录');
    }
  }
}
