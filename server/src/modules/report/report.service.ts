import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from '../../entities/student.entity';
import { AnswerSheet } from '../../entities/answer-sheet.entity';
import { Paper } from '../../entities/paper.entity';
import { Question } from '../../entities/question.entity';
import { School } from '../../entities/school.entity';
import { RecommendRule } from '../../entities/recommend-rule.entity';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Student) private studentRepo: Repository<Student>,
    @InjectRepository(AnswerSheet) private sheetRepo: Repository<AnswerSheet>,
    @InjectRepository(Paper) private paperRepo: Repository<Paper>,
    @InjectRepository(Question) private questionRepo: Repository<Question>,
    @InjectRepository(School) private schoolRepo: Repository<School>,
    @InjectRepository(RecommendRule) private ruleRepo: Repository<RecommendRule>,
  ) {}

  async getStudentReport(studentId: number) {
    const student = await this.studentRepo.findOne({ where: { id: studentId } });
    if (!student) return null;

    // 考试成绩
    const sheets = await this.sheetRepo.find({
      where: { studentId },
      order: { createdAt: 'DESC' },
    });

    const examResults = [];
    for (const sheet of sheets) {
      const paper = await this.paperRepo.findOne({ where: { id: sheet.paperId } });
      const answers = JSON.parse(sheet.answers || '[]');
      const questionIds = paper ? JSON.parse(paper.questionIds || '[]') : [];
      const questions = [];
      for (const qid of questionIds) {
        const q = await this.questionRepo.findOne({ where: { id: qid } });
        if (q) questions.push(q);
      }

      const detail = questions.map(q => {
        const sa = answers.find((a: any) => a.questionId === q.id);
        return {
          content: q.content,
          type: q.type,
          correctAnswer: q.answer,
          studentAnswer: sa?.answer ?? '',
          isCorrect: !q.needManualGrade ? (sa?.answer === q.answer) : null,
          score: q.score,
          knowledgePoint: q.knowledgePoint,
        };
      });

      examResults.push({
        paperTitle: paper?.title || '',
        objectiveScore: sheet.objectiveScore,
        subjectiveScore: sheet.subjectiveScore,
        totalScore: sheet.totalScore,
        paperTotalScore: paper?.totalScore || 0,
        status: sheet.status,
        comment: sheet.comment,
        weakPoints: JSON.parse(sheet.weakPoints || '[]'),
        createdAt: sheet.createdAt,
        detail,
      });
    }

    // 院校推荐（含潜力推荐）
    const rules = await this.ruleRepo.find();
    const schools = await this.schoolRepo.find();
    const gradeTotal = (student.gradeA || 0) + (student.gradeB || 0) + (student.gradeC || 0) + (student.gradeD || 0) + (student.gradeE || 0);
    const remaining = Math.max(0, 10 - gradeTotal);
    const potentialA = student.gradeA + Math.round(remaining * 0.7);
    const potentialB = student.gradeB + Math.round(remaining * 0.3);

    const recommendations = [];
    for (const rule of rules) {
      const match = (student.gradeA >= rule.minGradeA) && (student.gradeB >= rule.minGradeB) && (student.gradeC <= rule.maxGradeC);
      const potentialMatch = !match && remaining >= 2 && (potentialA >= rule.minGradeA) && (potentialB >= rule.minGradeB) && (student.gradeC <= rule.maxGradeC);
      if (match || potentialMatch) {
        const school = schools.find(s => s.id === rule.schoolId);
        if (school) {
          const levelMap: any = { safe: '保底', stable: '稳妥', reach: '冲刺' };
          recommendations.push({
            schoolName: school.name,
            region: school.region,
            type: school.type,
            level: potentialMatch ? 'potential' : rule.level,
            levelText: potentialMatch ? '潜力' : (levelMap[rule.level] || '未知'),
            isPotential: potentialMatch,
          });
        }
      }
    }

    // 薄弱知识点汇总
    const allWeak: string[] = [];
    examResults.forEach(e => allWeak.push(...e.weakPoints));
    const weakCount: Record<string, number> = {};
    allWeak.forEach(w => { weakCount[w] = (weakCount[w] || 0) + 1; });
    const weakAnalysis = Object.entries(weakCount)
      .sort((a, b) => b[1] - a[1])
      .map(([point, count]) => ({ point, count }));

    return {
      student: {
        name: student.name,
        phone: student.phone,
        schoolName: student.schoolName,
        grade: student.grade,
        gradeA: student.gradeA,
        gradeB: student.gradeB,
        gradeC: student.gradeC,
        gradeD: student.gradeD,
        gradeE: student.gradeE,
        preferredRegion: student.preferredRegion,
        preferredMajor: student.preferredMajor,
      },
      examResults,
      recommendations,
      weakAnalysis,
      generatedAt: new Date().toISOString(),
    };
  }
}
