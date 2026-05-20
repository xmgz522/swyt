import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { Student } from '../../entities/student.entity';
import { AnswerSheet } from '../../entities/answer-sheet.entity';
import { Paper } from '../../entities/paper.entity';
import { School } from '../../entities/school.entity';
import { Question } from '../../entities/question.entity';

@Injectable()
export class ExportService {
  constructor(
    @InjectRepository(Student)
    private studentRepo: Repository<Student>,
    @InjectRepository(AnswerSheet)
    private sheetRepo: Repository<AnswerSheet>,
    @InjectRepository(Paper)
    private paperRepo: Repository<Paper>,
    @InjectRepository(School)
    private schoolRepo: Repository<School>,
    @InjectRepository(Question)
    private questionRepo: Repository<Question>,
  ) {}

  async exportStudents(): Promise<ExcelJS.Workbook> {
    const students = await this.studentRepo.find({ order: { createdAt: 'DESC' } });
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('学生列表');

    ws.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: '姓名', key: 'name', width: 12 },
      { header: '手机号', key: 'phone', width: 15 },
      { header: '学校', key: 'schoolName', width: 20 },
      { header: '年级', key: 'grade', width: 8 },
      { header: 'A等第', key: 'gradeA', width: 8 },
      { header: 'B等第', key: 'gradeB', width: 8 },
      { header: 'C等第', key: 'gradeC', width: 8 },
      { header: 'D等第', key: 'gradeD', width: 8 },
      { header: 'E等第', key: 'gradeE', width: 8 },
      { header: '意向地区', key: 'preferredRegion', width: 12 },
      { header: '意向专业', key: 'preferredMajor', width: 12 },
      { header: '注册时间', key: 'createdAt', width: 18 },
    ];

    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '667EEA' } };

    students.forEach(s => {
      ws.addRow({
        ...s,
        createdAt: s.createdAt ? new Date(s.createdAt).toLocaleDateString('zh-CN') : '',
      });
    });

    return wb;
  }

  async exportScores(): Promise<ExcelJS.Workbook> {
    const sheets = await this.sheetRepo.find({ order: { createdAt: 'DESC' } });
    const students = await this.studentRepo.find();
    const papers = await this.paperRepo.find();
    const studentMap = Object.fromEntries(students.map(s => [s.id, s.name]));
    const paperMap = Object.fromEntries(papers.map(p => [p.id, p.title]));

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('成绩列表');

    ws.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: '学生', key: 'studentName', width: 12 },
      { header: '试卷', key: 'paperTitle', width: 25 },
      { header: '客观题分', key: 'objectiveScore', width: 10 },
      { header: '主观题分', key: 'subjectiveScore', width: 10 },
      { header: '总分', key: 'totalScore', width: 10 },
      { header: '状态', key: 'status', width: 12 },
      { header: '薄弱知识点', key: 'weakPoints', width: 25 },
      { header: '提交时间', key: 'createdAt', width: 18 },
    ];

    const statusMap: any = { pending: '待提交', auto_graded: '待批改', graded: '已批改' };
    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '667EEA' } };

    sheets.forEach(s => {
      let wp = '';
      try { wp = JSON.parse(s.weakPoints || '[]').join('、'); } catch {}
      ws.addRow({
        id: s.id,
        studentName: studentMap[s.studentId] || `#${s.studentId}`,
        paperTitle: paperMap[s.paperId] || `#${s.paperId}`,
        objectiveScore: s.objectiveScore,
        subjectiveScore: s.subjectiveScore,
        totalScore: s.totalScore,
        status: statusMap[s.status] || s.status,
        weakPoints: wp,
        createdAt: s.createdAt ? new Date(s.createdAt).toLocaleDateString('zh-CN') : '',
      });
    });

    return wb;
  }

  // ========== 导出院校 ==========
  async exportSchools(): Promise<ExcelJS.Workbook> {
    const schools = await this.schoolRepo.find({ order: { id: 'ASC' } });
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('院校列表');
    ws.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: '学校名称', key: 'name', width: 22 },
      { header: '地区', key: 'region', width: 10 },
      { header: '学校类型', key: 'type', width: 12 },
      { header: '学校简介', key: 'description', width: 40 },
      { header: '招生要求', key: 'requirements', width: 25 },
      { header: '学考要求', key: 'gradeRequirements', width: 20 },
      { header: '面试形式', key: 'interviewType', width: 15 },
      { header: '适合人群', key: 'suitableFor', width: 20 },
      { header: '报考建议', key: 'advice', width: 25 },
    ];
    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '667EEA' } };
    schools.forEach(s => ws.addRow(s));
    return wb;
  }

  // ========== 导入院校 ==========
  async importSchools(buffer: Buffer): Promise<{ total: number; inserted: number }> {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as any);
    const ws = wb.getWorksheet(1);
    const rows: Partial<School>[] = [];
    ws.eachRow((row, i) => {
      if (i === 1) return;
      rows.push({
        name: String(row.getCell(1).value || '').trim(),
        region: String(row.getCell(2).value || '').trim(),
        type: String(row.getCell(3).value || '').trim(),
        description: String(row.getCell(4).value || '').trim(),
        requirements: String(row.getCell(5).value || '').trim(),
        gradeRequirements: String(row.getCell(6).value || '').trim(),
        interviewType: String(row.getCell(7).value || '').trim(),
        suitableFor: String(row.getCell(8).value || '').trim(),
        advice: String(row.getCell(9).value || '').trim(),
      });
    });
    const valid = rows.filter(r => r.name);
    if (valid.length > 0) await this.schoolRepo.save(valid);
    return { total: rows.length, inserted: valid.length };
  }

  // ========== 导入题库 ==========
  async importQuestions(buffer: Buffer): Promise<{ total: number; inserted: number }> {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as any);
    const ws = wb.getWorksheet(1);
    const rows: Partial<Question>[] = [];
    ws.eachRow((row, i) => {
      if (i === 1) return;
      const type = String(row.getCell(1).value || 'single_choice').trim();
      const optVal = row.getCell(4).value;
      let options = '';
      if (optVal) {
        const raw = String(optVal).trim();
        if (raw.startsWith('[')) { options = raw; }
        else { options = JSON.stringify(raw.split(/[;；|]/).map(s => s.trim()).filter(Boolean)); }
      }
      rows.push({
        type,
        content: String(row.getCell(2).value || '').trim(),
        subject: String(row.getCell(3).value || '').trim(),
        options,
        answer: String(row.getCell(5).value || '').trim(),
        explanation: String(row.getCell(6).value || '').trim(),
        score: Number(row.getCell(7).value) || 5,
        difficulty: String(row.getCell(8).value || 'medium').trim(),
        knowledgePoint: String(row.getCell(9).value || '').trim(),
        bankType: String(row.getCell(10).value || '').includes('学考') || String(row.getCell(10).value || '').trim() === 'xuekao' ? 'xuekao' : 'triad',
        needManualGrade: ['short_answer'].includes(type),
      });
    });
    const valid = rows.filter(r => r.content);
    if (valid.length > 0) await this.questionRepo.save(valid);
    return { total: rows.length, inserted: valid.length };
  }

  // ========== 导入学生 ==========
  async importStudents(buffer: Buffer): Promise<{ total: number; inserted: number }> {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as any);
    const ws = wb.getWorksheet(1);
    const rows: Partial<Student>[] = [];
    ws.eachRow((row, i) => {
      if (i === 1) return;
      rows.push({
        name: String(row.getCell(1).value || '').trim(),
        phone: String(row.getCell(2).value || '').trim(),
        schoolName: String(row.getCell(3).value || '').trim(),
        grade: String(row.getCell(4).value || '').trim(),
        gradeA: Number(row.getCell(5).value) || 0,
        gradeB: Number(row.getCell(6).value) || 0,
        gradeC: Number(row.getCell(7).value) || 0,
        gradeD: Number(row.getCell(8).value) || 0,
        gradeE: Number(row.getCell(9).value) || 0,
      });
    });
    const valid = rows.filter(r => r.name);
    if (valid.length > 0) await this.studentRepo.save(valid);
    return { total: rows.length, inserted: valid.length };
  }

  // ========== 导入模板生成 ==========
  generateSchoolTemplate(): ExcelJS.Workbook {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('院校导入模板');
    ws.columns = [
      { header: '学校名称*', key: 'name', width: 22 },
      { header: '地区', key: 'region', width: 10 },
      { header: '学校类型', key: 'type', width: 12 },
      { header: '学校简介', key: 'desc', width: 40 },
      { header: '招生要求', key: 'req', width: 25 },
      { header: '学考要求', key: 'grade', width: 20 },
      { header: '面试形式', key: 'interview', width: 15 },
      { header: '适合人群', key: 'suit', width: 20 },
      { header: '报考建议', key: 'advice', width: 25 },
    ];
    this.styleHeader(ws);
    ws.addRow(['浙江工业大学', '杭州', '省属重点', '浙江省重点建设高校', '学考A3B及以上', '3A3B', '笔试+面试', '理工科优势考生', '冲刺类']);
    return wb;
  }

  generateQuestionTemplate(): ExcelJS.Workbook {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('题库导入模板');
    ws.columns = [
      { header: '题型*', key: 'type', width: 16 },
      { header: '题干*', key: 'content', width: 40 },
      { header: '科目', key: 'subject', width: 10 },
      { header: '选项(分号分隔)', key: 'options', width: 35 },
      { header: '答案', key: 'answer', width: 15 },
      { header: '解析', key: 'explanation', width: 35 },
      { header: '分值', key: 'score', width: 8 },
      { header: '难度', key: 'difficulty', width: 10 },
      { header: '知识点', key: 'kp', width: 20 },
      { header: '题库类型', key: 'bankType', width: 14 },
    ];
    this.styleHeader(ws);
    ws.addRow(['single_choice', '浙江三位一体最早开始于哪一年？', '综合', 'A.2011;B.2012;C.2013;D.2014', 'A', '2011年浙江率先试点', 5, 'easy', '三位一体概述', '三位一体']);
    ws.addRow(['short_answer', '简述三位一体综合评价招生的成绩计算方式', '综合', '', '综合成绩=高考成绩×比例+学考×比例+综合素质测试×比例', '', 10, 'medium', '录取规则', '三位一体']);
    return wb;
  }

  generateStudentTemplate(): ExcelJS.Workbook {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('学生导入模板');
    ws.columns = [
      { header: '姓名*', key: 'name', width: 12 },
      { header: '手机号', key: 'phone', width: 15 },
      { header: '学校', key: 'school', width: 20 },
      { header: '年级', key: 'grade', width: 8 },
      { header: 'A等第数', key: 'a', width: 10 },
      { header: 'B等第数', key: 'b', width: 10 },
      { header: 'C等第数', key: 'c', width: 10 },
      { header: 'D等第数', key: 'd', width: 10 },
      { header: 'E等第数', key: 'e', width: 10 },
    ];
    this.styleHeader(ws);
    ws.addRow(['张三', '13800138000', '杭州学军中学', '高三', 5, 3, 2, 0, 0]);
    return wb;
  }

  private styleHeader(ws: ExcelJS.Worksheet) {
    const row = ws.getRow(1);
    row.font = { bold: true, color: { argb: 'FFFFFF' } };
    row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '667EEA' } };
  }
}
