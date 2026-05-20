import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('weekly_reports')
@Index('idx_weekly_student_week', ['studentId', 'weekStart'], { unique: true })
@Index('idx_weekly_weekstart', ['weekStart'])
export class WeeklyReport {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: '学生ID' })
  studentId: number;

  @Column({ comment: '周起始日期 YYYY-MM-DD (周一)' })
  weekStart: string;

  @Column({ comment: '周结束日期 YYYY-MM-DD (周日)' })
  weekEnd: string;

  @Column({ default: 0, comment: '做题总数' })
  totalQuestions: number;

  @Column({ default: 0, comment: '做对题数' })
  correctQuestions: number;

  @Column({ type: 'float', default: 0, comment: '正确率(百分比)' })
  accuracy: number;

  @Column({ default: 0, comment: '完成试卷数' })
  examCount: number;

  @Column({ type: 'float', default: 0, comment: '试卷平均分' })
  avgExamScore: number;

  @Column({ default: 0, comment: '打卡天数' })
  checkinDays: number;

  @Column({ default: 0, comment: '完成任务数' })
  completedTasks: number;

  @Column({ default: 0, comment: '总任务数' })
  totalTasks: number;

  @Column({ default: 0, comment: '新增错题数' })
  newWrongCount: number;

  @Column({ default: 0, comment: '已掌握错题数' })
  masteredCount: number;

  @Column({ type: 'text', nullable: true, comment: '薄弱知识点JSON [{point, wrongCount, total}]' })
  weakPoints: string;

  @Column({ type: 'text', nullable: true, comment: '各科正确率JSON {科目: {total, correct, rate}}' })
  subjectStats: string;

  @Column({ type: 'text', nullable: true, comment: '上周对比JSON {accuracy, totalQuestions, checkinDays}' })
  lastWeekCompare: string;

  @Column({ type: 'text', nullable: true, comment: '自动生成的文字总结' })
  summary: string;

  @Column({ default: false, comment: '是否已推送通知' })
  notified: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
