This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## 会社備品管理アプリケーション

このアプリケーションは、会社の備品を管理するためのシステムです。備品の登録、検索、貸出、返却、履歴管理を行うことができます。

## Getting Started

### 1. JSON Server を起動

まず、バックエンドの JSON Server を起動します：

```bash
bun run json-server
```

JSON Server は `http://localhost:3001` で起動します。

### 2. 開発サーバーを起動

別のターミナルで、Next.js の開発サーバーを起動します：

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## テストの実行

### ユニットテスト

```bash
bun test
```

### データアクセス層のテスト

データアクセス層のテストを実行する前に、JSON Server を起動してください：

```bash
# ターミナル1
bun run json-server

# ターミナル2
bun test lib/data-access.test.ts --run
```

## 技術スタック

- **フレームワーク**: Next.js 16 (App Router), TypeScript
- **UI**: shadcn/ui, Tailwind CSS
- **状態管理**: TanStack Query
- **バリデーション**: Valibot
- **データストレージ**: JSON Server
- **テスト**: Bun Test, fast-check (Property-Based Testing)

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
