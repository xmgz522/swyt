import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('study_plans')
@Index('idx_plan_student_date', ['studentId', 'date'])
export class StudyPlan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: '学生ID' })
  studentId: number;

  @Column({ comment: '标题' })
  title: string;

  @Column({ type: 'text', nullable: true, comment: '描述' })
  description: string;

  @Column({ comment: '日期 YYYY-MM-DD' })
  date: string;

  @Column({ default: 'task', comment: '类型: task/event/deadline' })
  type: string;

  @Column({ default: false, comment: '是否完成(打卡)' })
  completed: boolean;

  @Column({ default: 'default' })
  appId: string;

  @CreateDateColumn()
  createdAt: Date;
}
