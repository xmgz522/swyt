import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('login_logs')
export class LoginLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: '学生ID' })
  studentId: number;

  @Column({ comment: '学生姓名' })
  studentName: string;

  @Column({ nullable: true, comment: '手机号' })
  phone: string;

  @Column({ nullable: true, comment: '登录平台: miniapp/web' })
  platform: string;

  @Column({ nullable: true, comment: 'IP地址' })
  ip: string;

  @Column({ nullable: true, comment: 'User-Agent' })
  userAgent: string;

  @CreateDateColumn()
  createdAt: Date;
}
