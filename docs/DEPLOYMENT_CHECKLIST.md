# 🚀 快速部署檢查清單

從零開始部署 Limira 到生產環境的步驟清單。

---

## ✅ 前置準備

- [ ] 註冊 GitHub 帳號
- [ ] 註冊 Render 帳號 (https://render.com)
- [ ] 註冊 Vercel 帳號 (https://vercel.com)
- [ ] 準備 OpenAI API Key

---

## 📝 部署步驟

### 第 1 步: Git 初始化 (本地操作)

```bash
cd /Users/pyjuan91/Programs/Limira
git init
git add .
git commit -m "Initial commit: Limira AI Patent Platform"
```

---

### 第 2 步: 創建 GitHub 儲存庫

1. 前往 https://github.com/new
2. 儲存庫名稱: `Limira`
3. 設為 Private
4. **不要**添加 README、.gitignore 或 license
5. 創建儲存庫

---

### 第 3 步: 推送到 GitHub

```bash
# 替換 YOUR_USERNAME 為您的 GitHub 用戶名
git remote add origin https://github.com/YOUR_USERNAME/Limira.git
git branch -M main
git push -u origin main
```

---

### 第 4 步: 部署後端 (Render)

1. 登入 https://render.com
2. 點擊 "New +" → "Blueprint"
3. 連接 GitHub 並選擇 `Limira` 儲存庫
4. 添加環境變數：
   - `OPENAI_API_KEY`: 您的 OpenAI Key
5. 點擊 "Deploy Blueprint"
6. **記下後端 URL**: `https://limira-backend-xxxx.onrender.com`

---

### 第 5 步: 部署前端 (Vercel)

1. 登入 https://vercel.com
2. 點擊 "Add New..." → "Project"
3. 選擇 `Limira` 儲存庫
4. 設定:
   - Root Directory: `frontend`
   - Framework: Vite
5. 添加環境變數:
   - `VITE_API_URL`: `https://limira-backend-xxxx.onrender.com/api/v1`
6. 點擊 "Deploy"
7. **記下前端 URL**: `https://limira-xxxx.vercel.app`

---

### 第 6 步: 更新 CORS 配置

1. 回到 Render Dashboard
2. 進入 `limira-backend` → Environment
3. 添加/更新:
   - `FRONTEND_URL`: `https://limira-xxxx.vercel.app`
4. 儲存（後端會自動重新部署）

---

### 第 7 步: 資料庫遷移

1. 在 Render Dashboard，進入 `limira-backend`
2. 點擊 "Shell"
3. 執行:
```bash
alembic upgrade head
python create_test_users.py
```

---

### 第 8 步: 測試部署

1. 訪問: `https://limira-xxxx.vercel.app`
2. 創建測試帳號
3. 測試 Inventor 和 Lawyer 功能

---

## ✨ 完成！

每次推送到 GitHub `main` 分支，Render 和 Vercel 會自動部署！

查看完整文檔: [docs/DEPLOYMENT.md](./DEPLOYMENT.md)
