/**
 * マイ貸出 API
 * GET /api/loans/my-loans - 自分の借用状況
 * 要件: 7.1, 7.3
 */

import { type NextRequest, NextResponse } from "next/server";
import {
  createErrorResponse,
  createInternalErrorResponse,
} from "@/lib/api-helpers";
import { getActiveLoansForUser, getAllEquipment } from "@/lib/data-access";

/**
 * GET /api/loans/my-loans
 * 自分の借用状況取得
 * クエリパラメータ:
 * - userId: ユーザーID（必須）
 * 要件: 7.1, 7.3
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return createErrorResponse({
        code: "VALIDATION_ERROR",
        message: "ユーザーIDが必要です",
      });
    }

    // 現在借りている備品を取得（要件: 7.1）
    const activeLoans = await getActiveLoansForUser(userId);

    // 備品情報を追加（要件: 7.3）
    // パフォーマンス最適化: すべての備品を一度に取得
    const allEquipment = await getAllEquipment();
    const equipmentMap = new Map(
      allEquipment.map((eq) => [
        eq.id,
        { name: eq.name, category: eq.category },
      ]),
    );

    const enrichedLoans = activeLoans.map((loan) => {
      const equipment = equipmentMap.get(loan.equipmentId);
      return {
        ...loan,
        equipmentName: equipment?.name || "不明",
        equipmentCategory: equipment?.category || "不明",
      };
    });

    return NextResponse.json(enrichedLoans, { status: 200 });
  } catch (error) {
    console.error("借用状況取得エラー:", error);
    return createInternalErrorResponse("借用状況の取得に失敗しました", error);
  }
}
