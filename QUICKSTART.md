# Limira - Quick Start Guide

快速启动 Limira 开发环境。

## 前置条件检查

```bash
# 检查 Python 版本 (需要 3.11+)
python --version

# 检查 Node.js 版本 (需要 18+)
node --version

# 检查 PostgreSQL
psql --version
```

---

## 🚀 一键启动（开发环境）

### 1. 后端启动

```bash
# 进入后端目录
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 复制环境变量文件
cp .env.example .env

# 编辑 .env 文件，配置必要的值：
# - SECRET_KEY (随机生成 32+ 字符)
# - DATABASE_URL
# - OPENAI_API_KEY 或 ANTHROPIC_API_KEY

# 创建数据库
createdb limira_db

# 运行数据库迁移
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head

# 启动后端
uvicorn app.main:app --reload
```

**后端运行在:** http://localhost:8000
**API 文档:** http://localhost:8000/docs

---

### 2. 前端启动

打开新终端：

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 复制环境变量文件
cp .env.example .env

# 启动前端开发服务器
npm run dev
```

**前端运行在:** http://localhost:5173

---

## 🧪 测试 MVP 流程

### 创建账号

1. 打开浏览器访问 http://localhost:5173
2. 点击 "Sign up"
3. 创建两个账号：
   - **Inventor 账号**: 用于创建披露
   - **Lawyer 账号**: 用于审查专利草稿

### Inventor 工作流

1. 以 Inventor 身份登录
2. 创建新的 Disclosure
3. 填写结构化表单
4. 上传文件（可选）
5. 提交后，AI 会自动处理并生成专利草稿

### Lawyer 工作流

1. 以 Lawyer 身份登录
2. 查看分配的 Disclosures
3. 审查 AI 生成的专利草稿
4. 编辑草稿内容
5. 添加评论
6. 批准或请求修订

---

## 📊 数据库管理

### 创建新的迁移

```bash
cd backend
alembic revision --autogenerate -m "Description of changes"
alembic upgrade head
```

### 回滚迁移

```bash
alembic downgrade -1  # 回滚一个版本
```

### 查看迁移历史

```bash
alembic history
alembic current
```

---

## 🐛 故障排除

### 后端错误

**数据库连接失败**
- 检查 PostgreSQL 是否运行
- 验证 `.env` 中的 `DATABASE_URL`

**AI 服务错误**
- 确认 API 密钥正确配置
- 检查网络连接

### 前端错误

**API 调用失败**
- 确认后端正在运行 (http://localhost:8000)
- 检查 `.env` 中的 `VITE_API_URL`

**依赖安装问题**
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 🔧 开发工具

### API 测试
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### 数据库管理
```bash
# 连接到数据库
psql limira_db

# 查看所有表
\dt

# 查看用户
SELECT * FROM users;
```

---

## 📝 下一步

阅读完整的 [README.md](./README.md) 了解：
- 完整的 API 文档
- 架构设计
- 部署指南
- 贡献指南

祝开发愉快！🚀
