import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../../entities/notification.entity';
import { SchoolEvent } from '../../entities/school-event.entity';
import { Student } from '../../entities/student.entity';

const EVENT_TYPE_LABELS: Record<string, string> = {
  registration: '报名',
  written_exam: '笔试',
  interview: '面试',
  result: '录取公布',
  enrollment: '入学',
};

@Injectable()
export class EventReminderService {
  private readonly logger = new Logger(EventReminderService.name);

  constructor(
    @InjectRepository(Notification)
    private notifRepo: Repository<Notification>,
    @InjectRepository(SchoolEvent)
    private eventRepo: Repository<SchoolEvent>,
    @InjectRepository(Student)
    private studentRepo: Repository<Student>,
  ) {}

  // 每天早上 8:00 执行
  @Cron('0 8 * * *')
  async handleDailyReminder() {
    this.logger.log('开始执行院校事件自动提醒...');
    await this.sendReminders();
    this.logger.log('院校事件自动提醒执行完毕');
  }

  async sendReminders() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 提醒时间点：当天、明天(1天)、3天后
    const remindDays = [0, 1, 3];
    const checkDates: string[] = remindDays.map(d => {
      const dt = new Date(today);
      dt.setDate(dt.getDate() + d);
      return dt.toISOString().slice(0, 10);
    });

    // 获取匹配日期的事件（date 或 endDate 匹配）
    const events = await this.eventRepo
      .createQueryBuilder('e')
      .where('e.date IN (:...dates) OR e.endDate IN (:...dates)', { dates: checkDates })
      .getMany();

    if (events.length === 0) return;

    // 获取所有有 selectedSchools 的学生
    const students = await this.studentRepo
      .createQueryBuilder('s')
      .where('s.selectedSchools IS NOT NULL')
      .andWhere("s.selectedSchools != ''")
      .andWhere("s.selectedSchools != '[]'")
      .getMany();

    const todayStr = today.toISOString().slice(0, 10);

    for (const event of events) {
      // 计算距离天数
      const eventDate = event.date;
      const eventEndDate = event.endDate;
      let daysUntil: number | null = null;
      let reminderType = '';

      // 判断提醒类型
      if (eventDate === todayStr) {
        daysUntil = 0;
        reminderType = 'today';
      } else if (eventEndDate === todayStr) {
        daysUntil = 0;
        reminderType = 'deadline_today';
      } else {
        const diffDate = Math.ceil(
          (new Date(eventDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );
        const diffEnd = eventEndDate
          ? Math.ceil(
              (new Date(eventEndDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
            )
          : null;

        if (remindDays.includes(diffDate)) {
          daysUntil = diffDate;
          reminderType = 'upcoming';
        } else if (diffEnd !== null && remindDays.includes(diffEnd)) {
          daysUntil = diffEnd;
          reminderType = 'deadline';
        }
      }

      if (daysUntil === null) continue;

      const typeLabel = EVENT_TYPE_LABELS[event.type] || event.type;

      // 构建通知内容
      let title = '';
      let content = '';
      if (reminderType === 'today') {
        title = `📢 ${event.schoolName}${typeLabel}今天开始`;
        content = `${event.schoolName}的「${event.title}」今天开始${event.endDate ? '，截止' + event.endDate : ''}，请及时关注！`;
      } else if (reminderType === 'deadline_today') {
        title = `⚠️ ${event.schoolName}${typeLabel}今天截止`;
        content = `${event.schoolName}的「${event.title}」今天是最后一天，请抓紧时间！`;
      } else if (reminderType === 'deadline') {
        title = `⏰ ${event.schoolName}${typeLabel}还有${daysUntil}天截止`;
        content = `${event.schoolName}的「${event.title}」将于${event.endDate}截止，还有${daysUntil}天，请做好准备。`;
      } else {
        title = `⏰ ${event.schoolName}${typeLabel}还有${daysUntil}天`;
        content = `${event.schoolName}的「${event.title}」将于${event.date}开始，还有${daysUntil}天，请做好准备。`;
      }

      // 找到关注该学校的学生
      for (const student of students) {
        let selected: any[] = [];
        try {
          selected = JSON.parse(student.selectedSchools || '[]');
        } catch {
          continue;
        }
        const hasSchool = selected.some((s: any) => s.id === event.schoolId);
        if (!hasSchool) continue;

        // 检查是否已放弃
        const schoolEntry = selected.find((s: any) => s.id === event.schoolId);
        if (schoolEntry?.status === 'abandoned') continue;

        // 去重：同一天同一事件同一学生不重复发
        const dedupKey = `event_${event.id}_${todayStr}`;
        const exists = await this.notifRepo
          .createQueryBuilder('n')
          .where('n.targetStudentId = :sid', { sid: student.id })
          .andWhere('n.type = :type', { type: 'reminder' })
          .andWhere('n.title = :title', { title })
          .andWhere('DATE(n.createdAt) = :today', { today: todayStr })
          .getCount();

        if (exists > 0) continue;

        await this.notifRepo.save(
          this.notifRepo.create({
            title,
            content,
            type: 'reminder',
            targetStudentId: student.id,
          }),
        );

        this.logger.log(`已发送提醒: [${student.name}] ${title}`);
      }
    }
  }
}
