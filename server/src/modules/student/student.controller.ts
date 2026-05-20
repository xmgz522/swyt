import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentService } from './student.service';
import { InviteCodeService } from '../invite-code/invite-code.service';
import { LoginLog } from '../../entities/login-log.entity';
import { Public } from '../../decorators/public.decorator';

@Controller('students')
export class StudentController {
  constructor(
    private studentService: StudentService,
    private inviteCodeService: InviteCodeService,
    @InjectRepository(LoginLog)
    private loginLogRepo: Repository<LoginLog>,
  ) {}

  @Public()
  @Post()
  async create(@Body() body: any) {
    const { inviteCode, ...data } = body;
    if (!inviteCode) {
      throw new BadRequestException('请输入注册码');
    }
    const check = await this.inviteCodeService.validate(inviteCode);
    if (!check.valid) {
      throw new BadRequestException(check.message);
    }
    const student = await this.studentService.create(data);
    // 标记注册码已使用
    await this.inviteCodeService.markUsed(inviteCode, student.id, student.name);
    return student;
  }

  // === 静态路由必须在 :id 参数路由之前 ===

  @Public()
  @Post('login')
  async login(@Body() body: { phone: string; password: string; platform?: string }, @Req() req: any) {
    const result = await this.studentService.login(body.phone, body.password);
    if (result.success && result.data) {
      this.loginLogRepo.save(this.loginLogRepo.create({
        studentId: result.data.id,
        studentName: result.data.name,
        phone: body.phone,
        platform: body.platform || 'unknown',
        ip: req.ip || req.connection?.remoteAddress || '',
        userAgent: req.headers?.['user-agent'] || '',
      })).catch(() => {});
    }
    return result;
  }

  @Public()
  @Post('request-reset')
  async requestReset(@Body() body: { phone: string }) {
    if (!body.phone || !/^1[3-9]\d{9}$/.test(body.phone)) {
      throw new BadRequestException('请输入正确的手机号');
    }
    return this.studentService.requestPasswordReset(body.phone);
  }

  @Post('auto-assign')
  autoAssign() {
    return this.studentService.autoAssignUnassigned();
  }

  @Get()
  findAll(@Query('page') page?: string, @Query('pageSize') pageSize?: string, @Req() req?: any) {
    const user = req?.user;
    const teacherId = (user?.role === 'teacher') ? user.id : undefined;
    return this.studentService.findAll(page ? +page : undefined, pageSize ? +pageSize : undefined, teacherId);
  }

  @Get('login-logs')
  async getLoginLogs(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('studentId') studentId?: string,
    @Query('phone') phone?: string,
  ) {
    const where: any = {};
    if (studentId) where.studentId = +studentId;
    if (phone) where.phone = phone;
    const p = page ? +page : 1;
    const ps = pageSize ? +pageSize : 20;
    const [data, total] = await this.loginLogRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (p - 1) * ps,
      take: ps,
    });
    return { data, total, page: p, pageSize: ps };
  }

  @Get('reset-requests')
  async getResetRequests() {
    return this.studentService.getResetRequests();
  }

  @Public()
  @Get('check-status/:id')
  checkStatus(@Param('id') id: string) {
    return this.studentService.checkStatus(+id);
  }

  // === :id 参数路由 ===

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.studentService.findOne(+id);
  }

  @Public()
  @Put(':id')
  update(@Param('id') id: string, @Body() body: any, @Req() req?: any) {
    const user = req?.user;
    if (body.teacherId !== undefined && user?.role === 'teacher') {
      delete body.teacherId;
    }
    return this.studentService.update(+id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.studentService.remove(+id);
  }

  @Put(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { status?: string; expireAt?: string }) {
    const update: any = {};
    if (body.status) update.status = body.status;
    if (body.expireAt) update.expireAt = new Date(body.expireAt);
    return this.studentService.update(+id, update);
  }

  @Public()
  @Post(':id/change-password')
  changePassword(@Param('id') id: string, @Body() body: { oldPassword: string; newPassword: string }) {
    return this.studentService.changePassword(+id, body.oldPassword, body.newPassword);
  }

  @Public()
  @Post(':id/change-phone')
  changePhone(@Param('id') id: string, @Body() body: { newPhone: string; password: string }) {
    return this.studentService.changePhone(+id, body.newPhone, body.password);
  }

  @Post(':id/reset-password')
  resetPassword(@Param('id') id: string, @Body() body: { newPassword?: string }) {
    return this.studentService.resetPassword(+id, body.newPassword);
  }

  @Post(':id/handle-reset')
  async handleReset(@Param('id') id: string, @Body() body: { newPassword?: string }) {
    return this.studentService.resetPassword(+id, body.newPassword);
  }
}
