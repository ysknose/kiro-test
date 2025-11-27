'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import type { Equipment } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { EquipmentForm } from '@/components/equipment-form';
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

  return {
    ...data,
    purchaseDate: new Date(data.purchaseDate),
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
  };
}

/**
 * 備品更新用のデータ型
 */
type UpdateEquipmentData = {
  name: string;
  category: string;
  description: string;
  totalQuantity: number;
  purchaseDate: string;
  usefulLife?: number;
};

/**
 * 備品を更新する関数
 */
async function updateEquipment(
  id: string,
  data: UpdateEquipmentData
): Promise<void> {
  const response = await fetch(`/api/equipment/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...data,
      purchaseDate: new Date(data.purchaseDate).toISOString(),
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || '備品の更新に失敗しました');
  }
}

/**
 * 備品編集ページ
 * 要件: 5.1
 */
export default function EditEquipmentPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const equipmentId = params.id as string;

  // 備品詳細の取得
  const {
    data: equipment,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['equipment', equipmentId],
    queryFn: () => fetchEquipmentDetail(equipmentId),
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateEquipmentData) =>
      updateEquipment(equipmentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment', equipmentId] });
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      toast.success('備品情報を更新しました');
      router.push(`/equipment/${equipmentId}`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = async (data: UpdateEquipmentData) => {
    await updateMutation.mutateAsync(data);
  };

  const handleCancel = () => {
    router.back();
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
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      {/* 戻るボタン */}
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        <ArrowLeft />
        戻る
      </Button>

      {/* フォーム */}
      <EquipmentForm
        equipment={equipment}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={updateMutation.isPending}
      />
    </div>
  );
}
