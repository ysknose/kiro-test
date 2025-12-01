/**
 * 貸出返却 API
 * PUT /api/loans/[id]/return - 返却処理
 * 要件: 4.1, 4.2, 4.3
 */

import { type NextRequest, NextResponse } from "next/server";
import {
  createErrorResponse,
  createInternalErrorResponse,
} from "@/lib/api-helpers";
import { returnEquipment } from "@/lib/loan-service";

/**
 * PUT /api/loans/[id]/return
 * 返却処理
 * 要件: 4.1, 4.2, 4.3
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const userId = body.userId;

    if (!userId) {
      return createErrorResponse({
        code: "VALIDATION_ERROR",
        message: "ユーザーIDが必要です",
      });
    }

    const result = await returnEquipment(id, userId);

    if (!result.success) {
      return createErrorResponse(result.error);
    }

    return NextResponse.json(result.data, { status: 200 });
  } catch (error) {
    console.error("返却処理エラー:", error);
    return createInternalErrorResponse("返却処理に失敗しました", error);
  }
}
