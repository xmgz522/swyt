import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('practice_records')
@Index('idx_practice_student_created', ['studentId', 'createdAt'])
export class PracticeRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: '学生ID' })
  studentId: number;

  @Column({ comment: '题目ID' })
  questionId: number;

  @Column({ type: 'text', nullable: true, comment: '学生答案' })
  answer: string;

  @Column({ default: false, comment: '是否正确' })
  isCorrect: boolean;

  @Column({ nullable: true, comment: '科目' })
  subject: string;

  @Column({ nullable: true, comment: '知识点' })
  knowledgePoint: string;

  @Column({ default: 'practice', comment: '来源: practice' })
  source: string;

  @Column({ default: 'default' })
  appId: string;

  @CreateDateColumn()
  createdAt: Date;
}
