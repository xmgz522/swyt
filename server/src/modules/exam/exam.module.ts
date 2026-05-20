import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamController } from './exam.controller';
import { ExamService } from './exam.service';
import { Question } from '../../entities/question.entity';
import { Paper } from '../../entities/paper.entity';
import { AnswerSheet } from '../../entities/answer-sheet.entity';
import { WrongNote } from '../../entities/wrong-note.entity';
import { PracticeRecord } from '../../entities/practice-record.entity';
import { Student } from '../../entities/student.entity';
import { Notification } from '../../entities/notification.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Question, Paper, AnswerSheet, WrongNote, PracticeRecord, Student, Notification])],
  controllers: [ExamController],
  providers: [ExamService],
  exports: [ExamService],
})
export class ExamModule {}
