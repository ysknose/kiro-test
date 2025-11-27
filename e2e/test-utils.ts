import type { Page } from '@playwright/test';

/**
 * E2Eテスト用のユーティリティ関数
 */

/**
 * テストデータをリセットする
 */
export async function resetTestData(page: Page) {
  // JSON Serverのデータをリセット
  // 本番環境では専用のテストデータベースを使用することを推奨
  const baseData = {
    equipment: [],
    loans: [],
    users: [
      {
        id: 'user-1',
        name: 'テストユーザー1',
        email: 'test1@example.com',
        role: 'user',
      },
      {
        id: 'admin-1',
        name: '管理者',
        email: 'admin@example.com',
        role: 'admin',
      },
    ],
  };

  // データをリセット（APIを通じて）
  await page.request.post('http://localhost:3001/reset', {
    data: baseData,
  });
}

/**
 * ホームページに移動
 */
export async function goToHome(page: Page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
}

/**
 * 備品一覧ページに移動
 */
export async function goToEquipmentList(page: Page) {
  await page.goto('/equipment');
  await page.waitForLoadState('networkidle');
}

/**
 * 備品を登録する
 */
export async function createEquipment(
  page: Page,
  equipment: {
    name: string;
    category: string;
    description: string;
    totalQuantity: number;
    purchaseDate: string;
  }
) {
  await page.goto('/equipment/new');
  await page.waitForLoadState('networkidle');

  await page.fill('input[name="name"]', equipment.name);
  await page.fill('input[name="category"]', equipment.category);
  await page.fill('textarea[name="description"]', equipment.description);
  await page.fill(
    'input[name="totalQuantity"]',
    equipment.totalQuantity.toString()
  );
  await page.fill('input[name="purchaseDate"]', equipment.purchaseDate);

  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
}

/**
 * トースト通知が表示されるのを待つ
 */
export async function waitForToast(page: Page, message?: string) {
  const toast = page.locator('[data-sonner-toast]');
  await toast.waitFor({ state: 'visible', timeout: 5000 });

  if (message) {
    await toast.filter({ hasText: message }).waitFor({ state: 'visible' });
  }

  return toast;
}
