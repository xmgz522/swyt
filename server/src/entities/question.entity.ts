import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: '题型: single_choice/multi_choice/judge/fill/short_answer' })
  type: string;

  @Column({ type: 'text', comment: '题干' })
  content: string;

  @Column({ type: 'text', nullable: true, comment: '选项JSON' })
  options: string;

  @Column({ type: 'text', nullable: true, comment: '标准答案' })
  answer: string;

  @Column({ type: 'text', nullable: true, comment: '解析' })
  explanation: string;

  @Column({ default: 5, comment: '分值' })
  score: number;

  @Column({ default: 'medium', comment: '难度: easy/medium/hard' })
  difficulty: string;

  @Column({ nullable: true, comment: '知识点' })
  knowledgePoint: string;

  @Column({ default: false, comment: '是否需要人工批改' })
  needManualGrade: boolean;

  @Column({ nullable: true, comment: '科目: 语文/数学/英语/物理/化学/生物/政治/历史/地理/技术' })
  subject: string;

  @Column({ default: 'triad', comment: '题库类型: triad=三位一体, xuekao=学考' })
  bankType: string;

  @Column({ default: 'default' })
  appId: string;

  @CreateDateColumn()
  createdAt: Date;
}
