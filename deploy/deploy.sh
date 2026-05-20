#!/bin/bash
# ===== 一键部署脚本 =====
# 用法：chmod +x deploy/deploy.sh && ./deploy/deploy.sh

set -e

echo "=========================================="
echo "  三位一体测评系统 - 一键部署"
echo "=========================================="

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，正在安装..."
    curl -fsSL https://get.docker.com | sh
    sudo systemctl enable docker && sudo systemctl start docker
    echo "✅ Docker 安装完成"
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose 未安装，正在安装..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose 安装完成"
fi

# 检查 .env 文件
cd "$(dirname "$0")/.."
if [ ! -f .env ]; then
    echo "⚠️  未找到 .env 文件，从模板创建..."
    cp deploy/env.production.example .env
    echo "📝 请编辑 .env 文件修改数据库密码和 JWT 密钥："
    echo "   vi .env"
    echo ""
    echo "修改完成后重新运行此脚本。"
    exit 1
fi

echo "📦 开始构建并启动服务..."
docker-compose up -d --build

echo ""
echo "⏳ 等待服务启动..."
sleep 10

# 检查状态
echo ""
echo "=========================================="
echo "  🚀 部署完成！"
echo "=========================================="
docker-compose ps
echo ""
echo "访问地址："
echo "  后台管理：http://$(hostname -I | awk '{print $1}'):8080"
echo "  学生PC端：http://$(hostname -I | awk '{print $1}'):8081"
echo "  后端 API：http://$(hostname -I | awk '{print $1}'):3000"
echo ""
echo "默认超管账号：admin / admin123"
echo "（首次登录请立即修改密码）"
echo ""
echo "查看日志：docker-compose logs -f server"
echo "=========================================="
