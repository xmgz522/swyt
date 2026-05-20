# ---- 构建阶段 ----
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --registry=https://registry.npmmirror.com
COPY . .
RUN npm run build

# ---- 运行阶段 ----
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
RUN npm ci --only=production --registry=https://registry.npmmirror.com
EXPOSE 3000
CMD ["node", "dist/main.js"]
