import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Policy } from '../../entities/policy.entity';

@Injectable()
export class PolicyService {
  constructor(
    @InjectRepository(Policy)
    private readonly repo: Repository<Policy>,
  ) {}

  async findAll(): Promise<Policy[]> {
    return this.repo.find({ order: { sortOrder: 'DESC', publishDate: 'DESC' } });
  }

  async findActive(): Promise<Policy[]> {
    return this.repo.find({
      where: { isActive: true },
      order: { sortOrder: 'DESC', publishDate: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Policy> {
    return this.repo.findOneBy({ id });
  }

  async create(data: Partial<Policy>): Promise<Policy> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: number, data: Partial<Policy>): Promise<Policy> {
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
