import { Controller, Get, Post, Res, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ExportService } from './export.service';

@Controller('export')
export class ExportController {
  constructor(private exportService: ExportService) {}

  // ========== 导出 ==========
  @Get('students')
  async exportStudents(@Res() res: Response) {
    const wb = await this.exportService.exportStudents();
    this.sendExcel(res, wb, 'students');
  }

  @Get('scores')
  async exportScores(@Res() res: Response) {
    const wb = await this.exportService.exportScores();
    this.sendExcel(res, wb, 'scores');
  }

  @Get('schools')
  async exportSchools(@Res() res: Response) {
    const wb = await this.exportService.exportSchools();
    this.sendExcel(res, wb, 'schools');
  }

  // ========== 导入 ==========
  @Post('import/schools')
  @UseInterceptors(FileInterceptor('file'))
  async importSchools(@UploadedFile() file: Express.Multer.File) {
    return this.exportService.importSchools(file.buffer);
  }

  @Post('import/questions')
  @UseInterceptors(FileInterceptor('file'))
  async importQuestions(@UploadedFile() file: Express.Multer.File) {
    return this.exportService.importQuestions(file.buffer);
  }

  @Post('import/students')
  @UseInterceptors(FileInterceptor('file'))
  async importStudents(@UploadedFile() file: Express.Multer.File) {
    return this.exportService.importStudents(file.buffer);
  }

  // ========== 模板下载 ==========
  @Get('template/schools')
  async templateSchools(@Res() res: Response) {
    const wb = this.exportService.generateSchoolTemplate();
    this.sendExcel(res, wb, 'school_template');
  }

  @Get('template/questions')
  async templateQuestions(@Res() res: Response) {
    const wb = this.exportService.generateQuestionTemplate();
    this.sendExcel(res, wb, 'question_template');
  }

  @Get('template/students')
  async templateStudents(@Res() res: Response) {
    const wb = this.exportService.generateStudentTemplate();
    this.sendExcel(res, wb, 'student_template');
  }

  private async sendExcel(res: Response, wb: any, name: string) {
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${name}_${Date.now()}.xlsx`);
    await wb.xlsx.write(res);
    res.end();
  }
}
