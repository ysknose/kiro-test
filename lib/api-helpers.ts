/**
 * API ヘルパー関数
 * API ルートで共通して使用するユーティリティ
 */

import { NextResponse } from "next/server";
import type { ServiceError } from "./types";

/**
 * エラーコードとHTTPステータスコードのマッピング
 */
const ERROR_STATUS_MAP: Record<string, number> = {
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  UNAUTHORIZED: 422,
  OUT_OF_STOCK: 409,
  BUSINESS_RULE_VIOLATION: 422,
  INTERNAL_ERROR: 500,
};

/**
 * サービスエラーからHTTPステータスコードを取得
 * @param errorCode エラーコード
 * @returns HTTPステータスコード
 */
export function getStatusFromErrorCode(errorCode: string): number {
  return ERROR_STATUS_MAP[errorCode] || 500;
}

/**
 * エラーレスポンスを生成
 * @param error サービスエラー
 * @returns NextResponse
 */
export function createErrorResponse(error: ServiceError): NextResponse {
  const status = getStatusFromErrorCode(error.code);
  return NextResponse.json({ error }, { status });
}

/**
 * 内部エラーレスポンスを生成
 * @param message エラーメッセージ
 * @param error 元のエラー
 * @returns NextResponse
 */
export function createInternalErrorResponse(
  message: string,
  error?: unknown,
): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message,
        details: error instanceof Error ? error.message : String(error),
      },
    },
    { status: 500 },
  );
}
