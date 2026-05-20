// PM2 配置文件（非 Docker 部署方案）
// 用法：pm2 start deploy/ecosystem.config.js

module.exports = {
  apps: [
    {
      name: 'zj-server',
      cwd: './server',
      script: 'dist/main.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        DB_HOST: 'localhost',
        DB_PORT: 3306,
        DB_USERNAME: 'root',
        DB_PASSWORD: 'your_password_here',
        DB_DATABASE: 'zj_early_admission',
        JWT_SECRET: 'your_jwt_secret_here',
        JWT_EXPIRES_IN: '7d',
      },
      // 日志
      error_file: './logs/server-error.log',
      out_file: './logs/server-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
