import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditService } from '../modules/audit/audit.service';

// 需要记录的路由模式
const AUDIT_RULES: { method: string; pattern: RegExp; module: string; action: string; detail: (req: any) => string }[] = [
  { method: 'POST', pattern: /\/api\/auth\/login$/, module: '认证', action: 'login', detail: (req) => `用户登录: ${req.body?.username}` },
  { method: 'POST', pattern: /\/api\/exam\/questions$/, module: '题库', action: 'create', detail: (req) => `创建题目` },
  { method: 'PUT', pattern: /\/api\/exam\/questions\/\d+$/, module: '题库', action: 'update', detail: (req) => `修改题目#${req.params?.id}` },
  { method: 'DELETE', pattern: /\/api\/exam\/questions\/\d+$/, module: '题库', action: 'delete', detail: (req) => `删除题目#${req.params?.id}` },
  { method: 'POST', pattern: /\/api\/exam\/papers$/, module: '试卷', action: 'create', detail: (req) => `创建试卷: ${req.body?.title}` },
  { method: 'POST', pattern: /\/api\/exam\/answer-sheets\/\d+\/grade$/, module: '批改', action: 'grade', detail: (req) => `批改答卷#${req.params?.id}` },
  { method: 'POST', pattern: /\/api\/schools$/, module: '院校', action: 'create', detail: (req) => `创建院校: ${req.body?.name}` },
  { method: 'PUT', pattern: /\/api\/schools\/\d+$/, module: '院校', action: 'update', detail: (req) => `修改院校#${req.params?.id}` },
  { method: 'DELETE', pattern: /\/api\/schools\/\d+$/, module: '院校', action: 'delete', detail: (req) => `删除院校#${req.params?.id}` },
  { method: 'POST', pattern: /\/api\/notifications$/, module: '通知', action: 'create', detail: (req) => `发布通知: ${req.body?.title}` },
  { method: 'DELETE', pattern: /\/api\/notifications\/\d+$/, module: '通知', action: 'delete', detail: (req) => `删除通知#${req.params?.id}` },
  { method: 'POST', pattern: /\/api\/policies$/, module: '政策', action: 'create', detail: (req) => `发布政策: ${req.body?.title}` },
  { method: 'POST', pattern: /\/api\/export\/import/, module: '导入', action: 'import', detail: (req) => `批量导入` },
  { method: 'POST', pattern: /\/api\/auth\/change-password$/, module: '认证', action: 'update', detail: () => `修改密码` },
  { method: 'PUT', pattern: /\/api\/auth\/reset-password\/\d+$/, module: '认证', action: 'update', detail: (req) => `重置密码: 用户#${req.params?.userId}` },
  { method: 'POST', pattern: /\/api\/auth\/users$/, module: '用户', action: 'create', detail: (req) => `创建用户: ${req.body?.username}` },
  { method: 'PUT', pattern: /\/api\/auth\/users\/\d+$/, module: '用户', action: 'update', detail: (req) => `修改用户#${req.params?.id}` },
  { method: 'DELETE', pattern: /\/api\/auth\/users\/\d+$/, module: '用户', action: 'delete', detail: (req) => `删除用户#${req.params?.id}` },
];

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;
    const url = req.originalUrl || req.url;

    const rule = AUDIT_RULES.find(r => r.method === method && r.pattern.test(url));
    if (!rule) return next.handle();

    return next.handle().pipe(
      tap(async (responseData) => {
        try {
          // 登录操作从响应中取用户信息
          let userId = req.user?.id || 0;
          let username = req.user?.username || '';

          if (rule.action === 'login' && responseData?.success) {
            userId = responseData.user?.id || 0;
            username = req.body?.username || '';
          }

          // 只记录成功的操作
          if (rule.action === 'login' && !responseData?.success) return;

          await this.auditService.log({
            userId,
            username: username || `user#${userId}`,
            module: rule.module,
            action: rule.action,
            detail: rule.detail(req),
            ip: req.ip || req.connection?.remoteAddress || '',
          });
        } catch (e) {
          console.error('Audit log error:', e);
        }
      }),
    );
  }
}
