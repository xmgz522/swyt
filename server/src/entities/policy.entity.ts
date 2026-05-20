import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('policies')
export class Policy {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: '标题' })
  title: string;

  @Column({ comment: '分类标签', default: '招生政策' })
  tag: string;

  @Column({ type: 'text', nullable: true, comment: '正文内容' })
  content: string;

  @Column({ nullable: true, comment: '外链地址' })
  url: string;

  @Column({ nullable: true, comment: '发布日期' })
  publishDate: string;

  @Column({ default: true, comment: '是否显示' })
  isActive: boolean;

  @Column({ default: 0, comment: '排序权重，越大越靠前' })
  sortOrder: number;

  @Column({ default: 'default' })
  appId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
