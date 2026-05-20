import { Controller, Get, Post, Put, Delete, Param, Query, Body } from '@nestjs/common';
import { MajorService } from './major.service';
import { Public } from '../../decorators/public.decorator';
import { Roles } from '../../decorators/roles.decorator';

@Controller('majors')
export class MajorController {
  constructor(private majorService: MajorService) {}

  // 公开：专业列表（分页、搜索、分类）
  @Public()
  @Get()
  list(
    @Query('keyword') keyword?: string,
    @Query('category') category?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.majorService.list({
      keyword,
      category,
      page: page ? +page : undefined,
      pageSize: pageSize ? +pageSize : undefined,
    });
  }

  // 公开：获取学科门类列表
  @Public()
  @Get('categories')
  getCategories() {
    return this.majorService.getCategories();
  }

  // 公开：专业详情
  @Public()
  @Get(':id')
  getDetail(@Param('id') id: string) {
    return this.majorService.getDetail(+id);
  }

  // 后台：获取全部
  @Get('admin/all')
  @Roles('superadmin', 'admin', 'teacher')
  findAll(@Query('keyword') keyword?: string, @Query('category') category?: string) {
    return this.majorService.findAll({ keyword, category });
  }

  // 后台：新增
  @Post()
  @Roles('superadmin', 'admin')
  create(@Body() body: any) {
    return this.majorService.create(body);
  }

  // 后台：批量新增
  @Post('batch')
  @Roles('superadmin', 'admin')
  batchCreate(@Body() body: { items: any[] }) {
    return this.majorService.batchCreate(body.items);
  }

  // 后台：更新
  @Put(':id')
  @Roles('superadmin', 'admin')
  update(@Param('id') id: string, @Body() body: any) {
    return this.majorService.update(+id, body);
  }

  // 后台：删除
  @Delete(':id')
  @Roles('superadmin', 'admin')
  remove(@Param('id') id: string) {
    return this.majorService.remove(+id);
  }

  // 后台：初始化预置数据
  @Post('seed')
  @Roles('superadmin', 'admin')
  seed() {
    return this.majorService.seed();
  }
}
