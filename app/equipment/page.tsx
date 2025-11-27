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
import { Search, Eye, Plus } from 'lucide-react';
import Link from 'next/link';
import type { Equipment } from '@/lib/types';
import { Button } from '@/components/ui/button';
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
 * ページングレスポンス型
 */
interface PaginatedResponse {
  data: Equipment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * 備品データを取得する関数
 */
async function fetchEquipment(
  category?: string,
  search?: string,
  page = 1,
  limit = 20
): Promise<PaginatedResponse> {
  const params = new URLSearchParams();
  if (category && category !== 'all') {
    params.append('category', category);
  }
  if (search) {
    params.append('search', search);
  }
  params.append('page', page.toString());
  params.append('limit', limit.toString());

  const url = `/api/equipment?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('備品の取得に失敗しました');
  }

  const result = await response.json();

  // 日付文字列を Date オブジェクトに変換
  const data = result.data.map((item: Equipment) => ({
    ...item,
    purchaseDate: new Date(item.purchaseDate),
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
  }));

  return {
    data,
    pagination: result.pagination,
  };
}

/**
 * カテゴリ一覧を取得する関数
 */
async function fetchCategories(): Promise<string[]> {
  const response = await fetch('/api/equipment/categories');

  if (!response.ok) {
    throw new Error('カテゴリの取得に失敗しました');
  }

  return response.json();
}

/**
 * 備品一覧ページ
 * 要件: 2.1, 2.2, 2.3
 */
export default function EquipmentPage() {
  const [category, setCategory] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(20);

  // 検索のデバウンス処理
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // 検索時はページをリセット
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // カテゴリ変更時にページをリセット
  useEffect(() => {
    setPage(1);
  }, [category]);

  // 備品データの取得（要件: 2.1）
  const {
    data: result,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['equipment', category, debouncedSearch, page, limit],
    queryFn: () =>
      fetchEquipment(
        category !== 'all' ? category : undefined,
        debouncedSearch || undefined,
        page,
        limit
      ),
  });

  const equipment = result?.data || [];
  const pagination = result?.pagination;

  // カテゴリ一覧の取得（別クエリで高速化）
  const { data: categories = [], isLoading: isCategoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 30 * 60 * 1000, // 30分間キャッシュ
    gcTime: 60 * 60 * 1000, // 1時間ガベージコレクション
  });

  // テーブルのカラム定義
  const columns: ColumnDef<Equipment>[] = [
    {
      accessorKey: 'name',
      header: '備品名',
    },
    {
      accessorKey: 'category',
      header: 'カテゴリ',
    },
    {
      accessorKey: 'description',
      header: '説明',
      cell: ({ row }) => {
        const description = row.original.description;
        return (
          <span className="max-w-xs truncate block" title={description}>
            {description}
          </span>
        );
      },
    },
    {
      accessorKey: 'availableQuantity',
      header: '在庫数',
      cell: ({ row }) => {
        const available = row.original.availableQuantity;
        const total = row.original.totalQuantity;
        return (
          <span
            className={available === 0 ? 'text-destructive font-medium' : ''}
          >
            {available} / {total}
          </span>
        );
      },
    },
    {
      accessorKey: 'purchaseDate',
      header: '購入日',
      cell: ({ row }) => {
        return format(row.original.purchaseDate, 'yyyy年MM月dd日');
      },
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => {
        return (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/equipment/${row.original.id}`}>
              <Eye />
              詳細
            </Link>
          </Button>
        );
      },
    },
  ];

  const table = useReactTable({
    data: equipment,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>備品一覧</CardTitle>
            <Button asChild>
              <Link href="/equipment/new">
                <Plus />
                新規登録
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* 検索バーとカテゴリフィルター */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* 検索バー（要件: 2.3） */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="備品名で検索..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* カテゴリフィルター（要件: 2.2） */}
            <Select
              value={category}
              onValueChange={setCategory}
              disabled={isCategoriesLoading}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue
                  placeholder={
                    isCategoriesLoading ? '読み込み中...' : 'カテゴリを選択'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべてのカテゴリ</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          ) : equipment.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              備品が見つかりませんでした
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

          {/* ページネーションと件数表示 */}
          {!isLoading && !error && equipment.length > 0 && pagination && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                {pagination.total} 件中 {(page - 1) * limit + 1} -{' '}
                {Math.min(page * limit, pagination.total)} 件を表示
              </div>

              {/* ページネーション */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    前へ
                  </Button>

                  <div className="flex items-center gap-1">
                    {/* 最初のページ */}
                    {page > 3 && (
                      <>
                        <Button
                          variant={page === 1 ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setPage(1)}
                        >
                          1
                        </Button>
                        {page > 4 && (
                          <span className="px-2 text-muted-foreground">
                            ...
                          </span>
                        )}
                      </>
                    )}

                    {/* 現在のページ周辺 */}
                    {Array.from(
                      { length: pagination.totalPages },
                      (_, i) => i + 1
                    )
                      .filter(
                        (p) =>
                          p === page ||
                          p === page - 1 ||
                          p === page + 1 ||
                          p === page - 2 ||
                          p === page + 2
                      )
                      .filter((p) => p >= 1 && p <= pagination.totalPages)
                      .map((p) => (
                        <Button
                          key={p}
                          variant={page === p ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setPage(p)}
                        >
                          {p}
                        </Button>
                      ))}

                    {/* 最後のページ */}
                    {page < pagination.totalPages - 2 && (
                      <>
                        {page < pagination.totalPages - 3 && (
                          <span className="px-2 text-muted-foreground">
                            ...
                          </span>
                        )}
                        <Button
                          variant={
                            page === pagination.totalPages
                              ? 'default'
                              : 'outline'
                          }
                          size="sm"
                          onClick={() => setPage(pagination.totalPages)}
                        >
                          {pagination.totalPages}
                        </Button>
                      </>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPage((p) => Math.min(pagination.totalPages, p + 1))
                    }
                    disabled={page === pagination.totalPages}
                  >
                    次へ
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
