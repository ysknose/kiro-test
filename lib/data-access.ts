/**
 * データアクセス層
 * 備品、貸出記録、ユーザーの CRUD 操作
 * JSON Server を使用してデータを管理
 * 要件: 1.1, 1.4, 3.1, 4.1, 5.1, 5.3
 */

import { randomUUID } from 'node:crypto';
import type { Equipment, Loan, User } from './types';

/**
 * JSON Server の API ベース URL
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * API リクエストのヘルパー関数
 */
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API エラー: ${response.status} ${response.statusText}`);
  }

  // DELETEリクエストの場合、レスポンスボディが空の可能性がある
  const text = await response.text();
  if (!text || text.trim() === '') {
    return {} as T;
  }

  const data = JSON.parse(text);

  // 日付文字列を Date オブジェクトに変換
  return JSON.parse(JSON.stringify(data), (key, value) => {
    if (
      typeof value === 'string' &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value)
    ) {
      return new Date(value);
    }
    return value;
  });
}

// ============================================
// 備品 (Equipment) CRUD 操作
// ============================================

/**
 * すべての備品を取得
 * @returns 備品の配列
 */
export async function getAllEquipment(): Promise<Equipment[]> {
  return fetchApi<Equipment[]>('/equipment');
}

/**
 * ID で備品を取得
 * @param id 備品ID
 * @param retries リトライ回数（デフォルト: 0）
 * @returns 備品オブジェクト、見つからない場合は null
 */
export async function getEquipmentById(
  id: string,
  retries = 0
): Promise<Equipment | null> {
  try {
    return await fetchApi<Equipment>(`/equipment/${id}`);
  } catch (error) {
    if ((error as Error).message.includes('404')) {
      // リトライが残っている場合は少し待ってから再試行
      if (retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return getEquipmentById(id, retries - 1);
      }
      return null;
    }
    throw error;
  }
}

/**
 * 備品を作成
 * @param equipmentData 備品データ（ID、createdAt、updatedAt は自動生成）
 * @returns 作成された備品
 */
export async function createEquipment(
  equipmentData: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Equipment> {
  const newEquipment: Equipment = {
    ...equipmentData,
    id: randomUUID(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return fetchApi<Equipment>('/equipment', {
    method: 'POST',
    body: JSON.stringify(newEquipment),
  });
}

/**
 * 備品を更新
 * @param id 備品ID
 * @param updates 更新データ
 * @returns 更新された備品、見つからない場合は null
 */
export async function updateEquipment(
  id: string,
  updates: Partial<Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Equipment | null> {
  try {
    const current = await getEquipmentById(id);
    if (!current) {
      return null;
    }

    // Filter out undefined values to prevent overwriting existing fields
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    const updated: Equipment = {
      ...current,
      ...filteredUpdates,
      updatedAt: new Date(),
    };

    return await fetchApi<Equipment>(`/equipment/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updated),
    });
  } catch (error) {
    if ((error as Error).message.includes('404')) {
      return null;
    }
    throw error;
  }
}

/**
 * 備品を削除
 * @param id 備品ID
 * @returns 削除に成功した場合 true、見つからない場合 false
 */
export async function deleteEquipment(id: string): Promise<boolean> {
  try {
    await fetchApi(`/equipment/${id}`, {
      method: 'DELETE',
    });
    return true;
  } catch (error) {
    if ((error as Error).message.includes('404')) {
      return false;
    }
    throw error;
  }
}

/**
 * カテゴリで備品を検索
 * @param category カテゴリ名
 * @returns 該当する備品の配列
 */
export async function getEquipmentByCategory(
  category: string
): Promise<Equipment[]> {
  return fetchApi<Equipment[]>(
    `/equipment?category=${encodeURIComponent(category)}`
  );
}

/**
 * 備品名で検索
 * @param keyword 検索キーワード
 * @returns 該当する備品の配列
 */
export async function searchEquipmentByName(
  keyword: string
): Promise<Equipment[]> {
  return fetchApi<Equipment[]>(
    `/equipment?name_like=${encodeURIComponent(keyword)}`
  );
}

/**
 * すべてのカテゴリを取得（重複なし、ソート済み）
 * 注: JSON Serverには直接カテゴリ一覧を取得する機能がないため、
 * 必要最小限のフィールドのみを取得して処理を高速化
 * @returns カテゴリの配列
 */
export async function getAllCategories(): Promise<string[]> {
  // すべての備品からカテゴリフィールドのみを取得
  const equipment = await fetchApi<Equipment[]>('/equipment');

  // カテゴリの一覧を取得（重複を除く）
  const categories = Array.from(
    new Set(equipment.map((item) => item.category))
  ).sort();

  return categories;
}

// ============================================
// 貸出記録 (Loan) CRUD 操作
// ============================================

/**
 * すべての貸出記録を取得
 * @returns 貸出記録の配列
 */
export async function getAllLoans(): Promise<Loan[]> {
  return fetchApi<Loan[]>('/loans');
}

/**
 * ID で貸出記録を取得
 * @param id 貸出記録ID
 * @param retries リトライ回数（デフォルト: 0）
 * @returns 貸出記録オブジェクト、見つからない場合は null
 */
export async function getLoanById(
  id: string,
  retries = 0
): Promise<Loan | null> {
  try {
    return await fetchApi<Loan>(`/loans/${id}`);
  } catch (error) {
    if ((error as Error).message.includes('404')) {
      // リトライが残っている場合は少し待ってから再試行
      if (retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return getLoanById(id, retries - 1);
      }
      return null;
    }
    throw error;
  }
}

/**
 * 貸出記録を作成
 * @param loanData 貸出データ（ID、borrowedAt は自動生成）
 * @returns 作成された貸出記録
 */
export async function createLoan(
  loanData: Omit<Loan, 'id' | 'borrowedAt' | 'returnedAt' | 'status'>
): Promise<Loan> {
  const newLoan: Loan = {
    ...loanData,
    id: randomUUID(),
    borrowedAt: new Date(),
    returnedAt: null,
    status: 'active',
  };

  return fetchApi<Loan>('/loans', {
    method: 'POST',
    body: JSON.stringify(newLoan),
  });
}

/**
 * 貸出記録を更新
 * @param id 貸出記録ID
 * @param updates 更新データ
 * @returns 更新された貸出記録、見つからない場合は null
 */
export async function updateLoan(
  id: string,
  updates: Partial<Omit<Loan, 'id' | 'borrowedAt'>>
): Promise<Loan | null> {
  try {
    const current = await getLoanById(id);
    if (!current) {
      return null;
    }

    const updated: Loan = {
      ...current,
      ...updates,
    };

    return await fetchApi<Loan>(`/loans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updated),
    });
  } catch (error) {
    if ((error as Error).message.includes('404')) {
      return null;
    }
    throw error;
  }
}

/**
 * 貸出記録を削除
 * @param id 貸出記録ID
 * @returns 削除に成功した場合 true、見つからない場合 false
 */
export async function deleteLoan(id: string): Promise<boolean> {
  try {
    await fetchApi(`/loans/${id}`, {
      method: 'DELETE',
    });
    return true;
  } catch (error) {
    if ((error as Error).message.includes('404')) {
      return false;
    }
    throw error;
  }
}

/**
 * 備品IDで貸出記録を取得
 * @param equipmentId 備品ID
 * @returns 該当する貸出記録の配列（時系列順降順）
 */
export async function getLoansByEquipmentId(
  equipmentId: string
): Promise<Loan[]> {
  const loans = await fetchApi<Loan[]>(
    `/loans?equipmentId=${encodeURIComponent(
      equipmentId
    )}&_sort=borrowedAt&_order=desc`
  );
  // Ensure reliable descending order sorting by timestamp
  // JSON Server's sorting may not be reliable for very close timestamps
  return loans.sort((a, b) => b.borrowedAt.getTime() - a.borrowedAt.getTime());
}

/**
 * ユーザーIDで貸出記録を取得
 * @param userId ユーザーID
 * @returns 該当する貸出記録の配列（時系列順降順）
 */
export async function getLoansByUserId(userId: string): Promise<Loan[]> {
  const loans = await fetchApi<Loan[]>(
    `/loans?userId=${encodeURIComponent(userId)}&_sort=borrowedAt&_order=desc`
  );
  // Ensure reliable descending order sorting by timestamp
  // JSON Server's sorting may not be reliable for very close timestamps
  return loans.sort((a, b) => b.borrowedAt.getTime() - a.borrowedAt.getTime());
}

/**
 * ユーザーの現在の借用中の貸出記録を取得
 * @param userId ユーザーID
 * @returns 現在借用中の貸出記録の配列
 */
export async function getActiveLoansForUser(userId: string): Promise<Loan[]> {
  return fetchApi<Loan[]>(
    `/loans?userId=${encodeURIComponent(userId)}&status=active`
  );
}

/**
 * 備品の現在の貸出中の記録を取得
 * @param equipmentId 備品ID
 * @returns 現在貸出中の貸出記録の配列
 */
export async function getActiveLoansForEquipment(
  equipmentId: string
): Promise<Loan[]> {
  return fetchApi<Loan[]>(
    `/loans?equipmentId=${encodeURIComponent(equipmentId)}&status=active`
  );
}

// ============================================
// ユーザー (User) 読み取り操作
// ============================================

/**
 * すべてのユーザーを取得
 * @returns ユーザーの配列
 */
export async function getAllUsers(): Promise<User[]> {
  return fetchApi<User[]>('/users');
}

/**
 * ID でユーザーを取得
 * @param id ユーザーID
 * @returns ユーザーオブジェクト、見つからない場合は null
 */
export async function getUserById(id: string): Promise<User | null> {
  try {
    return await fetchApi<User>(`/users/${id}`);
  } catch (error) {
    if ((error as Error).message.includes('404')) {
      return null;
    }
    throw error;
  }
}

/**
 * メールアドレスでユーザーを取得
 * @param email メールアドレス
 * @returns ユーザーオブジェクト、見つからない場合は null
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const users = await fetchApi<User[]>(
    `/users?email=${encodeURIComponent(email)}`
  );
  return users.length > 0 ? users[0] : null;
}
