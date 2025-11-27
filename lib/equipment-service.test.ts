/**
 * Equipment Service Tests
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import * as fc from 'fast-check';
import {
  createEquipment,
  updateEquipment,
  deleteEquipment,
  calculateAvailableQuantity,
} from './equipment-service';
import { deleteEquipment as deleteEquipmentData } from './data-access';
import type { Equipment } from './types';
import { description } from 'valibot';

// Mock data
const validEquipmentInput = {
  name: 'Test Laptop',
  category: 'PC',
  description: 'Test laptop for testing',
  totalQuantity: 5,
  purchaseDate: new Date('2024-01-01'),
  usefulLife: 5,
};

describe('Equipment Service', () => {
  // Track created IDs for cleanup
  const createdIds: string[] = [];

  afterEach(async () => {
    // Cleanup after tests (parallel execution for speed)
    const deletions = createdIds.map((id) =>
      deleteEquipmentData(id).catch(() => {
        /* Ignore errors */
      })
    );
    await Promise.all(deletions);
    createdIds.length = 0;
  });

  describe('createEquipment', () => {
    test('Can create equipment with valid data', async () => {
      const result = await createEquipment(validEquipmentInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe(validEquipmentInput.name);
        expect(result.data.category).toBe(validEquipmentInput.category);
        expect(result.data.totalQuantity).toBe(
          validEquipmentInput.totalQuantity
        );
        expect(result.data.availableQuantity).toBe(
          validEquipmentInput.totalQuantity
        );
        expect(result.data.id).toBeDefined();
        expect(result.data.createdAt).toBeInstanceOf(Date);
        expect(result.data.updatedAt).toBeInstanceOf(Date);
      }
    });

    test('備品名が空の場合�Eエラーを返す', async () => {
      const result = await createEquipment({
        ...validEquipmentInput,
        name: '',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    test('備品名が空白のみの場合�Eエラーを返す', async () => {
      const result = await createEquipment({
        ...validEquipmentInput,
        name: '   ',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    test('Returns error when category is empty', async () => {
      const result = await createEquipment({
        ...validEquipmentInput,
        category: '',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });
  });

  describe('calculateAvailableQuantity', () => {
    test('備品の利用可能数量を返す', () => {
      const equipment: Equipment = {
        id: '123',
        name: 'Test Equipment',
        category: 'Test',
        description: '',
        totalQuantity: 10,
        availableQuantity: 7,
        purchaseDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const available = calculateAvailableQuantity(equipment);
      expect(available).toBe(7);
    });
  });

  /**
   * Feature: company-equipment-management, Property 1: 備品登録の完�E性
   * Validates: Requirements 1.1, 1.3
   *
   * Property: For any valid equipment data (name, category, quantity, description),
   * when the registration process is executed, a new equipment record should be created
   * with a unique ID assigned and the registration date/time recorded.
   */
  describe('Property 1: Equipment registration completeness', () => {
    test('creates equipment with unique ID and timestamps for any valid input', async () => {
      // Generator for valid equipment data
      // Note: purchaseDate is set to at least 1 day in the past to avoid timing issues
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const validEquipmentArb = fc.record({
        name: fc
          .string({ minLength: 2, maxLength: 100 })
          .filter(
            (s) =>
              s.trim().length >= 2 &&
              /^[a-zA-Z0-9\u3042-\u3093\u30A2-\u30F3 ]+$/.test(s)
          ),
        category: fc
          .string({ minLength: 2, maxLength: 50 })
          .filter(
            (s) =>
              s.trim().length >= 2 &&
              /^[a-zA-Z0-9\u3042-\u3093\u30A2-\u30F3 ]+$/.test(s)
          ),
        description: fc.string({ maxLength: 500 }),
        totalQuantity: fc.integer({ min: 1, max: 100 }),
        purchaseDate: fc.date({
          min: new Date('2000-01-01'),
          max: oneDayAgo,
        }),
        usefulLife: fc.option(fc.integer({ min: 1, max: 100 }), {
          nil: undefined,
        }),
      });

      await fc.assert(
        fc.asyncProperty(validEquipmentArb, async (equipmentData) => {
          // Execute registration process
          const result = await createEquipment(equipmentData);

          // Should succeed
          expect(result.success).toBe(true);

          if (result.success) {
            const equipment = result.data;

            // Track for cleanup
            createdIds.push(equipment.id);

            // 1. A new equipment record should be created
            expect(equipment).toBeDefined();

            // 2. A unique ID should be assigned
            expect(equipment.id).toBeDefined();
            expect(typeof equipment.id).toBe('string');
            expect(equipment.id.length).toBeGreaterThan(0);

            // 3. Registration date/time should be recorded (createdAt)
            expect(equipment.createdAt).toBeInstanceOf(Date);
            expect(equipment.createdAt.getTime()).toBeLessThanOrEqual(
              Date.now()
            );

            // 4. Updated date/time should also be recorded (updatedAt)
            expect(equipment.updatedAt).toBeInstanceOf(Date);
            expect(equipment.updatedAt.getTime()).toBeLessThanOrEqual(
              Date.now()
            );

            // 5. Input data should be preserved (note: name and category are trimmed by validation)
            expect(equipment.name).toBe(equipmentData.name.trim());
            expect(equipment.category).toBe(equipmentData.category.trim());
            expect(equipment.description).toBe(equipmentData.description);
            expect(equipment.totalQuantity).toBe(equipmentData.totalQuantity);
            expect(equipment.purchaseDate.getTime()).toBe(
              equipmentData.purchaseDate.getTime()
            );
            expect(equipment.usefulLife).toBe(equipmentData.usefulLife);

            // 6. Available quantity should be initialized to total quantity
            expect(equipment.availableQuantity).toBe(
              equipmentData.totalQuantity
            );
          }
        }),
        { numRuns: 5 }
      );
    });
  });

  /**
   * Feature: company-equipment-management, Property 11: 備品更新の永続化
   * Validates: Requirements 5.1
   *
   * Property: For any existing equipment and update data, when the update process is executed
   * and then retrieved, the updated data should be returned and the updatedAt field should be updated.
   */
  describe('Property 11: Equipment update persistence', () => {
    test('persists equipment updates and updates the updatedAt field', async () => {
      // Generator for valid equipment data
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const validEquipmentArb = fc.record({
        name: fc
          .string({ minLength: 2, maxLength: 100 })
          .filter(
            (s) =>
              s.trim().length >= 2 &&
              /^[a-zA-Z0-9\u3042-\u3093\u30A2-\u30F3 ]+$/.test(s)
          ),
        category: fc
          .string({ minLength: 2, maxLength: 50 })
          .filter(
            (s) =>
              s.trim().length >= 2 &&
              /^[a-zA-Z0-9\u3042-\u3093\u30A2-\u30F3 ]+$/.test(s)
          ),
        description: fc.string({ maxLength: 500 }),
        totalQuantity: fc.integer({ min: 1, max: 100 }),
        purchaseDate: fc.date({
          min: new Date('2000-01-01'),
          max: oneDayAgo,
        }),
        usefulLife: fc.option(fc.integer({ min: 1, max: 100 }), {
          nil: undefined,
        }),
      });

      // Generator for partial update data
      const updateDataArb = fc.record(
        {
          name: fc.option(
            fc
              .string({ minLength: 1, maxLength: 100 })
              .filter((s) => s.trim().length > 0),
            { nil: undefined }
          ),
          category: fc.option(
            fc
              .string({ minLength: 1, maxLength: 50 })
              .filter((s) => s.trim().length > 0),
            { nil: undefined }
          ),
          description: fc.option(fc.string({ maxLength: 500 }), {
            nil: undefined,
          }),
          totalQuantity: fc.option(fc.integer({ min: 0, max: 10000 }), {
            nil: undefined,
          }),
          purchaseDate: fc.option(
            fc.date({
              min: new Date('1900-01-01'),
              max: oneDayAgo,
            }),
            { nil: undefined }
          ),
          usefulLife: fc.option(fc.integer({ min: 1, max: 100 }), {
            nil: undefined,
          }),
        },
        { requiredKeys: [] }
      );

      await fc.assert(
        fc.asyncProperty(
          validEquipmentArb,
          updateDataArb,
          async (equipmentData, updateData) => {
            // 1. Create initial equipment
            const createResult = await createEquipment(equipmentData);
            expect(createResult.success).toBe(true);
            if (!createResult.success) return;

            const original = createResult.data;
            createdIds.push(original.id);

            // Store original updatedAt for comparison
            const originalUpdatedAt = original.updatedAt.getTime();

            // Wait a small amount to ensure updatedAt will be different
            await new Promise((resolve) => setTimeout(resolve, 10));

            // 2. Update the equipment
            const updateResult = await updateEquipment(original.id, updateData);
            expect(updateResult.success).toBe(true);
            if (!updateResult.success) return;

            const updated = updateResult.data;

            // 3. Retrieve the equipment to verify persistence (with retry)
            const { getEquipmentById } = await import('./data-access');
            const retrieved = await getEquipmentById(original.id, 3);
            expect(retrieved).not.toBeNull();
            if (!retrieved) return;

            // 4. Verify that updated data is persisted
            // Check each field that was updated
            if (updateData.name !== undefined) {
              expect(retrieved.name).toBe(updateData.name.trim());
            } else {
              expect(retrieved.name).toBe(original.name);
            }

            if (updateData.category !== undefined) {
              expect(retrieved.category).toBe(updateData.category.trim());
            } else {
              expect(retrieved.category).toBe(original.category);
            }

            if (updateData.description !== undefined) {
              expect(retrieved.description).toBe(updateData.description);
            } else {
              expect(retrieved.description).toBe(original.description);
            }

            if (updateData.totalQuantity !== undefined) {
              expect(retrieved.totalQuantity).toBe(updateData.totalQuantity);
            } else {
              expect(retrieved.totalQuantity).toBe(original.totalQuantity);
            }

            if (updateData.purchaseDate !== undefined) {
              expect(retrieved.purchaseDate.getTime()).toBe(
                updateData.purchaseDate.getTime()
              );
            } else {
              expect(retrieved.purchaseDate.getTime()).toBe(
                original.purchaseDate.getTime()
              );
            }

            if (updateData.usefulLife !== undefined) {
              expect(retrieved.usefulLife).toBe(updateData.usefulLife);
            } else {
              expect(retrieved.usefulLife).toBe(original.usefulLife);
            }

            // 5. Verify that updatedAt field was updated
            expect(retrieved.updatedAt).toBeInstanceOf(Date);
            expect(retrieved.updatedAt.getTime()).toBeGreaterThan(
              originalUpdatedAt
            );

            // 6. Verify that other fields remain unchanged
            expect(retrieved.id).toBe(original.id);
            expect(retrieved.createdAt.getTime()).toBe(
              original.createdAt.getTime()
            );
          }
        ),
        { numRuns: 50, timeout: 10000 }
      );
    });
  });

  /**
   * Feature: company-equipment-management, Property 12: 貸出中備品の削除制紁E
   * Validates: Requirements 5.2
   *
   * Property: For any equipment currently on loan (with active loan records where status='active'),
   * attempting to delete it should be rejected and return a warning message.
   */
  describe('Property 12: Deletion constraint for equipment on loan', () => {
    test('rejects deletion of equipment with active loans', async () => {
      // Import necessary functions
      const { borrowEquipment } = await import('./loan-service');
      const { createLoan: createLoanData } = await import('./data-access');
      const { randomUUID } = await import('node:crypto');

      // Generator for valid equipment data with at least quantity 1
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const validEquipmentArb = fc.record({
        name: fc
          .string({ minLength: 2, maxLength: 100 })
          .filter(
            (s) =>
              s.trim().length >= 2 &&
              /^[a-zA-Z0-9\u3042-\u3093\u30A2-\u30F3 ]+$/.test(s)
          ),
        category: fc
          .string({ minLength: 2, maxLength: 50 })
          .filter(
            (s) =>
              s.trim().length >= 2 &&
              /^[a-zA-Z0-9\u3042-\u3093\u30A2-\u30F3 ]+$/.test(s)
          ),
        description: fc.string({ maxLength: 500 }),
        totalQuantity: fc.integer({ min: 1, max: 100 }), // At least 1 to allow borrowing
        purchaseDate: fc.date({
          min: new Date('2000-01-01'),
          max: oneDayAgo,
        }),
        usefulLife: fc.option(fc.integer({ min: 1, max: 100 }), {
          nil: undefined,
        }),
      });

      await fc.assert(
        fc.asyncProperty(validEquipmentArb, async (equipmentData) => {
          // 1. Create equipment
          const createResult = await createEquipment(equipmentData);
          expect(createResult.success).toBe(true);
          if (!createResult.success) return;

          const equipment = createResult.data;
          createdIds.push(equipment.id);

          // 2. Create an active loan for this equipment
          const userId = randomUUID();
          const borrowResult = await borrowEquipment({
            equipmentId: equipment.id,
            userId: userId,
          });

          expect(borrowResult.success).toBe(true);
          if (!borrowResult.success) return;

          const loan = borrowResult.data;

          // 3. Attempt to delete the equipment while it has an active loan
          const deleteResult = await deleteEquipment(equipment.id);

          // 4. Deletion should be rejected
          expect(deleteResult.success).toBe(false);

          if (!deleteResult.success) {
            // 5. Should return a business rule violation error
            expect(deleteResult.error.code).toBe('BUSINESS_RULE_VIOLATION');

            // 6. Should return a warning message
            expect(deleteResult.error.message).toBeDefined();
            expect(typeof deleteResult.error.message).toBe('string');
            expect(deleteResult.error.message.length).toBeGreaterThan(0);

            // 7. Message should indicate the equipment is on loan
            expect(deleteResult.error.message).toContain('貸出中');
          }

          // Cleanup: Delete the loan so we can clean up the equipment later
          const { deleteLoan } = await import('./data-access');
          await deleteLoan(loan.id);
        }),
        { numRuns: 5 }
      );
    });
  });

  /**
   * Feature: company-equipment-management, Property 13: 備品削除の完�E性
   * Validates: Requirements 5.3
   *
   * Property: For any equipment that is not on loan, when the deletion process is executed
   * and then retrieval is attempted, an equipment not found error should be returned.
   */
  describe('Property 13: Equipment deletion completeness', () => {
    test('successfully deletes equipment not on loan and returns not found on retrieval', async () => {
      // Generator for valid equipment data
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const validEquipmentArb = fc.record({
        name: fc
          .string({ minLength: 2, maxLength: 100 })
          .filter(
            (s) =>
              s.trim().length >= 2 &&
              /^[a-zA-Z0-9\u3042-\u3093\u30A2-\u30F3 ]+$/.test(s)
          ),
        category: fc
          .string({ minLength: 2, maxLength: 50 })
          .filter(
            (s) =>
              s.trim().length >= 2 &&
              /^[a-zA-Z0-9\u3042-\u3093\u30A2-\u30F3 ]+$/.test(s)
          ),
        description: fc.string({ maxLength: 500 }),
        totalQuantity: fc.integer({ min: 1, max: 100 }),
        purchaseDate: fc.date({
          min: new Date('2000-01-01'),
          max: oneDayAgo,
        }),
        usefulLife: fc.option(fc.integer({ min: 1, max: 100 }), {
          nil: undefined,
        }),
      });

      await fc.assert(
        fc.asyncProperty(validEquipmentArb, async (equipmentData) => {
          // 1. Create equipment (not on loan)
          const createResult = await createEquipment(equipmentData);
          expect(createResult.success).toBe(true);
          if (!createResult.success) return;

          const equipment = createResult.data;
          const equipmentId = equipment.id;

          // Note: We don't add to createdIds because we're testing deletion

          // 2. Verify equipment exists before deletion (with retry)
          const { getEquipmentById } = await import('./data-access');
          const beforeDelete = await getEquipmentById(equipmentId, 3);
          expect(beforeDelete).not.toBeNull();

          // 3. Delete the equipment (should succeed since it's not on loan)
          const deleteResult = await deleteEquipment(equipmentId);

          // 4. Deletion should succeed
          expect(deleteResult.success).toBe(true);

          // 5. Wait for deletion to persist, then attempt to retrieve
          await new Promise((resolve) => setTimeout(resolve, 100));
          const afterDelete = await getEquipmentById(equipmentId, 2);

          // 6. Should return null (equipment not found)
          expect(afterDelete).toBeNull();
        }),
        { numRuns: 5 }
      );
    });
  });
});
