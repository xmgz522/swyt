# 部署指南

## 服务器要求
- Linux 服务器（Ubuntu 20.04+ / CentOS 7+ 推荐）
- 最低配置：2核 4G 内存 40G 硬盘
- 安装 Docker 和 Docker Compose

## 一、安装 Docker（如未安装）

```bash
# Ubuntu
curl -fsSL https://get.docker.com | sh
sudo systemctl enable docker && sudo systemctl start docker

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

## 二、上传代码

将整个项目文件夹上传到服务器，例如 `/opt/zj-early-admission/`

```bash
# 方式1：Git 拉取
git clone <你的仓库地址> /opt/zj-early-admission
cd /opt/zj-early-admission

# 方式2：直接上传压缩包
scp -r ./浙江提前批 root@your_server_ip:/opt/zj-early-admission
```

## 三、配置环境变量

```bash
cd /opt/zj-early-admission

# 复制生产环境配置
cp deploy/env.production.example .env

# 编辑 .env，修改密码和密钥
vi .env
```

**必须修改的配置项：**
- `DB_PASSWORD` — 数据库密码，改为强密码
- `JWT_SECRET` — JWT 密钥，改为随机字符串（可用 `openssl rand -hex 32` 生成）

## 四、一键启动

```bash
# 构建并启动所有服务
docker-compose up -d --build

# 查看运行状态
docker-compose ps

# 查看后端日志
docker-compose logs -f server
```

启动后可访问：
- **后台管理**：http://服务器IP:8080
- **学生PC端**：http://服务器IP:8081
- **后端API**：http://服务器IP:3000

## 五、绑定域名（可选）

1. 在服务器上安装宿主机 Nginx：
```bash
sudo apt install nginx  # Ubuntu
```

2. 复制域名配置：
```bash
sudo cp deploy/nginx-host.conf /etc/nginx/conf.d/zj-admission.conf
```

3. 编辑配置，替换域名：
```bash
sudo vi /etc/nginx/conf.d/zj-admission.conf
# 将 admin.yourdomain.com / www.yourdomain.com / api.yourdomain.com 替换为实际域名
```

4. 重载 Nginx：
```bash
sudo nginx -t && sudo systemctl reload nginx
```

5. 配置 DNS 解析，将域名指向服务器 IP

## 六、SSL 证书（HTTPS）

推荐用 Let's Encrypt 免费证书：
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d admin.yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```

## 七、小程序配置

1. 登录[微信公众平台](https://mp.weixin.qq.com/)
2. 开发 → 开发管理 → 开发设置 → 服务器域名
3. 添加：
   - request 合法域名：`https://api.yourdomain.com`
4. 用微信开发者工具打开 `miniapp/` 项目
5. 修改 `miniapp/src/utils/` 中的接口地址为 `https://api.yourdomain.com`
6. 上传并提交审核

## 八、日常运维

```bash
# 查看所有容器状态
docker-compose ps

# 重启某个服务
docker-compose restart server

# 查看日志
docker-compose logs -f server    # 后端
docker-compose logs -f mysql     # 数据库

# 更新代码后重新部署
git pull
docker-compose up -d --build

# 停止所有服务
docker-compose down

# 停止并删除数据（慎用！）
docker-compose down -v

# 数据库备份
docker exec zj-mysql mysqldump -u root -p'你的密码' zj_early_admission > backup_$(date +%Y%m%d).sql

# 数据库恢复
docker exec -i zj-mysql mysql -u root -p'你的密码' zj_early_admission < backup_20240101.sql
```

## 九、常见问题

### 后端启动失败
```bash
docker-compose logs server  # 查看错误日志
```
常见原因：数据库还没启动完就连接了，等 30 秒再试或重启 server

### 前端白屏
检查浏览器控制台，通常是 API 地址不对，确认 Nginx 配置中 `/api` 代理正确

### 数据库连接被拒
检查 `.env` 中的密码和 docker-compose 中的一致

---

# 方案二：PM2 部署（非 Docker）

适用于已有宝塔面板或不想用 Docker 的服务器。

## 1. 安装依赖

```bash
# Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# MySQL 8
sudo apt install -y mysql-server
sudo mysql_secure_installation

# PM2
sudo npm install -g pm2

# Nginx
sudo apt install -y nginx
```

## 2. 创建数据库

```bash
sudo mysql -u root -p
```
```sql
CREATE DATABASE zj_early_admission CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 3. 构建项目

```bash
cd /opt/zj-early-admission

# 后端
cd server
npm ci
npm run build
cd ..

# 后台前端
cd admin
npm ci
npm run build
cd ..

# 学生端前端
cd student-web
npm ci
npm run build
cd ..
```

## 4. 配置 PM2 并启动

```bash
# 编辑 PM2 配置中的数据库密码和 JWT 密钥
vi deploy/ecosystem.config.js

# 启动
pm2 start deploy/ecosystem.config.js

# 设置开机自启
pm2 save
pm2 startup
```

## 5. 配置 Nginx

```bash
sudo cp deploy/nginx-pm2.conf /etc/nginx/conf.d/zj-admission.conf

# 按需修改路径和域名
sudo vi /etc/nginx/conf.d/zj-admission.conf

sudo nginx -t && sudo systemctl reload nginx
```

## 6. PM2 常用命令

```bash
pm2 list              # 查看进程
pm2 logs zj-server    # 查看日志
pm2 restart zj-server # 重启
pm2 stop zj-server    # 停止
pm2 monit             # 监控面板
```

## 7. 更新部署

```bash
cd /opt/zj-early-admission
git pull

# 重新构建后端
cd server && npm ci && npm run build && cd ..
pm2 restart zj-server

# 重新构建前端（按需）
cd admin && npm ci && npm run build && cd ..
cd student-web && npm ci && npm run build && cd ..
sudo systemctl reload nginx
```
