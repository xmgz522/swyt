import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';
import { Student } from '../../entities/student.entity';
import { User } from '../../entities/user.entity';
import { LoginLog } from '../../entities/login-log.entity';
import { InviteCodeModule } from '../invite-code/invite-code.module';

@Module({
  imports: [TypeOrmModule.forFeature([Student, User, LoginLog]), InviteCodeModule],
  controllers: [StudentController],
  providers: [StudentService],
  exports: [StudentService],
})
export class StudentModule {}
