import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { Student } from '../../entities/student.entity';
import { AnswerSheet } from '../../entities/answer-sheet.entity';
import { Paper } from '../../entities/paper.entity';
import { School } from '../../entities/school.entity';
import { Question } from '../../entities/question.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Student, AnswerSheet, Paper, School, Question])],
  controllers: [ExportController],
  providers: [ExportService],
})
export class ExportModule {}
