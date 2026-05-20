# 浙江三位一体测评系统 Demo

## 项目结构

```
├── server/         后端 API（NestJS + SQLite）
├── admin/          管理后台（Vue3 + Element Plus）
├── miniapp/        小程序端（uni-app）
├── 整体白标系统设想.md
└── 浙江高考提前批测评系统.md
```

## 快速启动

### 1. 启动后端

```bash
cd server
npm install
npm run start:dev
```

后端启动在 http://localhost:3000

默认账号：
- 超管：admin / admin123
- 老师：teacher / teacher123

系统会自动初始化：
- 5所示范院校和推荐规则
- 8道示范题目
- 2套模拟试卷

### 2. 启动管理后台

```bash
cd admin
npm install
npm run dev
```

后台启动在 http://localhost:5173

### 3. 启动小程序（H5模式预览）

```bash
cd miniapp
npm install
npm run dev:h5
```

H5模式启动在 http://localhost:5174

## 核心功能闭环

1. 学生端填写几A几B → 系统推荐院校
2. 学生查看院校详情
3. 学生做模拟卷 → 客观题自动批改
4. 后台老师批改主观题
5. 学生查看成绩和薄弱知识点分析

## 后台功能

- 学生管理：查看学生、查看推荐结果
- 院校管理：增删改院校、配置推荐规则
- 题库管理：增删题目
- 试卷管理：创建试卷
- 批卷管理：人工批改主观题
- 系统配置：超管可配置系统名称、主题色、功能开关

## 技术栈

- 后端：NestJS + TypeORM + SQLite（Demo用SQLite，生产切PostgreSQL）
- 后台：Vue3 + Vite + Element Plus
- 小程序：uni-app（支持微信小程序和H5）
