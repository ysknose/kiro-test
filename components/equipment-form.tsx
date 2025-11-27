'use client';

import { useForm } from 'react-hook-form';
import { valibotResolver } from '@hookform/resolvers/valibot';
import * as v from 'valibot';
import { format } from 'date-fns';
import type { Equipment } from '@/lib/types';
import { EquipmentSchema } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

/**
 * フォーム用の型定義
 * 要件: 1.1, 1.2, 1.5
 */
type EquipmentFormData = {
  name: string;
  category: string;
  description: string;
  totalQuantity: number;
  purchaseDate: string; // フォームでは文字列として扱う
  usefulLife?: number;
};

/**
 * フォーム用のバリデーションスキーマ
 * 日付を文字列として扱うバージョン
 */
const EquipmentFormSchema = v.object({
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
    v.number('数量を入力してください'),
    v.integer('数量は整数である必要があります'),
    v.minValue(0, '数量は0以上である必要があります'),
    v.maxValue(10000, '数量は10000以下である必要があります')
  ),
  purchaseDate: v.pipe(
    v.string(),
    v.minLength(1, '購入日は必須です'),
    v.isoDate('有効な日付形式で入力してください')
  ),
  usefulLife: v.optional(
    v.pipe(
      v.number('耐用年数を入力してください'),
      v.integer('耐用年数は整数である必要があります'),
      v.minValue(1, '耐用年数は1年以上である必要があります'),
      v.maxValue(100, '耐用年数は100年以下である必要があります')
    )
  ),
});

interface EquipmentFormProps {
  /** 編集モードの場合、既存の備品データ */
  equipment?: Equipment;
  /** フォーム送信時のコールバック */
  onSubmit: (data: EquipmentFormData) => Promise<void>;
  /** キャンセル時のコールバック */
  onCancel?: () => void;
  /** 送信中フラグ */
  isSubmitting?: boolean;
}

/**
 * 備品登録・編集フォームコンポーネント
 * 要件: 1.1, 1.2, 1.5, 5.1
 */
export function EquipmentForm({
  equipment,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: EquipmentFormProps) {
  const isEditMode = !!equipment;

  // デフォルト値の設定
  const defaultValues: EquipmentFormData = equipment
    ? {
        name: equipment.name,
        category: equipment.category,
        description: equipment.description,
        totalQuantity: equipment.totalQuantity,
        purchaseDate: format(equipment.purchaseDate, 'yyyy-MM-dd'),
        usefulLife: equipment.usefulLife,
      }
    : {
        name: '',
        category: '',
        description: '',
        totalQuantity: 1,
        purchaseDate: format(new Date(), 'yyyy-MM-dd'),
        usefulLife: undefined,
      };

  const form = useForm<EquipmentFormData>({
    resolver: valibotResolver(EquipmentFormSchema),
    defaultValues,
  });

  const handleSubmit = async (data: EquipmentFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      // エラーハンドリングは親コンポーネントで行う
      console.error('Form submission error:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEditMode ? '備品情報の編集' : '新しい備品の登録'}
        </CardTitle>
        <CardDescription>
          {isEditMode
            ? '備品情報を更新します。必須項目を入力してください。'
            : '新しい備品を登録します。必須項目を入力してください。'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            {/* 備品名 */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>備品名 *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="例: ノートPC"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* カテゴリ */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>カテゴリ *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="例: 電子機器"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 説明 */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>説明</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="備品の詳細説明"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    備品の詳細情報を入力してください（最大500文字）
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 数量 */}
            <FormField
              control={form.control}
              name="totalQuantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>数量 *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="1"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === '' ? '' : Number(value));
                      }}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    備品の総数量を入力してください（0〜10000）
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 購入日 */}
            <FormField
              control={form.control}
              name="purchaseDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>購入日 *</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      max={format(new Date(), 'yyyy-MM-dd')}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    備品を購入した日付を選択してください
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 耐用年数 */}
            <FormField
              control={form.control}
              name="usefulLife"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>耐用年数（オプション）</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="例: 5"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(
                          value === '' ? undefined : Number(value)
                        );
                      }}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    備品の耐用年数を年単位で入力してください（1〜100年）
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ボタン */}
            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? '処理中...'
                  : isEditMode
                  ? '更新する'
                  : '登録する'}
              </Button>
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  キャンセル
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
