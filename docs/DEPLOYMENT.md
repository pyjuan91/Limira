# Limira 部署指南

完整的部署步驟，從 Git 初始化到自動化 CI/CD 部署。

---

## 📋 前置準備

在開始之前，請確保您有：

- ✅ GitHub 帳號 (https://github.com)
- ✅ Render 帳號 (https://render.com) - 免費註冊
- ✅ Vercel 帳號 (https://vercel.com) - 免費註冊
- ✅ OpenAI API Key (https://platform.openai.com/api-keys)

---

## 🚀 部署步驟

### 階段 1: Git 初始化與 GitHub 設定

#### 步驟 1.1: 初始化 Git 儲存庫

```bash
cd /Users/pyjuan91/Programs/Limira

# 初始化 Git
git init

# 添加所有文件
git add .

# 創建第一次提交
git commit -m "Initial commit: Limira AI Patent Platform"
```

#### 步驟 1.2: 在 GitHub 創建新儲存庫

1. 前往 https://github.com/new
2. 填寫儲存庫資訊：
   - **Repository name**: `Limira` 或 `limira-patent-platform`
   - **Description**: "AI-powered patent disclosure platform"
   - **Visibility**: Private (推薦) 或 Public
   - ⚠️ **不要**勾選 "Add a README file"
   - ⚠️ **不要**勾選 "Add .gitignore"
   - ⚠️ **不要**選擇 license
3. 點擊 **"Create repository"**

#### 步驟 1.3: 連接本地儲存庫到 GitHub

```bash
# 添加遠端儲存庫（替換成您的 GitHub 用戶名）
git remote add origin https://github.com/YOUR_USERNAME/Limira.git

# 重命名主分支為 main
git branch -M main

# 推送到 GitHub
git push -u origin main
```

> 💡 **提示**: 如果推送時需要驗證，請使用 GitHub Personal Access Token 而非密碼
> - 生成 Token: https://github.com/settings/tokens
> - 權限選擇: `repo` (完整權限)

---

### 階段 2: 部署後端到 Render

#### 步驟 2.1: 連接 GitHub 到 Render

1. 登入 https://render.com
2. 點擊 **"New +"** → **"Blueprint"**
3. 點擊 **"Connect GitHub account"**
4. 授權 Render 訪問您的 GitHub 儲存庫
5. 選擇 **`Limira`** 儲存庫

#### 步驟 2.2: 配置環境變數

Render 會自動讀取 `render.yaml`，但您需要設定敏感環境變數：

1. 在 Render Dashboard 找到 **`limira-backend`** 服務
2. 點擊 **"Environment"** 標籤
3. 添加以下環境變數：

| Key | Value | 備註 |
|-----|-------|------|
| `OPENAI_API_KEY` | `sk-...` | 您的 OpenAI API Key |
| `FRONTEND_URL` | (稍後設定) | 等 Vercel 部署完成後填入 |
| `SECRET_KEY` | (自動生成) | Render 會自動生成 |

#### 步驟 2.3: 部署後端

1. 點擊 **"Deploy Blueprint"**
2. Render 會自動：
   - 創建 PostgreSQL 資料庫
   - 創建 Web Service
   - 安裝依賴
   - 啟動應用程式
3. 等待部署完成（約 5-10 分鐘）
4. 部署成功後，您會看到後端 URL，例如：
   ```
   https://limira-backend-xxxx.onrender.com
   ```
5. **記下這個 URL**，等等要用！

#### 步驟 2.4: 驗證後端部署

在瀏覽器打開：
```
https://limira-backend-xxxx.onrender.com/health
```

應該會看到：
```json
{"status": "healthy"}
```

---

### 階段 3: 部署前端到 Vercel

#### 步驟 3.1: 導入專案到 Vercel

1. 登入 https://vercel.com
2. 點擊 **"Add New..."** → **"Project"**
3. 點擊 **"Import Git Repository"**
4. 選擇 **`Limira`** 儲存庫
5. 配置專案：
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend` ← **重要！**
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

#### 步驟 3.2: 配置環境變數

在 Vercel 部署設定頁面，添加環境變數：

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://limira-backend-xxxx.onrender.com/api/v1` |

> ⚠️ **重要**: 將 `limira-backend-xxxx.onrender.com` 替換為您在步驟 2.3 記下的 Render 後端 URL

#### 步驟 3.3: 部署前端

1. 點擊 **"Deploy"**
2. 等待部署完成（約 2-3 分鐘）
3. 部署成功後，您會看到前端 URL，例如：
   ```
   https://limira-xxxx.vercel.app
   ```

#### 步驟 3.4: 更新後端 CORS 設定

回到 Render Dashboard：

1. 找到 **`limira-backend`** 服務
2. 進入 **"Environment"** 標籤
3. 更新 `FRONTEND_URL` 環境變數：
   ```
   https://limira-xxxx.vercel.app
   ```
4. 點擊 **"Save Changes"**
5. 後端會自動重新部署

---

### 階段 4: 資料庫遷移

#### 步驟 4.1: 連接到 Render Shell

1. 在 Render Dashboard，進入 **`limira-backend`** 服務
2. 點擊右上角 **"Shell"** 按鈕
3. 在終端輸入：

```bash
# 運行資料庫遷移
alembic upgrade head

# 創建測試用戶（可選）
python create_test_users.py
```

#### 步驟 4.2: 驗證資料庫

```bash
# 連接到資料庫查看表
python -c "from app.core.database import engine; from sqlalchemy import inspect; print(inspect(engine).get_table_names())"
```

---

### 階段 5: 測試部署

#### 步驟 5.1: 訪問應用程式

在瀏覽器打開您的 Vercel URL：
```
https://limira-xxxx.vercel.app
```

#### 步驟 5.2: 創建測試帳號

1. 點擊 **"Sign up"**
2. 創建一個 Inventor 帳號
3. 創建一個 Lawyer 帳號

#### 步驟 5.3: 測試功能

1. **以 Inventor 身份登入**
   - 創建新的 Disclosure
   - 上傳文件
   - 提交並等待 AI 處理

2. **以 Lawyer 身份登入**
   - 查看分配的 Disclosures
   - 審查 AI 生成的專利草稿

---

## 🔄 自動化 CI/CD

### GitHub Actions 已配置完成！

每次您推送代碼到 GitHub `main` 分支時：

1. **GitHub Actions** 會自動：
   - 運行後端 lint 檢查
   - 運行前端 lint 和 build
   - 執行測試（如果有）

2. **Render** 會自動：
   - 檢測到 `main` 分支更新
   - 重新部署後端

3. **Vercel** 會自動：
   - 檢測到 `main` 分支更新
   - 重新部署前端

### 查看部署狀態

- **GitHub Actions**: https://github.com/YOUR_USERNAME/Limira/actions
- **Render**: https://dashboard.render.com
- **Vercel**: https://vercel.com/dashboard

---

## 🔧 日常開發工作流程

```bash
# 1. 在本地開發
npm run dev  # 前端
uvicorn app.main:app --reload  # 後端

# 2. 提交變更
git add .
git commit -m "Add new feature"

# 3. 推送到 GitHub
git push origin main

# 4. 自動部署！
# GitHub Actions → Render → Vercel 全自動
```

---

## ⚠️ 故障排除

### 後端部署失敗

**問題**: Build 失敗
- 檢查 `requirements.txt` 是否正確
- 查看 Render 的 Deploy Logs

**問題**: 資料庫連接失敗
- 確認 `DATABASE_URL` 環境變數正確
- 檢查 PostgreSQL 服務是否運行

### 前端部署失敗

**問題**: Build 失敗
- 檢查 `package.json` 和依賴是否完整
- 確認 Root Directory 設定為 `frontend`

**問題**: API 呼叫失敗 (CORS)
- 確認 `FRONTEND_URL` 在 Render 中正確設定
- 檢查後端 CORS 配置

### AI 功能不工作

**問題**: OpenAI API 錯誤
- 確認 `OPENAI_API_KEY` 正確設定
- 檢查 API Key 是否有餘額
- 查看後端日誌中的錯誤訊息

---

## 💰 費用估算

### 免費方案限制

**Render (免費)**
- 750 小時/月的運行時間
- 服務閒置 15 分鐘後會休眠
- 免費 PostgreSQL (90 天後過期，需升級)

**Vercel (免費)**
- 無限部署
- 100 GB 頻寬/月
- 無休眠問題

**建議**:
- 開發/測試階段: 完全免費
- 生產環境: 考慮升級 Render ($7/月) 避免休眠

---

## 📱 下一步優化

部署完成後，可以考慮：

- [ ] 設定自定義網域名稱
- [ ] 添加 SSL 憑證（Render/Vercel 免費提供）
- [ ] 設定錯誤監控 (Sentry)
- [ ] 添加分析工具 (Google Analytics)
- [ ] 設定郵件通知服務
- [ ] 配置 Redis 快取
- [ ] 添加單元測試和集成測試

---

## 🆘 需要幫助？

- **Render 文檔**: https://render.com/docs
- **Vercel 文檔**: https://vercel.com/docs
- **GitHub Actions**: https://docs.github.com/actions
- **FastAPI 部署**: https://fastapi.tiangolo.com/deployment/

---

**恭喜！🎉 您的 Limira 平台已成功部署！**
