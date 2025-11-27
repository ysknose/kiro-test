/**
 * 備品管理システムのバリデーションスキーマ
 */

import * as v from 'valibot';

/**
 * 備品バリデーションスキーマ
 * 要件: 1.2, 1.5
 */
export const EquipmentSchema = v.object({
  name: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, '備品名は必須です'),
    v.maxLength(100, '備品名は100文字以内である必要があります')
  ),
  category: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, 'カテゴリは必須です'),
    v.maxLength(50, 'カテゴリは50文字以内である必要があります')
  ),
  description: v.pipe(
    v.string(),
    v.maxLength(500, '説明は500文字以内である必要があります')
  ),
  totalQuantity: v.pipe(
    v.number(),
    v.integer('数量は整数である必要があります'),
    v.minValue(0, '数量は0以上である必要があります'),
    v.maxValue(10000, '数量は10000以下である必要があります')
  ),
  purchaseDate: v.pipe(
    v.date(),
    v.maxValue(new Date(), '購入日は未来の日付にできません')
  ),
  usefulLife: v.optional(
    v.pipe(
      v.number(),
      v.integer('耐用年数は整数である必要があります'),
      v.minValue(1, '耐用年数は1年以上である必要があります'),
      v.maxValue(100, '耐用年数は100年以下である必要があります')
    )
  ),
});

/**
 * 貸出バリデーションスキーマ
 * 要件: 1.2, 1.5
 */
export const LoanSchema = v.object({
  equipmentId: v.pipe(v.string(), v.uuid('有効な備品IDが必要です')),
  userId: v.pipe(v.string(), v.trim(), v.minLength(1, 'ユーザーIDは必須です')),
});

/**
 * 備品作成用の入力型
 */
export type EquipmentInput = v.InferInput<typeof EquipmentSchema>;

/**
 * 備品作成用の出力型
 */
export type EquipmentOutput = v.InferOutput<typeof EquipmentSchema>;

/**
 * 貸出作成用の入力型
 */
export type LoanInput = v.InferInput<typeof LoanSchema>;

/**
 * 貸出作成用の出力型
 */
export type LoanOutput = v.InferOutput<typeof LoanSchema>;
