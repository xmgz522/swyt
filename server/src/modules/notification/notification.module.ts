import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from '../../entities/notification.entity';
import { SchoolEvent } from '../../entities/school-event.entity';
import { Student } from '../../entities/student.entity';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { EventReminderService } from './event-reminder.service';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, SchoolEvent, Student])],
  controllers: [NotificationController],
  providers: [NotificationService, EventReminderService],
  exports: [NotificationService, EventReminderService],
})
export class NotificationModule {}
