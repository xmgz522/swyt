import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { StudyPlan } from '../../entities/study-plan.entity';
import { DailyTask } from '../../entities/daily-task.entity';
import { DailyTaskLog } from '../../entities/daily-task-log.entity';

@Injectable()
export class StudyPlanService {
  constructor(
    @InjectRepository(StudyPlan)
    private planRepo: Repository<StudyPlan>,
    @InjectRepository(DailyTask)
    private dailyTaskRepo: Repository<DailyTask>,
    @InjectRepository(DailyTaskLog)
    private dailyLogRepo: Repository<DailyTaskLog>,
  ) {}

  // 某学生某月的计划
  async getByMonth(studentId: number, year: number, month: number) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;
    return this.planRepo.find({
      where: { studentId, date: Between(startDate, endDate) as any },
      order: { date: 'ASC' },
    });
  }

  // 某学生某天的计划
  async getByDate(studentId: number, date: string) {
    return this.planRepo.find({
      where: { studentId, date },
      order: { createdAt: 'ASC' },
    });
  }

  // 创建计划（同一天同标题不重复创建）
  async create(data: Partial<StudyPlan>) {
    if (data.studentId && data.date && data.title) {
      const existing = await this.planRepo.findOne({
        where: { studentId: data.studentId, date: data.date, title: data.title },
      });
      if (existing) return existing;
    }
    return this.planRepo.save(this.planRepo.create(data));
  }

  // 打卡/取消打卡
  async toggleComplete(id: number, completed: boolean) {
    await this.planRepo.update(id, { completed });
    return { success: true };
  }

  // 删除
  async remove(id: number) {
    await this.planRepo.delete(id);
    return { success: true };
  }

  // 打卡统计：某学生近N天的打卡数
  async checkinStats(studentId: number, days: number = 30) {
    const now = new Date();
    const start = new Date(now.getTime() - days * 86400000);
    const startDate = start.toISOString().slice(0, 10);
    const endDate = now.toISOString().slice(0, 10);
    const total = await this.planRepo.count({
      where: { studentId, date: Between(startDate, endDate) as any },
    });
    const completed = await this.planRepo.count({
      where: { studentId, date: Between(startDate, endDate) as any, completed: true },
    });
    // 哪些天有打卡
    const items = await this.planRepo.find({
      where: { studentId, date: Between(startDate, endDate) as any, completed: true },
      select: ['date'],
    });
    const checkedDates = [...new Set(items.map(i => i.date))];
    return { total, completed, streak: this.calcStreak(checkedDates), checkedDates };
  }

  private calcStreak(dates: string[]): number {
    if (dates.length === 0) return 0;
    const sorted = dates.sort().reverse();
    const today = new Date().toISOString().slice(0, 10);
    if (sorted[0] !== today) return 0;
    let streak = 1;
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1]);
      const curr = new Date(sorted[i]);
      const diff = (prev.getTime() - curr.getTime()) / 86400000;
      if (diff === 1) streak++;
      else break;
    }
    return streak;
  }

  // ==================== 每日任务 ====================

  async getDailyTasks(studentId: number) {
    return this.dailyTaskRepo.find({
      where: { studentId },
      order: { createdAt: 'ASC' },
    });
  }

  async createDailyTask(data: Partial<DailyTask>) {
    return this.dailyTaskRepo.save(this.dailyTaskRepo.create(data));
  }

  async updateDailyTask(id: number, data: Partial<DailyTask>) {
    await this.dailyTaskRepo.update(id, data);
    return this.dailyTaskRepo.findOne({ where: { id } });
  }

  async removeDailyTask(id: number) {
    await this.dailyLogRepo.delete({ dailyTaskId: id });
    await this.dailyTaskRepo.delete(id);
    return { success: true };
  }

  async toggleDailyTaskLog(studentId: number, dailyTaskId: number, date: string, completed: boolean) {
    let log = await this.dailyLogRepo.findOne({ where: { dailyTaskId, date } });
    if (log) {
      log.completed = completed;
      await this.dailyLogRepo.save(log);
    } else {
      log = await this.dailyLogRepo.save(this.dailyLogRepo.create({ dailyTaskId, studentId, date, completed }));
    }
    return log;
  }

  // 某天的任务：普通任务 + 每日任务合并
  async getMergedTasks(studentId: number, date: string) {
    const plans = await this.getByDate(studentId, date);
    const dailyTasks = await this.dailyTaskRepo.find({ where: { studentId, active: true } });
    const logs = await this.dailyLogRepo.find({ where: { studentId, date } });
    const logMap = new Map(logs.map(l => [l.dailyTaskId, l.completed]));

    const dailyItems = dailyTasks.map(dt => ({
      id: `daily-${dt.id}`,
      dailyTaskId: dt.id,
      title: dt.title,
      description: dt.description,
      date,
      type: 'daily',
      completed: logMap.get(dt.id) ?? false,
    }));

    return [...dailyItems, ...plans];
  }

  // 某月有任务的天数（包含每日任务）
  async getMonthWithDaily(studentId: number, year: number, month: number) {
    const plans = await this.getByMonth(studentId, year, month);
    const dailyTasks = await this.dailyTaskRepo.find({ where: { studentId, active: true } });

    if (dailyTasks.length === 0) return plans;

    // 获取该月每日任务打卡记录
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;
    const logs = await this.dailyLogRepo.find({
      where: { studentId, date: Between(startDate, endDate) as any },
    });
    const logSet = new Set(logs.filter(l => l.completed).map(l => `${l.dailyTaskId}-${l.date}`));

    // 为每日任务在每天生成虚拟记录
    const dailyPlans: any[] = [];
    for (let d = 1; d <= endDay; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      for (const dt of dailyTasks) {
        dailyPlans.push({
          id: `daily-${dt.id}-${dateStr}`,
          studentId,
          title: dt.title,
          date: dateStr,
          type: 'daily',
          completed: logSet.has(`${dt.id}-${dateStr}`),
        });
      }
    }
    return [...dailyPlans, ...plans];
  }
}
