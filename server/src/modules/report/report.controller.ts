import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { ReportService } from './report.service';
import { WeeklyReportService } from './weekly-report.service';
import { Public } from '../../decorators/public.decorator';
import { Roles } from '../../decorators/roles.decorator';

@Controller('report')
export class ReportController {
  constructor(
    private reportService: ReportService,
    private weeklyService: WeeklyReportService,
  ) {}

  @Get('student/:id')
  getStudentReport(@Param('id') id: string) {
    return this.reportService.getStudentReport(+id);
  }

  @Public()
  @Get('student/:id/public')
  getStudentReportPublic(@Param('id') id: string) {
    return this.reportService.getStudentReport(+id);
  }

  // ========== 学情周报 ==========

  // 后台：周报汇总列表（必须在 weekly/:id 之前）
  @Get('weekly/all')
  @Roles('superadmin', 'admin', 'teacher')
  getWeeklyAll() {
    return this.weeklyService.findAll();
  }

  // 后台：某周全部学生周报
  @Get('weekly/week')
  @Roles('superadmin', 'admin', 'teacher')
  getWeeklyByWeek(@Query('weekStart') weekStart: string) {
    return this.weeklyService.getAllByWeek(weekStart);
  }

  // 后台：手动生成全部周报
  @Post('weekly/generate')
  @Roles('superadmin', 'admin')
  generateWeekly() {
    return this.weeklyService.generateAllReports();
  }

  // 后台：为单个学生生成周报
  @Post('weekly/generate/:studentId')
  @Roles('superadmin', 'admin')
  generateForStudent(@Param('studentId') studentId: string) {
    return this.weeklyService.generateForStudent(+studentId);
  }

  // 后台：推送周报通知
  @Post('weekly/notify')
  @Roles('superadmin', 'admin')
  notifyWeekly(@Query('weekStart') weekStart: string) {
    return this.weeklyService.notifyReports(weekStart);
  }

  // 小程序：学生周报列表
  @Public()
  @Get('weekly/student/:studentId')
  getWeeklyList(@Param('studentId') studentId: string) {
    return this.weeklyService.getStudentReports(+studentId);
  }

  // 小程序：学生最新周报
  @Public()
  @Get('weekly/student/:studentId/latest')
  getWeeklyLatest(@Param('studentId') studentId: string) {
    return this.weeklyService.getLatest(+studentId);
  }

  // 小程序：周报详情（放最后，:id 是通配）
  @Public()
  @Get('weekly/:id')
  getWeeklyDetail(@Param('id') id: string) {
    return this.weeklyService.getReport(+id);
  }
}
