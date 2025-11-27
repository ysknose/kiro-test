/**
 * 備品管理サービス
 * 備品の作成、更新、削除ロジック
 * 要件: 1.1, 5.1, 5.2, 5.3
 */

import * as v from 'valibot';
import type { Equipment } from './types';
import { EquipmentSchema, type EquipmentInput } from './schemas';
import {
  createEquipment as createEquipmentData,
  updateEquipment as updateEquipmentData,
  deleteEquipment as deleteEquipmentData,
  getEquipmentById,
  getActiveLoansForEquipment,
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
 * 備品を作成
 * 要件: 1.1, 1.2, 1.3, 1.4, 1.5
 * @param input 備品入力データ
 * @returns 作成された備品またはエラー
 */
export async function createEquipment(
  input: EquipmentInput
): Promise<ServiceResult<Equipment>> {
  try {
    // バリデーション
    const validationResult = v.safeParse(EquipmentSchema, input);
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

    // 備品を作成
    const equipment = await createEquipmentData({
      name: validatedData.name,
      category: validatedData.category,
      description: validatedData.description,
      totalQuantity: validatedData.totalQuantity,
      availableQuantity: validatedData.totalQuantity, // 初期値は総数量と同じ
      purchaseDate: validatedData.purchaseDate,
      usefulLife: validatedData.usefulLife,
    });

    return {
      success: true,
      data: equipment,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '備品の作成に失敗しました',
        details: error,
      },
    };
  }
}

/**
 * 備品を更新
 * 要件: 5.1
 * @param id 備品ID
 * @param input 更新データ
 * @returns 更新された備品またはエラー
 */
export async function updateEquipment(
  id: string,
  input: Partial<EquipmentInput>
): Promise<ServiceResult<Equipment>> {
  try {
    // 備品が存在するか確認
    const existing = await getEquipmentById(id);
    if (!existing) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '備品が見つかりません',
        },
      };
    }

    // 検証済みデータを格納するオブジェクト
    const validatedData: Partial<EquipmentInput> = {};

    // 更新データのバリデーション（部分的）
    if (input.name !== undefined) {
      const nameResult = v.safeParse(
        v.pipe(
          v.string(),
          v.trim(),
          v.minLength(1, '備品名は必須です'),
          v.maxLength(100, '備品名は100文字以内である必要があります')
        ),
        input.name
      );
      if (!nameResult.success) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'バリデーションエラー',
            details: nameResult.issues,
          },
        };
      }
      validatedData.name = nameResult.output;
    }

    if (input.category !== undefined) {
      const categoryResult = v.safeParse(
        v.pipe(
          v.string(),
          v.trim(),
          v.minLength(1, 'カテゴリは必須です'),
          v.maxLength(50, 'カテゴリは50文字以内である必要があります')
        ),
        input.category
      );
      if (!categoryResult.success) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'バリデーションエラー',
            details: categoryResult.issues,
          },
        };
      }
      validatedData.category = categoryResult.output;
    }

    if (input.description !== undefined) {
      const descriptionResult = v.safeParse(
        v.pipe(
          v.string(),
          v.maxLength(500, '説明は500文字以内である必要があります')
        ),
        input.description
      );
      if (!descriptionResult.success) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'バリデーションエラー',
            details: descriptionResult.issues,
          },
        };
      }
      validatedData.description = descriptionResult.output;
    }

    if (input.totalQuantity !== undefined) {
      const quantityResult = v.safeParse(
        v.pipe(
          v.number(),
          v.integer('数量は整数である必要があります'),
          v.minValue(0, '数量は0以上である必要があります'),
          v.maxValue(10000, '数量は10000以下である必要があります')
        ),
        input.totalQuantity
      );
      if (!quantityResult.success) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'バリデーションエラー',
            details: quantityResult.issues,
          },
        };
      }
      validatedData.totalQuantity = quantityResult.output;
    }

    if (input.purchaseDate !== undefined) {
      const dateResult = v.safeParse(
        v.pipe(
          v.date(),
          v.maxValue(new Date(), '購入日は未来の日付にできません')
        ),
        input.purchaseDate
      );
      if (!dateResult.success) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'バリデーションエラー',
            details: dateResult.issues,
          },
        };
      }
      validatedData.purchaseDate = dateResult.output;
    }

    if (input.usefulLife !== undefined) {
      const usefulLifeResult = v.safeParse(
        v.pipe(
          v.number(),
          v.integer('耐用年数は整数である必要があります'),
          v.minValue(1, '耐用年数は1年以上である必要があります'),
          v.maxValue(100, '耐用年数は100年以下である必要があります')
        ),
        input.usefulLife
      );
      if (!usefulLifeResult.success) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'バリデーションエラー',
            details: usefulLifeResult.issues,
          },
        };
      }
      validatedData.usefulLife = usefulLifeResult.output;
    }

    // 備品を更新（検証済みデータを使用）
    const updated = await updateEquipmentData(id, validatedData);
    if (!updated) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '備品が見つかりません',
        },
      };
    }

    return {
      success: true,
      data: updated,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '備品の更新に失敗しました',
        details: error,
      },
    };
  }
}

/**
 * 備品を削除
 * 要件: 5.2, 5.3
 * @param id 備品ID
 * @returns 削除成功またはエラー
 */
export async function deleteEquipment(
  id: string
): Promise<ServiceResult<void>> {
  try {
    // 備品が存在するか確認
    const existing = await getEquipmentById(id);
    if (!existing) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '備品が見つかりません',
        },
      };
    }

    // 貸出中かチェック（要件: 5.2）
    const activeLoans = await getActiveLoansForEquipment(id);
    if (activeLoans.length > 0) {
      return {
        success: false,
        error: {
          code: 'BUSINESS_RULE_VIOLATION',
          message: '貸出中の備品は削除できません',
          details: { activeLoansCount: activeLoans.length },
        },
      };
    }

    // 備品を削除（要件: 5.3）
    const deleted = await deleteEquipmentData(id);
    if (!deleted) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '備品が見つかりません',
        },
      };
    }

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '備品の削除に失敗しました',
        details: error,
      },
    };
  }
}

/**
 * 在庫数を計算
 * 利用可能数量 = 総数量 - 貸出中の数量
 * @param equipment 備品
 * @returns 計算された在庫数
 */
export function calculateAvailableQuantity(equipment: Equipment): number {
  return equipment.availableQuantity;
}
