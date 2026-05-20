import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('daily_tasks')
export class DailyTask {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: '学生ID' })
  studentId: number;

  @Column({ comment: '任务标题' })
  title: string;

  @Column({ type: 'text', nullable: true, comment: '描述' })
  description: string;

  @Column({ default: true, comment: '是否启用' })
  active: boolean;

  @Column({ default: 'default' })
  appId: string;

  @CreateDateColumn()
  createdAt: Date;
}
