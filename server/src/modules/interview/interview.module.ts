import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InterviewQuestion } from '../../entities/interview-question.entity';
import { MockInterview } from '../../entities/mock-interview.entity';
import { School } from '../../entities/school.entity';
import { Student } from '../../entities/student.entity';
import { InterviewService } from './interview.service';
import { InterviewController } from './interview.controller';

@Module({
  imports: [TypeOrmModule.forFeature([InterviewQuestion, MockInterview, School, Student])],
  providers: [InterviewService],
  controllers: [InterviewController],
})
export class InterviewModule {}
