import { Controller, Get, Post, Put, Delete, Param, Query, Body } from '@nestjs/common';
import { StudyPlanService } from './study-plan.service';
import { Public } from '../../decorators/public.decorator';

@Controller('study-plan')
export class StudyPlanController {
  constructor(private planService: StudyPlanService) {}

  // ===== 每日任务（全局循环任务）=====

  @Public()
  @Get('daily-tasks/:studentId')
  getDailyTasks(@Param('studentId') studentId: string) {
    return this.planService.getDailyTasks(+studentId);
  }

  @Public()
  @Post('daily-tasks')
  createDailyTask(@Body() body: any) {
    return this.planService.createDailyTask(body);
  }

  @Public()
  @Put('daily-tasks/:id')
  updateDailyTask(@Param('id') id: string, @Body() body: any) {
    return this.planService.updateDailyTask(+id, body);
  }

  @Public()
  @Delete('daily-tasks/:id')
  removeDailyTask(@Param('id') id: string) {
    return this.planService.removeDailyTask(+id);
  }

  @Public()
  @Put('daily-tasks/:id/toggle')
  toggleDailyTaskLog(
    @Param('id') id: string,
    @Body() body: { studentId: number; date: string; completed: boolean },
  ) {
    return this.planService.toggleDailyTaskLog(body.studentId, +id, body.date, body.completed);
  }

  // ===== 普通计划 =====

  @Public()
  @Get(':studentId/month')
  getByMonth(
    @Param('studentId') studentId: string,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    const y = year ? +year : new Date().getFullYear();
    const m = month ? +month : new Date().getMonth() + 1;
    return this.planService.getMonthWithDaily(+studentId, y, m);
  }

  @Public()
  @Get(':studentId/date')
  getByDate(
    @Param('studentId') studentId: string,
    @Query('date') date: string,
  ) {
    return this.planService.getMergedTasks(+studentId, date);
  }

  @Public()
  @Get(':studentId/stats')
  checkinStats(
    @Param('studentId') studentId: string,
    @Query('days') days: string,
  ) {
    return this.planService.checkinStats(+studentId, days ? +days : 30);
  }

  @Public()
  @Post()
  create(@Body() body: any) {
    return this.planService.create(body);
  }

  @Public()
  @Put(':id/toggle')
  toggleComplete(@Param('id') id: string, @Body() body: { completed: boolean }) {
    return this.planService.toggleComplete(+id, body.completed);
  }

  @Public()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.planService.remove(+id);
  }
}
