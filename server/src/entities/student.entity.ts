import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('students')
export class Student {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: '姓名' })
  name: string;

  @Column({ nullable: true, comment: '手机号' })
  phone: string;

  @Column({ nullable: true, comment: '登录密码(bcrypt)' })
  password: string;

  @Column({ nullable: true, comment: '所在学校' })
  schoolName: string;

  @Column({ nullable: true, comment: '年级' })
  grade: string;

  @Column({ default: 0, comment: 'A等第数量' })
  gradeA: number;

  @Column({ default: 0, comment: 'B等第数量' })
  gradeB: number;

  @Column({ default: 0, comment: 'C等第数量' })
  gradeC: number;

  @Column({ default: 0, comment: 'D等第数量' })
  gradeD: number;

  @Column({ default: 0, comment: 'E等第数量' })
  gradeE: number;

  @Column({ type: 'text', nullable: true, comment: '各科目等级JSON {"语文":"A","数学":"B",...}' })
  subjectGrades: string;

  @Column({ nullable: true, comment: '意向地区' })
  preferredRegion: string;

  @Column({ nullable: true, comment: '意向专业方向' })
  preferredMajor: string;

  @Column({ type: 'text', nullable: true, comment: '已选目标院校JSON [{id,name,region,gradeRequirements}]' })
  selectedSchools: string;

  @Column({ nullable: true, comment: '微信openid' })
  openid: string;

  @Column({ nullable: true, comment: '负责老师ID' })
  teacherId: number;

  @Column({ default: 'active', comment: '账号状态: active/disabled' })
  status: string;

  @Column({ default: false, comment: '是否申请了重置密码' })
  resetRequested: boolean;

  @Column({ nullable: true, comment: '账号过期时间' })
  expireAt: Date;

  @Column({ default: 'default' })
  appId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
