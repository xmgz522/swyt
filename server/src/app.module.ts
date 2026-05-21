import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { StudentModule } from './modules/student/student.module';
import { SchoolModule } from './modules/school/school.module';
import { ExamModule } from './modules/exam/exam.module';
import { ConfigModule as AppConfigModule } from './modules/config/config.module';
import { RecommendModule } from './modules/recommend/recommend.module';
import { ExportModule } from './modules/export/export.module';
import { ReportModule } from './modules/report/report.module';
import { PolicyModule } from './modules/policy/policy.module';
import { NotificationModule } from './modules/notification/notification.module';
import { StudyPlanModule } from './modules/study-plan/study-plan.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AuditModule } from './modules/audit/audit.module';
import { InterviewModule } from './modules/interview/interview.module';
import { MajorModule } from './modules/major/major.module';
import { InviteCodeModule } from './modules/invite-code/invite-code.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql' as const,
        host: config.get<string>('DB_HOST', 'localhost'),
        port: +config.get<string>('DB_PORT', '3306'),
        username: config.get<string>('DB_USERNAME', 'root'),
        password: config.get<string>('DB_PASSWORD', 'root'),
        database: config.get<string>('DB_DATABASE', 'zj_early_admission'),
        autoLoadEntities: true,
        synchronize: true,
        charset: 'utf8mb4',
      }),
    }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET', 'zj-early-admission-secret-key'),
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN', '7d') },
      }),
    }),
    AuthModule,
    StudentModule,
    SchoolModule,
    ExamModule,
    AppConfigModule,
    RecommendModule,
    ExportModule,
    ReportModule,
    PolicyModule,
    NotificationModule,
    StudyPlanModule,
    DashboardModule,
    AuditModule,
    InterviewModule,
    MajorModule,
    InviteCodeModule,
    ScheduleModule.forRoot(),
  ],
})
export class AppModule {}
