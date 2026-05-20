import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Student } from '../../entities/student.entity';
import { User } from '../../entities/user.entity';

const TOTAL_SUBJECTS = 10;
const VALID_GRADES = ['高一', '高二', '高三'];

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(Student)
    private studentRepo: Repository<Student>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  // 从 subjectGrades JSON 自动计算 gradeA/B/C/D/E 数字
  private computeGradeCounts(data: any) {
    if (data.subjectGrades) {
      const sg = typeof data.subjectGrades === 'string' ? JSON.parse(data.subjectGrades) : data.subjectGrades;
      const counts = { A: 0, B: 0, C: 0, D: 0, E: 0 };
      for (const val of Object.values(sg)) {
        if (val && counts.hasOwnProperty(val as string)) {
          counts[val as string]++;
        }
      }
      data.gradeA = counts.A;
      data.gradeB = counts.B;
      data.gradeC = counts.C;
      data.gradeD = counts.D;
      data.gradeE = counts.E;
      // 确保存储为字符串
      if (typeof data.subjectGrades !== 'string') {
        data.subjectGrades = JSON.stringify(data.subjectGrades);
      }
    }
  }

  private validate(data: Partial<Student>) {
    if (!data.name || !data.name.trim()) {
      throw new BadRequestException('姓名不能为空');
    }
    if (data.phone && !/^1[3-9]\d{9}$/.test(data.phone)) {
      throw new BadRequestException('手机号格式不正确');
    }
    if (data.grade && !VALID_GRADES.includes(data.grade)) {
      throw new BadRequestException('年级只能选择：' + VALID_GRADES.join('、'));
    }

    // 如果有 subjectGrades，先自动计算 gradeA~E
    this.computeGradeCounts(data);

    const a = data.gradeA ?? 0;
    const b = data.gradeB ?? 0;
    const c = data.gradeC ?? 0;
    const d = data.gradeD ?? 0;
    const e = data.gradeE ?? 0;

    if ([a, b, c, d, e].some(v => v < 0 || v > TOTAL_SUBJECTS || !Number.isInteger(v))) {
      throw new BadRequestException('等第数量必须是0-10的整数');
    }

    const total = a + b + c + d + e;
    if (total > TOTAL_SUBJECTS) {
      throw new BadRequestException(`学考一共${TOTAL_SUBJECTS}门，当前A+B+C+D+E=${total}，超出了`);
    }
  }

  async create(data: Partial<Student>) {
    this.validate(data);
    if (!data.teacherId) {
      const teacher = await this.userRepo
        .createQueryBuilder('u')
        .select('u.id')
        .addSelect('COUNT(s.id)', 'cnt')
        .leftJoin(Student, 's', 's.teacherId = u.id')
        .where('u.role IN (:...roles)', { roles: ['teacher', 'admin'] })
        .groupBy('u.id')
        .orderBy('cnt', 'ASC')
        .limit(1)
        .getRawOne();
      if (teacher) {
        data.teacherId = teacher.u_id;
      }
    }
    // 密码加密
    if ((data as any).password) {
      (data as any).password = await bcrypt.hash((data as any).password, 10);
    }
    // 默认账号有效期 2 年
    if (!data.expireAt) {
      const expire = new Date();
      expire.setFullYear(expire.getFullYear() + 2);
      data.expireAt = expire;
    }
    data.status = 'active';
    const student = this.studentRepo.create(data);
    const saved = await this.studentRepo.save(student);
    const { password: _, ...result } = saved as any;
    return result;
  }

  async findAll(page?: number, pageSize?: number, teacherId?: number) {
    const where: any = {};
    if (teacherId) where.teacherId = teacherId;
    if (page && pageSize) {
      const [data, total] = await this.studentRepo.findAndCount({
        where,
        order: { createdAt: 'DESC' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      });
      return { data, total, page, pageSize };
    }
    return this.studentRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOne(id: number) {
    return this.studentRepo.findOne({ where: { id } });
  }

  async update(id: number, data: Partial<Student>) {
    if (data.name !== undefined || data.phone !== undefined || data.grade !== undefined ||
        data.gradeA !== undefined || data.subjectGrades !== undefined) {
      this.validate(data);
    }
    await this.studentRepo.update(id, data);
    return this.findOne(id);
  }

  async login(phone: string, password: string) {
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      throw new BadRequestException('请输入正确的手机号');
    }
    if (!password) {
      throw new BadRequestException('请输入密码');
    }
    const student = await this.studentRepo.findOne({ where: { phone } });
    if (!student) {
      return { success: false, message: '该手机号未注册，请先填写信息' };
    }
    if (!student.password) {
      return { success: false, message: '账号未设置密码，请联系管理员重置' };
    }
    const match = await bcrypt.compare(password, student.password);
    if (!match) {
      return { success: false, message: '密码错误' };
    }
    if (student.status === 'disabled') {
      return { success: false, message: '账号已被停用，请联系管理员' };
    }
    if (student.expireAt && new Date(student.expireAt) < new Date()) {
      return { success: false, message: '账号已过期，请联系管理员续期' };
    }
    const { password: _, ...data } = student as any;
    return { success: true, data };
  }

  // 检查账号状态（自动登录校验用）
  async checkStatus(id: number) {
    const student = await this.studentRepo.findOne({ where: { id } });
    if (!student) return { valid: false, message: '账号不存在' };
    if (student.status === 'disabled') return { valid: false, message: '账号已被停用，请联系管理员' };
    if (student.expireAt && new Date(student.expireAt) < new Date()) return { valid: false, message: '账号已过期，请联系管理员续期' };
    const { password: _, ...data } = student as any;
    return { valid: true, data };
  }

  // 修改密码
  async changePassword(id: number, oldPwd: string, newPwd: string) {
    const student = await this.studentRepo.findOne({ where: { id } });
    if (!student) throw new BadRequestException('学生不存在');
    if (student.password) {
      const match = await bcrypt.compare(oldPwd, student.password);
      if (!match) throw new BadRequestException('原密码错误');
    }
    if (!newPwd || newPwd.length < 6) throw new BadRequestException('新密码至少6位');
    student.password = await bcrypt.hash(newPwd, 10);
    await this.studentRepo.save(student);
    return { success: true };
  }

  // 学生申请重置密码
  async requestPasswordReset(phone: string) {
    const student = await this.studentRepo.findOne({ where: { phone } });
    if (!student) return { success: false, message: '该手机号未注册' };
    student.resetRequested = true;
    await this.studentRepo.save(student);
    return { success: true, message: '已提交重置申请，请等待管理员处理' };
  }

  // 获取重置密码申请列表
  async getResetRequests() {
    return this.studentRepo.find({
      where: { resetRequested: true },
      select: ['id', 'name', 'phone', 'grade', 'schoolName', 'createdAt'],
      order: { updatedAt: 'DESC' },
    });
  }

  // 管理员重置密码
  async resetPassword(id: number, newPwd: string) {
    const student = await this.studentRepo.findOne({ where: { id } });
    if (!student) throw new BadRequestException('学生不存在');
    student.password = await bcrypt.hash(newPwd || '123456', 10);
    student.resetRequested = false;
    await this.studentRepo.save(student);
    return { success: true };
  }

  // 换绑手机号
  async changePhone(id: number, newPhone: string, password: string) {
    if (!newPhone || !/^1[3-9]\d{9}$/.test(newPhone)) {
      throw new BadRequestException('新手机号格式不正确');
    }
    const student = await this.studentRepo.findOne({ where: { id } });
    if (!student) throw new BadRequestException('学生不存在');
    // 验证密码
    if (student.password) {
      const match = await bcrypt.compare(password, student.password);
      if (!match) throw new BadRequestException('密码错误');
    }
    // 检查新号是否已被使用
    const exist = await this.studentRepo.findOne({ where: { phone: newPhone } });
    if (exist && exist.id !== id) throw new BadRequestException('该手机号已被其他账号使用');
    student.phone = newPhone;
    await this.studentRepo.save(student);
    return { success: true };
  }

  async remove(id: number) {
    await this.studentRepo.delete(id);
    return { success: true };
  }

  async autoAssignUnassigned() {
    const unassigned = await this.studentRepo.find({ where: { teacherId: null as any } });
    if (unassigned.length === 0) return { success: true, count: 0 };

    const teachers = await this.userRepo
      .createQueryBuilder('u')
      .select('u.id')
      .addSelect('COUNT(s.id)', 'cnt')
      .leftJoin(Student, 's', 's.teacherId = u.id')
      .where('u.role IN (:...roles)', { roles: ['teacher', 'admin'] })
      .groupBy('u.id')
      .orderBy('cnt', 'ASC')
      .getRawMany();

    if (teachers.length === 0) return { success: false, message: '没有可分配的老师' };

    let assigned = 0;
    for (const student of unassigned) {
      const target = teachers[0];
      student.teacherId = target.u_id;
      await this.studentRepo.save(student);
      assigned++;
      // 更新计数，轮流分配
      const t = teachers.find((x: any) => x.u_id === target.u_id);
      if (t) t.cnt = (+t.cnt) + 1;
      teachers.sort((a: any, b: any) => (+a.cnt) - (+b.cnt));
    }
    return { success: true, count: assigned };
  }
}
