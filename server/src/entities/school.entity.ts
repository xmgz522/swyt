import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('schools')
export class School {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: '学校名称' })
  name: string;

  @Column({ nullable: true, comment: '地区' })
  region: string;

  @Column({ nullable: true, comment: '学校类型' })
  type: string;

  @Column({ nullable: true, comment: '学校Logo' })
  logo: string;

  @Column({ type: 'text', nullable: true, comment: '学校简介' })
  description: string;

  @Column({ nullable: true, comment: '招生要求' })
  requirements: string;

  @Column({ nullable: true, comment: '学考要求' })
  gradeRequirements: string;

  @Column({ nullable: true, comment: '面试形式' })
  interviewType: string;

  @Column({ type: 'text', nullable: true, comment: '往年录取情况' })
  admissionHistory: string;

  @Column({ nullable: true, comment: '适合人群' })
  suitableFor: string;

  @Column({ nullable: true, comment: '报考建议' })
  advice: string;

  @Column({ nullable: true, comment: '官网链接' })
  website: string;

  @Column({ default: true, comment: '是否上架' })
  isActive: boolean;

  @Column({ default: 'default' })
  appId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
