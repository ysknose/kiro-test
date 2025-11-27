'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import { History } from 'lucide-react';
import type { Loan } from '@/lib/types';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * 拡張された貸出記録型（備品名とユーザー名を含む）
 */
interface EnrichedLoan extends Loan {
  equipmentName: string;
  userName: string;
}

/**
 * 貸出履歴を取得する関数
 */
async function fetchLoanHistory(
  equipmentId?: string,
  userId?: string
): Promise<EnrichedLoan[]> {
  const params = new URLSearchParams();
  if (equipmentId) {
    params.append('equipmentId', equipmentId);
  }
  if (userId) {
    params.append('userId', userId);
  }

  const url = `/api/loans${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('貸出履歴の取得に失敗しました');
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
 * 貸出履歴ページ
 * 要件: 6.1, 6.2, 6.3, 6.4
 */
export default function LoanHistoryPage() {
  const [equipmentFilter, setEquipmentFilter] = useState<string>('');
  const [userFilter, setUserFilter] = useState<string>('');
  const [debouncedEquipmentFilter, setDebouncedEquipmentFilter] =
    useState<string>('');
  const [debouncedUserFilter, setDebouncedUserFilter] = useState<string>('');

  // フィルターのデバウンス処理
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedEquipmentFilter(equipmentFilter);
    }, 300);
    return () => clearTimeout(timer);
  }, [equipmentFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUserFilter(userFilter);
    }, 300);
    return () => clearTimeout(timer);
  }, [userFilter]);

  // 貸出履歴データの取得（要件: 6.1）
  const {
    data: loans = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['loans', debouncedEquipmentFilter, debouncedUserFilter],
    queryFn: () =>
      fetchLoanHistory(
        debouncedEquipmentFilter || undefined,
        debouncedUserFilter || undefined
      ),
  });

  // テーブルのカラム定義（要件: 6.4）
  const columns: ColumnDef<EnrichedLoan>[] = [
    {
      accessorKey: 'equipmentName',
      header: '備品名',
    },
    {
      accessorKey: 'userName',
      header: 'ユーザー名',
    },
    {
      accessorKey: 'borrowedAt',
      header: '貸出日時',
      cell: ({ row }) => {
        return format(row.original.borrowedAt, 'yyyy年MM月dd日 HH:mm');
      },
    },
    {
      accessorKey: 'returnedAt',
      header: '返却日時',
      cell: ({ row }) => {
        const returnedAt = row.original.returnedAt;
        return returnedAt ? format(returnedAt, 'yyyy年MM月dd日 HH:mm') : '-';
      },
    },
    {
      accessorKey: 'status',
      header: 'ステータス',
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <span
            className={
              status === 'active'
                ? 'text-blue-600 font-medium'
                : 'text-muted-foreground'
            }
          >
            {status === 'active' ? '貸出中' : '返却済み'}
          </span>
        );
      },
    },
  ];

  const table = useReactTable({
    data: loans,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <History className="size-5 text-primary" />
            </div>
            <CardTitle>貸出履歴</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {/* フィルター */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* 備品別フィルター（要件: 6.2） */}
            <div className="flex-1">
              <Input
                type="text"
                placeholder="備品IDでフィルタリング..."
                value={equipmentFilter}
                onChange={(e) => setEquipmentFilter(e.target.value)}
              />
            </div>

            {/* ユーザー別フィルター（要件: 6.3） */}
            <div className="flex-1">
              <Input
                type="text"
                placeholder="ユーザーIDでフィルタリング..."
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
              />
            </div>
          </div>

          {/* テーブル */}
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              読み込み中...
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              エラーが発生しました: {(error as Error).message}
            </div>
          ) : loans.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              貸出履歴が見つかりませんでした
            </div>
          ) : (
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* 件数表示 */}
          {!isLoading && !error && loans.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              {loans.length} 件の貸出記録が見つかりました
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
