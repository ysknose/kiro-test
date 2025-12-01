/**
 * 備品管理 API（個別操作）
 * GET /api/equipment/[id] - 詳細取得
 * PUT /api/equipment/[id] - 更新
 * DELETE /api/equipment/[id] - 削除
 * 要件: 2.4, 5.1, 5.3
 */

import { type NextRequest, NextResponse } from "next/server";
import {
  createErrorResponse,
  createInternalErrorResponse,
} from "@/lib/api-helpers";
import { getEquipmentById } from "@/lib/data-access";
import { deleteEquipment, updateEquipment } from "@/lib/equipment-service";
import type { EquipmentInput } from "@/lib/schemas";

/**
 * GET /api/equipment/[id]
 * 備品詳細取得
 * 要件: 2.4
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const equipment = await getEquipmentById(id);

    if (!equipment) {
      return createErrorResponse({
        code: "NOT_FOUND",
        message: "備品が見つかりません",
      });
    }

    return NextResponse.json(equipment, { status: 200 });
  } catch (error) {
    console.error("備品取得エラー:", error);
    return createInternalErrorResponse("備品の取得に失敗しました", error);
  }
}

/**
 * PUT /api/equipment/[id]
 * 備品更新
 * 要件: 5.1
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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
      return createErrorResponse(result.error);
    }

    return NextResponse.json(result.data, { status: 200 });
  } catch (error) {
    console.error("備品更新エラー:", error);
    return createInternalErrorResponse("備品の更新に失敗しました", error);
  }
}

/**
 * DELETE /api/equipment/[id]
 * 備品削除
 * 要件: 5.2, 5.3
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const result = await deleteEquipment(id);

    if (!result.success) {
      return createErrorResponse(result.error);
    }

    return NextResponse.json(
      { message: "備品を削除しました" },
      { status: 200 },
    );
  } catch (error) {
    console.error("備品削除エラー:", error);
    return createInternalErrorResponse("備品の削除に失敗しました", error);
  }
}
