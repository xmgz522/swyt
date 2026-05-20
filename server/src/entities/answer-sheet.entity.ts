import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('answer_sheets')
@Index('idx_sheet_student_created', ['studentId', 'createdAt'])
@Index('idx_sheet_status', ['status'])
export class AnswerSheet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: '学生ID' })
  studentId: number;

  @Column({ comment: '试卷ID' })
  paperId: number;

  @Column({ type: 'text', nullable: true, comment: '答案JSON [{questionId, answer}]' })
  answers: string;

  @Column({ default: 0, comment: '客观题得分' })
  objectiveScore: number;

  @Column({ default: 0, comment: '主观题得分' })
  subjectiveScore: number;

  @Column({ default: 0, comment: '总分' })
  totalScore: number;

  @Column({ default: 'pending', comment: '状态: pending/auto_graded/graded' })
  status: string;

  @Column({ type: 'text', nullable: true, comment: '薄弱知识点JSON' })
  weakPoints: string;

  @Column({ type: 'text', nullable: true, comment: '老师评语' })
  comment: string;

  @Column({ type: 'text', nullable: true, comment: '上传图片JSON ["url1","url2"]' })
  images: string;

  @Column({ default: 'default' })
  appId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
