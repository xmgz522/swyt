import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: '用户名' })
  username: string;

  @Column({ comment: '密码' })
  password: string;

  @Column({ comment: '姓名' })
  name: string;

  @Column({ default: 'teacher', comment: '角色: superadmin/teacher/student' })
  role: string;

  @Column({ type: 'text', nullable: true, comment: '功能权限JSON数组，如["students","papers","grading"]' })
  permissions: string;

  @Column({ default: 'default', comment: '应用标识' })
  appId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
