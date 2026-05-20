import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Major } from '../../entities/major.entity';
import { MAJOR_SEED_DATA } from './major-seed';

@Injectable()
export class MajorService implements OnModuleInit {
  private readonly logger = new Logger(MajorService.name);

  constructor(
    @InjectRepository(Major)
    private majorRepo: Repository<Major>,
  ) {}

  async onModuleInit() {
    const count = await this.majorRepo.count();
    if (count === 0) {
      const result = await this.seed();
      this.logger.log(result.message);
    }
  }

  // 公开：获取专业列表（支持搜索和分类筛选）
  async list(query?: { keyword?: string; category?: string; page?: number; pageSize?: number }) {
    const where: any = { isActive: true };
    if (query?.category) where.category = query.category;
    if (query?.keyword) where.name = Like(`%${query.keyword}%`);

    const page = query?.page || 1;
    const pageSize = query?.pageSize || 20;

    const [data, total] = await this.majorRepo.findAndCount({
      where,
      order: { sortOrder: 'DESC', name: 'ASC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { data, total, page, pageSize };
  }

  // 公开：获取所有学科门类
  async getCategories() {
    const raw = await this.majorRepo
      .createQueryBuilder('m')
      .select('DISTINCT m.category', 'category')
      .where('m.isActive = true')
      .andWhere('m.category IS NOT NULL')
      .getRawMany();
    return raw.map(r => r.category).filter(Boolean);
  }

  // 公开：获取专业详情
  async getDetail(id: number) {
    return this.majorRepo.findOne({ where: { id, isActive: true } });
  }

  // 后台：获取全部（含未激活）
  async findAll(query?: { keyword?: string; category?: string }) {
    const where: any = {};
    if (query?.category) where.category = query.category;
    if (query?.keyword) where.name = Like(`%${query.keyword}%`);
    return this.majorRepo.find({ where, order: { sortOrder: 'DESC', name: 'ASC' } });
  }

  // 后台：创建
  async create(data: Partial<Major>) {
    return this.majorRepo.save(this.majorRepo.create(data));
  }

  // 后台：批量创建
  async batchCreate(items: Partial<Major>[]) {
    const entities = items.map(item => this.majorRepo.create(item));
    await this.majorRepo.save(entities);
    return { success: true, created: entities.length };
  }

  // 后台：更新
  async update(id: number, data: Partial<Major>) {
    await this.majorRepo.update(id, data);
    return this.majorRepo.findOne({ where: { id } });
  }

  // 后台：删除
  async remove(id: number) {
    await this.majorRepo.delete(id);
    return { success: true };
  }

  // 初始化预置数据
  async seed() {
    const count = await this.majorRepo.count();
    if (count > 0) return { success: true, message: `已有 ${count} 条数据，跳过初始化`, seeded: 0 };
    const entities = MAJOR_SEED_DATA.map(item => this.majorRepo.create(item));
    await this.majorRepo.save(entities);
    return { success: true, message: `成功导入 ${entities.length} 个专业`, seeded: entities.length };
  }
}
