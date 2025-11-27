/**
 * 貸出管理サービス
 * 貸出処理ロジック（在庫減少）、返却処理ロジック（在庫増加）、貸出可能性チェック
 * 要件: 3.1, 3.2, 4.1, 4.3
 */

import * as v from 'valibot';
import type { Loan, Equipment } from './types';
import { LoanSchema, type LoanInput } from './schemas';
import {
  createLoan as createLoanData,
  updateLoan as updateLoanData,
  getLoanById,
  getEquipmentById,
  updateEquipment,
  getActiveLoansForUser,
} from './data-access';

/**
 * エラーレスポンス型
 */
export interface ServiceError {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * サービス結果型
 */
export type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: ServiceError };

/**
 * 貸出可能性をチェック
 * 要件: 3.2
 * @param equipment 備品
 * @returns 貸出可能な場合 true
 */
export function canBorrowEquipment(equipment: Equipment): boolean {
  return equipment.availableQuantity > 0;
}

/**
 * 備品を貸出
 * 要件: 3.1, 3.2, 3.3
 * @param input 貸出入力データ（equipmentId, userId）
 * @returns 作成された貸出記録またはエラー
 */
export async function borrowEquipment(
  input: LoanInput
): Promise<ServiceResult<Loan>> {
  try {
    // バリデーション
    const validationResult = v.safeParse(LoanSchema, input);
    if (!validationResult.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'バリデーションエラー',
          details: validationResult.issues,
        },
      };
    }

    const validatedData = validationResult.output;

    // 備品が存在するか確認
    const equipment = await getEquipmentById(validatedData.equipmentId);
    if (!equipment) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '備品が見つかりません',
        },
      };
    }

    // 在庫があるかチェック（要件: 3.2）
    if (!canBorrowEquipment(equipment)) {
      return {
        success: false,
        error: {
          code: 'OUT_OF_STOCK',
          message: '在庫切れです',
          details: { availableQuantity: equipment.availableQuantity },
        },
      };
    }

    // 貸出記録を作成（要件: 3.3）
    const loan = await createLoanData({
      equipmentId: validatedData.equipmentId,
      userId: validatedData.userId,
    });

    // 在庫数を減らす（要件: 3.1）
    await updateEquipment(validatedData.equipmentId, {
      availableQuantity: equipment.availableQuantity - 1,
    });

    return {
      success: true,
      data: loan,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '貸出処理に失敗しました',
        details: error,
      },
    };
  }
}

/**
 * 備品を返却
 * 要件: 4.1, 4.2, 4.3
 * @param loanId 貸出記録ID
 * @param userId 返却するユーザーID（権限チェック用）
 * @returns 更新された貸出記録またはエラー
 */
export async function returnEquipment(
  loanId: string,
  userId: string
): Promise<ServiceResult<Loan>> {
  try {
    // 貸出記録が存在するか確認
    const loan = await getLoanById(loanId);
    if (!loan) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '貸出記録が見つかりません',
        },
      };
    }

    // ユーザーが借りているか確認（要件: 4.3）
    if (loan.userId !== userId) {
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'この備品を借りていません',
          details: { loanUserId: loan.userId, requestUserId: userId },
        },
      };
    }

    // すでに返却済みかチェック（要件: 4.3）
    if (loan.status === 'returned') {
      return {
        success: false,
        error: {
          code: 'BUSINESS_RULE_VIOLATION',
          message: 'すでに返却済みです',
        },
      };
    }

    // 備品が存在するか確認
    const equipment = await getEquipmentById(loan.equipmentId);
    if (!equipment) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '備品が見つかりません',
        },
      };
    }

    // 貸出記録を更新（要件: 4.2）
    const updatedLoan = await updateLoanData(loanId, {
      returnedAt: new Date(),
      status: 'returned',
    });

    if (!updatedLoan) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '貸出記録が見つかりません',
        },
      };
    }

    // 在庫数を増やす（要件: 4.1）
    await updateEquipment(loan.equipmentId, {
      availableQuantity: equipment.availableQuantity + 1,
    });

    return {
      success: true,
      data: updatedLoan,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '返却処理に失敗しました',
        details: error,
      },
    };
  }
}

/**
 * ユーザーが特定の備品を借りているかチェック
 * @param userId ユーザーID
 * @param equipmentId 備品ID
 * @returns 借りている場合 true
 */
export async function hasActiveLoan(
  userId: string,
  equipmentId: string
): Promise<boolean> {
  const activeLoans = await getActiveLoansForUser(userId);
  return activeLoans.some((loan) => loan.equipmentId === equipmentId);
}
