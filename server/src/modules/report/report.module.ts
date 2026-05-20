import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { WeeklyReportService } from './weekly-report.service';
import { Student } from '../../entities/student.entity';
import { AnswerSheet } from '../../entities/answer-sheet.entity';
import { Paper } from '../../entities/paper.entity';
import { Question } from '../../entities/question.entity';
import { School } from '../../entities/school.entity';
import { RecommendRule } from '../../entities/recommend-rule.entity';
import { WeeklyReport } from '../../entities/weekly-report.entity';
import { PracticeRecord } from '../../entities/practice-record.entity';
import { StudyPlan } from '../../entities/study-plan.entity';
import { WrongNote } from '../../entities/wrong-note.entity';
import { Notification } from '../../entities/notification.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    Student, AnswerSheet, Paper, Question, School, RecommendRule,
    WeeklyReport, PracticeRecord, StudyPlan, WrongNote, Notification,
  ])],
  controllers: [ReportController],
  providers: [ReportService, WeeklyReportService],
  exports: [WeeklyReportService],
})
export class ReportModule {}
