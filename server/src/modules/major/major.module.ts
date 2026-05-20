import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Major } from '../../entities/major.entity';
import { MajorService } from './major.service';
import { MajorController } from './major.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Major])],
  controllers: [MajorController],
  providers: [MajorService],
  exports: [MajorService],
})
export class MajorModule {}
