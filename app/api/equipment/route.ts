/**
 * 備品管理 API
 * GET /api/equipment - 一覧取得、検索、フィルタリング
 * POST /api/equipment - 作成
 * 要件: 1.1, 2.1, 2.2, 2.3, 5.1
 */

import { type NextRequest, NextResponse } from "next/server";
import {
  createErrorResponse,
  createInternalErrorResponse,
} from "@/lib/api-helpers";
import {
  getAllEquipment,
  getEquipmentByCategory,
  searchEquipmentByName,
} from "@/lib/data-access";
import { createEquipment } from "@/lib/equipment-service";
import type { EquipmentInput } from "@/lib/schemas";

/**
 * GET /api/equipment
 * 備品一覧取得、検索、フィルタリング、ページング
 * クエリパラメータ:
 * - category: カテゴリでフィルタリング
 * - search: 備品名で検索
 * - page: ページ番号（デフォルト: 1）
 * - limit: 1ページあたりの件数（デフォルト: 20）
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const page = Number.parseInt(searchParams.get("page") || "1", 10);
    const limit = Number.parseInt(searchParams.get("limit") || "20", 10);

    let equipment;

    if (category) {
      // カテゴリでフィルタリング（要件: 2.2）
      equipment = await getEquipmentByCategory(category);
    } else if (search) {
      // 備品名で検索（要件: 2.3）
      equipment = await searchEquipmentByName(search);
    } else {
      // すべての備品を取得（要件: 2.1）
      equipment = await getAllEquipment();
    }

    // ページング処理
    const total = equipment.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedEquipment = equipment.slice(startIndex, endIndex);

    return NextResponse.json(
      {
        data: paginatedEquipment,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("備品取得エラー:", error);
    return createInternalErrorResponse("備品の取得に失敗しました", error);
  }
}

/**
 * POST /api/equipment
 * 備品作成
 * 要件: 1.1, 1.2, 1.5, 5.1
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 日付文字列を Date オブジェクトに変換
    const input: EquipmentInput = {
      ...body,
      purchaseDate: body.purchaseDate
        ? new Date(body.purchaseDate)
        : new Date(),
    };

    const result = await createEquipment(input);

    if (!result.success) {
      return createErrorResponse(result.error);
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error("備品作成エラー:", error);
    return createInternalErrorResponse("備品の作成に失敗しました", error);
  }
}
