import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('papers')
export class Paper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: '试卷名称' })
  title: string;

  @Column({ nullable: true, comment: '关联院校ID' })
  schoolId: number;

  @Column({ type: 'text', nullable: true, comment: '题目ID列表JSON' })
  questionIds: string;

  @Column({ default: 100, comment: '总分' })
  totalScore: number;

  @Column({ default: 60, comment: '考试时长(分钟)' })
  duration: number;

  @Column({ default: true, comment: '是否发布' })
  isPublished: boolean;

  @Column({ default: 'mock', comment: '试卷类型: mock=模拟卷, real=历年真题' })
  type: string;

  @Column({ nullable: true, comment: '科目: 语文/数学/英语/物理/化学/生物/政治/历史/地理/技术，空=三位一体综合卷' })
  subject: string;

  @Column({ default: 'triad', comment: '试卷分类: triad=三位一体, xuekao=学考' })
  bankType: string;

  @Column({ default: 'default' })
  appId: string;

  @CreateDateColumn()
  createdAt: Date;
}
