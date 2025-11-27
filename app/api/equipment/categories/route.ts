/**
 * 備品カテゴリ一覧 API
 * GET /api/equipment/categories - カテゴリ一覧を取得
 */

import { NextResponse } from 'next/server';
import { getAllCategories } from '@/lib/data-access';

/**
 * GET /api/equipment/categories
 * 備品のカテゴリ一覧を取得（重複なし、ソート済み）
 */
export async function GET() {
  try {
    const categories = await getAllCategories();

    // キャッシュヘッダーを追加して、ブラウザとCDNでキャッシュ
    return NextResponse.json(categories, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('カテゴリ取得エラー:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'カテゴリの取得に失敗しました',
          details: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 500 }
    );
  }
}
