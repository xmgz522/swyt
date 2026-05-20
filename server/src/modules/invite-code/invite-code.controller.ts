import { Controller, Post, Get, Delete, Body, Query, Req, ForbiddenException } from '@nestjs/common';
import { InviteCodeService } from './invite-code.service';

@Controller('invite-codes')
export class InviteCodeController {
  constructor(private service: InviteCodeService) {}

  private checkAdmin(req: any) {
    const role = req?.user?.role;
    if (role !== 'superadmin' && role !== 'admin') {
      throw new ForbiddenException('仅管理员可操作');
    }
  }

  // 批量生成注册码
  @Post('generate')
  async generate(@Body() body: { count: number; expireDays?: number; remark?: string }, @Req() req: any) {
    this.checkAdmin(req);
    const count = Math.min(body.count || 10, 500); // 最多一次500个
    return this.service.batchGenerate(count, body.expireDays, body.remark);
  }

  // 获取注册码列表
  @Get()
  async list(@Query('status') status?: string, @Req() req?: any) {
    this.checkAdmin(req);
    return this.service.findAll(status);
  }

  // 批量删除未使用的注册码
  @Delete()
  async deleteUnused(@Body() body: { ids: number[] }, @Req() req?: any) {
    this.checkAdmin(req);
    return this.service.deleteUnused(body.ids);
  }
}
