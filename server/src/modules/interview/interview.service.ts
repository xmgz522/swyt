import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InterviewQuestion } from '../../entities/interview-question.entity';
import { MockInterview } from '../../entities/mock-interview.entity';
import { School } from '../../entities/school.entity';
import { Student } from '../../entities/student.entity';

@Injectable()
export class InterviewService implements OnModuleInit {
  constructor(
    @InjectRepository(InterviewQuestion) private interviewRepo: Repository<InterviewQuestion>,
    @InjectRepository(MockInterview) private mockRepo: Repository<MockInterview>,
    @InjectRepository(School) private schoolRepo: Repository<School>,
    @InjectRepository(Student) private studentRepo: Repository<Student>,
  ) {}

  async onModuleInit() {
    const count = await this.interviewRepo.count();
    if (count === 0) {
      await this.seedData();
    }
  }

  async getSchoolsWithQuestions() {
    const result = await this.interviewRepo
      .createQueryBuilder('iq')
      .select('iq.schoolId', 'schoolId')
      .addSelect('iq.schoolName', 'schoolName')
      .addSelect('COUNT(*)', 'questionCount')
      .groupBy('iq.schoolId')
      .addGroupBy('iq.schoolName')
      .orderBy('questionCount', 'DESC')
      .getRawMany();
    return result.map(r => ({ schoolId: +r.schoolId, schoolName: r.schoolName, questionCount: +r.questionCount }));
  }

  async getQuestionsBySchool(schoolId: number, category?: string) {
    const where: any = { schoolId };
    if (category) where.category = category;
    return this.interviewRepo.find({ where, order: { sortOrder: 'ASC', id: 'ASC' } });
  }

  async getCategories(schoolId: number) {
    const result = await this.interviewRepo
      .createQueryBuilder('iq')
      .select('iq.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .where('iq.schoolId = :schoolId', { schoolId })
      .groupBy('iq.category')
      .orderBy('count', 'DESC')
      .getRawMany();
    return result.map(r => ({ category: r.category || '未分类', count: +r.count }));
  }

  async findAll(query?: { schoolId?: number; category?: string; keyword?: string }) {
    const qb = this.interviewRepo.createQueryBuilder('iq');
    if (query?.schoolId) qb.andWhere('iq.schoolId = :schoolId', { schoolId: query.schoolId });
    if (query?.category) qb.andWhere('iq.category = :category', { category: query.category });
    if (query?.keyword) qb.andWhere('(iq.question LIKE :kw OR iq.answer LIKE :kw)', { kw: `%${query.keyword}%` });
    qb.orderBy('iq.schoolId', 'ASC').addOrderBy('iq.sortOrder', 'ASC').addOrderBy('iq.id', 'ASC');
    return qb.getMany();
  }

  async create(data: Partial<InterviewQuestion>) {
    if (data.schoolId && !data.schoolName) {
      const school = await this.schoolRepo.findOne({ where: { id: data.schoolId } });
      if (school) data.schoolName = school.name;
    }
    return this.interviewRepo.save(data);
  }

  async update(id: number, data: Partial<InterviewQuestion>) {
    if (data.schoolId && !data.schoolName) {
      const school = await this.schoolRepo.findOne({ where: { id: data.schoolId } });
      if (school) data.schoolName = school.name;
    }
    await this.interviewRepo.update(id, data);
    return this.interviewRepo.findOne({ where: { id } });
  }

  async remove(id: number) {
    await this.interviewRepo.delete(id);
    return { success: true };
  }

  async batchCreate(items: Partial<InterviewQuestion>[]) {
    const saved = [];
    for (const item of items) {
      if (item.schoolId && !item.schoolName) {
        const school = await this.schoolRepo.findOne({ where: { id: item.schoolId } });
        if (school) item.schoolName = school.name;
      }
      saved.push(await this.interviewRepo.save(item));
    }
    return { success: true, count: saved.length };
  }

  // ========== 模拟面试 ==========

  // 开始模拟面试：随机抽 N 道题
  async startMock(studentId: number, schoolId: number, count = 5) {
    const student = await this.studentRepo.findOne({ where: { id: studentId } });
    if (!student) throw new Error('学生不存在');

    const allQuestions = await this.interviewRepo.find({ where: { schoolId } });
    if (allQuestions.length === 0) throw new Error('该学校暂无面试题');

    // 随机选题，尽量覆盖不同分类
    const shuffled = allQuestions.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(count, shuffled.length));

    const school = await this.schoolRepo.findOne({ where: { id: schoolId } });
    const mock = await this.mockRepo.save(this.mockRepo.create({
      studentId,
      schoolId,
      schoolName: school?.name || '',
      questionIds: JSON.stringify(selected.map(q => q.id)),
      status: 'pending',
    }));

    return {
      id: mock.id,
      schoolName: mock.schoolName,
      questions: selected.map(q => ({
        id: q.id,
        question: q.question,
        category: q.category,
        difficulty: q.difficulty,
        tips: q.tips,
      })),
    };
  }

  // 提交回答
  async submitMock(mockId: number, answers: { questionId: number; answer: string }[]) {
    const mock = await this.mockRepo.findOne({ where: { id: mockId } });
    if (!mock) throw new Error('面试记录不存在');
    mock.answers = JSON.stringify(answers);
    mock.status = 'submitted';
    await this.mockRepo.save(mock);
    return { success: true };
  }

  // 老师评分
  async gradeMock(mockId: number, data: {
    scoreLogic: number;
    scoreKnowledge: number;
    scoreQuality: number;
    scoreExpression: number;
    scoreAdaptability: number;
    feedback?: string;
    gradedBy: number;
  }) {
    const mock = await this.mockRepo.findOne({ where: { id: mockId } });
    if (!mock) throw new Error('面试记录不存在');
    mock.scoreLogic = data.scoreLogic;
    mock.scoreKnowledge = data.scoreKnowledge;
    mock.scoreQuality = data.scoreQuality;
    mock.scoreExpression = data.scoreExpression;
    mock.scoreAdaptability = data.scoreAdaptability;
    mock.totalScore = +(
      (data.scoreLogic + data.scoreKnowledge + data.scoreQuality + data.scoreExpression + data.scoreAdaptability) / 5
    ).toFixed(1);
    mock.feedback = data.feedback || null;
    mock.gradedBy = data.gradedBy;
    mock.gradedAt = new Date();
    mock.status = 'graded';
    await this.mockRepo.save(mock);
    return mock;
  }

  // 学生历史记录
  async getMockHistory(studentId: number) {
    return this.mockRepo.find({
      where: { studentId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  // 获取单条面试记录（含题目详情）
  async getMockDetail(mockId: number) {
    const mock = await this.mockRepo.findOne({ where: { id: mockId } });
    if (!mock) return null;

    const questionIds: number[] = JSON.parse(mock.questionIds || '[]');
    const questions = questionIds.length > 0
      ? await this.interviewRepo
          .createQueryBuilder('q')
          .where('q.id IN (:...ids)', { ids: questionIds })
          .getMany()
      : [];

    const answers: any[] = mock.answers ? JSON.parse(mock.answers) : [];

    return {
      ...mock,
      questions: questions.map(q => {
        const ans = answers.find(a => a.questionId === q.id);
        return {
          id: q.id,
          question: q.question,
          category: q.category,
          difficulty: q.difficulty,
          referenceAnswer: q.answer,
          tips: q.tips,
          studentAnswer: ans?.answer || '',
        };
      }),
    };
  }

  // 雷达图数据：最近 N 次面试各维度平均分
  async getRadarData(studentId: number) {
    const graded = await this.mockRepo.find({
      where: { studentId, status: 'graded' },
      order: { gradedAt: 'DESC' },
      take: 10,
    });
    if (graded.length === 0) return { count: 0, radar: null, history: [] };

    const avg = (key: string) =>
      +(graded.reduce((sum, m) => sum + (m as any)[key], 0) / graded.length).toFixed(1);

    return {
      count: graded.length,
      radar: {
        logic: avg('scoreLogic'),
        knowledge: avg('scoreKnowledge'),
        quality: avg('scoreQuality'),
        expression: avg('scoreExpression'),
        adaptability: avg('scoreAdaptability'),
        total: avg('totalScore'),
      },
      history: graded.map(m => ({
        id: m.id,
        schoolName: m.schoolName,
        totalScore: m.totalScore,
        gradedAt: m.gradedAt,
      })),
    };
  }

  // 后台：获取待评分列表
  async getPendingMocks() {
    return this.mockRepo.find({
      where: { status: 'submitted' },
      order: { createdAt: 'ASC' },
    });
  }

  // 后台：获取全部模拟面试记录
  async getAllMocks(query?: { studentId?: number; status?: string }) {
    const qb = this.mockRepo.createQueryBuilder('m');
    if (query?.studentId) qb.andWhere('m.studentId = :sid', { sid: query.studentId });
    if (query?.status) qb.andWhere('m.status = :status', { status: query.status });
    qb.orderBy('m.createdAt', 'DESC');
    return qb.getMany();
  }

  private async seedData() {
    const schools = await this.schoolRepo.find({ where: { isActive: true }, take: 5 });
    if (schools.length === 0) return;

    const sampleQuestions: { category: string; question: string; answer: string; tips?: string; difficulty: string }[] = [
      // 综合素质类
      { category: '综合素质', question: '请做一个简单的自我介绍', answer: '我叫XXX，来自XX中学。我的学考成绩为X个A、X个B。我对贵校的XX专业非常感兴趣，因为...（结合个人经历和特长，突出与目标专业的匹配度）', tips: '控制在1-2分钟内，突出个人亮点和与学校/专业的匹配', difficulty: 'easy' },
      { category: '综合素质', question: '你为什么选择我们学校？', answer: '贵校在XX领域有很强的学科实力，特别是XX专业在全国排名靠前。此外，贵校的XX特色培养模式（如导师制/国际交流/实践教学）非常吸引我。我了解到贵校校训是"XXX"，这与我的价值观高度契合...', tips: '提前了解目标学校特色、校训、知名专业、师资', difficulty: 'easy' },
      { category: '综合素质', question: '你的优点和缺点分别是什么？', answer: '我的优点是XX（举具体事例证明）。我的缺点是有时候过于追求完美/做事节奏稍慢，我正在通过XX方式改进...', tips: '优点要有具体事例支撑，缺点不要说致命缺点，要体现自我反思和改进意识', difficulty: 'easy' },
      { category: '综合素质', question: '高中三年最有成就感的一件事是什么？', answer: '高二时我组织了一次校园科技节活动/带领团队参加XX竞赛获奖/克服困难学好了XX学科...（讲述背景-困难-行动-结果-收获的故事线）', tips: '用STAR法则（情境-任务-行动-结果）组织回答', difficulty: 'medium' },
      { category: '综合素质', question: '你对未来四年的大学生活有什么规划？', answer: '大一打好基础课程，适应大学学习节奏；大二深入专业学习，参加XX社团/实验室；大三进行实习或科研项目；大四准备毕业论文和未来方向（考研/就业）。同时保持阅读和运动的习惯...', tips: '体现对专业的了解、对时间的规划能力，不要太空泛', difficulty: 'medium' },
      // 时事热点类
      { category: '时事热点', question: '你如何看待人工智能对教育的影响？', answer: 'AI对教育既是机遇也是挑战。积极方面：个性化学习、智能辅导、教育资源均衡化；挑战方面：可能加剧教育不公平、学生过度依赖技术。我认为关键是把AI作为工具辅助学习，而非替代独立思考能力的培养...', tips: '辩证思维，有正反两面分析，最后给出自己的观点', difficulty: 'medium' },
      { category: '时事热点', question: '谈谈你对"双碳"目标的理解', answer: '"双碳"即2030年碳达峰、2060年碳中和。这是中国应对气候变化的重大战略部署。实现路径包括：能源结构转型（发展新能源）、产业结构升级、碳交易市场建设、绿色生活方式推广等。作为青年学生，我们可以从节能减排、绿色出行做起...', tips: '了解基本概念、实现路径，联系自身', difficulty: 'medium' },
      { category: '时事热点', question: '你怎么看待"内卷"现象？', answer: '"内卷"本质是在存量博弈中的过度竞争。原因包括资源有限、评价体系单一、焦虑传导等。解决思路：多元评价体系、找到自身热爱的方向、提升效率而非单纯增加时间投入。我个人应对方式是...', tips: '不要只抱怨，要有建设性思考', difficulty: 'medium' },
      // 专业兴趣类
      { category: '专业兴趣', question: '你为什么对这个专业感兴趣？', answer: '我对XX专业的兴趣源自高中XX课程/一次XX经历/一本XX书籍。我了解到这个专业主要学习XX方向，未来可以从事XX工作。我认为自己在XX方面的能力与这个专业匹配...', tips: '结合具体经历，展现对专业的了解，不要泛泛而谈', difficulty: 'easy' },
      { category: '专业兴趣', question: '你对这个专业的了解有多少？', answer: '据我了解，XX专业主要研究XX方向，核心课程包括XX、XX、XX。目前该领域的前沿发展有XX。贵校的XX专业特色是XX，师资方面有XX教授...', tips: '提前做功课，了解专业课程设置、研究方向、就业前景', difficulty: 'medium' },
      { category: '专业兴趣', question: '如果入学后发现这个专业和你想象的不一样，你会怎么做？', answer: '首先我会给自己一个适应期，深入了解专业的核心内涵。如果确实不适合，我会通过辅修、双学位、转专业等途径调整。最重要的是，我相信任何专业都能学到方法论和思维方式，这些都是跨领域适用的...', tips: '展现适应力和解决问题的态度，不要表现得犹豫不决', difficulty: 'hard' },
      // 逻辑思辨类
      { category: '逻辑思辨', question: '有人说"读书无用"，你怎么看？', answer: '这个观点需要辩证看待。"读书无用论"的出现可能因为：部分人认为学历贬值、实践经验更重要。但我认为读书的价值不仅是获得文凭，更在于：培养系统性思维、拓宽认知边界、提升人文素养。同时，学习方式可以多元化，不局限于课本...', tips: '辩证分析，注意逻辑层次，给出自己的明确立场', difficulty: 'medium' },
      { category: '逻辑思辨', question: '公平和效率哪个更重要？', answer: '这不是简单的二选一问题，而是要寻求平衡。在社会发展的不同阶段侧重不同：经济发展初期可能更重视效率，达到一定水平后需要更关注公平。我认为"效率优先、兼顾公平"是比较合理的原则，但底线公平（如教育、医疗）必须保障...', tips: '不要简单站队，展现辩证思维能力', difficulty: 'hard' },
      { category: '逻辑思辨', question: '科技发展会让人类更幸福还是更不幸福？', answer: '科技本身是中性的，关键在于如何使用。科技带来的便利（医疗进步、通信便捷、生产力提升）客观上提升了生活水平。但也带来了信息焦虑、隐私问题、人际关系疏离等挑战。我认为人类需要在拥抱科技的同时，保持对人文价值的关注...', tips: '结合具体事例，正反两面分析', difficulty: 'hard' },
    ];

    for (const school of schools) {
      const questionsToSeed = sampleQuestions.map((q, idx) => ({
        schoolId: school.id,
        schoolName: school.name,
        category: q.category,
        question: q.question,
        answer: q.answer,
        tips: q.tips || null,
        difficulty: q.difficulty,
        year: '2024',
        sortOrder: idx,
      }));
      await this.interviewRepo.save(questionsToSeed);
    }
  }
}
