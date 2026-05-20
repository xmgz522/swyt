import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InviteCode } from '../../entities/invite-code.entity';

@Injectable()
export class InviteCodeService {
  constructor(
    @InjectRepository(InviteCode)
    private codeRepo: Repository<InviteCode>,
  ) {}

  // 生成随机码：大写字母+数字，8位
  private generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 去掉易混淆的 I/O/0/1
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  // 批量生成注册码
  async batchGenerate(count: number, expireDays?: number, remark?: string) {
    const codes: InviteCode[] = [];
    const existingCodes = new Set(
      (await this.codeRepo.find({ select: ['code'] })).map(c => c.code),
    );

    for (let i = 0; i < count; i++) {
      let code: string;
      do {
        code = this.generateCode();
      } while (existingCodes.has(code));
      existingCodes.add(code);

      const entity = this.codeRepo.create({
        code,
        status: 'unused',
        remark: remark || null,
        expireAt: expireDays ? new Date(Date.now() + expireDays * 86400000) : null,
      });
      codes.push(entity);
    }

    await this.codeRepo.save(codes);
    return { success: true, data: codes.map(c => ({ id: c.id, code: c.code, expireAt: c.expireAt, remark: c.remark })), count: codes.length };
  }

  // 验证注册码（注册时调用）
  async validate(code: string): Promise<{ valid: boolean; message?: string; codeEntity?: InviteCode }> {
    const entity = await this.codeRepo.findOne({ where: { code: code.toUpperCase() } });
    if (!entity) return { valid: false, message: '注册码不存在' };
    if (entity.status === 'used') return { valid: false, message: '注册码已被使用' };
    if (entity.expireAt && entity.expireAt < new Date()) return { valid: false, message: '注册码已过期' };
    return { valid: true, codeEntity: entity };
  }

  // 标记注册码已使用
  async markUsed(code: string, studentId: number, studentName: string) {
    const entity = await this.codeRepo.findOne({ where: { code: code.toUpperCase() } });
    if (!entity) return;
    entity.status = 'used';
    entity.usedBy = studentId;
    entity.usedByName = studentName;
    entity.usedAt = new Date();
    await this.codeRepo.save(entity);
  }

  // 获取所有注册码列表
  async findAll(status?: string) {
    const where: any = {};
    if (status) where.status = status;
    return this.codeRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  // 删除未使用的注册码
  async deleteUnused(ids: number[]) {
    const result = await this.codeRepo
      .createQueryBuilder()
      .delete()
      .whereInIds(ids)
      .andWhere('status = :status', { status: 'unused' })
      .execute();
    return { success: true, deleted: result.affected };
  }
}
