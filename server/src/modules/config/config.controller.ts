import { Controller, Get } from '@nestjs/common';
import { Public } from '../../decorators/public.decorator';

@Controller('config')
export class ConfigController {
  @Public()
  @Get('app')
  getAppConfig() {
    return {
      name: '浙江三位一体测评系统',
      logo: '',
      primaryColor: '#1890ff',
      banner: '',
      phone: '400-000-0000',
      copyright: '© 2026 浙江三位一体测评系统',
      features: {
        recommend: true,
        exam: true,
        report: true,
        manualGrade: true,
      },
    };
  }
}
