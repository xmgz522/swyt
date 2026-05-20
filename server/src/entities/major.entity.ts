import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('majors')
@Index('idx_major_category', ['category'])
export class Major {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: '专业名称' })
  name: string;

  @Column({ nullable: true, comment: '专业代码（如080901）' })
  code: string;

  @Column({ nullable: true, comment: '学科门类（如工学、文学、理学）' })
  category: string;

  @Column({ type: 'text', nullable: true, comment: '专业简介' })
  description: string;

  @Column({ type: 'text', nullable: true, comment: '核心课程（JSON数组）' })
  courses: string;

  @Column({ type: 'text', nullable: true, comment: '就业方向' })
  employment: string;

  @Column({ type: 'text', nullable: true, comment: '适合人群/能力要求' })
  suitableFor: string;

  @Column({ type: 'text', nullable: true, comment: '相关院校（JSON数组 或 文字描述）' })
  relatedSchools: string;

  @Column({ nullable: true, comment: '学制（如4年、5年）' })
  duration: string;

  @Column({ nullable: true, comment: '授予学位（如工学学士）' })
  degree: string;

  @Column({ type: 'text', nullable: true, comment: '备注/补充信息' })
  remark: string;

  @Column({ default: true, comment: '是否显示' })
  isActive: boolean;

  @Column({ default: 0, comment: '排序权重（越大越靠前）' })
  sortOrder: number;

  @Column({ default: 'default' })
  appId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
