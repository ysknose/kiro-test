'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { User, Package, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
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
 * 拡張された貸出記録型（備品情報を含む）
 */
interface EnrichedLoan {
  id: string;
  equipmentId: string;
  userId: string;
  borrowedAt: Date;
  returnedAt: Date | null;
  status: 'active' | 'returned';
  equipmentName: string;
  equipmentCategory: string;
}

/**
 * 現在の借用リストを取得する関数
 * 要件: 7.1
 */
async function fetchMyLoans(userId: string): Promise<EnrichedLoan[]> {
  const response = await fetch(`/api/loans/my-loans?userId=${userId}`);

  if (!response.ok) {
    throw new Error('借用状況の取得に失敗しました');
  }

  const data = await response.json();

  // 日付文字列を Date オブジェクトに変換
  return data.map((item: EnrichedLoan) => ({
    ...item,
    borrowedAt: new Date(item.borrowedAt),
    returnedAt: item.returnedAt ? new Date(item.returnedAt) : null,
  }));
}

/**
 * 返却処理を実行する関数
 * 要件: 7.2
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
 * マイページ（現在借りている備品のリスト）
 * 要件: 7.1, 7.2, 7.3
 */
export default function MyLoansPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // 仮のユーザーID（実際の実装では認証システムから取得）
  const currentUserId = 'user-1';

  // 現在の借用リストを取得（要件: 7.1）
  const {
    data: loans = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['myLoans', currentUserId],
    queryFn: () => fetchMyLoans(currentUserId),
  });

  // 返却処理のミューテーション（要件: 7.2）
  const returnMutation = useMutation({
    mutationFn: ({ loanId }: { loanId: string }) =>
      returnLoan(loanId, currentUserId),
    onSuccess: () => {
      // キャッシュを無効化して最新データを取得
      queryClient.invalidateQueries({ queryKey: ['myLoans', currentUserId] });
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['userLoans', currentUserId] });
      toast.success('備品を返却しました');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleReturn = (loanId: string) => {
    returnMutation.mutate({ loanId });
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* 戻るボタン */}
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        <ArrowLeft />
        戻る
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <User className="size-5 text-primary" />
            </div>
            <div>
              <CardTitle>マイページ</CardTitle>
              <CardDescription>現在借りている備品</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              読み込み中...
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              エラーが発生しました: {(error as Error).message}
            </div>
          ) : loans.length === 0 ? (
            // 空状態のメッセージ表示（要件: 7.2）
            <div className="text-center py-12">
              <Package className="size-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                現在借りている備品はありません
              </p>
            </div>
          ) : (
            // 借りている備品のリスト表示（要件: 7.1, 7.3）
            <div className="space-y-4">
              {loans.map((loan) => (
                <Card key={loan.id} className="border-2">
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        {/* 備品名（要件: 7.3） */}
                        <h3 className="text-lg font-semibold">
                          {loan.equipmentName}
                        </h3>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                          {/* カテゴリ（要件: 7.3） */}
                          <div className="flex items-center gap-1">
                            <Package className="size-4" />
                            <span>{loan.equipmentCategory}</span>
                          </div>

                          {/* 貸出日（要件: 7.3） */}
                          <div>
                            <span className="font-medium">貸出日:</span>{' '}
                            {format(loan.borrowedAt, 'yyyy年MM月dd日')}
                          </div>
                        </div>
                      </div>

                      {/* 返却ボタン（要件: 7.2） */}
                      <Button
                        onClick={() => handleReturn(loan.id)}
                        disabled={returnMutation.isPending}
                        variant="outline"
                        className="w-full sm:w-auto"
                      >
                        {returnMutation.isPending ? '処理中...' : '返却する'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* 件数表示 */}
              <div className="text-sm text-muted-foreground text-center pt-2">
                {loans.length} 件の備品を借りています
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
