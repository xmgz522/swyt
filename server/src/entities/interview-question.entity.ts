import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('interview_questions')
export class InterviewQuestion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: '关联学校ID' })
  schoolId: number;

  @Column({ comment: '学校名称(冗余)' })
  schoolName: string;

  @Column({ nullable: true, comment: '题目分类：综合素质/专业知识/时事热点/个人规划 等' })
  category: string;

  @Column({ type: 'text', comment: '面试问题' })
  question: string;

  @Column({ type: 'text', comment: '参考答案' })
  answer: string;

  @Column({ type: 'text', nullable: true, comment: '答题要点/提示' })
  tips: string;

  @Column({ nullable: true, comment: '难度: easy/medium/hard' })
  difficulty: string;

  @Column({ nullable: true, comment: '年份' })
  year: string;

  @Column({ default: 0, comment: '排序权重' })
  sortOrder: number;

  @Column({ default: 'default' })
  appId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
