import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudyPlan } from '../../entities/study-plan.entity';
import { DailyTask } from '../../entities/daily-task.entity';
import { DailyTaskLog } from '../../entities/daily-task-log.entity';
import { StudyPlanController } from './study-plan.controller';
import { StudyPlanService } from './study-plan.service';

@Module({
  imports: [TypeOrmModule.forFeature([StudyPlan, DailyTask, DailyTaskLog])],
  controllers: [StudyPlanController],
  providers: [StudyPlanService],
})
export class StudyPlanModule {}
