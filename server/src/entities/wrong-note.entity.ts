import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('wrong_notes')
@Index('idx_wrong_student_created', ['studentId', 'createdAt'])
@Index('idx_wrong_student_mastered', ['studentId', 'mastered'])
export class WrongNote {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: '学生ID' })
  studentId: number;

  @Column({ comment: '题目ID' })
  questionId: number;

  @Column({ nullable: true, comment: '来源答卷ID（首次错的那次）' })
  sourceSheetId: number;

  @Column({ default: 1, comment: '错误次数' })
  wrongCount: number;

  @Column({ default: false, comment: '是否已标记掌握' })
  mastered: boolean;

  @Column({ nullable: true, comment: '科目' })
  subject: string;

  @Column({ nullable: true, comment: '知识点' })
  knowledgePoint: string;

  @Column({ type: 'text', nullable: true, comment: '最近一次的错误答案' })
  lastWrongAnswer: string;

  @Column({ nullable: true, comment: '题库类型: triad=三位一体, xuekao=学考' })
  bankType: string;

  @Column({ default: 'default' })
  appId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
