import { test, expect } from '@playwright/test';

/**
 * E2Eテスト: 備品管理フロー
 * 備品登録から検索、貸出、返却までの一連の流れをテスト
 * 要件: 1.1, 2.1, 2.2, 2.3, 2.4, 3.1, 4.1
 */

test.describe('備品管理フロー', () => {
  test.beforeEach(async ({ page }) => {
    // ホームページに移動
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('備品登録から検索、貸出、返却までの完全なフロー', async ({ page }) => {
    // ステップ1: 備品一覧ページに移動
    await page.click('text=備品一覧を見る');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/equipment');

    // ステップ2: 新規備品を登録（要件: 1.1）
    await page.click('text=新規登録');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/equipment/new');

    // フォームに入力
    const testEquipmentName = `テストノートPC_${Date.now()}`;
    await page.fill('input[name="name"]', testEquipmentName);
    await page.fill('input[name="category"]', 'ノートPC');
    await page.fill(
      'textarea[name="description"]',
      'E2Eテスト用のノートPCです'
    );
    await page.fill('input[name="totalQuantity"]', '3');
    await page.fill('input[name="purchaseDate"]', '2024-01-15');
    await page.fill('input[name="usefulLife"]', '5');

    // 登録ボタンをクリック
    await page.click('button[type="submit"]');

    // トースト通知を確認
    await expect(page.locator('text=備品を登録しました')).toBeVisible({
      timeout: 5000,
    });

    // 備品一覧ページにリダイレクトされることを確認
    await page.waitForURL('/equipment', { timeout: 5000 });

    // ステップ3: 登録した備品を検索（要件: 2.3）
    await page.fill('input[placeholder*="備品名で検索"]', testEquipmentName);
    await page.waitForTimeout(500); // デバウンス待機

    // 検索結果に登録した備品が表示されることを確認
    await expect(page.locator(`text=${testEquipmentName}`)).toBeVisible();

    // ステップ4: カテゴリフィルタリング（要件: 2.2）
    await page.click('button[role="combobox"]');
    await page.click('text=ノートPC');
    await page.waitForTimeout(500);

    // フィルタリング結果を確認
    await expect(page.locator(`text=${testEquipmentName}`)).toBeVisible();

    // ステップ5: 備品詳細ページに移動（要件: 2.4）
    await page.click(`text=${testEquipmentName}`);
    await page.waitForLoadState('networkidle');

    // 詳細情報が表示されることを確認
    await expect(
      page.locator(`h1:has-text("${testEquipmentName}")`)
    ).toBeVisible();
    await expect(page.locator('text=ノートPC')).toBeVisible();
    await expect(page.locator('text=E2Eテスト用のノートPCです')).toBeVisible();
    await expect(page.locator('text=3')).toBeVisible(); // 在庫数

    // ステップ6: 備品を借りる（要件: 3.1）
    const loanButton = page.locator('button:has-text("この備品を借りる")');
    await expect(loanButton).toBeEnabled();
    await loanButton.click();

    // トースト通知を確認
    await expect(page.locator('text=備品を借りました')).toBeVisible({
      timeout: 5000,
    });

    // 在庫数が減少していることを確認（3 → 2）
    await page.waitForTimeout(1000); // データ更新待機
    await expect(page.locator('text=2')).toBeVisible();

    // 返却ボタンが表示されることを確認
    await expect(
      page.locator('button:has-text("この備品を返却する")')
    ).toBeVisible();

    // ステップ7: マイページで借用状況を確認（要件: 7.1, 7.3）
    await page.goto('/loans/my-loans');
    await page.waitForLoadState('networkidle');

    // 借りた備品が表示されることを確認
    await expect(page.locator(`text=${testEquipmentName}`)).toBeVisible();
    await expect(page.locator('text=ノートPC')).toBeVisible();
    await expect(page.locator('text=貸出日')).toBeVisible();

    // ステップ8: マイページから返却（要件: 4.1, 7.2）
    const returnButton = page.locator('button:has-text("返却する")').first();
    await expect(returnButton).toBeEnabled();
    await returnButton.click();

    // トースト通知を確認
    await expect(page.locator('text=備品を返却しました')).toBeVisible({
      timeout: 5000,
    });

    // 空状態のメッセージが表示されることを確認（要件: 7.2）
    await expect(
      page.locator('text=現在借りている備品はありません')
    ).toBeVisible({ timeout: 5000 });

    // ステップ9: 備品詳細ページで在庫が戻っていることを確認
    await page.goto('/equipment');
    await page.waitForLoadState('networkidle');
    await page.fill('input[placeholder*="備品名で検索"]', testEquipmentName);
    await page.waitForTimeout(500);
    await page.click(`text=${testEquipmentName}`);
    await page.waitForLoadState('networkidle');

    // 在庫数が元に戻っていることを確認（2 → 3）
    await expect(page.locator('text=3')).toBeVisible();
    await expect(
      page.locator('button:has-text("この備品を借りる")')
    ).toBeVisible();
  });

  test('複数回の貸出と返却', async ({ page }) => {
    // 備品一覧ページに移動
    await page.goto('/equipment');
    await page.waitForLoadState('networkidle');

    // 新規備品を登録
    await page.click('text=新規登録');
    await page.waitForLoadState('networkidle');

    const testEquipmentName = `テストマウス_${Date.now()}`;
    await page.fill('input[name="name"]', testEquipmentName);
    await page.fill('input[name="category"]', '周辺機器');
    await page.fill('textarea[name="description"]', 'E2Eテスト用のマウス');
    await page.fill('input[name="totalQuantity"]', '5');
    await page.fill('input[name="purchaseDate"]', '2024-02-01');

    await page.click('button[type="submit"]');
    await expect(page.locator('text=備品を登録しました')).toBeVisible({
      timeout: 5000,
    });

    // 備品詳細ページに移動
    await page.fill('input[placeholder*="備品名で検索"]', testEquipmentName);
    await page.waitForTimeout(500);
    await page.click(`text=${testEquipmentName}`);
    await page.waitForLoadState('networkidle');

    // 1回目の貸出
    await page.click('button:has-text("この備品を借りる")');
    await expect(page.locator('text=備品を借りました')).toBeVisible({
      timeout: 5000,
    });
    await page.waitForTimeout(1000);
    await expect(page.locator('text=4')).toBeVisible(); // 5 → 4

    // 1回目の返却
    await page.click('button:has-text("この備品を返却する")');
    await expect(page.locator('text=備品を返却しました')).toBeVisible({
      timeout: 5000,
    });
    await page.waitForTimeout(1000);
    await expect(page.locator('text=5')).toBeVisible(); // 4 → 5

    // 2回目の貸出
    await page.click('button:has-text("この備品を借りる")');
    await expect(page.locator('text=備品を借りました')).toBeVisible({
      timeout: 5000,
    });
    await page.waitForTimeout(1000);
    await expect(page.locator('text=4')).toBeVisible(); // 5 → 4

    // 2回目の返却
    await page.click('button:has-text("この備品を返却する")');
    await expect(page.locator('text=備品を返却しました')).toBeVisible({
      timeout: 5000,
    });
    await page.waitForTimeout(1000);
    await expect(page.locator('text=5')).toBeVisible(); // 4 → 5
  });

  test('貸出履歴の確認', async ({ page }) => {
    // 備品を登録
    await page.goto('/equipment/new');
    await page.waitForLoadState('networkidle');

    const testEquipmentName = `テストキーボード_${Date.now()}`;
    await page.fill('input[name="name"]', testEquipmentName);
    await page.fill('input[name="category"]', '周辺機器');
    await page.fill('textarea[name="description"]', 'E2Eテスト用のキーボード');
    await page.fill('input[name="totalQuantity"]', '2');
    await page.fill('input[name="purchaseDate"]', '2024-03-01');

    await page.click('button[type="submit"]');
    await expect(page.locator('text=備品を登録しました')).toBeVisible({
      timeout: 5000,
    });

    // 備品を借りる
    await page.fill('input[placeholder*="備品名で検索"]', testEquipmentName);
    await page.waitForTimeout(500);
    await page.click(`text=${testEquipmentName}`);
    await page.waitForLoadState('networkidle');

    await page.click('button:has-text("この備品を借りる")');
    await expect(page.locator('text=備品を借りました')).toBeVisible({
      timeout: 5000,
    });

    // 貸出履歴ページに移動（要件: 6.1, 6.4）
    await page.goto('/loans');
    await page.waitForLoadState('networkidle');

    // 貸出記録が表示されることを確認
    await expect(page.locator(`text=${testEquipmentName}`)).toBeVisible();
    await expect(page.locator('text=テストユーザー1')).toBeVisible();
    await expect(page.locator('text=貸出中')).toBeVisible();
  });
});
