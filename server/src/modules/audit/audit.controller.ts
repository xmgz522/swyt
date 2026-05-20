import { Controller, Get, Query } from '@nestjs/common';
import { AuditService } from './audit.service';

@Controller('audit')
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get('logs')
  findAll(
    @Query('module') module?: string,
    @Query('action') action?: string,
    @Query('username') username?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.auditService.findAll({
      module,
      action,
      username,
      startDate,
      endDate,
      page: page ? +page : 1,
      pageSize: pageSize ? +pageSize : 50,
    });
  }

  @Get('modules')
  getModules() {
    return this.auditService.getModules();
  }
}
