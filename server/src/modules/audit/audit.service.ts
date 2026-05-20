import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import { AuditLog } from '../../entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private logRepo: Repository<AuditLog>,
  ) {}

  async log(data: {
    userId: number;
    username: string;
    module: string;
    action: string;
    detail?: string;
    ip?: string;
  }) {
    return this.logRepo.save(this.logRepo.create(data));
  }

  async findAll(query?: {
    module?: string;
    action?: string;
    username?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }) {
    const where: any = {};
    if (query?.module) where.module = query.module;
    if (query?.action) where.action = query.action;
    if (query?.username) where.username = Like(`%${query.username}%`);
    if (query?.startDate && query?.endDate) {
      where.createdAt = Between(new Date(query.startDate), new Date(query.endDate + ' 23:59:59'));
    }

    const page = query?.page || 1;
    const pageSize = query?.pageSize || 50;

    const [data, total] = await this.logRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { data, total, page, pageSize };
  }

  async getModules() {
    const result = await this.logRepo
      .createQueryBuilder('l')
      .select('DISTINCT l.module', 'module')
      .getRawMany();
    return result.map(r => r.module);
  }
}
