import { Controller, Post, Body, Get, Put, Delete, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from '../../decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() body: { username: string; password: string }) {
    return this.authService.login(body.username, body.password);
  }

  @Get('users')
  async getUsers() {
    return this.authService.getUsers();
  }

  @Get('teachers')
  async getTeachers() {
    return this.authService.getTeachers();
  }

  @Post('users')
  async createUser(@Body() body: { username: string; password: string; name: string; role: string }) {
    return this.authService.createUser(body);
  }

  @Put('users/:id')
  async updateUser(@Param('id') id: string, @Body() body: { name?: string; role?: string; username?: string; permissions?: string }) {
    return this.authService.updateUser(+id, body);
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    return this.authService.deleteUser(+id);
  }

  @Post('change-password')
  async changePassword(@Body() body: { userId: number; oldPassword: string; newPassword: string }) {
    return this.authService.changePassword(body.userId, body.oldPassword, body.newPassword);
  }

  @Put('reset-password/:userId')
  async resetPassword(@Param('userId') userId: string, @Body() body: { newPassword: string }) {
    return this.authService.resetPassword(+userId, body.newPassword);
  }
}
