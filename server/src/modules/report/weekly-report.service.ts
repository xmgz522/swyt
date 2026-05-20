import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WeeklyReport } from '../../entities/weekly-report.entity';
import { Student } from '../../entities/student.entity';
import { PracticeRecord } from '../../entities/practice-record.entity';
import { AnswerSheet } from '../../entities/answer-sheet.entity';
import { StudyPlan } from '../../entities/study-plan.entity';
import { WrongNote } from '../../entities/wrong-note.entity';
import { Notification } from '../../entities/notification.entity';

@Injectable()
export class WeeklyReportService {
  private readonly logger = new Logger(WeeklyReportService.name);

  constructor(
    @InjectRepository(WeeklyReport) private reportRepo: Repository<WeeklyReport>,
    @InjectRepository(Student) private studentRepo: Repository<Student>,
    @InjectRepository(PracticeRecord) private practiceRepo: Repository<PracticeRecord>,
    @InjectRepository(AnswerSheet) private sheetRepo: Repository<AnswerSheet>,
    @InjectRepository(StudyPlan) private planRepo: Repository<StudyPlan>,
    @InjectRepository(WrongNote) private wrongRepo: Repository<WrongNote>,
    @InjectRepository(Notification) private notifRepo: Repository<Notification>,
  ) {}

  // 每周一早上 9:00 自动生成上周周报
  @Cron('0 9 * * 1')
  async handleWeeklyGeneration() {
    this.logger.log('开始生成学情周报...');
    await this.generateAllReports();
    this.logger.log('学情周报生成完毕');
  }

  // 计算上周的日期范围
  private getLastWeekRange(): { weekStart: string; weekEnd: string } {
    const now = new Date();
    const dayOfWeek = now.getDay() || 7; // 周日=7
    const lastMonday = new Date(now);
    lastMonday.setDate(now.getDate() - dayOfWeek - 6);
    lastMonday.setHours(0, 0, 0, 0);
    const lastSunday = new Date(lastMonday);
    lastSunday.setDate(lastMonday.getDate() + 6);

    return {
      weekStart: lastMonday.toISOString().slice(0, 10),
      weekEnd: lastSunday.toISOString().slice(0, 10),
    };
  }

  // 为所有学生生成周报
  async generateAllReports() {
    const students = await this.studentRepo.find({ select: ['id'] });
    const { weekStart, weekEnd } = this.getLastWeekRange();

    // 批量查出本周已有周报的学生ID，避免 N+1
    const existingReports = await this.reportRepo.find({
      where: { weekStart },
      select: ['studentId'],
    });
    const existingSet = new Set(existingReports.map(r => r.studentId));

    let count = 0;
    for (const student of students) {
      if (existingSet.has(student.id)) continue;
      await this.generateReport(student.id, weekStart, weekEnd);
      count++;
    }
    this.logger.log(`共生成 ${count} 份周报`);
    return { generated: count };
  }

  // 为单个学生生成周报
  async generateReport(studentId: number, weekStart: string, weekEnd: string) {
    const startDate = weekStart;
    const endDate = weekEnd;
    const startDt = `${startDate} 00:00:00`;
    const endDt = `${endDate} 23:59:59`;

    // 1. 练习题统计
    const practices = await this.practiceRepo
      .createQueryBuilder('p')
      .where('p.studentId = :sid', { sid: studentId })
      .andWhere('p.createdAt BETWEEN :start AND :end', { start: startDt, end: endDt })
      .getMany();

    const totalQuestions = practices.length;
    const correctQuestions = practices.filter(p => p.isCorrect).length;
    const accuracy = totalQuestions > 0 ? +((correctQuestions / totalQuestions) * 100).toFixed(1) : 0;

    // 各科统计
    const subjectMap: Record<string, { total: number; correct: number }> = {};
    for (const p of practices) {
      const subj = p.subject || '未分类';
      if (!subjectMap[subj]) subjectMap[subj] = { total: 0, correct: 0 };
      subjectMap[subj].total++;
      if (p.isCorrect) subjectMap[subj].correct++;
    }
    const subjectStats: Record<string, any> = {};
    for (const [k, v] of Object.entries(subjectMap)) {
      subjectStats[k] = { ...v, rate: +((v.correct / v.total) * 100).toFixed(1) };
    }

    // 薄弱知识点
    const weakMap: Record<string, { wrongCount: number; total: number }> = {};
    for (const p of practices) {
      const kp = p.knowledgePoint || '其他';
      if (!weakMap[kp]) weakMap[kp] = { wrongCount: 0, total: 0 };
      weakMap[kp].total++;
      if (!p.isCorrect) weakMap[kp].wrongCount++;
    }
    const weakPoints = Object.entries(weakMap)
      .filter(([, v]) => v.wrongCount > 0)
      .map(([point, v]) => ({ point, ...v, rate: +((v.wrongCount / v.total) * 100).toFixed(1) }))
      .sort((a, b) => b.wrongCount - a.wrongCount)
      .slice(0, 10);

    // 2. 试卷统计
    const sheets = await this.sheetRepo
      .createQueryBuilder('s')
      .where('s.studentId = :sid', { sid: studentId })
      .andWhere('s.createdAt BETWEEN :start AND :end', { start: startDt, end: endDt })
      .getMany();

    const examCount = sheets.length;
    const avgExamScore = examCount > 0
      ? +(sheets.reduce((s, sh) => s + sh.totalScore, 0) / examCount).toFixed(1)
      : 0;

    // 3. 打卡统计
    const plans = await this.planRepo
      .createQueryBuilder('p')
      .where('p.studentId = :sid', { sid: studentId })
      .andWhere('p.date BETWEEN :start AND :end', { start: startDate, end: endDate })
      .getMany();

    const totalTasks = plans.length;
    const completedTasks = plans.filter(p => p.completed).length;
    // 有完成任务的天数
    const checkinDays = new Set(plans.filter(p => p.completed).map(p => p.date)).size;

    // 4. 错题统计
    const newWrong = await this.wrongRepo
      .createQueryBuilder('w')
      .where('w.studentId = :sid', { sid: studentId })
      .andWhere('w.createdAt BETWEEN :start AND :end', { start: startDt, end: endDt })
      .getCount();

    const mastered = await this.wrongRepo
      .createQueryBuilder('w')
      .where('w.studentId = :sid', { sid: studentId })
      .andWhere('w.mastered = true')
      .andWhere('w.updatedAt BETWEEN :start AND :end', { start: startDt, end: endDt })
      .getCount();

    // 5. 上周对比
    const prevStart = new Date(weekStart);
    prevStart.setDate(prevStart.getDate() - 7);
    const prevStartStr = prevStart.toISOString().slice(0, 10);
    const prevEnd = new Date(weekStart);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevEndStr = prevEnd.toISOString().slice(0, 10);

    const lastWeekReport = await this.reportRepo.findOne({
      where: { studentId, weekStart: prevStartStr },
    });
    const lastWeekCompare = lastWeekReport
      ? {
          accuracyChange: +(accuracy - lastWeekReport.accuracy).toFixed(1),
          questionsChange: totalQuestions - lastWeekReport.totalQuestions,
          checkinChange: checkinDays - lastWeekReport.checkinDays,
        }
      : null;

    // 6. 生成文字总结
    const summaryParts: string[] = [];
    summaryParts.push(`本周共做题 ${totalQuestions} 道，正确率 ${accuracy}%。`);
    if (examCount > 0) summaryParts.push(`完成 ${examCount} 份试卷，平均分 ${avgExamScore}。`);
    summaryParts.push(`打卡 ${checkinDays} 天，完成 ${completedTasks}/${totalTasks} 个任务。`);
    if (weakPoints.length > 0) {
      summaryParts.push(`薄弱知识点：${weakPoints.slice(0, 3).map(w => w.point).join('、')}。`);
    }
    if (lastWeekCompare) {
      if (lastWeekCompare.accuracyChange > 0) summaryParts.push(`正确率较上周提升 ${lastWeekCompare.accuracyChange}%，继续保持！`);
      else if (lastWeekCompare.accuracyChange < 0) summaryParts.push(`正确率较上周下降 ${Math.abs(lastWeekCompare.accuracyChange)}%，需要加油！`);
    }

    const report = await this.reportRepo.save(this.reportRepo.create({
      studentId,
      weekStart,
      weekEnd,
      totalQuestions,
      correctQuestions,
      accuracy,
      examCount,
      avgExamScore,
      checkinDays,
      completedTasks,
      totalTasks,
      newWrongCount: newWrong,
      masteredCount: mastered,
      weakPoints: JSON.stringify(weakPoints),
      subjectStats: JSON.stringify(subjectStats),
      lastWeekCompare: lastWeekCompare ? JSON.stringify(lastWeekCompare) : null,
      summary: summaryParts.join(''),
    }));

    return report;
  }

  // 推送周报通知（批量插入 + 批量更新）
  async notifyReports(weekStart: string) {
    const reports = await this.reportRepo.find({
      where: { weekStart, notified: false },
    });
    if (reports.length === 0) return { notified: 0 };

    // 批量创建通知
    const notifications = reports.map(report =>
      this.notifRepo.create({
        title: `📊 学情周报 (${report.weekStart} ~ ${report.weekEnd})`,
        content: report.summary,
        type: 'reminder',
        targetStudentId: report.studentId,
      }),
    );
    await this.notifRepo.save(notifications);

    // 批量更新已推送状态
    const reportIds = reports.map(r => r.id);
    await this.reportRepo
      .createQueryBuilder()
      .update()
      .set({ notified: true })
      .whereInIds(reportIds)
      .execute();

    return { notified: reports.length };
  }

  // 获取学生的周报列表
  async getStudentReports(studentId: number) {
    return this.reportRepo.find({
      where: { studentId },
      order: { weekStart: 'DESC' },
      take: 20,
    });
  }

  // 获取单份周报
  async getReport(id: number) {
    return this.reportRepo.findOne({ where: { id } });
  }

  // 获取学生最新一份周报
  async getLatest(studentId: number) {
    return this.reportRepo.findOne({
      where: { studentId },
      order: { weekStart: 'DESC' },
    });
  }

  // 后台：获取某周全部周报（带学生姓名）
  async getAllByWeek(weekStart: string) {
    const reports = await this.reportRepo.find({
      where: { weekStart },
      order: { studentId: 'ASC' },
    });
    // 补学生姓名
    const studentIds = reports.map(r => r.studentId);
    if (studentIds.length === 0) return [];
    const students = await this.studentRepo.findByIds(studentIds);
    const nameMap = new Map(students.map(s => [s.id, s.name || `学生${s.id}`]));
    return reports.map(r => ({ ...r, studentName: nameMap.get(r.studentId) || `学生${r.studentId}` }));
  }

  // 为单个学生手动生成周报
  async generateForStudent(studentId: number) {
    const { weekStart, weekEnd } = this.getLastWeekRange();
    const exists = await this.reportRepo.findOne({ where: { studentId, weekStart } });
    if (exists) return { message: '该学生本周周报已存在', report: exists };
    const report = await this.generateReport(studentId, weekStart, weekEnd);
    return { message: '生成成功', report };
  }

  // 后台：获取全部周报
  async findAll() {
    return this.reportRepo
      .createQueryBuilder('r')
      .select('r.weekStart', 'weekStart')
      .addSelect('r.weekEnd', 'weekEnd')
      .addSelect('COUNT(*)', 'count')
      .addSelect('AVG(r.accuracy)', 'avgAccuracy')
      .addSelect('AVG(r.totalQuestions)', 'avgQuestions')
      .groupBy('r.weekStart')
      .addGroupBy('r.weekEnd')
      .orderBy('r.weekStart', 'DESC')
      .getRawMany();
  }
}
