/**
 * 貸出返却 API
 * PUT /api/loans/[id]/return - 返却処理
 * 要件: 4.1, 4.2, 4.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { returnEquipment } from '@/lib/loan-service';

/**
 * PUT /api/loans/[id]/return
 * 返却処理
 * 要件: 4.1, 4.2, 4.3
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const userId = body.userId;

    if (!userId) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'ユーザーIDが必要です',
          },
        },
        { status: 400 }
      );
    }

    const result = await returnEquipment(id, userId);

    if (!result.success) {
      // 貸出記録が見つからない
      if (result.error.code === 'NOT_FOUND') {
        return NextResponse.json({ error: result.error }, { status: 404 });
      }

      // ユーザーが借りていない（要件: 4.3）
      if (result.error.code === 'UNAUTHORIZED') {
        return NextResponse.json({ error: result.error }, { status: 422 });
      }

      // すでに返却済み（要件: 4.3）
      if (result.error.code === 'BUSINESS_RULE_VIOLATION') {
        return NextResponse.json({ error: result.error }, { status: 422 });
      }

      // その他のエラー
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result.data, { status: 200 });
  } catch (error) {
    console.error('返却処理エラー:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: '返却処理に失敗しました',
          details: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 500 }
    );
  }
}
