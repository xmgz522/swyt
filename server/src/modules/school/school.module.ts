import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchoolController } from './school.controller';
import { SchoolService } from './school.service';
import { School } from '../../entities/school.entity';
import { RecommendRule } from '../../entities/recommend-rule.entity';
import { SchoolEvent } from '../../entities/school-event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([School, RecommendRule, SchoolEvent])],
  controllers: [SchoolController],
  providers: [SchoolService],
  exports: [SchoolService],
})
export class SchoolModule {}
