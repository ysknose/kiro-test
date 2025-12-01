/**
 * 備品管理システムの型定義
 */

/**
 * 備品インターフェース
 */
export interface Equipment {
  /** 一意のID（UUID） */
  id: string;
  /** 備品名（必須） */
  name: string;
  /** カテゴリ（必須） */
  category: string;
  /** 説明 */
  description: string;
  /** 総数量 */
  totalQuantity: number;
  /** 利用可能数量 */
  availableQuantity: number;
  /** 購入日（必須） */
  purchaseDate: Date;
  /** 耐用年数（年単位、オプション） */
  usefulLife?: number;
  /** 登録日時 */
  createdAt: Date;
  /** 更新日時 */
  updatedAt: Date;
}

/**
 * 貸出記録インターフェース
 */
export interface Loan {
  /** 一意のID（UUID） */
  id: string;
  /** 備品ID */
  equipmentId: string;
  /** ユーザーID */
  userId: string;
  /** 貸出日時 */
  borrowedAt: Date;
  /** 返却日時（未返却の場合null） */
  returnedAt: Date | null;
  /** ステータス */
  status: "active" | "returned";
}

/**
 * ユーザーインターフェース
 */
export interface User {
  /** 一意のID（UUID） */
  id: string;
  /** ユーザー名 */
  name: string;
  /** メールアドレス */
  email: string;
  /** 役割 */
  role: "user" | "admin";
}

// ============================================
// サービス層の共通型定義
// ============================================

/**
 * サービスエラーレスポンス型
 */
export interface ServiceError {
  /** エラーコード */
  code: string;
  /** エラーメッセージ */
  message: string;
  /** 詳細情報（オプション） */
  details?: unknown;
}

/**
 * サービス結果型
 * 成功時はデータを、失敗時はエラーを返す
 */
export type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: ServiceError };
