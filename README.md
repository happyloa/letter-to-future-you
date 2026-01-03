# Future Letters (寫給未來的信)

Future Letters 是一個時間膠囊平台，讓你可以寫信給未來的自己或他人。信件會在指定的發送日期送達收件人的電子信箱。本專案以極簡主義、隱私為核心，強調純文字的交流體驗。

## 使用技術

本專案採用現代化的 Web 技術堆疊：

- **核心框架**: [Nuxt 4](https://nuxt.com) (Vue 3) - 極致的效能與開發體驗。
- **部署平台**: [Cloudflare Pages](https://pages.cloudflare.com) - 邊緣計算，全球快速存取。
- **資料庫**: [Cloudflare D1](https://developers.cloudflare.com/d1/) - 基於 SQLite 的邊緣資料庫，用於儲存信件內容。
- **郵件服務**: [Resend](https://resend.com) - 可靠的 Transactional Email 發送服務。
- **樣式**: Tailwind CSS / UnoCSS (視專案配置而定) - Utility-first 的 CSS 框架。

## 開發環境設置

確保你的電腦已安裝 Node.js 和 pnpm。

```bash
# 安裝依賴
pnpm install

# 啟動開發伺服器
pnpm dev
```

開發伺服器預設運行在 `http://localhost:3000`。

## 真實部署流程 (Cloudflare Pages)

請注意：Cloudflare 的介面與功能可能會隨時間更新，以下流程僅供參考，請以 Cloudflare 官方最新的文件為準。

本專案主要依賴 Cloudflare 的 CLI 工具 `wrangler` 進行管理，以確保配置的一致性。

### 1. 前置準備
- 註冊 [Cloudflare](https://dash.cloudflare.com/) 帳號。
- 安裝 Wrangler CLI: `npm install -g wrangler`。
- 登入 Wrangler: `wrangler login`。

### 2. 資料庫設置 (Cloudflare D1)

由於 Cloudflare D1 是邊緣資料庫，你需要先在 Cloudflare Dashboard 或透過 CLI 建立一個資料庫。

```bash
# 建立資料庫 (名稱可自訂，例如 future-letters-db)
wrangler d1 create future-letters-db
```

執行後，你會得到類似以下的輸出，請將 `database_id` 記錄下來：

```toml
[[d1_databases]]
binding = "DB" # 這裡的名稱需對應程式碼中的設定
database_name = "future-letters-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

你需要在 `wrangler.toml` (如果有的話) 或 Nuxt 的設定檔中配置這些資訊，以便應用程式能連接到資料庫。

**初始化資料表 schema:**

```bash
# 本地開發測試
wrangler d1 execute future-letters-db --local --file=./schema.sql

# 部署到生產環境
wrangler d1 execute future-letters-db --remote --file=./schema.sql
```

### 3. 部署應用程式

推薦使用 Git 整合自動部署 (CI/CD)：

1.  將程式碼推送到 GitHub / GitLab。
2.  在 Cloudflare Dashboard 進入 **Workers & Pages** -> **Create Application** -> **Connect to Git**。
3.  選擇你的 Repository。
4.  **Build Settings (建置設定)**:
    -   **Framework Preset**: 選擇 `Nuxt`。
    -   **Build command**: `pnpm build` (或 `npm run build`)。
    -   **Build output directory**: `.output/public` (Nuxt 4 預設可能是 `.output/public` 或 `.output`，若使用 server-side rendering 需注意 Pages Functions 的整合)。
5.  **Environment Variables (環境變數)**:
    -   設定 `NUXT_RESEND_API_KEY` 等必要的 API Keys。
6.  **綁定 D1 資料庫**:
    -   專案建立後，進入該 Pages 專案的 **Settings** -> **Functions**。
    -   找到 **D1 Database Bindings**。
    -   Variable name 設定為 `DB` (需與程式碼中的 binding 一致)。
    -   選擇你剛才建立的 D1 資料庫。

### 4. 手動部署 (CLI)

如果你不使用 Git 整合，也可以透過 CLI 直接部署：

```bash
# 建置專案
pnpm build

# 部署 (需確保 wrangler 已正確登入並選對帳號)
npx wrangler pages deploy .output/public --project-name=future-letters
```

*(注意：若應用程式包含後端 API (Nuxt Server Routes)，部署到 Cloudflare Pages 時會自動轉換為 Cloudflare Workers/Functions。確保你的 Nuxt Config 中 `nitro` preset 設置正確，通常 Nuxt 會自動偵測 Cloudflare Pages 環境。)*

## 專案結構

- `server/api`: 後端 API 邏輯 (處理信件儲存、發送請求)。
- `pages`: 前端頁面。
- `schema.sql`: 資料庫結構定義。
- `public`: 靜態資源。
