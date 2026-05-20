import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { School } from '../../entities/school.entity';
import { RecommendRule } from '../../entities/recommend-rule.entity';
import { SchoolEvent } from '../../entities/school-event.entity';
import { MoreThanOrEqual } from 'typeorm';

@Injectable()
export class SchoolService {
  constructor(
    @InjectRepository(School)
    private schoolRepo: Repository<School>,
    @InjectRepository(RecommendRule)
    private ruleRepo: Repository<RecommendRule>,
    @InjectRepository(SchoolEvent)
    private eventRepo: Repository<SchoolEvent>,
  ) {}

  async onModuleInit() {
    const count = await this.schoolRepo.count();
    if (count === 0) {
      await this.seedData();
    }
    await this.seedEvents();
  }

  private async seedData() {
    const schools = [
      { name: '浙江大学', region: '杭州', type: '综合类', description: '985/211双一流高校', requirements: '学考成绩优秀，综合素质突出', gradeRequirements: '要求4A及以上', interviewType: '综合面试+笔试', suitableFor: '学考成绩拔尖的学生' },
      { name: '浙江工业大学', region: '杭州', type: '理工类', description: '浙江省属重点大学', requirements: '学考成绩良好', gradeRequirements: '要求3A2B及以上', interviewType: '综合面试', suitableFor: '理工科有特长的学生' },
      { name: '浙江师范大学', region: '金华', type: '师范类', description: '浙江省属重点师范大学', requirements: '学考成绩良好，有教育情怀', gradeRequirements: '要求3A1B及以上', interviewType: '面试+才艺展示', suitableFor: '有志于教育事业的学生' },
      { name: '宁波大学', region: '宁波', type: '综合类', description: '双一流高校', requirements: '学考成绩优良', gradeRequirements: '要求3A及以上', interviewType: '综合面试', suitableFor: '综合素质较好的学生' },
      { name: '杭州电子科技大学', region: '杭州', type: '理工类', description: '电子信息特色高校', requirements: '数理成绩突出', gradeRequirements: '要求2A3B及以上', interviewType: '专业面试', suitableFor: '对电子信息有兴趣的学生' },
    ];

    for (const s of schools) {
      await this.schoolRepo.save(s);
    }

    const rules = [
      { schoolId: 1, minGradeA: 5, minGradeB: 0, maxGradeC: 0, level: 'stable' },
      { schoolId: 1, minGradeA: 4, minGradeB: 1, maxGradeC: 0, level: 'reach' },
      { schoolId: 2, minGradeA: 3, minGradeB: 2, maxGradeC: 1, level: 'stable' },
      { schoolId: 2, minGradeA: 2, minGradeB: 3, maxGradeC: 1, level: 'reach' },
      { schoolId: 3, minGradeA: 3, minGradeB: 1, maxGradeC: 2, level: 'stable' },
      { schoolId: 3, minGradeA: 2, minGradeB: 2, maxGradeC: 2, level: 'reach' },
      { schoolId: 4, minGradeA: 3, minGradeB: 0, maxGradeC: 2, level: 'stable' },
      { schoolId: 4, minGradeA: 2, minGradeB: 1, maxGradeC: 3, level: 'reach' },
      { schoolId: 5, minGradeA: 2, minGradeB: 3, maxGradeC: 2, level: 'stable' },
      { schoolId: 5, minGradeA: 1, minGradeB: 3, maxGradeC: 3, level: 'reach' },
    ];

    for (const r of rules) {
      await this.ruleRepo.save(r);
    }
  }

  async findAll() {
    return this.schoolRepo.find({ where: { isActive: true }, order: { id: 'ASC' } });
  }

  async search(keyword: string) {
    return this.schoolRepo
      .createQueryBuilder('s')
      .where('s.isActive = true')
      .andWhere('(s.name LIKE :kw OR s.region LIKE :kw OR s.type LIKE :kw OR s.description LIKE :kw)', { kw: `%${keyword}%` })
      .orderBy('s.id', 'ASC')
      .getMany();
  }

  async findOne(id: number) {
    return this.schoolRepo.findOne({ where: { id } });
  }

  async create(data: Partial<School>) {
    return this.schoolRepo.save(data);
  }

  async update(id: number, data: Partial<School>) {
    await this.schoolRepo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.schoolRepo.delete(id);
    return { success: true };
  }

  async getRules(schoolId: number) {
    return this.ruleRepo.find({ where: { schoolId } });
  }

  async saveRule(data: Partial<RecommendRule>) {
    return this.ruleRepo.save(data);
  }

  async deleteRule(id: number) {
    await this.ruleRepo.delete(id);
    return { success: true };
  }

  // ========== SchoolEvent ==========

  async findEventsBySchool(schoolId: number) {
    return this.eventRepo.find({ where: { schoolId }, order: { date: 'ASC', sortOrder: 'ASC' } });
  }

  async findAllEvents() {
    return this.eventRepo.find({ order: { date: 'ASC', sortOrder: 'ASC' } });
  }

  async findEventsBySchoolIds(schoolIds: number[]) {
    if (!schoolIds.length) return [];
    return this.eventRepo
      .createQueryBuilder('e')
      .where('e.schoolId IN (:...ids)', { ids: schoolIds })
      .orderBy('e.date', 'ASC')
      .addOrderBy('e.sortOrder', 'ASC')
      .getMany();
  }

  async findUpcomingEvents(schoolIds: number[]) {
    if (!schoolIds.length) return [];
    const today = new Date().toISOString().slice(0, 10);
    return this.eventRepo
      .createQueryBuilder('e')
      .where('e.schoolId IN (:...ids)', { ids: schoolIds })
      .andWhere('(e.date >= :today OR e.endDate >= :today)', { today })
      .orderBy('e.date', 'ASC')
      .addOrderBy('e.sortOrder', 'ASC')
      .getMany();
  }

  async createEvent(data: Partial<SchoolEvent>) {
    return this.eventRepo.save(data);
  }

  async updateEvent(id: number, data: Partial<SchoolEvent>) {
    await this.eventRepo.update(id, data);
    return this.eventRepo.findOne({ where: { id } });
  }

  async deleteEvent(id: number) {
    await this.eventRepo.delete(id);
    return { success: true };
  }

  async seedEvents() {
    const count = await this.eventRepo.count();
    if (count > 0) return;
    const schools = await this.schoolRepo.find({ where: { isActive: true }, take: 5 });
    const year = new Date().getFullYear();
    const templates = [
      { type: 'registration', title: '网上报名开始', monthDay: '03-01', endMonthDay: '03-15', sortOrder: 1 },
      { type: 'registration', title: '报名截止', monthDay: '03-15', endMonthDay: null, sortOrder: 2 },
      { type: 'written_exam', title: '综合素质笔试', monthDay: '04-12', endMonthDay: null, sortOrder: 3 },
      { type: 'interview', title: '综合面试', monthDay: '04-20', endMonthDay: null, sortOrder: 4 },
      { type: 'result', title: '录取结果公布', monthDay: '05-10', endMonthDay: null, sortOrder: 5 },
    ];
    for (const school of schools) {
      // 每个学校的日期错开几天
      const offset = (school.id - 1) * 3;
      for (const t of templates) {
        const baseDate = new Date(`${year}-${t.monthDay}`);
        baseDate.setDate(baseDate.getDate() + offset);
        const dateStr = baseDate.toISOString().slice(0, 10);
        let endDateStr: string | null = null;
        if (t.endMonthDay) {
          const endBase = new Date(`${year}-${t.endMonthDay}`);
          endBase.setDate(endBase.getDate() + offset);
          endDateStr = endBase.toISOString().slice(0, 10);
        }
        await this.eventRepo.save({
          schoolId: school.id,
          schoolName: school.name,
          type: t.type,
          title: t.title,
          date: dateStr,
          endDate: endDateStr,
          sortOrder: t.sortOrder,
        });
      }
    }
  }
}
