import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecommendController } from './recommend.controller';
import { RecommendService } from './recommend.service';
import { School } from '../../entities/school.entity';
import { RecommendRule } from '../../entities/recommend-rule.entity';
import { Student } from '../../entities/student.entity';

@Module({
  imports: [TypeOrmModule.forFeature([School, RecommendRule, Student])],
  controllers: [RecommendController],
  providers: [RecommendService],
})
export class RecommendModule {}
