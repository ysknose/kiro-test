'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EquipmentForm } from '@/components/equipment-form';
import { toast } from 'sonner';

/**
 * 備品作成用のデータ型
 */
type CreateEquipmentData = {
  name: string;
  category: string;
  description: string;
  totalQuantity: number;
  purchaseDate: string;
  usefulLife?: number;
};

/**
 * 備品を作成する関数
 */
async function createEquipment(data: CreateEquipmentData): Promise<void> {
  const response = await fetch('/api/equipment', {
    method: 'POST',
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
    throw new Error(error.error?.message || '備品の登録に失敗しました');
  }
}

/**
 * 備品登録ページ
 * 要件: 1.1, 1.2, 1.5
 */
export default function NewEquipmentPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createEquipment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      toast.success('備品を登録しました');
      router.push('/equipment');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = async (data: CreateEquipmentData) => {
    await createMutation.mutateAsync(data);
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      {/* 戻るボタン */}
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        <ArrowLeft />
        戻る
      </Button>

      {/* フォーム */}
      <EquipmentForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={createMutation.isPending}
      />
    </div>
  );
}
