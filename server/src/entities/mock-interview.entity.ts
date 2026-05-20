import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('mock_interviews')
export class MockInterview {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: '学生ID' })
  studentId: number;

  @Column({ comment: '学校ID' })
  schoolId: number;

  @Column({ comment: '学校名称' })
  schoolName: string;

  @Column({ type: 'text', comment: '题目ID列表JSON [1,2,3]' })
  questionIds: string;

  @Column({ type: 'text', nullable: true, comment: '学生回答JSON [{questionId, answer}]' })
  answers: string;

  @Column({ default: 'pending', comment: '状态: pending(答题中)/submitted(已提交)/graded(已评分)' })
  status: string;

  @Column({ type: 'float', default: 0, comment: '逻辑表达 0-10' })
  scoreLogic: number;

  @Column({ type: 'float', default: 0, comment: '知识面 0-10' })
  scoreKnowledge: number;

  @Column({ type: 'float', default: 0, comment: '综合素质 0-10' })
  scoreQuality: number;

  @Column({ type: 'float', default: 0, comment: '语言表达 0-10' })
  scoreExpression: number;

  @Column({ type: 'float', default: 0, comment: '应变能力 0-10' })
  scoreAdaptability: number;

  @Column({ type: 'float', default: 0, comment: '总分(平均)' })
  totalScore: number;

  @Column({ type: 'text', nullable: true, comment: '老师评语' })
  feedback: string;

  @Column({ nullable: true, comment: '评分老师ID' })
  gradedBy: number;

  @Column({ nullable: true, comment: '评分时间' })
  gradedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
