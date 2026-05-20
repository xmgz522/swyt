import { Controller, Get, Param, Query } from '@nestjs/common';
import { RecommendService } from './recommend.service';
import { Public } from '../../decorators/public.decorator';

@Controller('recommend')
export class RecommendController {
  constructor(private recommendService: RecommendService) {}

  @Public()
  @Get('student/:studentId')
  getByStudent(@Param('studentId') studentId: string) {
    return this.recommendService.getRecommendations(+studentId);
  }

  @Public()
  @Get('query')
  getByProfile(
    @Query('gradeA') gradeA: string,
    @Query('gradeB') gradeB: string,
    @Query('gradeC') gradeC: string,
  ) {
    return this.recommendService.getRecommendationsByProfile(+gradeA, +gradeB, +gradeC);
  }
}
