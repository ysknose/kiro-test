/**
 * Property-based tests for validation schemas
 * Feature: company-equipment-management
 */

import { describe, test, expect } from 'bun:test';
import * as fc from 'fast-check';
import * as v from 'valibot';
import { EquipmentSchema } from './schemas';

describe('Equipment Validation Schema', () => {
  /**
   * Feature: company-equipment-management, Property 2: 必須フィールドバリデーション
   * Validates: Requirements 1.2
   *
   * Property: For any equipment data where name or category is an empty string
   * or contains only whitespace characters, the validation should reject it
   * and return an error message.
   */
  test('Property 2: Required field validation - rejects empty or whitespace-only name/category', () => {
    // Generator for whitespace-only strings (including empty string)
    const whitespaceStringArb = fc.oneof(
      fc.constant(''),
      fc.constant(' '),
      fc.constant('  '),
      fc.constant('\t'),
      fc.constant('\n'),
      fc.constant('   \t  \n  ')
    );

    // Generator for valid equipment data with invalid name
    const invalidNameEquipmentArb = fc.record({
      name: whitespaceStringArb,
      category: fc
        .string({ minLength: 1, maxLength: 50 })
        .filter((s) => s.trim().length > 0),
      description: fc.string({ maxLength: 500 }),
      totalQuantity: fc.integer({ min: 0, max: 10000 }),
      purchaseDate: fc.date({ max: new Date() }),
      usefulLife: fc.option(fc.integer({ min: 1, max: 100 }), {
        nil: undefined,
      }),
    });

    // Generator for valid equipment data with invalid category
    const invalidCategoryEquipmentArb = fc.record({
      name: fc
        .string({ minLength: 1, maxLength: 100 })
        .filter((s) => s.trim().length > 0),
      category: whitespaceStringArb,
      description: fc.string({ maxLength: 500 }),
      totalQuantity: fc.integer({ min: 0, max: 10000 }),
      purchaseDate: fc.date({ max: new Date() }),
      usefulLife: fc.option(fc.integer({ min: 1, max: 100 }), {
        nil: undefined,
      }),
    });

    // Test invalid name
    fc.assert(
      fc.property(invalidNameEquipmentArb, (equipmentData) => {
        const result = v.safeParse(EquipmentSchema, equipmentData);

        // Validation should fail
        expect(result.success).toBe(false);

        if (!result.success) {
          // Should have an error message about the name field
          const hasNameError = result.issues.some((issue) =>
            issue.path?.some((p) => p.key === 'name')
          );
          expect(hasNameError).toBe(true);
        }
      }),
      { numRuns: 100 }
    );

    // Test invalid category
    fc.assert(
      fc.property(invalidCategoryEquipmentArb, (equipmentData) => {
        const result = v.safeParse(EquipmentSchema, equipmentData);

        // Validation should fail
        expect(result.success).toBe(false);

        if (!result.success) {
          // Should have an error message about the category field
          const hasCategoryError = result.issues.some((issue) =>
            issue.path?.some((p) => p.key === 'category')
          );
          expect(hasCategoryError).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });
});
