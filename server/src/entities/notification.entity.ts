import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('notifications')
@Index('idx_notif_student', ['targetStudentId', 'createdAt'])
@Index('idx_notif_teacher', ['teacherId'])
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: '标题' })
  title: string;

  @Column({ type: 'text', nullable: true, comment: '内容' })
  content: string;

  @Column({ default: 'system', comment: '类型: system/score/policy/exam/reminder' })
  type: string;

  @Column({ default: 0, comment: '目标学生ID，0=全体' })
  targetStudentId: number;

  @Column({ nullable: true, comment: '目标老师ID' })
  teacherId: number;

  @Column({ default: false, comment: '是否已读' })
  isRead: boolean;

  @Column({ default: 'default' })
  appId: string;

  @CreateDateColumn()
  createdAt: Date;
}
