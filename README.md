# Future Letters (寫給未來的信)

Future Letters 目前是一個針對「寫信排程」的雛形專案：

- 前端已提供表單，可送出信件排程到 D1 資料庫。
- 後端提供 `POST /api/letters` 用於新增信件、`POST /api/letters/send` 用於批次寄送到期信件（透過 Resend）。

如果你想用它作為自己的時光膠囊服務，可以先部署並驗證 API 正常運作，再依需求擴充 UI 或寄信邏輯。

## 使用技術

本專案採用現代化的 Web 技術堆疊：

- **核心框架**: [Nuxt 4](https://nuxt.com) (Vue 3)。
- **部署平台**: [Cloudflare Pages](https://pages.cloudflare.com)（Nitro preset 已鎖定 `cloudflare-pages`，可直接產出 Pages Functions）。
- **資料庫**: [Cloudflare D1](https://developers.cloudflare.com/d1/)（綁定名稱需為 `DB` 才能對應程式碼）。
- **郵件服務**: 使用 [Resend](https://resend.com/)；需在 Cloudflare Pages 綁定 `RESEND_API_KEY` 與寄件人位址 `RESEND_FROM_EMAIL`。
- **樣式**: 尚未加入任何 CSS framework。

## 開發環境設置

確保你的電腦已安裝 Node.js 和 pnpm。

```bash
# 安裝依賴
pnpm install

# 啟動開發伺服器（含前端排程表單）
pnpm dev
```

> `pnpm dev` 只會啟動前端；要驗證 API 寫入 D1，請依據下方的「本機模擬 Cloudflare Pages」步驟。

## 真實部署流程 (Cloudflare Pages)

本專案主要依賴 Cloudflare 的 CLI 工具 `wrangler` 進行管理，以確保配置的一致性。

### 1. 前置準備
- 註冊 [Cloudflare](https://dash.cloudflare.com/) 帳號。
- 安裝 Wrangler CLI: `npm install -g wrangler`。
- 登入 Wrangler: `wrangler login`。

### 2. 資料庫設置 (Cloudflare D1)

建立 D1 資料庫並綁定為 `DB`（程式碼已固定使用此 binding）：

```bash
# 建立資料庫 (名稱可自訂，例如 future-letters-db)
wrangler d1 create future-letters-db

# 匯入 schema
wrangler d1 execute future-letters-db --remote --file=./schema.sql
```

綁定設定範例（`wrangler.toml` 片段）：

```toml
[[d1_databases]]
binding = "DB"
database_name = "future-letters-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### 3. 郵件寄送設定 (Resend)

1. 建立 Resend API Key，並在 Resend 驗證寄件網域（確保 From Email 可用）。
2. 於 Cloudflare Pages 專案的 Environment Variables 新增：
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`（例：`Future Letters <noreply@yourdomain.com>`）。
3. 本機開發時，可建立 `.dev.vars` 並填入上述兩個變數，`wrangler pages dev` 會自動讀取。

### 4. 本機模擬 Cloudflare Pages

要在本機測試 API 與 D1，請使用 Pages 模擬器：

```bash
# 建置並產出 Cloudflare Pages 專用 dist
pnpm build

# 使用 Pages 模擬器並綁定 D1（需先在 Wrangler 建立本地資料庫）
npx wrangler d1 execute future-letters-db --local --file=./schema.sql
RESEND_API_KEY=xxx RESEND_FROM_EMAIL="Future Letters <noreply@yourdomain.com>" \\
  npx wrangler pages dev dist --d1 DB=future-letters-db
```

### 5. 部署應用程式（Cloudflare Pages）

1.  將程式碼推送到 GitHub / GitLab。
2.  在 Cloudflare Dashboard 進入 **Workers & Pages** -> **Create Application** -> **Connect to Git**。
3.  選擇你的 Repository。
4.  **Build Settings (建置設定)**:
    -   **Framework Preset**: `Nuxt`。
    -   **Build command**: `pnpm build`。
    -   **Build output directory**: `dist`（本專案的 Nitro preset 已設定為 `cloudflare-pages`，輸出目錄固定為 `dist`）。
5.  **Functions 設定**:
    -   **D1 Database Bindings** → Variable name 輸入 `DB`，選擇剛剛建立的資料庫。

### 6. 手動部署 (CLI)

如需直接透過 CLI 部署：

```bash
pnpm build
npx wrangler pages deploy dist --project-name=future-letters
```

## 專案結構

- `server/api`: 後端 API（`POST /api/letters` 建立排程、`POST /api/letters/send` 批次寄送到期信件）。
- `app/app.vue`: 前端頁面，提供信件排程表單與流程說明。
- `schema.sql`: 資料庫結構定義。
- `public`: 靜態資源。

## API 快速測試

在本機啟動 Pages 模擬器後，可以用 `curl` 測試新增信件：

```bash
curl -X POST http://localhost:8788/api/letters \
  -H "Content-Type: application/json" \
  -d '{
    "recipient_email": "user@example.com",
    "subject": "Hello future",
    "content": "See you soon",
    "delivery_date": 1893456000,
    "is_public": true
  }'
```

`delivery_date` 請提供 Unix Timestamp（秒或毫秒皆可，程式會自動轉換）。

要批次寄送到期信件，可在同一環境呼叫：

```bash
curl -X POST http://localhost:8788/api/letters/send
```

回應會包含本次處理、成功與失敗的數量。
