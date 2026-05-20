import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('school_events')
export class SchoolEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: '关联学校ID' })
  schoolId: number;

  @Column({ comment: '学校名称(冗余)' })
  schoolName: string;

  @Column({ comment: '事件类型: registration/written_exam/interview/result/enrollment' })
  type: string;

  @Column({ comment: '事件标题，如"网上报名开始"' })
  title: string;

  @Column({ type: 'date', comment: '事件日期' })
  date: string;

  @Column({ type: 'date', nullable: true, comment: '截止日期（如报名有开始和截止）' })
  endDate: string;

  @Column({ type: 'text', nullable: true, comment: '备注说明' })
  remark: string;

  @Column({ default: 0, comment: '排序' })
  sortOrder: number;

  @Column({ default: 'default' })
  appId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
