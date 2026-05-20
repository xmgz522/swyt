import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { School } from '../../entities/school.entity';
import { RecommendRule } from '../../entities/recommend-rule.entity';
import { Student } from '../../entities/student.entity';

@Injectable()
export class RecommendService {
  constructor(
    @InjectRepository(School)
    private schoolRepo: Repository<School>,
    @InjectRepository(RecommendRule)
    private ruleRepo: Repository<RecommendRule>,
    @InjectRepository(Student)
    private studentRepo: Repository<Student>,
  ) {}

  async getRecommendations(studentId: number) {
    const student = await this.studentRepo.findOne({ where: { id: studentId } });
    if (!student) return { success: false, message: '学生不存在' };

    const schools = await this.schoolRepo.find({ where: { isActive: true } });
    const rules = await this.ruleRepo.find();

    // 计算已考科目数和剩余潜力
    const gradeTotal = (student.gradeA || 0) + (student.gradeB || 0) + (student.gradeC || 0) + (student.gradeD || 0) + (student.gradeE || 0);
    const remaining = Math.max(0, 10 - gradeTotal);

    // 潜力预估：剩余科目按乐观(70%A + 30%B)估算
    const potentialA = student.gradeA + Math.round(remaining * 0.7);
    const potentialB = student.gradeB + Math.round(remaining * 0.3);
    const potentialC = student.gradeC; // C不会增加

    const results = [];

    for (const school of schools) {
      const schoolRules = rules.filter(r => r.schoolId === school.id);
      let matchLevel = null;
      let isPotential = false;

      for (const rule of schoolRules) {
        // 先用实际成绩匹配
        if (
          student.gradeA >= rule.minGradeA &&
          student.gradeB >= rule.minGradeB &&
          student.gradeC <= rule.maxGradeC
        ) {
          if (!matchLevel || this.getLevelPriority(rule.level) > this.getLevelPriority(matchLevel)) {
            matchLevel = rule.level;
          }
        }
      }

      // 如果实际成绩没匹配到，且还有剩余科目未考，用潜力匹配
      if (!matchLevel && remaining >= 2) {
        for (const rule of schoolRules) {
          if (
            potentialA >= rule.minGradeA &&
            potentialB >= rule.minGradeB &&
            potentialC <= rule.maxGradeC
          ) {
            matchLevel = 'potential';
            isPotential = true;
            break;
          }
        }
      }

      if (matchLevel) {
        // 找到该校最佳匹配规则的要求
        const bestRule = schoolRules.find(r => r.schoolId === school.id);
        const reqText = bestRule ? `该校要求≥${bestRule.minGradeA}A${bestRule.minGradeB}B` : '';

        let reason = '';
        if (isPotential) {
          reason = `您当前${student.gradeA}A${student.gradeB}B，还有${remaining}门未考，预计可达${potentialA}A${potentialB}B。${reqText}，你有机会冲击该校！`;
        } else {
          reason = this.getReasonText(student, school, matchLevel);
          if (reqText) reason += `（${reqText}）`;
        }

        results.push({
          school,
          level: matchLevel,
          levelText: isPotential ? '潜力' : this.getLevelText(matchLevel),
          isPotential,
          reason,
          currentGrade: `${student.gradeA}A${student.gradeB}B${student.gradeC}C`,
          potentialGrade: remaining > 0 ? `${potentialA}A${potentialB}B` : null,
          requirement: bestRule ? { minA: bestRule.minGradeA, minB: bestRule.minGradeB, maxC: bestRule.maxGradeC } : null,
        });
      }
    }

    // 排序: safe > stable > reach > potential
    results.sort((a, b) => this.getLevelPriority(b.level) - this.getLevelPriority(a.level));

    return { success: true, data: results, meta: { gradeTotal, remaining, potentialA, potentialB } };
  }

  async getRecommendationsByProfile(gradeA: number, gradeB: number, gradeC: number) {
    const schools = await this.schoolRepo.find({ where: { isActive: true } });
    const rules = await this.ruleRepo.find();

    const results = [];

    for (const school of schools) {
      const schoolRules = rules.filter(r => r.schoolId === school.id);
      let matchLevel = null;

      for (const rule of schoolRules) {
        if (gradeA >= rule.minGradeA && gradeB >= rule.minGradeB && gradeC <= rule.maxGradeC) {
          if (!matchLevel || this.getLevelPriority(rule.level) > this.getLevelPriority(matchLevel)) {
            matchLevel = rule.level;
          }
        }
      }

      if (matchLevel) {
        results.push({
          school,
          level: matchLevel,
          levelText: this.getLevelText(matchLevel),
        });
      }
    }

    results.sort((a, b) => this.getLevelPriority(b.level) - this.getLevelPriority(a.level));
    return { success: true, data: results };
  }

  private getLevelPriority(level: string): number {
    const map = { safe: 4, stable: 3, reach: 2, potential: 1 };
    return map[level] || 0;
  }

  private getLevelText(level: string): string {
    const map = { safe: '保底', stable: '稳妥', reach: '冲刺', potential: '潜力' };
    return map[level] || '未知';
  }

  private getReasonText(student: any, school: any, level: string): string {
    const g = `${student.gradeA}A${student.gradeB}B`;
    if (level === 'safe') return `您当前${g}，远超该校录取线，录取把握很大`;
    if (level === 'stable') return `您当前${g}，符合该校招生要求，录取概率较高`;
    return `您当前${g}，接近该校要求，加油冲刺有希望`;
  }
}
