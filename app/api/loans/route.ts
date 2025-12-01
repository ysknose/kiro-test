/**
 * 貸出管理 API
 * GET /api/loans - 履歴取得、フィルタリング
 * POST /api/loans - 貸出処理
 * 要件: 3.1, 6.1, 6.2, 6.3
 */

import { type NextRequest, NextResponse } from "next/server";
import {
  createErrorResponse,
  createInternalErrorResponse,
} from "@/lib/api-helpers";
import {
  getAllEquipment,
  getAllLoans,
  getAllUsers,
  getLoansByEquipmentId,
  getLoansByUserId,
} from "@/lib/data-access";
import { borrowEquipment } from "@/lib/loan-service";
import type { LoanInput } from "@/lib/schemas";
import type { Loan } from "@/lib/types";

/**
 * GET /api/loans
 * 貸出履歴取得、フィルタリング
 * クエリパラメータ:
 * - equipmentId: 備品IDでフィルタリング
 * - userId: ユーザーIDでフィルタリング
 * 要件: 6.1, 6.2, 6.3, 6.4
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const equipmentId = searchParams.get("equipmentId");
    const userId = searchParams.get("userId");

    let loans: Loan[];

    if (equipmentId) {
      // 備品IDでフィルタリング（要件: 6.2）
      loans = await getLoansByEquipmentId(equipmentId);
    } else if (userId) {
      // ユーザーIDでフィルタリング（要件: 6.3）
      loans = await getLoansByUserId(userId);
    } else {
      // すべての貸出記録を取得（要件: 6.1）
      loans = await getAllLoans();
      // 時系列順（降順）にソート
      loans.sort((a, b) => b.borrowedAt.getTime() - a.borrowedAt.getTime());
    }

    // 備品名とユーザー名を追加（要件: 6.4）
    // パフォーマンス最適化: すべての備品とユーザーを一度に取得
    const [allEquipment, allUsers] = await Promise.all([
      getAllEquipment(),
      getAllUsers(),
    ]);

    // マップを作成して高速検索
    const equipmentMap = new Map(allEquipment.map((eq) => [eq.id, eq.name]));
    const userMap = new Map(allUsers.map((u) => [u.id, u.name]));

    const enrichedLoans = loans.map((loan) => ({
      ...loan,
      equipmentName: equipmentMap.get(loan.equipmentId) || "不明",
      userName: userMap.get(loan.userId) || "不明",
    }));

    return NextResponse.json(enrichedLoans, { status: 200 });
  } catch (error) {
    console.error("貸出履歴取得エラー:", error);
    return createInternalErrorResponse("貸出履歴の取得に失敗しました", error);
  }
}

/**
 * POST /api/loans
 * 貸出処理
 * 要件: 3.1, 3.2, 3.3
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const input: LoanInput = {
      equipmentId: body.equipmentId,
      userId: body.userId,
    };

    const result = await borrowEquipment(input);

    if (!result.success) {
      return createErrorResponse(result.error);
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error("貸出処理エラー:", error);
    return createInternalErrorResponse("貸出処理に失敗しました", error);
  }
}
