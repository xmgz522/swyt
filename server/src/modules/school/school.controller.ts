import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { SchoolService } from './school.service';
import { Public } from '../../decorators/public.decorator';
import { Roles } from '../../decorators/roles.decorator';

@Controller('schools')
export class SchoolController {
  constructor(private schoolService: SchoolService) {}

  @Public()
  @Get()
  findAll(@Query('keyword') keyword?: string) {
    if (keyword) return this.schoolService.search(keyword);
    return this.schoolService.findAll();
  }

  @Public()
  @Get('events/all')
  findAllEvents() {
    return this.schoolService.findAllEvents();
  }

  @Public()
  @Get('events/upcoming')
  findUpcomingEvents(@Query('schoolIds') schoolIds: string) {
    const ids = schoolIds ? schoolIds.split(',').map(Number).filter(Boolean) : [];
    return this.schoolService.findUpcomingEvents(ids);
  }

  @Public()
  @Get('events/by-schools')
  findEventsBySchoolIds(@Query('schoolIds') schoolIds: string) {
    const ids = schoolIds ? schoolIds.split(',').map(Number).filter(Boolean) : [];
    return this.schoolService.findEventsBySchoolIds(ids);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.schoolService.findOne(+id);
  }

  @Post()
  @Roles('superadmin', 'admin')
  create(@Body() body: any) {
    return this.schoolService.create(body);
  }

  @Put(':id')
  @Roles('superadmin', 'admin')
  update(@Param('id') id: string, @Body() body: any) {
    return this.schoolService.update(+id, body);
  }

  @Delete(':id')
  @Roles('superadmin', 'admin')
  remove(@Param('id') id: string) {
    return this.schoolService.remove(+id);
  }

  @Get(':id/rules')
  @Roles('superadmin', 'admin')
  getRules(@Param('id') id: string) {
    return this.schoolService.getRules(+id);
  }

  @Post(':id/rules')
  @Roles('superadmin', 'admin')
  saveRule(@Param('id') id: string, @Body() body: any) {
    return this.schoolService.saveRule({ ...body, schoolId: +id });
  }

  @Delete('rules/:ruleId')
  @Roles('superadmin', 'admin')
  deleteRule(@Param('ruleId') ruleId: string) {
    return this.schoolService.deleteRule(+ruleId);
  }

  // ========== SchoolEvent ==========

  @Public()
  @Get(':id/events')
  findEventsBySchool(@Param('id') id: string) {
    return this.schoolService.findEventsBySchool(+id);
  }

  @Post('events')
  @Roles('superadmin', 'admin')
  createEvent(@Body() body: any) {
    return this.schoolService.createEvent(body);
  }

  @Put('events/:eventId')
  @Roles('superadmin', 'admin')
  updateEvent(@Param('eventId') eventId: string, @Body() body: any) {
    return this.schoolService.updateEvent(+eventId, body);
  }

  @Delete('events/:eventId')
  @Roles('superadmin', 'admin')
  deleteEvent(@Param('eventId') eventId: string) {
    return this.schoolService.deleteEvent(+eventId);
  }
}
