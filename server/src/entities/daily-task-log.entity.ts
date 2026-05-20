import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('daily_task_logs')
@Index('idx_dtlog_student_date', ['studentId', 'date'])
@Index('idx_dtlog_task_date', ['dailyTaskId', 'date'], { unique: true })
export class DailyTaskLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: '每日任务ID' })
  dailyTaskId: number;

  @Column({ comment: '学生ID' })
  studentId: number;

  @Column({ comment: '日期 YYYY-MM-DD' })
  date: string;

  @Column({ default: true, comment: '是否完成' })
  completed: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
