import { Controller, Get, Post, Put, Delete, Param, Query, Body } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { EventReminderService } from './event-reminder.service';
import { Public } from '../../decorators/public.decorator';
import { Roles } from '../../decorators/roles.decorator';

@Controller('notifications')
export class NotificationController {
  constructor(
    private notifService: NotificationService,
    private eventReminderService: EventReminderService,
  ) {}

  // 学生端：获取自己的通知
  @Public()
  @Get('student/:studentId')
  getByStudent(@Param('studentId') studentId: string) {
    return this.notifService.getByStudent(+studentId);
  }

  // 学生端：未读数
  @Public()
  @Get('student/:studentId/unread')
  unreadCount(@Param('studentId') studentId: string) {
    return this.notifService.unreadCount(+studentId);
  }

  // 学生端：标记已读
  @Public()
  @Put(':id/read')
  markRead(@Param('id') id: string) {
    return this.notifService.markRead(+id);
  }

  // 学生端：全部已读
  @Public()
  @Put('student/:studentId/read-all')
  markAllRead(@Param('studentId') studentId: string) {
    return this.notifService.markAllRead(+studentId);
  }

  // 老师端：获取自己的通知
  @Get('teacher/:teacherId')
  getByTeacher(@Param('teacherId') teacherId: string) {
    return this.notifService.getByTeacher(+teacherId);
  }

  // 老师端：未读数
  @Get('teacher/:teacherId/unread')
  teacherUnreadCount(@Param('teacherId') teacherId: string) {
    return this.notifService.teacherUnreadCount(+teacherId);
  }

  // 老师端：全部已读
  @Put('teacher/:teacherId/read-all')
  markAllTeacherRead(@Param('teacherId') teacherId: string) {
    return this.notifService.markAllTeacherRead(+teacherId);
  }

  // 后台：获取全部（支持分页）
  @Get()
  findAll(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.notifService.findAll(+(page || 1), +(pageSize || 200));
  }

  // 后台：创建通知
  @Post()
  create(@Body() body: any) {
    return this.notifService.create(body);
  }

  // 后台：删除
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.notifService.remove(+id);
  }

  // 后台：手动触发事件提醒（测试用）
  @Post('trigger-reminders')
  @Roles('superadmin', 'admin')
  async triggerReminders() {
    await this.eventReminderService.sendReminders();
    return { success: true, message: '事件提醒已触发' };
  }
}
