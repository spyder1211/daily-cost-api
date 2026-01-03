# Daily Cost API

日割りコストアプリ用のバックエンドAPI。Amazon Product Advertising APIを使用した商品検索機能を提供。

## セットアップ

### 1. 依存関係インストール

```bash
npm install
```

### 2. 環境変数設定

`.env.local` ファイルを作成:

```
AMAZON_ACCESS_KEY=your_access_key
AMAZON_SECRET_KEY=your_secret_key
AMAZON_PARTNER_TAG=your_partner_tag
```

### 3. ローカル開発

```bash
npm run dev
```

## API エンドポイント

### GET /api/search

商品を検索します。

**パラメータ:**
- `q` (必須): 検索キーワード（2文字以上）

**レスポンス例:**
```json
{
  "products": [
    {
      "asin": "B09V3KXJPB",
      "title": "Apple MacBook Air M2",
      "imageUrl": "https://...",
      "price": 164800,
      "detailPageUrl": "https://amazon.co.jp/dp/B09V3KXJPB"
    }
  ]
}
```

## デプロイ

Vercelにデプロイ:

```bash
vercel --prod
```

環境変数はVercel Dashboardで設定してください。

## 技術スタック

- Vercel Serverless Functions
- TypeScript
- Amazon PA-API (amazon-paapi)
