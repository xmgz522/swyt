import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../../entities/notification.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notifRepo: Repository<Notification>,
  ) {}

  // 获取某学生的通知（全体 + 个人）
  async getByStudent(studentId: number) {
    return this.notifRepo
      .createQueryBuilder('n')
      .where('n.targetStudentId = :sid OR n.targetStudentId = 0', { sid: studentId })
      .andWhere('n.teacherId IS NULL')
      .orderBy('n.createdAt', 'DESC')
      .take(50)
      .getMany();
  }

  // 获取某老师的通知
  async getByTeacher(teacherId: number) {
    return this.notifRepo.find({
      where: { teacherId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  // 老师未读数量
  async teacherUnreadCount(teacherId: number) {
    const count = await this.notifRepo.count({
      where: { teacherId, isRead: false },
    });
    return { count };
  }

  // 未读数量
  async unreadCount(studentId: number) {
    const count = await this.notifRepo
      .createQueryBuilder('n')
      .where('(n.targetStudentId = :sid OR n.targetStudentId = 0)', { sid: studentId })
      .andWhere('n.teacherId IS NULL')
      .andWhere('n.isRead = false')
      .getCount();
    return { count };
  }

  // 标记已读
  async markRead(id: number) {
    await this.notifRepo.update(id, { isRead: true });
    return { success: true };
  }

  // 全部已读
  async markAllRead(studentId: number) {
    await this.notifRepo
      .createQueryBuilder()
      .update(Notification)
      .set({ isRead: true })
      .where('targetStudentId = :sid OR targetStudentId = 0', { sid: studentId })
      .andWhere('teacherId IS NULL')
      .execute();
    return { success: true };
  }

  // 老师全部已读
  async markAllTeacherRead(teacherId: number) {
    await this.notifRepo.update({ teacherId, isRead: false }, { isRead: true });
    return { success: true };
  }

  // 后台：创建通知
  async create(data: Partial<Notification>) {
    return this.notifRepo.save(this.notifRepo.create(data));
  }

  // 后台：获取所有通知（分页，默认最新200条）
  async findAll(page = 1, pageSize = 200) {
    const [data, total] = await this.notifRepo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { data, total, page, pageSize };
  }

  // 后台：删除
  async remove(id: number) {
    await this.notifRepo.delete(id);
    return { success: true };
  }
}
