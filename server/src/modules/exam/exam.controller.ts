import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseInterceptors, UploadedFile, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtService } from '@nestjs/jwt';
import { ExamService } from './exam.service';
import { Public } from '../../decorators/public.decorator';

@Controller('exam')
export class ExamController {
  constructor(private examService: ExamService, private jwtService: JwtService) {}

  // 题库
  @Get('questions')
  getQuestions(@Query('keyword') keyword?: string, @Query('bankType') bankType?: string) {
    return this.examService.getQuestions(keyword, bankType);
  }

  @Post('questions')
  createQuestion(@Body() body: any) {
    return this.examService.createQuestion(body);
  }

  @Put('questions/:id')
  updateQuestion(@Param('id') id: string, @Body() body: any) {
    return this.examService.updateQuestion(+id, body);
  }

  @Delete('questions/:id')
  deleteQuestion(@Param('id') id: string) {
    return this.examService.deleteQuestion(+id);
  }

  @Post('questions/import')
  @UseInterceptors(FileInterceptor('file'))
  importQuestions(@UploadedFile() file: Express.Multer.File) {
    return this.examService.importQuestions(file.buffer);
  }

  // 试卷（小程序可查看）
  @Public()
  @Get('papers')
  getPapers(@Query('subject') subject: string, @Query('type') type: string, @Query('bankType') bankType: string) {
    return this.examService.getPapers(subject, type, bankType);
  }

  @Public()
  @Get('papers/:id')
  getPaper(@Param('id') id: string) {
    return this.examService.getPaper(+id);
  }

  @Post('papers')
  createPaper(@Body() body: any) {
    return this.examService.createPaper(body);
  }

  @Put('papers/:id')
  updatePaper(@Param('id') id: string, @Body() body: any) {
    return this.examService.updatePaper(+id, body);
  }

  @Delete('papers/:id')
  deletePaper(@Param('id') id: string) {
    return this.examService.deletePaper(+id);
  }

  // 答卷（小程序提交）
  @Public()
  @Post('submit')
  submitAnswerSheet(@Body() body: any) {
    return this.examService.submitAnswerSheet(body);
  }

  @Public()
  @Get('answer-sheets')
  getAnswerSheets(
    @Query('studentId') studentId: string,
    @Query('status') status: string,
    @Query('paperType') paperType?: string,
    @Query('bankType') bankType?: string,
    @Req() req?: any,
  ) {
    let teacherId: number | undefined;
    const auth = req?.headers?.authorization;
    if (auth?.startsWith('Bearer ')) {
      try {
        const payload = this.jwtService.verify(auth.split(' ')[1]);
        if (payload.role === 'teacher') teacherId = payload.id;
      } catch {}
    }
    return this.examService.getAnswerSheets({
      studentId: studentId ? +studentId : undefined,
      status: status || undefined,
      paperType: paperType || undefined,
      bankType: bankType || undefined,
      teacherId,
    });
  }

  @Public()
  @Get('answer-sheets/:id')
  getAnswerSheet(@Param('id') id: string) {
    return this.examService.getAnswerSheet(+id);
  }

  @Post('answer-sheets/:id/grade')
  gradeAnswerSheet(@Param('id') id: string, @Body() body: any) {
    return this.examService.gradeAnswerSheet(+id, body);
  }

  @Public()
  @Get('analysis/:studentId')
  getStudentAnalysis(@Param('studentId') studentId: string, @Query('subject') subject?: string, @Query('bankType') bankType?: string) {
    return this.examService.getStudentAnalysis(+studentId, subject, bankType);
  }

  // 单题练习：获取某科目下的知识点分类（含题目数量）
  @Public()
  @Get('practice/categories')
  getPracticeCategories(@Query('subject') subject: string, @Query('knowledgePoint') knowledgePoint?: string, @Query('type') type?: string, @Query('bankType') bankType?: string) {
    return this.examService.getPracticeCategories(subject, knowledgePoint, type, bankType);
  }

  // 单题练习：按科目+知识点筛选题目
  @Public()
  @Get('practice/questions')
  getPracticeQuestions(
    @Query('subject') subject: string,
    @Query('knowledgePoint') knowledgePoint: string,
    @Query('type') type: string,
    @Query('limit') limit: string,
    @Query('bankType') bankType: string,
  ) {
    return this.examService.getPracticeQuestions(subject, knowledgePoint, type, limit ? Number(limit) : undefined, bankType);
  }

  // 单题练习：核对答案（返回正确答案+解析）
  @Public()
  @Post('practice/check')
  checkAnswer(@Body() body: { questionId: number; answer: string; studentId?: number }) {
    return this.examService.checkPracticeAnswer(body.questionId, body.answer, body.studentId);
  }

  // ==================== 错题本 ====================

  @Public()
  @Get('wrong-notes/:studentId')
  getWrongNotes(
    @Param('studentId') studentId: string,
    @Query('subject') subject?: string,
    @Query('mastered') mastered?: string,
    @Query('bankType') bankType?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.examService.getWrongNotes(+studentId, {
      subject,
      mastered,
      bankType,
      page: page ? +page : undefined,
      pageSize: pageSize ? +pageSize : undefined,
    });
  }

  @Public()
  @Get('wrong-notes/:studentId/stats')
  getWrongNoteStats(@Param('studentId') studentId: string, @Query('bankType') bankType?: string) {
    return this.examService.getWrongNoteStats(+studentId, bankType);
  }

  @Public()
  @Put('wrong-notes/:id/toggle')
  toggleWrongNote(@Param('id') id: string, @Body() body: { mastered: boolean }) {
    return this.examService.toggleWrongNoteMastered(+id, body.mastered);
  }

  @Public()
  @Delete('wrong-notes/:id')
  removeWrongNote(@Param('id') id: string) {
    return this.examService.removeWrongNote(+id);
  }

  @Public()
  @Post('wrong-notes/backfill-bank-type')
  backfillWrongNoteBankType() {
    return this.examService.backfillWrongNoteBankType();
  }

  @Public()
  @Post('wrong-notes/backfill-subjects')
  backfillWrongNoteSubjects() {
    return this.examService.backfillWrongNoteSubjects();
  }

  @Post('seed-xuekao')
  seedXuekao() {
    return this.examService.seedXuekaoData();
  }

  // 图片上传（答题拍照）
  @Public()
  @Post('upload-image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) return { success: false, message: '未收到文件' };
    const fs = await import('fs');
    const path = await import('path');
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const ext = path.extname(file.originalname) || '.jpg';
    const filename = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
    fs.writeFileSync(path.join(uploadDir, filename), file.buffer);
    return { success: true, url: `/uploads/${filename}` };
  }

  // 重置种子数据（开发用）
  @Public()
  @Post('reseed')
  reseed() {
    return this.examService.reseed();
  }
}
