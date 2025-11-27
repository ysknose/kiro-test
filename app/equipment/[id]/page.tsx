'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft, Package, Pencil } from 'lucide-react';
import Link from 'next/link';
import type { Equipment, Loan } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { toast } from 'sonner';

/**
 * 備品詳細を取得する関数
 */
async function fetchEquipmentDetail(id: string): Promise<Equipment> {
  const response = await fetch(`/api/equipment/${id}`);

  if (!response.ok) {
    throw new Error('備品の取得に失敗しました');
  }

  const data = await response.json();

  // 日付文字列を Date オブジェクトに変換
  return {
    ...data,
    purchaseDate: new Date(data.purchaseDate),
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
  };
}

/**
 * 貸出処理を実行する関数
 */
async function createLoan(equipmentId: string, userId: string): Promise<void> {
  const response = await fetch('/api/loans', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ equipmentId, userId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || '貸出処理に失敗しました');
  }
}

/**
 * ユーザーの現在の貸出を取得する関数
 */
async function fetchUserActiveLoans(userId: string): Promise<Loan[]> {
  const response = await fetch(`/api/loans/my-loans?userId=${userId}`);

  if (!response.ok) {
    throw new Error('貸出情報の取得に失敗しました');
  }

  const data = await response.json();

  // 日付文字列を Date オブジェクトに変換
  return data.map((loan: Loan) => ({
    ...loan,
    borrowedAt: new Date(loan.borrowedAt),
    returnedAt: loan.returnedAt ? new Date(loan.returnedAt) : null,
  }));
}

/**
 * 返却処理を実行する関数
 */
async function returnLoan(loanId: string, userId: string): Promise<void> {
  const response = await fetch(`/api/loans/${loanId}/return`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || '返却処理に失敗しました');
  }
}

/**
 * 備品詳細ページ
 * 要件: 2.4
 */
export default function EquipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const equipmentId = params.id as string;

  // 仮のユーザーID（実際の実装では認証システムから取得）
  const currentUserId = 'user-1';

  // 備品詳細の取得
  const {
    data: equipment,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['equipment', equipmentId],
    queryFn: () => fetchEquipmentDetail(equipmentId),
  });

  // ユーザーの現在の貸出を取得
  const { data: userLoans = [] } = useQuery({
    queryKey: ['userLoans', currentUserId],
    queryFn: () => fetchUserActiveLoans(currentUserId),
  });

  // この備品を借りているかチェック
  const activeLoan = userLoans.find(
    (loan) => loan.equipmentId === equipmentId && loan.status === 'active'
  );

  // 貸出処理のミューテーション（要件: 3.1, 3.2）
  const loanMutation = useMutation({
    mutationFn: () => createLoan(equipmentId, currentUserId),
    onSuccess: () => {
      // キャッシュを無効化して最新データを取得（楽観的更新）
      queryClient.invalidateQueries({ queryKey: ['equipment', equipmentId] });
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['userLoans', currentUserId] });
      toast.success('備品を借りました');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // 返却処理のミューテーション（要件: 4.1, 4.3）
  const returnMutation = useMutation({
    mutationFn: () => {
      if (!activeLoan) {
        throw new Error('貸出記録が見つかりません');
      }
      return returnLoan(activeLoan.id, currentUserId);
    },
    onSuccess: () => {
      // キャッシュを無効化して最新データを取得（楽観的更新）
      queryClient.invalidateQueries({ queryKey: ['equipment', equipmentId] });
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['userLoans', currentUserId] });
      toast.success('備品を返却しました');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleLoan = () => {
    if (equipment && equipment.availableQuantity > 0) {
      loanMutation.mutate();
    }
  };

  const handleReturn = () => {
    if (activeLoan) {
      returnMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-8 text-muted-foreground">
          読み込み中...
        </div>
      </div>
    );
  }

  if (error || !equipment) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-8 text-destructive">
          エラーが発生しました:{' '}
          {(error as Error)?.message || '備品が見つかりません'}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* 戻るボタン */}
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        <ArrowLeft />
        戻る
      </Button>

      {/* 備品詳細カード */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Package className="size-6 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl">{equipment.name}</CardTitle>
              <CardDescription className="mt-2">
                {equipment.category}
              </CardDescription>
            </div>
            <Button variant="outline" asChild>
              <Link href={`/equipment/${equipmentId}/edit`}>
                <Pencil />
                編集
              </Link>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 説明 */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              説明
            </h3>
            <p className="text-base">
              {equipment.description || '説明はありません'}
            </p>
          </div>

          {/* 在庫情報 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                在庫数
              </h3>
              <p className="text-2xl font-semibold">
                <span
                  className={
                    equipment.availableQuantity === 0
                      ? 'text-destructive'
                      : 'text-foreground'
                  }
                >
                  {equipment.availableQuantity}
                </span>
                <span className="text-base text-muted-foreground">
                  {' '}
                  / {equipment.totalQuantity}
                </span>
              </p>
              {equipment.availableQuantity === 0 && (
                <p className="text-sm text-destructive mt-1">在庫切れ</p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                貸出状況
              </h3>
              <p className="text-base">
                {equipment.availableQuantity === equipment.totalQuantity
                  ? 'すべて利用可能'
                  : equipment.availableQuantity === 0
                  ? 'すべて貸出中'
                  : `${
                      equipment.totalQuantity - equipment.availableQuantity
                    }個が貸出中`}
              </p>
            </div>
          </div>

          {/* 購入情報 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                購入日
              </h3>
              <p className="text-base">
                {format(equipment.purchaseDate, 'yyyy年MM月dd日')}
              </p>
            </div>

            {equipment.usefulLife && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  耐用年数
                </h3>
                <p className="text-base">{equipment.usefulLife}年</p>
              </div>
            )}
          </div>

          {/* 登録情報 */}
          <div className="pt-4 border-t">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <span className="font-medium">登録日時:</span>{' '}
                {format(equipment.createdAt, 'yyyy年MM月dd日 HH:mm')}
              </div>
              <div>
                <span className="font-medium">更新日時:</span>{' '}
                {format(equipment.updatedAt, 'yyyy年MM月dd日 HH:mm')}
              </div>
            </div>
          </div>

          {/* 貸出・返却ボタン */}
          <div className="pt-4 flex gap-3">
            {activeLoan ? (
              // 返却ボタン（要件: 4.1, 4.3）
              <Button
                onClick={handleReturn}
                disabled={returnMutation.isPending}
                className="w-full sm:w-auto"
                size="lg"
                variant="outline"
              >
                {returnMutation.isPending ? '処理中...' : 'この備品を返却する'}
              </Button>
            ) : (
              // 貸出ボタン（要件: 3.1, 3.2）
              <Button
                onClick={handleLoan}
                disabled={
                  equipment.availableQuantity === 0 || loanMutation.isPending
                }
                className="w-full sm:w-auto"
                size="lg"
              >
                {loanMutation.isPending
                  ? '処理中...'
                  : equipment.availableQuantity === 0
                  ? '在庫切れ'
                  : 'この備品を借りる'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
