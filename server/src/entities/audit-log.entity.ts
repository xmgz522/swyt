import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: '操作用户ID' })
  userId: number;

  @Column({ comment: '用户名' })
  username: string;

  @Column({ comment: '操作模块' })
  module: string;

  @Column({ comment: '操作类型: login/create/update/delete/grade/export/import' })
  action: string;

  @Column({ type: 'text', nullable: true, comment: '操作详情' })
  detail: string;

  @Column({ nullable: true, comment: '请求IP' })
  ip: string;

  @Column({ default: 'default' })
  appId: string;

  @CreateDateColumn()
  createdAt: Date;
}
