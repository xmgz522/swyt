import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('recommend_rules')
export class RecommendRule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: '关联院校ID' })
  schoolId: number;

  @Column({ default: 0, comment: '最低A等第数量' })
  minGradeA: number;

  @Column({ default: 0, comment: '最低B等第数量' })
  minGradeB: number;

  @Column({ default: 10, comment: '最大C等第数量' })
  maxGradeC: number;

  @Column({ nullable: true, comment: '适用地区' })
  region: string;

  @Column({ default: 'stable', comment: '推荐等级: reach/stable/safe' })
  level: string;

  @Column({ default: 'default' })
  appId: string;

  @CreateDateColumn()
  createdAt: Date;
}
