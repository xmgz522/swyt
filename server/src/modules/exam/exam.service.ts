import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { Question } from '../../entities/question.entity';
import { Paper } from '../../entities/paper.entity';
import { AnswerSheet } from '../../entities/answer-sheet.entity';
import { WrongNote } from '../../entities/wrong-note.entity';
import { PracticeRecord } from '../../entities/practice-record.entity';
import { Student } from '../../entities/student.entity';
import { Notification } from '../../entities/notification.entity';

@Injectable()
export class ExamService {
  constructor(
    @InjectRepository(Question) private questionRepo: Repository<Question>,
    @InjectRepository(Paper) private paperRepo: Repository<Paper>,
    @InjectRepository(AnswerSheet) private answerSheetRepo: Repository<AnswerSheet>,
    @InjectRepository(WrongNote) private wrongNoteRepo: Repository<WrongNote>,
    @InjectRepository(PracticeRecord) private practiceRecordRepo: Repository<PracticeRecord>,
    @InjectRepository(Student) private studentRepo: Repository<Student>,
    @InjectRepository(Notification) private notifRepo: Repository<Notification>,
  ) {}

  async onModuleInit() {
    const count = await this.questionRepo.count();
    if (count === 0) {
      await this.seedData();
    }
  }

  async reseed() {
    await this.answerSheetRepo.clear();
    await this.paperRepo.clear();
    await this.questionRepo.clear();
    await this.wrongNoteRepo.clear();
    await this.practiceRecordRepo.clear();
    await this.seedData();
    const qCount = await this.questionRepo.count();
    const pCount = await this.paperRepo.count();
    return { success: true, message: `已重置：${qCount} 道题、${pCount} 套试卷，错题和练习记录已清空` };
  }

  private isAnswerCorrect(studentAnswer: string, correctAnswer: string, type: string): boolean {
    if (!studentAnswer) return false;
    const sa = studentAnswer.trim().toUpperCase();
    const ca = correctAnswer.trim().toUpperCase();
    if (type === 'single_choice') {
      // 提取选项字母前缀（如 "A.《滕王阁序》" → "A"）
      const extractLetter = (s: string) => {
        const m = s.match(/^([A-D])/);
        return m ? m[1] : s;
      };
      return extractLetter(sa) === extractLetter(ca);
    }
    if (type === 'judge') return sa === ca;
    if (type === 'multi_choice') {
      const extractLetters = (s: string) => (s.match(/[A-D]/g) || []).sort().join('');
      return extractLetters(sa) === extractLetters(ca);
    }
    if (type === 'fill') return sa === ca;
    return false;
  }

  private async seedData() {
    // ========= 综合素质测试题（时事热点、逻辑推理、人文素养、科学常识等） =========
    const generalQs = [
      // 时事热点
      { type: 'single_choice', content: '"双碳"目标中，中国承诺实现碳达峰的时间节点是：', options: JSON.stringify(['A. 2025年', 'B. 2030年', 'C. 2035年', 'D. 2060年']), answer: 'B', explanation: '中国承诺2030年前碳达峰、2060年前碳中和', score: 5, knowledgePoint: '时事热点', needManualGrade: false },
      { type: 'single_choice', content: '以下哪个国际组织的总部设在日内瓦？', options: JSON.stringify(['A. 联合国', 'B. 世界贸易组织', 'C. 国际货币基金组织', 'D. 世界银行']), answer: 'B', explanation: 'WTO总部在瑞士日内瓦；联合国总部在纽约；IMF和世界银行总部在华盛顿', score: 5, knowledgePoint: '时事热点', needManualGrade: false },
      { type: 'single_choice', content: '共同富裕示范区设在哪个省份？', options: JSON.stringify(['A. 广东', 'B. 江苏', 'C. 浙江', 'D. 福建']), answer: 'C', explanation: '2021年国家批准浙江建设共同富裕示范区', score: 5, knowledgePoint: '时事热点', needManualGrade: false },
      { type: 'single_choice', content: '中国空间站的名称是：', options: JSON.stringify(['A. 天宫', 'B. 天舟', 'C. 神舟', 'D. 嫦娥']), answer: 'A', explanation: '中国空间站名为"天宫"，天舟是货运飞船，神舟是载人飞船，嫦娥是探月工程', score: 5, knowledgePoint: '时事热点', needManualGrade: false },
      { type: 'single_choice', content: '"一带一路"倡议中"一路"指的是：', options: JSON.stringify(['A. 丝绸之路经济带', 'B. 21世纪海上丝绸之路', 'C. 中欧班列', 'D. 亚投行']), answer: 'B', explanation: '"一带"是丝绸之路经济带，"一路"是21世纪海上丝绸之路', score: 5, knowledgePoint: '时事热点', needManualGrade: false },

      // 逻辑推理
      { type: 'single_choice', content: '如果"所有的鱼都会游泳"为真，那么以下哪项一定为真？', options: JSON.stringify(['A. 会游泳的都是鱼', 'B. 不会游泳的一定不是鱼', 'C. 有些鱼不会游泳', 'D. 不是鱼的一定不会游泳']), answer: 'B', explanation: '"所有A是B"的逆否命题"非B则非A"一定为真，即不会游泳的一定不是鱼', score: 5, knowledgePoint: '逻辑推理', needManualGrade: false },
      { type: 'single_choice', content: '甲说："乙在说谎。"乙说："丙在说谎。"丙说："甲和乙都在说谎。"以下哪项判断正确？', options: JSON.stringify(['A. 甲说真话', 'B. 乙说真话', 'C. 三人都说谎', 'D. 只有乙说真话']), answer: 'D', explanation: '假设乙说真话→丙说谎→"甲和乙都说谎"为假→至少一人说真话（乙确实说真话，自洽）→丙说谎→甲说"乙说谎"为假→甲说谎。验证：乙真、甲丙假，逻辑自洽', score: 5, knowledgePoint: '逻辑推理', needManualGrade: false },
      { type: 'single_choice', content: '数列：2, 6, 12, 20, 30, ____，下一个数是：', options: JSON.stringify(['A. 36', 'B. 40', 'C. 42', 'D. 48']), answer: 'C', explanation: '规律为n×(n+1)：1×2=2, 2×3=6, 3×4=12, 4×5=20, 5×6=30, 6×7=42', score: 5, knowledgePoint: '逻辑推理', needManualGrade: false },
      { type: 'single_choice', content: '某公司有100名员工，其中会英语的有70人，会日语的有35人，两种都不会的有10人。则两种都会的人数为：', options: JSON.stringify(['A. 5人', 'B. 10人', 'C. 15人', 'D. 20人']), answer: 'C', explanation: '会至少一种语言的有100-10=90人；由容斥原理：70+35-x=90，x=15', score: 5, knowledgePoint: '逻辑推理', needManualGrade: false },

      // 人文素养
      { type: 'single_choice', content: '"己所不欲，勿施于人"体现的哲学思想是：', options: JSON.stringify(['A. 道家无为', 'B. 儒家仁恕', 'C. 法家法治', 'D. 墨家兼爱']), answer: 'B', explanation: '这是孔子的名言，体现儒家"恕"的思想', score: 5, knowledgePoint: '人文素养', needManualGrade: false },
      { type: 'single_choice', content: '文艺复兴运动起源于哪个国家？', options: JSON.stringify(['A. 英国', 'B. 法国', 'C. 意大利', 'D. 德国']), answer: 'C', explanation: '文艺复兴14世纪起源于意大利佛罗伦萨', score: 5, knowledgePoint: '人文素养', needManualGrade: false },
      { type: 'single_choice', content: '"良渚古城遗址"被列入世界遗产名录，该遗址位于浙江省哪个城市？', options: JSON.stringify(['A. 宁波', 'B. 杭州', 'C. 绍兴', 'D. 湖州']), answer: 'B', explanation: '良渚古城遗址位于杭州市余杭区，2019年列入世界遗产名录', score: 5, knowledgePoint: '人文素养', needManualGrade: false },
      { type: 'single_choice', content: '《论语》中"学而不思则罔，思而不学则殆"强调的是：', options: JSON.stringify(['A. 学习的重要性', 'B. 思考的重要性', 'C. 学习与思考结合', 'D. 实践的重要性']), answer: 'C', explanation: '这句话强调学与思必须结合，缺一不可', score: 5, knowledgePoint: '人文素养', needManualGrade: false },
      { type: 'single_choice', content: '被称为"东方莎士比亚"的中国戏剧家是：', options: JSON.stringify(['A. 关汉卿', 'B. 汤显祖', 'C. 曹禺', 'D. 梅兰芳']), answer: 'B', explanation: '汤显祖与莎士比亚同时代，代表作《牡丹亭》，被称为"东方莎士比亚"', score: 5, knowledgePoint: '人文素养', needManualGrade: false },

      // 科学常识
      { type: 'single_choice', content: '以下哪种能源属于可再生能源？', options: JSON.stringify(['A. 石油', 'B. 天然气', 'C. 风能', 'D. 煤炭']), answer: 'C', explanation: '风能、太阳能、水能等属于可再生能源；石油、天然气、煤炭是不可再生能源', score: 5, knowledgePoint: '科学常识', needManualGrade: false },
      { type: 'single_choice', content: '人体最大的器官是：', options: JSON.stringify(['A. 心脏', 'B. 肝脏', 'C. 肺', 'D. 皮肤']), answer: 'D', explanation: '皮肤是人体最大的器官，总面积约1.5-2平方米', score: 5, knowledgePoint: '科学常识', needManualGrade: false },
      { type: 'single_choice', content: 'ChatGPT等大语言模型的核心技术架构是：', options: JSON.stringify(['A. 卷积神经网络', 'B. Transformer', 'C. 循环神经网络', 'D. 决策树']), answer: 'B', explanation: 'GPT系列基于Transformer架构', score: 5, knowledgePoint: '科学常识', needManualGrade: false },
      { type: 'single_choice', content: '"温室效应"的主要温室气体是：', options: JSON.stringify(['A. 氧气', 'B. 氮气', 'C. 二氧化碳', 'D. 氢气']), answer: 'C', explanation: '二氧化碳是最主要的温室气体', score: 5, knowledgePoint: '科学常识', needManualGrade: false },
      { type: 'single_choice', content: '5G通信技术相比4G的最大优势不包括：', options: JSON.stringify(['A. 更高速率', 'B. 更低延迟', 'C. 更长续航', 'D. 更大连接数']), answer: 'C', explanation: '5G优势是高速率、低延迟、大连接，但并不直接提升设备续航', score: 5, knowledgePoint: '科学常识', needManualGrade: false },

      // 判断题
      { type: 'judge', content: '"可持续发展"的核心理念是既满足当代人的需求，又不危及后代人满足其需求的能力。', options: JSON.stringify(['正确', '错误']), answer: '正确', explanation: '这是1987年布伦特兰委员会对可持续发展的经典定义', score: 5, knowledgePoint: '时事热点', needManualGrade: false },
      { type: 'judge', content: '浙江是中国民营经济最发达的省份之一。', options: JSON.stringify(['正确', '错误']), answer: '正确', explanation: '浙江民营经济贡献了全省约65%的GDP', score: 5, knowledgePoint: '时事热点', needManualGrade: false },
      { type: 'judge', content: '人工智能可以完全取代人类的创造性思维。', options: JSON.stringify(['正确', '错误']), answer: '错误', explanation: 'AI目前在创造性、情感理解等方面仍远不及人类', score: 5, knowledgePoint: '科学常识', needManualGrade: false },
      { type: 'judge', content: '三段论"所有人都会死→苏格拉底是人→所以苏格拉底会死"是有效推理。', options: JSON.stringify(['正确', '错误']), answer: '正确', explanation: '这是经典的演绎推理三段论，大前提+小前提→结论', score: 5, knowledgePoint: '逻辑推理', needManualGrade: false },

      // 主观题
      { type: 'short_answer', content: '有人说"科技是把双刃剑"，请结合一个具体例子，谈谈你对科技发展利弊的看法。', answer: '', explanation: '', score: 20, knowledgePoint: '综合思辨', needManualGrade: true },
      { type: 'short_answer', content: '如果你是一座城市的市长，面对老龄化问题，你会采取哪些措施？请至少提出三条建议并说明理由。', answer: '', explanation: '', score: 20, knowledgePoint: '综合思辨', needManualGrade: true },
      { type: 'short_answer', content: '"读万卷书不如行万里路"，你同意这个观点吗？请阐述你的理由。', answer: '', explanation: '', score: 20, knowledgePoint: '人文素养', needManualGrade: true },
      { type: 'short_answer', content: '浙江是"绿水青山就是金山银山"理念的发源地，请结合实际谈谈如何平衡经济发展与环境保护。', answer: '', explanation: '', score: 20, knowledgePoint: '综合思辨', needManualGrade: true },
    ];

    // ========= 综合素质测试题（第二组） =========
    const triadQs2 = [
      { type: 'single_choice', content: '以下哪位思想家提出了"知行合一"？', options: JSON.stringify(['A. 朱熹', 'B. 王阳明', 'C. 程颢', 'D. 陆九渊']), answer: 'B', explanation: '明代王阳明（王守仁）提出"知行合一"的哲学思想', score: 5, knowledgePoint: '人文素养', needManualGrade: false },
      { type: 'single_choice', content: '联合国安理会常任理事国共有几个？', options: JSON.stringify(['A. 3个', 'B. 4个', 'C. 5个', 'D. 6个']), answer: 'C', explanation: '五个常任理事国：中、美、俄、英、法', score: 5, knowledgePoint: '时事热点', needManualGrade: false },
      { type: 'single_choice', content: '以下哪项不属于亚里士多德提出的"三段论"要素？', options: JSON.stringify(['A. 大前提', 'B. 小前提', 'C. 结论', 'D. 假设']), answer: 'D', explanation: '三段论由大前提、小前提和结论三部分组成，不含"假设"', score: 5, knowledgePoint: '逻辑推理', needManualGrade: false },
      { type: 'single_choice', content: '浙江省的GDP在全国省份中排名大约是：', options: JSON.stringify(['A. 前3', 'B. 前5', 'C. 前10', 'D. 前15']), answer: 'B', explanation: '浙江GDP长期位居全国第4或第5位', score: 5, knowledgePoint: '时事热点', needManualGrade: false },
      { type: 'single_choice', content: '以下关于基因编辑技术CRISPR的说法，错误的是：', options: JSON.stringify(['A. 可以精准修改DNA序列', 'B. 已完全没有伦理争议', 'C. 可用于治疗遗传病', 'D. 源于细菌的免疫系统']), answer: 'B', explanation: '基因编辑涉及重大伦理问题，全球仍在广泛讨论其边界', score: 5, knowledgePoint: '科学常识', needManualGrade: false },
      { type: 'single_choice', content: '"囚徒困境"说明的博弈论核心问题是：', options: JSON.stringify(['A. 个体理性导致集体非理性', 'B. 合作一定优于竞争', 'C. 信息越多决策越好', 'D. 竞争一定优于合作']), answer: 'A', explanation: '囚徒困境的经典结论是每个人追求自身最优，反而导致整体结果最差', score: 5, knowledgePoint: '逻辑推理', needManualGrade: false },
      { type: 'single_choice', content: '以下哪个朝代被认为是中国古代科技发展的高峰？', options: JSON.stringify(['A. 秦朝', 'B. 汉朝', 'C. 宋朝', 'D. 清朝']), answer: 'C', explanation: '宋朝在活字印刷、火药、指南针等方面取得重大突破，是古代科技高峰', score: 5, knowledgePoint: '人文素养', needManualGrade: false },
      { type: 'single_choice', content: '全球气候变化《巴黎协定》的核心目标是：', options: JSON.stringify(['A. 消除贫困', 'B. 控制全球升温在2℃以内', 'C. 禁止使用化石能源', 'D. 增加森林面积50%']), answer: 'B', explanation: '《巴黎协定》目标是将全球平均气温升幅控制在2℃以内，并努力限制在1.5℃', score: 5, knowledgePoint: '时事热点', needManualGrade: false },
      { type: 'single_choice', content: '以下哪部法律被称为"社会生活的百科全书"？', options: JSON.stringify(['A. 宪法', 'B. 刑法', 'C. 民法典', 'D. 行政法']), answer: 'C', explanation: '《民法典》调整平等主体间的人身和财产关系，涵盖社会生活方方面面', score: 5, knowledgePoint: '人文素养', needManualGrade: false },
      { type: 'single_choice', content: '批判性思维的核心要素不包括：', options: JSON.stringify(['A. 质疑假设', 'B. 盲从权威', 'C. 分析论据', 'D. 独立判断']), answer: 'B', explanation: '批判性思维强调质疑、分析和独立判断，恰恰反对盲从权威', score: 5, knowledgePoint: '逻辑推理', needManualGrade: false },
      { type: 'single_choice', content: '"数字浙江"建设中，"最多跑一次"改革的核心理念是：', options: JSON.stringify(['A. 减少公务员', 'B. 以群众需求为导向的政务服务改革', 'C. 取消所有审批', 'D. 全部线上办理']), answer: 'B', explanation: '"最多跑一次"改革是以人民为中心，让群众办事最多跑一次', score: 5, knowledgePoint: '时事热点', needManualGrade: false },
      { type: 'single_choice', content: '量子计算相比经典计算的核心优势在于：', options: JSON.stringify(['A. 体积更小', 'B. 并行计算能力指数级增长', 'C. 耗电更少', 'D. 操作更简单']), answer: 'B', explanation: '量子比特可叠加态，使计算能力呈指数级增长', score: 5, knowledgePoint: '科学常识', needManualGrade: false },
      { type: 'judge', content: '马克思主义认为，经济基础决定上层建筑。', options: JSON.stringify(['正确', '错误']), answer: '正确', explanation: '这是历史唯物主义的基本原理', score: 5, knowledgePoint: '人文素养', needManualGrade: false },
      { type: 'judge', content: '"相关关系"等同于"因果关系"。', options: JSON.stringify(['正确', '错误']), answer: '错误', explanation: '相关不等于因果，两个变量相关可能是巧合、混淆变量等原因', score: 5, knowledgePoint: '逻辑推理', needManualGrade: false },
      { type: 'judge', content: '新能源汽车在使用过程中实现了零碳排放，因此对环境完全没有影响。', options: JSON.stringify(['正确', '错误']), answer: '错误', explanation: '电池生产和回收、发电来源等环节仍有环境影响', score: 5, knowledgePoint: '科学常识', needManualGrade: false },
      { type: 'judge', content: '联合国的工作语言只有英语和法语两种。', options: JSON.stringify(['正确', '错误']), answer: '错误', explanation: '联合国有六种工作语言：中文、英文、法文、俄文、西班牙文、阿拉伯文', score: 5, knowledgePoint: '时事热点', needManualGrade: false },
      { type: 'short_answer', content: '有人认为"人工智能将导致大规模失业"，也有人认为"AI会创造更多新岗位"。请谈谈你的看法。', answer: '', explanation: '', score: 20, knowledgePoint: '综合思辨', needManualGrade: true },
      { type: 'short_answer', content: '请分析"内卷"现象产生的原因，并提出你认为可行的解决思路。', answer: '', explanation: '', score: 20, knowledgePoint: '综合思辨', needManualGrade: true },
    ];

    const englishQs = [
      { type: 'single_choice', subject: '英语', knowledgePoint: '语法选择', content: 'She suggested that we _____ a meeting to discuss the problem.', options: JSON.stringify(['A. held', 'B. hold', 'C. would hold', 'D. holding']), answer: 'B', explanation: 'suggest后接虚拟语气，谓语用动词原形', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '英语', knowledgePoint: '语法选择', content: 'Not until he got home _____ he had lost his key.', options: JSON.stringify(['A. did he realize', 'B. he realized', 'C. he did realize', 'D. realized he']), answer: 'A', explanation: 'Not until引导的句子，主句需要部分倒装', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '英语', knowledgePoint: '语法选择', content: 'The number of students who _____ the exam _____ increased this year.', options: JSON.stringify(['A. takes; has', 'B. take; have', 'C. take; has', 'D. takes; have']), answer: 'C', explanation: 'who指代students用复数；the number of作主语谓语用单数', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '英语', knowledgePoint: '语法选择', content: 'I would rather you _____ tomorrow than today.', options: JSON.stringify(['A. come', 'B. came', 'C. will come', 'D. had come']), answer: 'B', explanation: 'would rather后接从句用虚拟语气，表将来用过去时', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '英语', knowledgePoint: '七选五', content: '阅读下文，选出最佳选项填入空白处。\nTravel is one of the best ways to learn. _____ You get to see new places, meet new people, and experience different cultures.', options: JSON.stringify(['A. It opens your eyes to the world.', 'B. However, it can be expensive.', 'C. Many people dislike traveling.', 'D. You should stay at home.']), answer: 'A', explanation: '根据后文"see new places, meet new people"可知是说旅行开阔眼界', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '英语', knowledgePoint: '七选五', content: 'Exercise is important for health. _____ Even a 30-minute walk each day can make a big difference.', options: JSON.stringify(['A. You don\'t need to go to a gym.', 'B. Fast food is unhealthy.', 'C. Reading is also good.', 'D. Sleep more hours.']), answer: 'A', explanation: '后文说30分钟走路就有效，说明不需要去健身房', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '英语', knowledgePoint: '完形填空', content: 'Tom was very nervous before his first speech. But once he started talking, he found that the audience was very _____ and he gradually relaxed.', options: JSON.stringify(['A. unfriendly', 'B. supportive', 'C. bored', 'D. angry']), answer: 'B', explanation: '根据"gradually relaxed"可知观众很支持他', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '英语', knowledgePoint: '完形填空', content: 'She had always been afraid of water. However, after weeks of practice, she finally learned to _____ and felt proud of herself.', options: JSON.stringify(['A. sink', 'B. swim', 'C. drown', 'D. float']), answer: 'B', explanation: '怕水→练习→学会游泳→自豪，逻辑通顺', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '英语', knowledgePoint: '阅读理解', content: '根据文章：Jack spent 3 years building a small library in his village. Now over 200 children visit it every week. 问：What did Jack do for his village?', options: JSON.stringify(['A. Built a school', 'B. Built a library', 'C. Built a hospital', 'D. Built a park']), answer: 'B', explanation: '文中明确说"building a small library"', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '英语', knowledgePoint: '阅读理解', content: '根据文章：The experiment showed that plants grow faster with music playing nearby. 问：What was the result of the experiment?', options: JSON.stringify(['A. Plants died with music', 'B. Plants grew slower', 'C. Plants grew faster with music', 'D. Music had no effect']), answer: 'C', explanation: '文中说"grow faster with music"', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '英语', knowledgePoint: '语法选择', content: 'It is the first time that I _____ to Beijing.', options: JSON.stringify(['A. have been', 'B. had been', 'C. went', 'D. am going']), answer: 'A', explanation: 'It is the first time后用现在完成时', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '英语', knowledgePoint: '语法选择', content: '_____ hard, and you will succeed.', options: JSON.stringify(['A. Working', 'B. To work', 'C. Work', 'D. Worked']), answer: 'C', explanation: '祈使句+and+将来时，前面用动词原形', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '英语', knowledgePoint: '阅读理解', content: '文章：The new library has over 50,000 books and is open from 8am to 10pm every day. 问：When does the library close?', options: JSON.stringify(['A. 8am', 'B. 10am', 'C. 8pm', 'D. 10pm']), answer: 'D', explanation: '文中明确说"open from 8am to 10pm"', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '英语', knowledgePoint: '完形填空', content: 'The little girl was so _____ that she couldn\'t stop crying when she lost her toy.', options: JSON.stringify(['A. happy', 'B. sad', 'C. angry', 'D. excited']), answer: 'B', explanation: '丢了玩具哭→sad', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '英语', knowledgePoint: '词汇辨析', content: 'The teacher asked us to _____ the new words in the text.', options: JSON.stringify(['A. look up', 'B. look at', 'C. look for', 'D. look after']), answer: 'A', explanation: 'look up查字典；look at看；look for寻找；look after照顾', score: 3, needManualGrade: false },
    ];

    const chineseQs = [
      { type: 'single_choice', subject: '语文', knowledgePoint: '字音字形', content: '下列词语中加点字的读音完全正确的一项是：', options: JSON.stringify(['A. 踌躇(chú) 恣意(zì) 缱绻(quǎn)', 'B. 叱咤(chà) 包扎(zā) 联袂(mèi)', 'C. 踌躇(chú) 恣意(zì) 联袂(mèi)', 'D. 叱咤(zhà) 包扎(zā) 缱绻(quǎn)']), answer: 'C', explanation: '踌躇chóuchú、恣意zì、联袂mèi均正确；叱咤应读zhà', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '语文', knowledgePoint: '字音字形', content: '下列词语书写全部正确的一项是：', options: JSON.stringify(['A. 寒暄 诙谐 竭泽而渔', 'B. 消遣 追朔 变本加历', 'C. 浮燥 安祥 黄粱一梦', 'D. 慰籍 蜕变 不记其数']), answer: 'A', explanation: 'B追溯、变本加厉；C浮躁、安详；D慰藉、不计其数', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '语文', knowledgePoint: '成语运用', content: '下列加点成语使用正确的一项是：', options: JSON.stringify(['A. 这件事对他来说简直是大材小用', 'B. 这部小说情节扣人心弦，读来让人感同身受', 'C. 他说话总是闪烁其词，让人无所适从', 'D. 会场上人声鼎沸，大家七嘴八舌']), answer: 'C', explanation: '闪烁其词指说话含糊不清，语境恰当', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '语文', knowledgePoint: '成语运用', content: '下列句中加点成语使用不恰当的一项是：', options: JSON.stringify(['A. 这位老教师兢兢业业工作了三十年', 'B. 他高谈阔论，令在场的专家刮目相看', 'C. 同学们异口同声地回答了问题', 'D. 他做事总是举棋不定，错过了很多机会']), answer: 'B', explanation: '高谈阔论含贬义，指漫无边际地大发议论，不能令人刮目相看', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '语文', knowledgePoint: '文言文阅读', content: '"学而时习之，不亦说乎"中"说"的意思是：', options: JSON.stringify(['A. 说话', 'B. 高兴', 'C. 解释', 'D. 劝说']), answer: 'B', explanation: '说通悦，高兴的意思', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '语文', knowledgePoint: '文言文阅读', content: '"温故而知新，可以为师矣"中"故"的意思是：', options: JSON.stringify(['A. 故意', 'B. 所以', 'C. 旧的知识', 'D. 故事']), answer: 'C', explanation: '故指旧的、已经学过的知识', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '语文', knowledgePoint: '病句辨析', content: '下列句子没有语病的一项是：', options: JSON.stringify(['A. 通过这次活动，使同学们受到了教育', 'B. 他的学习成绩有了明显的提高', 'C. 能否保持良好心态是考试成功的关键', 'D. 我们要发挥和继承中华传统文化']), answer: 'B', explanation: 'A缺主语；C两面对一面；D语序不当应为"继承和发挥"', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '语文', knowledgePoint: '名句默写', content: '"落霞与孤鹜齐飞，秋水共长天一色"出自：', options: JSON.stringify(['A.《滕王阁序》', 'B.《岳阳楼记》', 'C.《醉翁亭记》', 'D.《赤壁赋》']), answer: 'A', explanation: '出自王勃《滕王阁序》', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '语文', knowledgePoint: '名句默写', content: '"先天下之忧而忧，后天下之乐而乐"的作者是：', options: JSON.stringify(['A. 欧阳修', 'B. 范仲淹', 'C. 苏轼', 'D. 王安石']), answer: 'B', explanation: '出自范仲淹《岳阳楼记》', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '语文', knowledgePoint: '文学常识', content: '下列作品与作者对应正确的是：', options: JSON.stringify(['A.《红楼梦》—罗贯中', 'B.《水浒传》—施耐庵', 'C.《西游记》—蒲松龄', 'D.《三国演义》—曹雪芹']), answer: 'B', explanation: '《水浒传》作者施耐庵', score: 3, needManualGrade: false },
      { type: 'fill', subject: '语文', knowledgePoint: '名句默写', content: '海内存知己，____。（王勃《送杜少府之任蜀州》）', answer: '天涯若比邻', explanation: '王勃名句', score: 3, needManualGrade: false },
      { type: 'fill', subject: '语文', knowledgePoint: '名句默写', content: '____，悠然见南山。（陶渊明《饮酒》）', answer: '采菊东篱下', explanation: '陶渊明名句', score: 3, needManualGrade: false },
    ];

    const mathQs = [
      { type: 'single_choice', subject: '数学', knowledgePoint: '集合', content: '设全集U={1,2,3,4,5}，A={1,3,5}，B={2,3,4}，则A∩B=', options: JSON.stringify(['A. {3}', 'B. {1,2,3,4,5}', 'C. {1,5}', 'D. {2,4}']), answer: 'A', explanation: 'A∩B是两个集合的公共元素，只有3同时在A和B中', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '数学', knowledgePoint: '集合', content: '设A={x|x²-3x+2=0}，则A的元素个数为：', options: JSON.stringify(['A. 0', 'B. 1', 'C. 2', 'D. 3']), answer: 'C', explanation: 'x²-3x+2=0解为x=1和x=2，共2个元素', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '数学', knowledgePoint: '函数', content: '函数f(x)=x²-2x+3的最小值为：', options: JSON.stringify(['A. 1', 'B. 2', 'C. 3', 'D. 4']), answer: 'B', explanation: 'f(x)=(x-1)²+2，当x=1时取最小值2', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '数学', knowledgePoint: '函数', content: '函数y=log₂(x-1)的定义域为：', options: JSON.stringify(['A. (0, +∞)', 'B. (1, +∞)', 'C. [1, +∞)', 'D. (-∞, +∞)']), answer: 'B', explanation: '对数函数真数>0，即x-1>0，x>1', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '数学', knowledgePoint: '三角函数', content: 'sin30°+cos60°的值为：', options: JSON.stringify(['A. 0', 'B. 1/2', 'C. 1', 'D. √3/2']), answer: 'C', explanation: 'sin30°=1/2，cos60°=1/2，相加得1', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '数学', knowledgePoint: '三角函数', content: '在三角形ABC中，若A=60°，b=2，c=3，则a的值为：', options: JSON.stringify(['A. √7', 'B. √13', 'C. 7', 'D. 13']), answer: 'A', explanation: '由余弦定理a²=b²+c²-2bc·cosA=4+9-2×2×3×(1/2)=7，a=√7', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '数学', knowledgePoint: '概率统计', content: '1,2,3,4,5中随机抽取2个数，它们的和为偶数的概率是：', options: JSON.stringify(['A. 2/5', 'B. 3/10', 'C. 4/10', 'D. 1/2']), answer: 'C', explanation: '和为偶数：两个都是奇数C(3,2)=3种或两个都是偶数C(2,2)=1种，共4种；总共C(5,2)=10种，概率=4/10=2/5', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '数学', knowledgePoint: '数列', content: '等差数列{an}中，a₁=2，d=3，则a₁₀=', options: JSON.stringify(['A. 27', 'B. 29', 'C. 30', 'D. 32']), answer: 'B', explanation: 'a₁₀=a₁+9d=2+27=29', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '数学', knowledgePoint: '数列', content: '等比数列{an}中，a₁=1，q=2，则S₅=', options: JSON.stringify(['A. 15', 'B. 31', 'C. 32', 'D. 63']), answer: 'B', explanation: 'S₅=a₁(1-q⁵)/(1-q)=1×(1-32)/(1-2)=31', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '数学', knowledgePoint: '向量', content: '向量a=(1,2)，b=(3,1)，则a·b=', options: JSON.stringify(['A. 3', 'B. 5', 'C. 7', 'D. 2']), answer: 'B', explanation: 'a·b=1×3+2×1=5', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '数学', knowledgePoint: '不等式', content: '不等式x²-5x+6<0的解集为：', options: JSON.stringify(['A. (2,3)', 'B. (-∞,2)∪(3,+∞)', 'C. [2,3]', 'D. (-∞,2]∪[3,+∞)']), answer: 'A', explanation: 'x²-5x+6=(x-2)(x-3)<0，解为2<x<3', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '数学', knowledgePoint: '立体几何', content: '正方体的体对角线长为√3，则棱长为：', options: JSON.stringify(['A. 1', 'B. √2', 'C. √3/3', 'D. 3']), answer: 'A', explanation: '体对角线=√(3a²)=√3，a=1', score: 3, needManualGrade: false },
    ];

    const physicsQs = [
      { type: 'single_choice', subject: '物理', knowledgePoint: '力学', content: '一个物体静止在光滑水平面上，受到两个互相垂直的力F₁=3N和F₂=4N的作用，则合力大小为：', options: JSON.stringify(['A. 1N', 'B. 5N', 'C. 7N', 'D. 12N']), answer: 'B', explanation: '两力垂直，合力=√(3²+4²)=5N', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '物理', knowledgePoint: '力学', content: '自由落体运动中，物体下落2秒后的速度为（g=10m/s²）：', options: JSON.stringify(['A. 10m/s', 'B. 20m/s', 'C. 30m/s', 'D. 40m/s']), answer: 'B', explanation: 'v=gt=10×2=20m/s', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '物理', knowledgePoint: '电学', content: '两个电阻R₁=2Ω和R₂=3Ω并联，则总电阻为：', options: JSON.stringify(['A. 5Ω', 'B. 6/5Ω', 'C. 1Ω', 'D. 2.5Ω']), answer: 'B', explanation: '并联1/R=1/R₁+1/R₂=1/2+1/3=5/6，R=6/5Ω', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '物理', knowledgePoint: '电学', content: '一段导体两端电压为6V，通过的电流为2A，则导体电阻为：', options: JSON.stringify(['A. 3Ω', 'B. 4Ω', 'C. 8Ω', 'D. 12Ω']), answer: 'A', explanation: '由欧姆定律R=U/I=6/2=3Ω', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '物理', knowledgePoint: '光学', content: '光从空气射入水中时，以下说法正确的是：', options: JSON.stringify(['A. 速度变大，波长变大', 'B. 速度变小，波长变小', 'C. 速度不变，波长变大', 'D. 速度变小，频率变大']), answer: 'B', explanation: '光进入水中速度变小，频率不变，波长=v/f也变小', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '物理', knowledgePoint: '力学', content: '质量为2kg的物体以4m/s的速度运动，其动能为：', options: JSON.stringify(['A. 4J', 'B. 8J', 'C. 16J', 'D. 32J']), answer: 'C', explanation: 'Ek=½mv²=½×2×16=16J', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '物理', knowledgePoint: '力学', content: '物体做匀速圆周运动时，下列说法正确的是：', options: JSON.stringify(['A. 速度不变', 'B. 加速度为零', 'C. 合力不为零', 'D. 动能变化']), answer: 'C', explanation: '匀速圆周运动合力提供向心力，不为零', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '物理', knowledgePoint: '热学', content: '一定质量的理想气体等温膨胀时：', options: JSON.stringify(['A. 内能增大', 'B. 内能减小', 'C. 吸收热量', 'D. 放出热量']), answer: 'C', explanation: '等温膨胀对外做功，内能不变，需吸热', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '物理', knowledgePoint: '电学', content: '在电场中，沿电场线方向：', options: JSON.stringify(['A. 电势升高', 'B. 电势降低', 'C. 电势不变', 'D. 无法判断']), answer: 'B', explanation: '沿电场线方向电势逐渐降低', score: 3, needManualGrade: false },
    ];

    const chemistryQs = [
      { type: 'single_choice', subject: '化学', knowledgePoint: '基本概念', content: '下列物质中属于纯净物的是：', options: JSON.stringify(['A. 空气', 'B. 海水', 'C. 蒸馏水', 'D. 矿泉水']), answer: 'C', explanation: '蒸馏水只含H₂O一种物质，是纯净物', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '化学', knowledgePoint: '基本概念', content: '下列变化中属于化学变化的是：', options: JSON.stringify(['A. 冰融化', 'B. 铁生锈', 'C. 汽油挥发', 'D. 玻璃破碎']), answer: 'B', explanation: '铁生锈生成新物质Fe₂O₃，属于化学变化', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '化学', knowledgePoint: '化学方程式', content: '配平化学方程式：____Fe + ____O₂ → ____Fe₂O₃，铁的系数为：', options: JSON.stringify(['A. 2', 'B. 3', 'C. 4', 'D. 6']), answer: 'C', explanation: '4Fe + 3O₂ → 2Fe₂O₃', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '化学', knowledgePoint: '元素周期表', content: '原子序数为11的元素是：', options: JSON.stringify(['A. 氢', 'B. 钠', 'C. 镁', 'D. 铝']), answer: 'B', explanation: '原子序数11为钠(Na)', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '化学', knowledgePoint: '元素周期表', content: '同一主族元素从上到下，原子半径的变化趋势是：', options: JSON.stringify(['A. 逐渐减小', 'B. 逐渐增大', 'C. 不变', 'D. 先增大后减小']), answer: 'B', explanation: '同一主族从上到下电子层数增多，原子半径增大', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '化学', knowledgePoint: '有机化学', content: '甲烷(CH₄)的分子空间构型为：', options: JSON.stringify(['A. 平面正方形', 'B. 正四面体', 'C. 三角锥形', 'D. 直线形']), answer: 'B', explanation: '甲烷为正四面体结构', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '化学', knowledgePoint: '有机化学', content: '乙醇的分子式为：', options: JSON.stringify(['A. CH₄O', 'B. C₂H₆O', 'C. C₂H₄O₂', 'D. C₃H₈O']), answer: 'B', explanation: '乙醇C₂H₅OH即C₂H₆O', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '化学', knowledgePoint: '化学实验', content: '实验室制取氧气常用的药品是：', options: JSON.stringify(['A. 锌和稀硫酸', 'B. 高锰酸钾', 'C. 石灰石和盐酸', 'D. 铜和稀硝酸']), answer: 'B', explanation: '高锰酸钾加热分解可制取O₂', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '化学', knowledgePoint: '化学平衡', content: '可逆反应达到化学平衡时：', options: JSON.stringify(['A. 反应停止', 'B. 正逆反应速率相等', 'C. 反应物完全转化', 'D. 生成物浓度为零']), answer: 'B', explanation: '化学平衡的标志是正逆反应速率相等', score: 3, needManualGrade: false },
    ];

    const biologyQs = [
      { type: 'single_choice', subject: '生物', knowledgePoint: '细胞', content: '下列细胞结构中，动植物细胞都有的是：', options: JSON.stringify(['A. 细胞壁', 'B. 叶绿体', 'C. 线粒体', 'D. 液泡']), answer: 'C', explanation: '线粒体是动植物细胞共有的细胞器', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '生物', knowledgePoint: '细胞', content: 'DNA主要存在于细胞的哪个结构中？', options: JSON.stringify(['A. 细胞膜', 'B. 细胞质', 'C. 细胞核', 'D. 核糖体']), answer: 'C', explanation: 'DNA主要存在于细胞核中的染色体上', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '生物', knowledgePoint: '遗传', content: '基因型为Aa的个体自交，后代中表现型比例为：', options: JSON.stringify(['A. 1:1', 'B. 3:1', 'C. 1:2:1', 'D. 1:1:1:1']), answer: 'B', explanation: 'Aa自交后代AA:Aa:aa=1:2:1，表现型显:隐=3:1', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '生物', knowledgePoint: '遗传', content: '人类的血型遗传中，A型血的基因型可能是：', options: JSON.stringify(['A. 只有IAIA', 'B. IAIA或IAi', 'C. 只有IAi', 'D. IAIB']), answer: 'B', explanation: 'A型血的基因型可以是纯合IAIA或杂合IAi', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '生物', knowledgePoint: '生态', content: '在食物链"草→兔→狐"中，狐属于：', options: JSON.stringify(['A. 生产者', 'B. 初级消费者', 'C. 次级消费者', 'D. 分解者']), answer: 'C', explanation: '狐吃兔，属于次级消费者', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '生物', knowledgePoint: '生态', content: '生态系统中能量流动的特点是：', options: JSON.stringify(['A. 循环流动', 'B. 单向流动逐级递减', 'C. 双向流动', 'D. 逐级递增']), answer: 'B', explanation: '能量沿食物链单向流动、逐级递减', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '生物', knowledgePoint: '细胞', content: '有丝分裂过程中，染色体数目加倍发生在：', options: JSON.stringify(['A. 间期', 'B. 前期', 'C. 中期', 'D. 后期']), answer: 'D', explanation: '后期着丝点分裂，染色体数目加倍', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '生物', knowledgePoint: '变异', content: '基因突变的特征不包括：', options: JSON.stringify(['A. 随机性', 'B. 不定向性', 'C. 定向性', 'D. 低频性']), answer: 'C', explanation: '基因突变具有随机性、不定向性、低频性，不具有定向性', score: 3, needManualGrade: false },
    ];

    const politicsQs = [
      { type: 'single_choice', subject: '政治', knowledgePoint: '经济常识', content: '下列属于商品的是：', options: JSON.stringify(['A. 阳光', 'B. 超市里的矿泉水', 'C. 自家种的蔬菜自己吃', 'D. 空气']), answer: 'B', explanation: '商品必须是用于交换的劳动产品', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '政治', knowledgePoint: '经济常识', content: '人民币升值对我国经济的影响不包括：', options: JSON.stringify(['A. 有利于进口', 'B. 有利于出口', 'C. 有利于出国留学', 'D. 不利于吸引外资']), answer: 'B', explanation: '人民币升值不利于出口，因为使出口商品价格上升', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '政治', knowledgePoint: '政治常识', content: '我国的根本政治制度是：', options: JSON.stringify(['A. 人民代表大会制度', 'B. 民族区域自治制度', 'C. 基层群众自治制度', 'D. 多党合作制度']), answer: 'A', explanation: '人民代表大会制度是我国的根本政治制度', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '政治', knowledgePoint: '经济常识', content: '价值规律的表现形式是：', options: JSON.stringify(['A. 价格围绕价值上下波动', 'B. 价格等于价值', 'C. 价格低于价值', 'D. 价格高于价值']), answer: 'A', explanation: '价值规律通过价格围绕价值上下波动来表现', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '政治', knowledgePoint: '政治常识', content: '我国公民最基本的民主权利是：', options: JSON.stringify(['A. 选举权和被选举权', 'B. 言论自由', 'C. 监督权', 'D. 受教育权']), answer: 'A', explanation: '选举权和被选举权是公民最基本的民主权利', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '政治', knowledgePoint: '哲学', content: '"物质决定意识"体现了唯物论的哪个观点？', options: JSON.stringify(['A. 世界的本原是物质', 'B. 意识对物质有反作用', 'C. 物质和意识相互决定', 'D. 意识是世界的本原']), answer: 'A', explanation: '物质决定意识说明世界的本原是物质', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '政治', knowledgePoint: '哲学', content: '"量变引起质变"体现了：', options: JSON.stringify(['A. 对立统一规律', 'B. 质量互变规律', 'C. 否定之否定规律', 'D. 内外因关系']), answer: 'B', explanation: '量变引起质变是质量互变规律的内容', score: 3, needManualGrade: false },
    ];

    const historyQs = [
      { type: 'single_choice', subject: '历史', knowledgePoint: '中国古代史', content: '秦朝统一中国的时间是：', options: JSON.stringify(['A. 公元前230年', 'B. 公元前221年', 'C. 公元前210年', 'D. 公元前206年']), answer: 'B', explanation: '公元前221年秦始皇统一六国', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '历史', knowledgePoint: '中国古代史', content: '科举制度正式确立于哪个朝代？', options: JSON.stringify(['A. 汉朝', 'B. 隋朝', 'C. 唐朝', 'D. 宋朝']), answer: 'B', explanation: '隋炀帝设进士科，标志科举制正式确立', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '历史', knowledgePoint: '中国近代史', content: '标志中国近代史开端的事件是：', options: JSON.stringify(['A. 鸦片战争', 'B. 太平天国运动', 'C. 辛亥革命', 'D. 五四运动']), answer: 'A', explanation: '1840年鸦片战争标志中国近代史的开端', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '历史', knowledgePoint: '中国近代史', content: '辛亥革命的指导思想是：', options: JSON.stringify(['A. 民主与科学', 'B. 三民主义', 'C. 君主立宪', 'D. 共产主义']), answer: 'B', explanation: '孙中山提出民族、民权、民生的三民主义', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '历史', knowledgePoint: '中国近代史', content: '五四运动爆发的直接原因是：', options: JSON.stringify(['A. 北伐战争', 'B. 巴黎和会中国外交失败', 'C. 辛亥革命', 'D. 新文化运动']), answer: 'B', explanation: '巴黎和会上中国外交失败是五四运动的导火线', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '历史', knowledgePoint: '世界史', content: '工业革命首先发生在：', options: JSON.stringify(['A. 法国', 'B. 美国', 'C. 英国', 'D. 德国']), answer: 'C', explanation: '18世纪60年代工业革命首先在英国发生', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '历史', knowledgePoint: '世界史', content: '第二次世界大战结束的标志是：', options: JSON.stringify(['A. 德国投降', 'B. 日本投降', 'C. 意大利投降', 'D. 诺曼底登陆']), answer: 'B', explanation: '1945年9月2日日本正式投降标志二战结束', score: 3, needManualGrade: false },
    ];

    const geographyQs = [
      { type: 'single_choice', subject: '地理', knowledgePoint: '自然地理', content: '地球自转的周期约为：', options: JSON.stringify(['A. 12小时', 'B. 24小时', 'C. 365天', 'D. 30天']), answer: 'B', explanation: '地球自转一周约24小时（一个恒星日约23时56分）', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '地理', knowledgePoint: '自然地理', content: '下列气候类型中，浙江省属于：', options: JSON.stringify(['A. 温带大陆性气候', 'B. 亚热带季风气候', 'C. 热带季风气候', 'D. 温带季风气候']), answer: 'B', explanation: '浙江位于秦岭-淮河以南，属亚热带季风气候', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '地理', knowledgePoint: '人文地理', content: '影响工业区位选择的主导因素中，电子工业最主要考虑的是：', options: JSON.stringify(['A. 原料', 'B. 市场', 'C. 技术和人才', 'D. 交通']), answer: 'C', explanation: '电子工业属于技术密集型，主导因素是技术和人才', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '地理', knowledgePoint: '自然地理', content: '地球公转的周期约为：', options: JSON.stringify(['A. 24小时', 'B. 30天', 'C. 365天', 'D. 29.5天']), answer: 'C', explanation: '地球公转一周约365天', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '地理', knowledgePoint: '自然地理', content: '板块构造学说认为，喜马拉雅山脉是由哪两个板块碰撞形成的？', options: JSON.stringify(['A. 太平洋板块与亚欧板块', 'B. 印度洋板块与亚欧板块', 'C. 非洲板块与亚欧板块', 'D. 美洲板块与太平洋板块']), answer: 'B', explanation: '印度洋板块与亚欧板块碰撞形成喜马拉雅山脉', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '地理', knowledgePoint: '人文地理', content: '下列城市中，人口密度最大的是：', options: JSON.stringify(['A. 杭州', 'B. 上海', 'C. 南京', 'D. 宁波']), answer: 'B', explanation: '上海是中国人口密度最大的城市之一', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '地理', knowledgePoint: '区域地理', content: '浙江省的省会是：', options: JSON.stringify(['A. 宁波', 'B. 温州', 'C. 杭州', 'D. 绍兴']), answer: 'C', explanation: '浙江省省会是杭州', score: 3, needManualGrade: false },
    ];

    const techQs = [
      { type: 'single_choice', subject: '技术', knowledgePoint: '信息技术基础', content: '1GB等于多少MB？', options: JSON.stringify(['A. 100MB', 'B. 512MB', 'C. 1000MB', 'D. 1024MB']), answer: 'D', explanation: '1GB=1024MB', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '技术', knowledgePoint: '信息技术基础', content: '下列文件扩展名中，属于图片格式的是：', options: JSON.stringify(['A. .mp3', 'B. .docx', 'C. .jpg', 'D. .exe']), answer: 'C', explanation: '.jpg是图片格式；.mp3音频；.docx文档；.exe可执行文件', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '技术', knowledgePoint: '程序设计', content: '在Python中，len("hello")的返回值是：', options: JSON.stringify(['A. 4', 'B. 5', 'C. 6', 'D. hello']), answer: 'B', explanation: '"hello"有5个字符，len()返回字符串长度', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '技术', knowledgePoint: '程序设计', content: '下列关于算法的说法正确的是：', options: JSON.stringify(['A. 算法只能用流程图表示', 'B. 算法的步骤必须是有限的', 'C. 算法没有输入', 'D. 算法可以没有输出']), answer: 'B', explanation: '算法的有穷性要求步骤必须是有限的', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '技术', knowledgePoint: '网络基础', content: 'HTTP协议默认使用的端口号是：', options: JSON.stringify(['A. 21', 'B. 22', 'C. 80', 'D. 443']), answer: 'C', explanation: 'HTTP默认端口80，HTTPS默认443', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '技术', knowledgePoint: '网络基础', content: 'IP地址192.168.1.1属于哪类地址？', options: JSON.stringify(['A. A类', 'B. B类', 'C. C类', 'D. D类']), answer: 'C', explanation: '192开头属于C类私有地址', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '技术', knowledgePoint: '程序设计', content: '在Python中，print(type(3.14))的输出是：', options: JSON.stringify(["A. <class 'int'>", "B. <class 'float'>", "C. <class 'str'>", "D. <class 'bool'>"]), answer: 'B', explanation: '3.14是浮点数，类型为float', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '技术', knowledgePoint: '数据库', content: 'SQL中用于查询数据的关键字是：', options: JSON.stringify(['A. INSERT', 'B. UPDATE', 'C. SELECT', 'D. DELETE']), answer: 'C', explanation: 'SELECT用于查询，INSERT插入，UPDATE更新，DELETE删除', score: 3, needManualGrade: false },
      { type: 'single_choice', subject: '技术', knowledgePoint: '信息技术基础', content: '二进制数1011转换为十进制数是：', options: JSON.stringify(['A. 9', 'B. 10', 'C. 11', 'D. 12']), answer: 'C', explanation: '1011=1×8+0×4+1×2+1×1=11', score: 3, needManualGrade: false },
    ];

    // 保存所有题目
    const allQuestions = [...generalQs, ...triadQs2, ...englishQs, ...chineseQs, ...mathQs, ...physicsQs, ...chemistryQs, ...biologyQs, ...politicsQs, ...historyQs, ...geographyQs, ...techQs];
    const saved = [];
    for (const q of allQuestions) {
      (q as any).bankType = (q as any).subject ? 'xuekao' : 'triad';
      saved.push(await this.questionRepo.save(q));
    }

    // 三位一体题目（generalQs + triadQs2）
    const triadSaved = saved.filter(q => q.bankType === 'triad');
    const triadObj = triadSaved.filter(q => !q.needManualGrade); // 客观题
    const triadSubj = triadSaved.filter(q => q.needManualGrade); // 主观题

    // 模拟卷1：时事热点 + 逻辑推理
    const mock1Qs = triadObj.filter(q => q.knowledgePoint === '时事热点' || q.knowledgePoint === '逻辑推理').slice(0, 12);
    await this.paperRepo.save({
      title: '综合素质模拟卷（一）· 时事与逻辑',
      questionIds: JSON.stringify(mock1Qs.map(q => q.id)),
      totalScore: mock1Qs.reduce((s, q) => s + q.score, 0),
      duration: 40,
      isPublished: true,
      bankType: 'triad',
      type: 'mock',
    });

    // 模拟卷2：人文素养 + 科学常识
    const mock2Qs = triadObj.filter(q => q.knowledgePoint === '人文素养' || q.knowledgePoint === '科学常识').slice(0, 14);
    await this.paperRepo.save({
      title: '综合素质模拟卷（二）· 人文与科学',
      questionIds: JSON.stringify(mock2Qs.map(q => q.id)),
      totalScore: mock2Qs.reduce((s, q) => s + q.score, 0),
      duration: 40,
      isPublished: true,
      bankType: 'triad',
      type: 'mock',
    });

    // 模拟卷3：全真综合模拟（含主观题）
    const mock3Obj = triadObj.slice(0, 15);
    const mock3Sub = triadSubj.slice(0, 3);
    const mock3Qs = [...mock3Obj, ...mock3Sub];
    await this.paperRepo.save({
      title: '综合素质全真模拟卷',
      questionIds: JSON.stringify(mock3Qs.map(q => q.id)),
      totalScore: mock3Qs.reduce((s, q) => s + q.score, 0),
      duration: 75,
      isPublished: true,
      bankType: 'triad',
      type: 'mock',
    });

    // 真题卷1：逻辑推理专项
    const real1Qs = triadSaved.filter(q => q.knowledgePoint === '逻辑推理');
    await this.paperRepo.save({
      title: '逻辑推理专项真题',
      questionIds: JSON.stringify(real1Qs.map(q => q.id)),
      totalScore: real1Qs.reduce((s, q) => s + q.score, 0),
      duration: 30,
      isPublished: true,
      bankType: 'triad',
      type: 'real',
    });

    // 真题卷2：人文素养专项
    const real2Qs = triadSaved.filter(q => q.knowledgePoint === '人文素养');
    await this.paperRepo.save({
      title: '人文素养专项真题',
      questionIds: JSON.stringify(real2Qs.map(q => q.id)),
      totalScore: real2Qs.reduce((s, q) => s + q.score, 0),
      duration: 30,
      isPublished: true,
      bankType: 'triad',
      type: 'real',
    });

    // 真题卷3：时事热点 + 科学前沿
    const real3Qs = triadSaved.filter(q => q.knowledgePoint === '时事热点' || q.knowledgePoint === '科学常识');
    await this.paperRepo.save({
      title: '时事与科学前沿真题',
      questionIds: JSON.stringify(real3Qs.map(q => q.id)),
      totalScore: real3Qs.reduce((s, q) => s + q.score, 0),
      duration: 40,
      isPublished: true,
      bankType: 'triad',
      type: 'real',
    });

    // 为全部10科创建学考试卷
    const xuekaoSubjects = ['语文', '数学', '英语', '物理', '化学', '生物', '政治', '历史', '地理', '技术'];
    for (const subj of xuekaoSubjects) {
      const ids = saved.filter(q => (q as any).subject === subj).map(q => q.id);
      if (ids.length === 0) continue;
      await this.paperRepo.save({
        title: `${subj}学考真题精选`,
        questionIds: JSON.stringify(ids),
        totalScore: ids.reduce((sum, id) => sum + (saved.find(q => q.id === id)?.score || 3), 0),
        duration: ids.length <= 5 ? 20 : 30,
        isPublished: true,
        subject: subj,
        bankType: 'xuekao',
        type: 'real',
      });
    }
  }

  // 题库管理
  async getQuestions(keyword?: string, bankType?: string) {
    const qb = this.questionRepo.createQueryBuilder('q');
    if (keyword) {
      qb.where('q.content LIKE :kw OR q.knowledgePoint LIKE :kw OR q.subject LIKE :kw', { kw: `%${keyword}%` });
    }
    if (bankType) {
      keyword ? qb.andWhere('q.bankType = :bankType', { bankType }) : qb.where('q.bankType = :bankType', { bankType });
    }
    return qb.orderBy('q.id', 'ASC').getMany();
  }

  async createQuestion(data: Partial<Question>) {
    return this.questionRepo.save(data);
  }

  async updateQuestion(id: number, data: Partial<Question>) {
    await this.questionRepo.update(id, data);
    return this.questionRepo.findOne({ where: { id } });
  }

  async deleteQuestion(id: number) {
    await this.questionRepo.delete(id);
    return { success: true };
  }

  async importQuestions(buffer: Buffer) {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as any);
    const ws = wb.worksheets[0];
    if (!ws) throw new BadRequestException('Excel文件中没有工作表');

    const typeMap: Record<string, string> = {
      '单选': 'single_choice', '多选': 'multi_choice', '判断': 'judge',
      '填空': 'fill', '简答': 'short_answer',
    };

    const questions: Partial<Question>[] = [];
    ws.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const type = typeMap[String(row.getCell(1).value || '').trim()] || 'single_choice';
      const content = String(row.getCell(2).value || '').trim();
      if (!content) return;
      const optionsRaw = String(row.getCell(3).value || '').trim();
      const options = optionsRaw ? JSON.stringify(optionsRaw.split('|').map(o => o.trim())) : null;
      const answer = String(row.getCell(4).value || '').trim();
      const explanation = String(row.getCell(5).value || '').trim();
      const score = Number(row.getCell(6).value) || 5;
      const knowledgePoint = String(row.getCell(7).value || '').trim();
      const needManualGrade = type === 'short_answer';
      const subject = String(row.getCell(8).value || '').trim() || undefined;
      const bankTypeRaw = String(row.getCell(9).value || '').trim();
      const bankType = bankTypeRaw.includes('学考') || bankTypeRaw === 'xuekao' ? 'xuekao' : 'triad';

      questions.push({ type, content, options, answer, explanation, score, knowledgePoint, needManualGrade, subject, bankType });
    });

    if (questions.length === 0) throw new BadRequestException('Excel中没有有效题目数据');

    const saved = await this.questionRepo.save(questions);
    return { success: true, count: saved.length };
  }

  // 试卷管理
  async getPapers(subject?: string, type?: string, bankType?: string) {
    const where: any = {};
    if (subject === '综合') {
      where.subject = IsNull();
    } else if (subject) {
      where.subject = subject;
    }
    if (type) {
      where.type = type;
    }
    if (bankType) {
      where.bankType = bankType;
    }
    const papers = await this.paperRepo.find({ where, order: { id: 'ASC' } });
    return papers.map(p => ({
      ...p,
      questionCount: JSON.parse(p.questionIds || '[]').length,
    }));
  }

  async getPaper(id: number) {
    const paper = await this.paperRepo.findOne({ where: { id } });
    if (!paper) return null;
    const questionIds = JSON.parse(paper.questionIds || '[]');
    const questions = [];
    for (const qid of questionIds) {
      const q = await this.questionRepo.findOne({ where: { id: qid } });
      if (q) questions.push(q);
    }
    return { ...paper, questions };
  }

  async createPaper(data: Partial<Paper>) {
    return this.paperRepo.save(data);
  }

  async updatePaper(id: number, data: Partial<Paper>) {
    await this.paperRepo.update(id, data);
    return this.paperRepo.findOne({ where: { id } });
  }

  async deletePaper(id: number) {
    await this.paperRepo.delete(id);
    return { success: true };
  }

  // 答卷管理
  async submitAnswerSheet(data: { studentId: number; paperId: number; answers: any[]; images?: string }) {
    const paper = await this.getPaper(data.paperId);
    if (!paper) return { success: false, message: '试卷不存在' };

    let objectiveScore = 0;
    const weakPoints = [];

    for (const ans of data.answers) {
      const question = paper.questions.find(q => q.id === ans.questionId);
      if (!question) continue;

      if (!question.needManualGrade) {
        if (this.isAnswerCorrect(ans.answer, question.answer, question.type)) {
          objectiveScore += question.score;
        } else {
          if (question.knowledgePoint) weakPoints.push(question.knowledgePoint);
        }
      }
    }

    const sheet = await this.answerSheetRepo.save({
      studentId: data.studentId,
      paperId: data.paperId,
      answers: JSON.stringify(data.answers),
      objectiveScore,
      totalScore: objectiveScore,
      status: 'auto_graded',
      weakPoints: JSON.stringify([...new Set(weakPoints)]),
      images: data.images || null,
    });

    await this.recordWrongNotes(data.studentId, sheet.id, data.paperId);

    const student = await this.studentRepo.findOne({ where: { id: data.studentId } });
    if (student?.teacherId) {
      await this.notifRepo.save(this.notifRepo.create({
        title: '新答卷待批改',
        content: `${student.name} 完成了「${paper.title}」，请前往批卷管理批改主观题。`,
        type: 'exam',
        targetStudentId: 0,
        teacherId: student.teacherId,
      }));
    }

    return { success: true, data: sheet };
  }

  async getAnswerSheets(query?: { studentId?: number; paperId?: number; status?: string; paperType?: string; bankType?: string; teacherId?: number }) {
    const where: any = {};
    if (query?.studentId) where.studentId = query.studentId;
    if (query?.paperId) where.paperId = query.paperId;
    if (query?.status) where.status = query.status;
    if (query?.teacherId) {
      const studentIds = await this.studentRepo
        .createQueryBuilder('s')
        .select('s.id')
        .where('s.teacherId = :tid', { tid: query.teacherId })
        .getRawMany();
      const ids = studentIds.map((s: any) => s.s_id);
      if (ids.length === 0) return [];
      where.studentId = In(ids);
    }
    const sheets = await this.answerSheetRepo.find({ where, order: { createdAt: 'DESC' } });
    const result = [];
    for (const sheet of sheets) {
      const paper = await this.paperRepo.findOne({ where: { id: sheet.paperId } });
      if (query?.paperType && paper?.type !== query.paperType) continue;
      if (query?.bankType && (paper?.bankType || 'triad') !== query.bankType) continue;
      result.push({
        ...sheet,
        paperTitle: paper?.title || '',
        paperType: paper?.type || '',
        bankType: paper?.bankType || 'triad',
        paperTotalScore: paper?.totalScore || 0,
      });
    }
    return result;
  }

  async getAnswerSheet(id: number) {
    const sheet = await this.answerSheetRepo.findOne({ where: { id } });
    if (!sheet) return null;

    const paper = await this.getPaper(sheet.paperId);
    const studentAnswers = JSON.parse(sheet.answers || '[]');

    const detail = (paper?.questions || []).map(q => {
      const sa = studentAnswers.find((a: any) => a.questionId === q.id);
      return {
        questionId: q.id,
        type: q.type,
        content: q.content,
        options: q.options ? JSON.parse(q.options) : null,
        correctAnswer: q.answer,
        studentAnswer: sa?.answer ?? '',
        score: q.score,
        studentScore: sa?.score ?? null,
        teacherComment: sa?.teacherComment || '',
        isCorrect: !q.needManualGrade ? this.isAnswerCorrect(sa?.answer, q.answer, q.type) : null,
        needManualGrade: q.needManualGrade,
        knowledgePoint: q.knowledgePoint,
        explanation: q.explanation,
      };
    });

    return {
      ...sheet,
      paperTitle: paper?.title || '',
      questions: detail,
    };
  }

  async getStudentAnalysis(studentId: number, subject?: string, bankType?: string) {
    const allSheets = await this.answerSheetRepo.find({ where: { studentId }, order: { createdAt: 'DESC' } });
    const practiceRecords = await this.practiceRecordRepo.find({ where: { studentId }, order: { createdAt: 'DESC' } });

    const seenPapers = new Set<number>();
    const sheets: typeof allSheets = [];
    for (const s of allSheets) {
      if (!seenPapers.has(s.paperId)) {
        seenPapers.add(s.paperId);
        sheets.push(s);
      }
    }

    const kpStats: Record<string, { total: number; correct: number; wrong: string[] }> = {};
    let totalQ = 0;
    let totalCorrect = 0;
    let analyzedSheetCount = 0;

    for (const sheet of sheets) {
      const paper = await this.getPaper(sheet.paperId);
      if (!paper) continue;
      if (bankType && (paper.bankType || 'triad') !== bankType) continue;
      analyzedSheetCount++;
      const studentAnswers = JSON.parse(sheet.answers || '[]');

      for (const q of paper.questions) {
        if (q.needManualGrade) continue;
        if (subject && (q.subject || '') !== subject) continue;
        const sa = studentAnswers.find((a: any) => a.questionId === q.id);
        const isCorrect = this.isAnswerCorrect(sa?.answer, q.answer, q.type);
        const kp = q.knowledgePoint || '未分类';
        totalQ++;
        if (isCorrect) totalCorrect++;

        if (!kpStats[kp]) kpStats[kp] = { total: 0, correct: 0, wrong: [] };
        kpStats[kp].total++;
        if (isCorrect) {
          kpStats[kp].correct++;
        } else {
          kpStats[kp].wrong.push(q.content.substring(0, 30));
        }
      }
    }

    for (const record of practiceRecords) {
      if (subject && (record.subject || '') !== subject) continue;
      const q = await this.questionRepo.findOne({ where: { id: record.questionId } });
      if (bankType && ((q?.bankType || 'triad') !== bankType)) continue;
      const kp = record.knowledgePoint || '未分类';
      totalQ++;
      if (record.isCorrect) totalCorrect++;

      if (!kpStats[kp]) kpStats[kp] = { total: 0, correct: 0, wrong: [] };
      kpStats[kp].total++;
      if (record.isCorrect) {
        kpStats[kp].correct++;
      } else {
        kpStats[kp].wrong.push((q?.content || '').substring(0, 30));
      }
    }

    if (totalQ === 0) {
      return {
        success: true,
        data: {
          totalExams: 0,
          totalPractice: 0,
          totalQuestions: 0,
          totalCorrect: 0,
          overallAccuracy: 0,
          knowledgePoints: [],
          weak: [],
          summary: '暂无答题记录，请先完成模拟测试、历年真题或考点练习。',
          suggestions: [],
        },
      };
    }

    const knowledgePoints = Object.entries(kpStats).map(([name, stat]) => ({
      name,
      total: stat.total,
      correct: stat.correct,
      accuracy: stat.total > 0 ? Math.round(stat.correct / stat.total * 100) : 0,
      wrongSamples: stat.wrong.slice(0, 3),
    })).sort((a, b) => a.accuracy - b.accuracy);

    const weak = knowledgePoints.filter(k => k.accuracy < 60);
    const medium = knowledgePoints.filter(k => k.accuracy >= 60 && k.accuracy < 80);
    const strong = knowledgePoints.filter(k => k.accuracy >= 80);

    const suggestions: string[] = [];
    if (weak.length > 0) {
      suggestions.push(`重点突破：${weak.map(w => w.name).join('、')}，正确率较低，建议反复练习`);
    }
    if (medium.length > 0) {
      suggestions.push(`巩固提升：${medium.map(m => m.name).join('、')}，正确率一般，需加强理解`);
    }
    if (strong.length > 0) {
      suggestions.push(`保持优势：${strong.map(s => s.name).join('、')}，正确率较高，继续保持`);
    }
    if (totalQ < 20) {
      suggestions.push('做题数量偏少，建议继续完成模拟测试、历年真题或考点练习，分析结果会更准确。');
    }

    const overallAccuracy = totalQ > 0 ? Math.round(totalCorrect / totalQ * 100) : 0;
    let filteredPracticeCount = 0;
    for (const record of practiceRecords) {
      if (subject && (record.subject || '') !== subject) continue;
      const q = await this.questionRepo.findOne({ where: { id: record.questionId } });
      if (bankType && ((q?.bankType || 'triad') !== bankType)) continue;
      filteredPracticeCount++;
    }
    const summary = `已完成${analyzedSheetCount}套试卷、${filteredPracticeCount}道考点练习，共${totalQ}道客观题，总正确率${overallAccuracy}%。` +
      (weak.length > 0 ? `薄弱知识点${weak.length}个，需重点关注。` : '各知识点掌握良好。');

    return {
      success: true,
      data: {
        totalExams: analyzedSheetCount,
        totalPractice: filteredPracticeCount,
        totalQuestions: totalQ,
        totalCorrect,
        overallAccuracy,
        knowledgePoints,
        weak: weak.map(w => w.name),
        summary,
        suggestions,
      },
    };
  }

  async getPracticeCategories(subject?: string, knowledgePoint?: string, type?: string, bankType?: string) {
    const qb = this.questionRepo.createQueryBuilder('q')
      .select('q.knowledgePoint', 'knowledgePoint')
      .addSelect('COUNT(*)', 'count')
      .where('q.knowledgePoint IS NOT NULL')
      .andWhere("q.knowledgePoint != ''")
    if (subject) {
      qb.andWhere('q.subject = :subject', { subject })
    }
    if (knowledgePoint) {
      qb.andWhere('q.knowledgePoint = :knowledgePoint', { knowledgePoint })
    }
    if (type) {
      qb.andWhere('q.type = :type', { type })
    }
    if (bankType) {
      qb.andWhere('q.bankType = :bankType', { bankType })
    }
    qb.groupBy('q.knowledgePoint').orderBy('count', 'DESC')
    const raw = await qb.getRawMany()
    return raw.map(r => ({ name: r.knowledgePoint, count: Number(r.count) }))
  }

  async getPracticeQuestions(subject?: string, knowledgePoint?: string, type?: string, limit?: number, bankType?: string) {
    const where: any = {}
    if (subject) where.subject = subject
    if (knowledgePoint) where.knowledgePoint = knowledgePoint
    if (type) where.type = type
    if (bankType) where.bankType = bankType
    const questions = await this.questionRepo.find({ where, order: { id: 'ASC' }, take: limit || undefined })
    return questions.map(q => ({
      id: q.id,
      type: q.type,
      content: q.content,
      options: q.options,
      score: q.score,
      difficulty: q.difficulty,
      knowledgePoint: q.knowledgePoint,
      subject: q.subject,
      needManualGrade: q.needManualGrade,
    }))
  }

  async checkPracticeAnswer(questionId: number, answer: string, studentId?: number) {
    const q = await this.questionRepo.findOne({ where: { id: questionId } })
    if (!q) return { success: false, message: '题目不存在' }

    const isCorrect = !q.needManualGrade && this.isAnswerCorrect(answer, q.answer, q.type);

    if (studentId) {
      await this.practiceRecordRepo.save({
        studentId,
        questionId,
        answer,
        isCorrect,
        subject: q.subject || '',
        knowledgePoint: q.knowledgePoint || '',
        source: 'practice',
      });

      // 答错时同步记录到错题本
      if (!isCorrect && !q.needManualGrade) {
        const existing = await this.wrongNoteRepo.findOne({ where: { studentId, questionId } });
        if (existing) {
          existing.wrongCount += 1;
          existing.lastWrongAnswer = answer;
          existing.mastered = false;
          if (q.subject) existing.subject = q.subject;
          if (q.knowledgePoint) existing.knowledgePoint = q.knowledgePoint;
          await this.wrongNoteRepo.save(existing);
        } else {
          await this.wrongNoteRepo.save({
            studentId,
            questionId,
            wrongCount: 1,
            mastered: false,
            subject: q.subject || '',
            knowledgePoint: q.knowledgePoint || '',
            lastWrongAnswer: answer,
            bankType: q.bankType || 'triad',
          });
        }
      }
    }

    let correctDisplay = q.answer;
    if (['single_choice', 'multi_choice', 'judge'].includes(q.type) && q.options) {
      try {
        const opts: string[] = JSON.parse(q.options);
        const matched = opts.find(o => o.startsWith(q.answer));
        if (matched) correctDisplay = matched;
      } catch {}
    }

    return {
      success: true,
      isCorrect,
      correctAnswer: correctDisplay,
      explanation: q.explanation,
      needManualGrade: q.needManualGrade,
    }
  }

  async gradeAnswerSheet(id: number, data: { subjectiveScore?: number; comment?: string; questionScores?: { questionId: number; score: number; comment?: string }[] }) {
    const sheet = await this.answerSheetRepo.findOne({ where: { id } });
    if (!sheet) return { success: false, message: '答卷不存在' };

    if (data.questionScores && data.questionScores.length > 0) {
      const studentAnswers = JSON.parse(sheet.answers || '[]');
      for (const qs of data.questionScores) {
        const sa = studentAnswers.find((a: any) => a.questionId === qs.questionId);
        if (sa) {
          sa.score = qs.score;
          sa.teacherComment = qs.comment || '';
        }
      }
      sheet.answers = JSON.stringify(studentAnswers);
      const totalSubjective = data.questionScores.reduce((sum, qs) => sum + (qs.score || 0), 0);
      sheet.subjectiveScore = totalSubjective;
      sheet.totalScore = sheet.objectiveScore + totalSubjective;
    } else if (data.subjectiveScore !== undefined) {
      sheet.subjectiveScore = data.subjectiveScore;
      sheet.totalScore = sheet.objectiveScore + data.subjectiveScore;
    }

    sheet.comment = data.comment || '';
    sheet.status = 'graded';

    await this.answerSheetRepo.save(sheet);

    const paper = await this.paperRepo.findOne({ where: { id: sheet.paperId } });
    await this.notifRepo.save(this.notifRepo.create({
      title: '试卷已批改',
      content: `「${paper?.title || '试卷'}」已批改完成，总分 ${sheet.totalScore} 分，点击查看详情。`,
      type: 'score',
      targetStudentId: sheet.studentId,
    }));

    return { success: true, data: sheet };
  }

  // ==================== 错题本 ====================

  async recordWrongNotes(studentId: number, sheetId: number, paperId: number) {
    const paper = await this.getPaper(paperId);
    if (!paper) return;
    const sheet = await this.answerSheetRepo.findOne({ where: { id: sheetId } });
    if (!sheet) return;
    const studentAnswers = JSON.parse(sheet.answers || '[]');

    for (const q of paper.questions) {
      if (q.needManualGrade) continue;
      const sa = studentAnswers.find((a: any) => a.questionId === q.id);
      const isCorrect = this.isAnswerCorrect(sa?.answer, q.answer, q.type);

      if (!isCorrect) {
        const existing = await this.wrongNoteRepo.findOne({
          where: { studentId, questionId: q.id },
        });
        if (existing) {
          existing.wrongCount += 1;
          existing.lastWrongAnswer = sa?.answer || '';
          existing.mastered = false;
          if (q.subject) existing.subject = q.subject;
          if (q.knowledgePoint) existing.knowledgePoint = q.knowledgePoint;
          await this.wrongNoteRepo.save(existing);
        } else {
          await this.wrongNoteRepo.save({
            studentId,
            questionId: q.id,
            sourceSheetId: sheetId,
            wrongCount: 1,
            mastered: false,
            subject: q.subject || '',
            knowledgePoint: q.knowledgePoint || '',
            lastWrongAnswer: sa?.answer || '',
            bankType: q.bankType || paper.bankType || 'triad',
          });
        }
      }
    }
  }

  async getWrongNotes(studentId: number, query?: { subject?: string; mastered?: string; bankType?: string; page?: number; pageSize?: number }) {
    const where: any = { studentId };
    if (query?.subject) where.subject = query.subject;
    if (query?.mastered === 'true') where.mastered = true;
    if (query?.mastered === 'false') where.mastered = false;
    if (query?.bankType) where.bankType = query.bankType;

    const page = query?.page || 1;
    const pageSize = query?.pageSize || 20;

    const [notes, total] = await this.wrongNoteRepo.findAndCount({
      where,
      order: { mastered: 'ASC', wrongCount: 'DESC', updatedAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const items = [];
    for (const note of notes) {
      const q = await this.questionRepo.findOne({ where: { id: note.questionId } });
      items.push({
        ...note,
        question: q ? {
          id: q.id,
          type: q.type,
          content: q.content,
          options: q.options ? JSON.parse(q.options) : null,
          answer: q.answer,
          explanation: q.explanation,
          score: q.score,
          difficulty: q.difficulty,
          subject: q.subject,
          knowledgePoint: q.knowledgePoint,
        } : null,
      });
    }

    return { data: items, total, page, pageSize };
  }

  async toggleWrongNoteMastered(id: number, mastered: boolean) {
    const note = await this.wrongNoteRepo.findOne({ where: { id } });
    if (!note) return { success: false, message: '错题记录不存在' };
    note.mastered = mastered;
    await this.wrongNoteRepo.save(note);
    return { success: true, data: note };
  }

  async getWrongNoteStats(studentId: number, bankType?: string) {
    const where: any = { studentId };
    if (bankType) where.bankType = bankType;
    const all = await this.wrongNoteRepo.find({ where });
    const total = all.length;
    const masteredCount = all.filter(n => n.mastered).length;
    const unmasteredCount = total - masteredCount;

    const subjectMap: Record<string, number> = {};
    for (const n of all) {
      const subj = n.subject || '未分类';  // subject 可能为空（如综合面试题）
      subjectMap[subj] = (subjectMap[subj] || 0) + 1;
    }
    const bySubject = Object.entries(subjectMap)
      .map(([subject, count]) => ({ subject, count }))
      .sort((a, b) => b.count - a.count);

    const topWrong = all
      .filter(n => !n.mastered)
      .sort((a, b) => b.wrongCount - a.wrongCount)
      .slice(0, 5);

    return { total, masteredCount, unmasteredCount, bySubject, topWrong };
  }

  async removeWrongNote(id: number) {
    await this.wrongNoteRepo.delete(id);
    return { success: true };
  }

  async backfillWrongNoteBankType() {
    return this.backfillWrongNotes();
  }

  async backfillWrongNoteSubjects() {
    return this.backfillWrongNotes();
  }

  async backfillWrongNotes() {
    const notes = await this.wrongNoteRepo.find();
    let updated = 0;
    let removed = 0;
    for (const note of notes) {
      const q = await this.questionRepo.findOne({ where: { id: note.questionId } });
      if (!q) {
        // question no longer exists (after reseed), remove orphaned wrong note
        await this.wrongNoteRepo.delete(note.id);
        removed++;
        continue;
      }
      let dirty = false;
      const correctSubject = q.subject || '';
      const correctBankType = q.bankType || 'triad';
      const correctKP = q.knowledgePoint || '';
      if (note.subject !== correctSubject) { note.subject = correctSubject; dirty = true; }
      if (note.bankType !== correctBankType) { note.bankType = correctBankType; dirty = true; }
      if (note.knowledgePoint !== correctKP) { note.knowledgePoint = correctKP; dirty = true; }
      if (dirty) {
        await this.wrongNoteRepo.save(note);
        updated++;
      }
    }
    return { success: true, updated, removed, total: notes.length };
  }

  async seedXuekaoData() {
    return { success: true, message: '已合并到主种子数据，请使用 POST /exam/reseed' };
  }
}
