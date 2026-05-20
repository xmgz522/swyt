import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from '../../entities/student.entity';
import { School } from '../../entities/school.entity';
import { Paper } from '../../entities/paper.entity';
import { AnswerSheet } from '../../entities/answer-sheet.entity';
import { Question } from '../../entities/question.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [TypeOrmModule.forFeature([Student, School, Paper, AnswerSheet, Question])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
