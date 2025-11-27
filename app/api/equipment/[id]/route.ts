/**
 * 備品管理 API（個別操作）
 * GET /api/equipment/[id] - 詳細取得
 * PUT /api/equipment/[id] - 更新
 * DELETE /api/equipment/[id] - 削除
 * 要件: 2.4, 5.1, 5.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { getEquipmentById } from '@/lib/data-access';
import { updateEquipment, deleteEquipment } from '@/lib/equipment-service';
import type { EquipmentInput } from '@/lib/schemas';

/**
 * GET /api/equipment/[id]
 * 備品詳細取得
 * 要件: 2.4
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const equipment = await getEquipmentById(id);

    if (!equipment) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: '備品が見つかりません',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json(equipment, { status: 200 });
  } catch (error) {
    console.error('備品取得エラー:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: '備品の取得に失敗しました',
          details: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/equipment/[id]
 * 備品更新
 * 要件: 5.1
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // 日付文字列を Date オブジェクトに変換
    const input: Partial<EquipmentInput> = {
      ...body,
    };

    if (body.purchaseDate) {
      input.purchaseDate = new Date(body.purchaseDate);
    }

    const result = await updateEquipment(id, input);

    if (!result.success) {
      // 備品が見つからない
      if (result.error.code === 'NOT_FOUND') {
        return NextResponse.json({ error: result.error }, { status: 404 });
      }

      // バリデーションエラー
      if (result.error.code === 'VALIDATION_ERROR') {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      // その他のエラー
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result.data, { status: 200 });
  } catch (error) {
    console.error('備品更新エラー:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: '備品の更新に失敗しました',
          details: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/equipment/[id]
 * 備品削除
 * 要件: 5.2, 5.3
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await deleteEquipment(id);

    if (!result.success) {
      // 備品が見つからない
      if (result.error.code === 'NOT_FOUND') {
        return NextResponse.json({ error: result.error }, { status: 404 });
      }

      // 貸出中の備品は削除できない（要件: 5.2）
      if (result.error.code === 'BUSINESS_RULE_VIOLATION') {
        return NextResponse.json({ error: result.error }, { status: 422 });
      }

      // その他のエラー
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(
      { message: '備品を削除しました' },
      { status: 200 }
    );
  } catch (error) {
    console.error('備品削除エラー:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: '備品の削除に失敗しました',
          details: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 500 }
    );
  }
}
