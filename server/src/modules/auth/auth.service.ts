import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '../../entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async onModuleInit() {
    const count = await this.userRepo.count();
    if (count === 0) {
      const hash = await bcrypt.hash('admin123', 10);
      await this.userRepo.save({
        username: 'admin',
        password: hash,
        name: '超级管理员',
        role: 'superadmin',
      });
      await this.userRepo.save({
        username: 'teacher',
        password: await bcrypt.hash('teacher123', 10),
        name: '张老师',
        role: 'teacher',
      });
    }
  }

  async login(username: string, password: string) {
    const user = await this.userRepo.findOne({ where: { username } });
    if (!user) return { success: false, message: '用户不存在' };
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return { success: false, message: '密码错误' };
    const token = this.jwtService.sign({ id: user.id, role: user.role });
    return { success: true, token, user: { id: user.id, name: user.name, role: user.role, permissions: user.permissions } };
  }

  async getUsers() {
    return this.userRepo.find({ select: ['id', 'username', 'name', 'role', 'permissions', 'createdAt'] });
  }

  async getTeachers() {
    return this.userRepo.find({
      where: [
        { role: 'teacher' },
        { role: 'admin' },
      ],
      select: ['id', 'name', 'role'],
    });
  }

  async changePassword(userId: number, oldPassword: string, newPassword: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return { success: false, message: '用户不存在' };
    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid) return { success: false, message: '原密码错误' };
    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepo.save(user);
    return { success: true, message: '密码修改成功' };
  }

  async resetPassword(userId: number, newPassword: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return { success: false, message: '用户不存在' };
    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepo.save(user);
    return { success: true, message: '密码重置成功' };
  }

  async createUser(data: { username: string; password: string; name: string; role: string }) {
    const exists = await this.userRepo.findOne({ where: { username: data.username } });
    if (exists) return { success: false, message: '用户名已存在' };
    const hash = await bcrypt.hash(data.password, 10);
    const user = await this.userRepo.save({
      username: data.username,
      password: hash,
      name: data.name,
      role: data.role || 'teacher',
    });
    return { success: true, data: { id: user.id, username: user.username, name: user.name, role: user.role } };
  }

  async updateUser(id: number, data: { name?: string; role?: string; username?: string; permissions?: string }) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) return { success: false, message: '用户不存在' };
    if (data.username && data.username !== user.username) {
      const dup = await this.userRepo.findOne({ where: { username: data.username } });
      if (dup) return { success: false, message: '用户名已存在' };
    }
    if (data.name) user.name = data.name;
    if (data.role) user.role = data.role;
    if (data.username) user.username = data.username;
    if (data.permissions !== undefined) user.permissions = data.permissions;
    await this.userRepo.save(user);
    return { success: true, data: { id: user.id, username: user.username, name: user.name, role: user.role, permissions: user.permissions } };
  }

  async deleteUser(id: number) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) return { success: false, message: '用户不存在' };
    if (user.role === 'superadmin') return { success: false, message: '不能删除超管账号' };
    await this.userRepo.delete(id);
    return { success: true };
  }
}
