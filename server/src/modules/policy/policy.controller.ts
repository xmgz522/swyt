import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { PolicyService } from './policy.service';
import { Public } from '../../decorators/public.decorator';
import { Roles } from '../../decorators/roles.decorator';

@Controller('policies')
export class PolicyController {
  constructor(private readonly service: PolicyService) {}

  @Get()
  @Roles('superadmin', 'admin')
  findAll() {
    return this.service.findAll();
  }

  @Public()
  @Get('active')
  findActive() {
    return this.service.findActive();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.service.findOne(+id);
  }

  @Post()
  @Roles('superadmin', 'admin')
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Put(':id')
  @Roles('superadmin', 'admin')
  update(@Param('id') id: number, @Body() body: any) {
    return this.service.update(+id, body);
  }

  @Delete(':id')
  @Roles('superadmin', 'admin')
  remove(@Param('id') id: number) {
    return this.service.remove(+id);
  }
}
