import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from '../../entities/student.entity';
import { School } from '../../entities/school.entity';
import { Paper } from '../../entities/paper.entity';
import { AnswerSheet } from '../../entities/answer-sheet.entity';
import { Question } from '../../entities/question.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Student) private studentRepo: Repository<Student>,
    @InjectRepository(School) private schoolRepo: Repository<School>,
    @InjectRepository(Paper) private paperRepo: Repository<Paper>,
    @InjectRepository(AnswerSheet) private sheetRepo: Repository<AnswerSheet>,
    @InjectRepository(Question) private questionRepo: Repository<Question>,
  ) {}

  async getStats() {
    const [students, schools, papers, questions, totalSheets, pendingSheets, gradedSheets] =
      await Promise.all([
        this.studentRepo.count(),
        this.schoolRepo.count({ where: { isActive: true } }),
        this.paperRepo.count(),
        this.questionRepo.count(),
        this.sheetRepo.count(),
        this.sheetRepo.count({ where: { status: 'auto_graded' } }),
        this.sheetRepo.count({ where: { status: 'graded' } }),
      ]);

    // 学考等级分布
    const allStudents = await this.studentRepo.find({ select: ['gradeA', 'gradeB', 'gradeC', 'gradeD', 'gradeE'] });
    const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    allStudents.forEach(s => {
      gradeDistribution.A += s.gradeA || 0;
      gradeDistribution.B += s.gradeB || 0;
      gradeDistribution.C += s.gradeC || 0;
      gradeDistribution.D += s.gradeD || 0;
      gradeDistribution.E += s.gradeE || 0;
    });

    // 成绩分布
    const gradedResults = await this.sheetRepo.find({
      where: { status: 'graded' },
      select: ['totalScore'],
    });
    const scoreRanges = [0, 0, 0, 0, 0];
    gradedResults.forEach(s => {
      const score = s.totalScore;
      if (score <= 20) scoreRanges[0]++;
      else if (score <= 40) scoreRanges[1]++;
      else if (score <= 60) scoreRanges[2]++;
      else if (score <= 80) scoreRanges[3]++;
      else scoreRanges[4]++;
    });

    // 平均分
    const avgScore = gradedResults.length > 0
      ? Math.round(gradedResults.reduce((sum, s) => sum + s.totalScore, 0) / gradedResults.length)
      : 0;

    // 最近注册学生
    const recentStudents = await this.studentRepo.find({
      order: { createdAt: 'DESC' },
      take: 5,
    });

    // 待批答卷
    const pendingSheetList = await this.sheetRepo.find({
      where: { status: 'auto_graded' },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    // 每日新增学生（最近7天）— 单条 GROUP BY 查询
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const startDateStr = sevenDaysAgo.toISOString().slice(0, 10);

    const dailyRaw = await this.studentRepo
      .createQueryBuilder('s')
      .select('DATE(s.createdAt)', 'date')
      .addSelect('COUNT(*)', 'count')
      .where('s.createdAt >= :start', { start: `${startDateStr} 00:00:00` })
      .groupBy('DATE(s.createdAt)')
      .getRawMany();

    const dailyMap = new Map(dailyRaw.map((r: any) => [r.date, +r.count]));
    const dailyStudents: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      dailyStudents.push({ date: dateStr, count: dailyMap.get(dateStr) || 0 });
    }

    // 完成率
    const completionRate = totalSheets > 0 ? Math.round(gradedSheets / totalSheets * 100) : 0;

    return {
      students,
      schools,
      papers,
      questions,
      totalSheets,
      pendingGrade: pendingSheets,
      completedExams: gradedSheets,
      avgScore,
      completionRate,
      gradeDistribution,
      scoreRanges,
      recentStudents,
      pendingSheetList,
      dailyStudents,
    };
  }
}
