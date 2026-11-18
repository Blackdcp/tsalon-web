import assert from 'node:assert/strict';
import test from 'node:test';
import { COMPARISONS } from '../src/data/comparisons.ts';

test('COMPARISONS contains at least 5 unique entries', () => {
  assert.ok(Array.isArray(COMPARISONS));
  assert.ok(COMPARISONS.length >= 5, `Expected >= 5 comparisons, got ${COMPARISONS.length}`);
  const slugs = new Set(COMPARISONS.map((c) => c.slug));
  assert.equal(slugs.size, COMPARISONS.length, 'Duplicate slugs found in COMPARISONS');
});

test('all COMPARISONS entries have consistent bilingual columns, rows, clean headings, and zero CJK in English fields', () => {
  for (const item of COMPARISONS) {
    assert.ok(item.slug && /^[a-z0-9-]+$/.test(item.slug), `Invalid slug: ${item.slug}`);
    assert.ok(item.titleZh && !/[。.]$/.test(item.titleZh), `titleZh ends with period: ${item.slug}`);
    assert.ok(item.titleEn && !/[。.]$/.test(item.titleEn), `titleEn ends with period: ${item.slug}`);
    assert.equal(item.columnsZh.length, item.columnsEn.length, `Column count mismatch for ${item.slug}`);
    assert.ok(item.rows.length >= 4, `Need >= 4 rows for ${item.slug}`);
    for (const row of item.rows) {
      assert.equal(
        row.valuesZh.length,
        item.columnsZh.length - 1,
        `valuesZh length mismatch in ${item.slug} row "${row.dimensionEn}"`
      );
      assert.equal(
        row.valuesEn.length,
        item.columnsEn.length - 1,
        `valuesEn length mismatch in ${item.slug} row "${row.dimensionEn}"`
      );
      assert.equal(/[\u4e00-\u9fff]/.test(row.dimensionEn), false, `CJK in dimensionEn: ${item.slug}`);
      for (const valEn of row.valuesEn) {
        assert.equal(/[\u4e00-\u9fff]/.test(valEn), false, `CJK in valuesEn: ${item.slug}`);
      }
    }
    assert.ok(item.whenToChooseZh.length >= 2 && item.whenToChooseEn.length >= 2, `Need >= 2 scenarios for ${item.slug}`);
    assert.ok(item.faqZh.length >= 1 && item.faqEn.length >= 1, `Need >= 1 FAQ for ${item.slug}`);
    assert.equal(/[\u4e00-\u9fff]/.test(item.titleEn), false, `CJK in titleEn: ${item.slug}`);
    assert.equal(/[\u4e00-\u9fff]/.test(item.descEn), false, `CJK in descEn: ${item.slug}`);
    assert.equal(/[\u4e00-\u9fff]/.test(item.directVerdictEn), false, `CJK in directVerdictEn: ${item.slug}`);
  }
});
