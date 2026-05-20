import { Controller, Get, Post, Put, Delete, Param, Query, Body } from '@nestjs/common';
import { InterviewService } from './interview.service';
import { Public } from '../../decorators/public.decorator';
import { Roles } from '../../decorators/roles.decorator';

@Controller('interview')
export class InterviewController {
  constructor(private interviewService: InterviewService) {}

  // 获取有面试题的学校列表（含题目数量）
  @Public()
  @Get('schools')
  getSchools() {
    return this.interviewService.getSchoolsWithQuestions();
  }

  // 获取某学校的分类列表
  @Public()
  @Get('schools/:schoolId/categories')
  getCategories(@Param('schoolId') schoolId: string) {
    return this.interviewService.getCategories(+schoolId);
  }

  // 获取某学校的面试题
  @Public()
  @Get('schools/:schoolId/questions')
  getQuestionsBySchool(
    @Param('schoolId') schoolId: string,
    @Query('category') category?: string,
  ) {
    return this.interviewService.getQuestionsBySchool(+schoolId, category);
  }

  // 后台：获取全部面试题（支持筛选）
  @Get('questions')
  findAll(
    @Query('schoolId') schoolId?: string,
    @Query('category') category?: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.interviewService.findAll({
      schoolId: schoolId ? +schoolId : undefined,
      category,
      keyword,
    });
  }

  // 后台：新增
  @Post('questions')
  create(@Body() body: any) {
    return this.interviewService.create(body);
  }

  // 后台：批量新增
  @Post('questions/batch')
  batchCreate(@Body() body: { items: any[] }) {
    return this.interviewService.batchCreate(body.items);
  }

  // 后台：更新
  @Put('questions/:id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.interviewService.update(+id, body);
  }

  // 后台：删除
  @Delete('questions/:id')
  remove(@Param('id') id: string) {
    return this.interviewService.remove(+id);
  }

  // ========== 模拟面试 ==========

  // 小程序：开始模拟面试
  @Public()
  @Post('mock/start')
  startMock(@Body() body: { studentId: number; schoolId: number; count?: number }) {
    return this.interviewService.startMock(body.studentId, body.schoolId, body.count || 5);
  }

  // 小程序：提交回答
  @Public()
  @Post('mock/:id/submit')
  submitMock(@Param('id') id: string, @Body() body: { answers: { questionId: number; answer: string }[] }) {
    return this.interviewService.submitMock(+id, body.answers);
  }

  // 小程序：学生历史记录
  @Public()
  @Get('mock/history/:studentId')
  getMockHistory(@Param('studentId') studentId: string) {
    return this.interviewService.getMockHistory(+studentId);
  }

  // 小程序：面试详情
  @Public()
  @Get('mock/detail/:id')
  getMockDetail(@Param('id') id: string) {
    return this.interviewService.getMockDetail(+id);
  }

  // 小程序：雷达图数据
  @Public()
  @Get('mock/radar/:studentId')
  getRadarData(@Param('studentId') studentId: string) {
    return this.interviewService.getRadarData(+studentId);
  }

  // 后台：待评分列表
  @Get('mock/pending')
  @Roles('superadmin', 'admin', 'teacher')
  getPendingMocks() {
    return this.interviewService.getPendingMocks();
  }

  // 后台：全部记录
  @Get('mock/all')
  @Roles('superadmin', 'admin', 'teacher')
  getAllMocks(@Query('studentId') studentId?: string, @Query('status') status?: string) {
    return this.interviewService.getAllMocks({
      studentId: studentId ? +studentId : undefined,
      status,
    });
  }

  // 后台：评分
  @Post('mock/:id/grade')
  @Roles('superadmin', 'admin', 'teacher')
  gradeMock(@Param('id') id: string, @Body() body: any) {
    return this.interviewService.gradeMock(+id, body);
  }
}
