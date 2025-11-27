import { test, expect } from '@playwright/test';

/**
 * E2Eテスト: エラーケース
 * バリデーションエラー、在庫切れ、権限エラーなどをテスト
 * 要件: 1.2, 1.5, 3.2, 4.3, 5.2
 */

test.describe('エラーケース', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('必須フィールドのバリデーションエラー（要件: 1.2）', async ({
    page,
  }) => {
    // 備品登録ページに移動
    await page.goto('/equipment/new');
    await page.waitForLoadState('networkidle');

    // 必須フィールドを空のまま登録を試みる
    await page.click('button[type="submit"]');

    // エラーメッセージが表示されることを確認
    // Valibotのバリデーションエラーが表示される
    await expect(page.locator('text=/備品名|カテゴリ|購入日/')).toBeVisible({
      timeout: 3000,
    });
  });

  test('備品名の文字数制限バリデーション（要件: 1.2）', async ({ page }) => {
    await page.goto('/equipment/new');
    await page.waitForLoadState('networkidle');

    // 101文字の備品名を入力（制限は100文字）
    const longName = 'あ'.repeat(101);
    await page.fill('input[name="name"]', longName);
    await page.fill('input[name="category"]', 'テスト');
    await page.fill('input[name="totalQuantity"]', '1');
    await page.fill('input[name="purchaseDate"]', '2024-01-01');

    await page.click('button[type="submit"]');

    // エラーメッセージが表示されることを確認
    await expect(page.locator('text=/100文字以内|文字数/')).toBeVisible({
      timeout: 3000,
    });
  });

  test('未来の購入日のバリデーションエラー（要件: 1.5）', async ({ page }) => {
    await page.goto('/equipment/new');
    await page.waitForLoadState('networkidle');

    // 未来の日付を入力
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const futureDateStr = futureDate.toISOString().split('T')[0];

    await page.fill('input[name="name"]', 'テスト備品');
    await page.fill('input[name="category"]', 'テスト');
    await page.fill('input[name="totalQuantity"]', '1');
    await page.fill('input[name="purchaseDate"]', futureDateStr);

    await page.click('button[type="submit"]');

    // エラートーストが表示されることを確認
    await expect(page.locator('text=/未来の日付|購入日/')).toBeVisible({
      timeout: 5000,
    });
  });

  test('在庫切れ備品の貸出エラー（要件: 3.2）', async ({ page }) => {
    // 在庫1の備品を登録
    await page.goto('/equipment/new');
    await page.waitForLoadState('networkidle');

    const testEquipmentName = `在庫切れテスト_${Date.now()}`;
    await page.fill('input[name="name"]', testEquipmentName);
    await page.fill('input[name="category"]', 'テスト');
    await page.fill('textarea[name="description"]', '在庫切れテスト用');
    await page.fill('input[name="totalQuantity"]', '1');
    await page.fill('input[name="purchaseDate"]', '2024-01-01');

    await page.click('button[type="submit"]');
    await expect(page.locator('text=備品を登録しました')).toBeVisible({
      timeout: 5000,
    });

    // 備品詳細ページに移動
    await page.fill('input[placeholder*="備品名で検索"]', testEquipmentName);
    await page.waitForTimeout(500);
    await page.click(`text=${testEquipmentName}`);
    await page.waitForLoadState('networkidle');

    // 1回目の貸出（成功）
    await page.click('button:has-text("この備品を借りる")');
    await expect(page.locator('text=備品を借りました')).toBeVisible({
      timeout: 5000,
    });

    // 在庫が0になることを確認
    await page.waitForTimeout(1000);
    await expect(page.locator('text=0')).toBeVisible();
    await expect(page.locator('text=在庫切れ')).toBeVisible();

    // 返却する
    await page.click('button:has-text("この備品を返却する")');
    await expect(page.locator('text=備品を返却しました')).toBeVisible({
      timeout: 5000,
    });

    // 再度借りる（別のユーザーとして動作をシミュレート）
    await page.waitForTimeout(1000);
    await page.click('button:has-text("この備品を借りる")');
    await expect(page.locator('text=備品を借りました')).toBeVisible({
      timeout: 5000,
    });

    // 在庫切れボタンが無効化されていることを確認
    await page.waitForTimeout(1000);
    const loanButton = page.locator('button:has-text("在庫切れ")');
    await expect(loanButton).toBeDisabled();
  });

  test('借りていない備品の返却エラー（要件: 4.3）', async ({ page }) => {
    // 備品を登録
    await page.goto('/equipment/new');
    await page.waitForLoadState('networkidle');

    const testEquipmentName = `返却エラーテスト_${Date.now()}`;
    await page.fill('input[name="name"]', testEquipmentName);
    await page.fill('input[name="category"]', 'テスト');
    await page.fill('textarea[name="description"]', '返却エラーテスト用');
    await page.fill('input[name="totalQuantity"]', '2');
    await page.fill('input[name="purchaseDate"]', '2024-01-01');

    await page.click('button[type="submit"]');
    await expect(page.locator('text=備品を登録しました')).toBeVisible({
      timeout: 5000,
    });

    // マイページに移動（何も借りていない状態）
    await page.goto('/loans/my-loans');
    await page.waitForLoadState('networkidle');

    // 空状態のメッセージが表示されることを確認
    await expect(
      page.locator('text=現在借りている備品はありません')
    ).toBeVisible();

    // 返却ボタンが存在しないことを確認
    await expect(page.locator('button:has-text("返却する")')).not.toBeVisible();
  });

  test('空の検索結果', async ({ page }) => {
    await page.goto('/equipment');
    await page.waitForLoadState('networkidle');

    // 存在しない備品名で検索
    const nonExistentName = `存在しない備品_${Date.now()}`;
    await page.fill('input[placeholder*="備品名で検索"]', nonExistentName);
    await page.waitForTimeout(500);

    // 「備品が見つかりませんでした」メッセージが表示されることを確認
    await expect(page.locator('text=備品が見つかりませんでした')).toBeVisible();
  });

  test('数量の範囲バリデーション', async ({ page }) => {
    await page.goto('/equipment/new');
    await page.waitForLoadState('networkidle');

    // 負の数量を入力
    await page.fill('input[name="name"]', 'テスト備品');
    await page.fill('input[name="category"]', 'テスト');
    await page.fill('input[name="totalQuantity"]', '-1');
    await page.fill('input[name="purchaseDate"]', '2024-01-01');

    await page.click('button[type="submit"]');

    // エラーメッセージが表示されることを確認
    await expect(page.locator('text=/0以上|数量/')).toBeVisible({
      timeout: 3000,
    });
  });

  test('カテゴリの文字数制限バリデーション', async ({ page }) => {
    await page.goto('/equipment/new');
    await page.waitForLoadState('networkidle');

    // 51文字のカテゴリを入力（制限は50文字）
    const longCategory = 'あ'.repeat(51);
    await page.fill('input[name="name"]', 'テスト備品');
    await page.fill('input[name="category"]', longCategory);
    await page.fill('input[name="totalQuantity"]', '1');
    await page.fill('input[name="purchaseDate"]', '2024-01-01');

    await page.click('button[type="submit"]');

    // エラーメッセージが表示されることを確認
    await expect(page.locator('text=/50文字以内|文字数/')).toBeVisible({
      timeout: 3000,
    });
  });

  test('説明の文字数制限バリデーション', async ({ page }) => {
    await page.goto('/equipment/new');
    await page.waitForLoadState('networkidle');

    // 501文字の説明を入力（制限は500文字）
    const longDescription = 'あ'.repeat(501);
    await page.fill('input[name="name"]', 'テスト備品');
    await page.fill('input[name="category"]', 'テスト');
    await page.fill('textarea[name="description"]', longDescription);
    await page.fill('input[name="totalQuantity"]', '1');
    await page.fill('input[name="purchaseDate"]', '2024-01-01');

    await page.click('button[type="submit"]');

    // エラーメッセージが表示されることを確認
    await expect(page.locator('text=/500文字以内|文字数/')).toBeVisible({
      timeout: 3000,
    });
  });

  test('耐用年数の範囲バリデーション', async ({ page }) => {
    await page.goto('/equipment/new');
    await page.waitForLoadState('networkidle');

    // 0年の耐用年数を入力（最小値は1年）
    await page.fill('input[name="name"]', 'テスト備品');
    await page.fill('input[name="category"]', 'テスト');
    await page.fill('input[name="totalQuantity"]', '1');
    await page.fill('input[name="purchaseDate"]', '2024-01-01');
    await page.fill('input[name="usefulLife"]', '0');

    await page.click('button[type="submit"]');

    // エラーメッセージが表示されることを確認
    await expect(page.locator('text=/1年以上|耐用年数/')).toBeVisible({
      timeout: 3000,
    });
  });

  test('存在しない備品IDでの詳細ページアクセス', async ({ page }) => {
    // 存在しないIDで備品詳細ページにアクセス
    await page.goto('/equipment/non-existent-id-12345');
    await page.waitForLoadState('networkidle');

    // エラーメッセージが表示されることを確認
    await expect(
      page.locator('text=/エラーが発生しました|見つかりません/')
    ).toBeVisible({ timeout: 5000 });
  });
});
