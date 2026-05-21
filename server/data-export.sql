-- SQLite to MySQL data export
SET FOREIGN_KEY_CHECKS = 0;

-- Skipped users table (auto-created by server)

-- Table: schools (5 rows)
INSERT INTO `schools` (`id`, `name`, `region`, `type`, `logo`, `description`, `requirements`, `gradeRequirements`, `interviewType`, `admissionHistory`, `suitableFor`, `advice`, `isActive`, `appId`, `createdAt`, `updatedAt`) VALUES (1, '浙江大学', '杭州', '综合类', NULL, '985/211双一流高校', '学考成绩优秀，综合素质突出', '要求4A及以上', '综合面试+笔试', NULL, '学考成绩拔尖的学生', NULL, 1, 'default', '2026-05-10 15:54:58', '2026-05-10 15:54:58');
INSERT INTO `schools` (`id`, `name`, `region`, `type`, `logo`, `description`, `requirements`, `gradeRequirements`, `interviewType`, `admissionHistory`, `suitableFor`, `advice`, `isActive`, `appId`, `createdAt`, `updatedAt`) VALUES (2, '浙江工业大学', '杭州', '理工类', NULL, '浙江省属重点大学', '学考成绩良好', '要求3A2B及以上', '综合面试', NULL, '理工科有特长的学生', NULL, 1, 'default', '2026-05-10 15:54:58', '2026-05-10 15:54:58');
INSERT INTO `schools` (`id`, `name`, `region`, `type`, `logo`, `description`, `requirements`, `gradeRequirements`, `interviewType`, `admissionHistory`, `suitableFor`, `advice`, `isActive`, `appId`, `createdAt`, `updatedAt`) VALUES (3, '浙江师范大学', '金华', '师范类', NULL, '浙江省属重点师范大学', '学考成绩良好，有教育情怀', '要求3A1B及以上', '面试+才艺展示', NULL, '有志于教育事业的学生', NULL, 1, 'default', '2026-05-10 15:54:58', '2026-05-10 15:54:58');
INSERT INTO `schools` (`id`, `name`, `region`, `type`, `logo`, `description`, `requirements`, `gradeRequirements`, `interviewType`, `admissionHistory`, `suitableFor`, `advice`, `isActive`, `appId`, `createdAt`, `updatedAt`) VALUES (4, '宁波大学', '宁波', '综合类', NULL, '双一流高校', '学考成绩优良', '要求3A及以上', '综合面试', NULL, '综合素质较好的学生', NULL, 1, 'default', '2026-05-10 15:54:58', '2026-05-10 15:54:58');
INSERT INTO `schools` (`id`, `name`, `region`, `type`, `logo`, `description`, `requirements`, `gradeRequirements`, `interviewType`, `admissionHistory`, `suitableFor`, `advice`, `isActive`, `appId`, `createdAt`, `updatedAt`) VALUES (5, '杭州电子科技大学', '杭州', '理工类', NULL, '电子信息特色高校', '数理成绩突出', '要求2A3B及以上', '专业面试', NULL, '对电子信息有兴趣的学生', NULL, 1, 'default', '2026-05-10 15:54:58', '2026-05-10 15:54:58');

-- Table: recommend_rules (10 rows)
INSERT INTO `recommend_rules` (`id`, `schoolId`, `minGradeA`, `minGradeB`, `maxGradeC`, `region`, `level`, `appId`, `createdAt`) VALUES (1, 1, 5, 0, 0, NULL, 'stable', 'default', '2026-05-10 15:54:58');
INSERT INTO `recommend_rules` (`id`, `schoolId`, `minGradeA`, `minGradeB`, `maxGradeC`, `region`, `level`, `appId`, `createdAt`) VALUES (2, 1, 4, 1, 0, NULL, 'reach', 'default', '2026-05-10 15:54:58');
INSERT INTO `recommend_rules` (`id`, `schoolId`, `minGradeA`, `minGradeB`, `maxGradeC`, `region`, `level`, `appId`, `createdAt`) VALUES (3, 2, 3, 2, 1, NULL, 'stable', 'default', '2026-05-10 15:54:58');
INSERT INTO `recommend_rules` (`id`, `schoolId`, `minGradeA`, `minGradeB`, `maxGradeC`, `region`, `level`, `appId`, `createdAt`) VALUES (4, 2, 2, 3, 1, NULL, 'reach', 'default', '2026-05-10 15:54:58');
INSERT INTO `recommend_rules` (`id`, `schoolId`, `minGradeA`, `minGradeB`, `maxGradeC`, `region`, `level`, `appId`, `createdAt`) VALUES (5, 3, 3, 1, 2, NULL, 'stable', 'default', '2026-05-10 15:54:58');
INSERT INTO `recommend_rules` (`id`, `schoolId`, `minGradeA`, `minGradeB`, `maxGradeC`, `region`, `level`, `appId`, `createdAt`) VALUES (6, 3, 2, 2, 2, NULL, 'reach', 'default', '2026-05-10 15:54:58');
INSERT INTO `recommend_rules` (`id`, `schoolId`, `minGradeA`, `minGradeB`, `maxGradeC`, `region`, `level`, `appId`, `createdAt`) VALUES (7, 4, 3, 0, 2, NULL, 'stable', 'default', '2026-05-10 15:54:58');
INSERT INTO `recommend_rules` (`id`, `schoolId`, `minGradeA`, `minGradeB`, `maxGradeC`, `region`, `level`, `appId`, `createdAt`) VALUES (8, 4, 2, 1, 3, NULL, 'reach', 'default', '2026-05-10 15:54:58');
INSERT INTO `recommend_rules` (`id`, `schoolId`, `minGradeA`, `minGradeB`, `maxGradeC`, `region`, `level`, `appId`, `createdAt`) VALUES (9, 5, 2, 3, 2, NULL, 'stable', 'default', '2026-05-10 15:54:58');
INSERT INTO `recommend_rules` (`id`, `schoolId`, `minGradeA`, `minGradeB`, `maxGradeC`, `region`, `level`, `appId`, `createdAt`) VALUES (10, 5, 1, 3, 3, NULL, 'reach', 'default', '2026-05-10 15:54:58');

-- Table: questions (8 rows)
INSERT INTO `questions` (`id`, `type`, `content`, `options`, `answer`, `explanation`, `score`, `difficulty`, `knowledgePoint`, `needManualGrade`, `appId`, `createdAt`) VALUES (1, 'single_choice', '浙江省提前批招生中，以下哪项不是综合素质评价的内容？', '["A. 品德表现","B. 运动健康","C. 家庭收入","D. 创新实践"]', 'C', '综合素质评价不包含家庭收入', 5, 'medium', '提前批政策', 0, 'default', '2026-05-10 15:54:58');
INSERT INTO `questions` (`id`, `type`, `content`, `options`, `answer`, `explanation`, `score`, `difficulty`, `knowledgePoint`, `needManualGrade`, `appId`, `createdAt`) VALUES (2, 'single_choice', '浙江高考提前批的学考等级中，A等第对应的比例约为？', '["A. 前5%","B. 前15%","C. 前30%","D. 前50%"]', 'B', 'A等第约为前15%', 5, 'medium', '学考等级', 0, 'default', '2026-05-10 15:54:58');
INSERT INTO `questions` (`id`, `type`, `content`, `options`, `answer`, `explanation`, `score`, `difficulty`, `knowledgePoint`, `needManualGrade`, `appId`, `createdAt`) VALUES (3, 'single_choice', '以下哪所学校不是浙江省属重点高校？', '["A. 浙江工业大学","B. 浙江师范大学","C. 温州大学","D. 宁波大学"]', 'C', '温州大学不属于浙江省属重点高校', 5, 'medium', '院校知识', 0, 'default', '2026-05-10 15:54:58');
INSERT INTO `questions` (`id`, `type`, `content`, `options`, `answer`, `explanation`, `score`, `difficulty`, `knowledgePoint`, `needManualGrade`, `appId`, `createdAt`) VALUES (4, 'judge', '浙江提前批可以同时填报多所学校。', '["正确","错误"]', '错误', '提前批一般只能填报一所学校', 5, 'medium', '提前批政策', 0, 'default', '2026-05-10 15:54:58');
INSERT INTO `questions` (`id`, `type`, `content`, `options`, `answer`, `explanation`, `score`, `difficulty`, `knowledgePoint`, `needManualGrade`, `appId`, `createdAt`) VALUES (5, 'judge', '学考成绩在提前批招生中占有重要比重。', '["正确","错误"]', '正确', '学考成绩是提前批招生的重要参考', 5, 'medium', '学考等级', 0, 'default', '2026-05-10 15:54:58');
INSERT INTO `questions` (`id`, `type`, `content`, `options`, `answer`, `explanation`, `score`, `difficulty`, `knowledgePoint`, `needManualGrade`, `appId`, `createdAt`) VALUES (6, 'fill', '浙江省学考等级从高到低依次为A、B、C、D、____。', NULL, 'E', '浙江学考等级为A/B/C/D/E五级', 5, 'medium', '学考等级', 0, 'default', '2026-05-10 15:54:58');
INSERT INTO `questions` (`id`, `type`, `content`, `options`, `answer`, `explanation`, `score`, `difficulty`, `knowledgePoint`, `needManualGrade`, `appId`, `createdAt`) VALUES (7, 'short_answer', '请简述你对浙江高考提前批招生政策的理解，包括报名条件、选拔方式和你认为最重要的准备工作。', NULL, '', '', 20, 'medium', '综合分析', 1, 'default', '2026-05-10 15:54:58');
INSERT INTO `questions` (`id`, `type`, `content`, `options`, `answer`, `explanation`, `score`, `difficulty`, `knowledgePoint`, `needManualGrade`, `appId`, `createdAt`) VALUES (8, 'short_answer', '如果你的学考成绩为3A3B，请分析你适合报考哪些类型的学校，并说明理由。', NULL, '', '', 20, 'medium', '院校匹配', 1, 'default', '2026-05-10 15:54:58');

-- Table: papers (2 rows)
INSERT INTO `papers` (`id`, `title`, `schoolId`, `questionIds`, `totalScore`, `duration`, `isPublished`, `appId`, `createdAt`) VALUES (1, '浙江提前批模拟卷一', NULL, '[1,2,3,4,5,6,7,8]', 70, 45, 1, 'default', '2026-05-10 15:54:58');
INSERT INTO `papers` (`id`, `title`, `schoolId`, `questionIds`, `totalScore`, `duration`, `isPublished`, `appId`, `createdAt`) VALUES (2, '浙江提前批模拟卷二', NULL, '[1,3,4,6,7]', 40, 30, 1, 'default', '2026-05-10 15:54:58');

SET FOREIGN_KEY_CHECKS = 1;
