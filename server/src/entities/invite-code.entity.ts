import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('invite_codes')
export class InviteCode {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, comment: '注册码' })
  code: string;

  @Column({ default: 'unused', comment: '状态: unused/used' })
  status: string;

  @Column({ nullable: true, comment: '使用者学生ID' })
  usedBy: number;

  @Column({ nullable: true, comment: '使用者姓名' })
  usedByName: string;

  @Column({ nullable: true, comment: '使用时间' })
  usedAt: Date;

  @Column({ nullable: true, comment: '过期时间' })
  expireAt: Date;

  @Column({ nullable: true, comment: '备注' })
  remark: string;

  @Column({ default: 'default', comment: '应用标识' })
  appId: string;

  @CreateDateColumn()
  createdAt: Date;
}
