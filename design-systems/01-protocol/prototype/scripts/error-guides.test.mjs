import assert from 'node:assert/strict';
import test from 'node:test';
import { ERROR_GUIDES } from '../src/data/error-guides.ts';

test('ERROR_GUIDES contains at least 8 unique entries', () => {
  assert.ok(Array.isArray(ERROR_GUIDES));
  assert.ok(ERROR_GUIDES.length >= 8, `Expected >= 8 error guides, got ${ERROR_GUIDES.length}`);
  const slugs = new Set(ERROR_GUIDES.map((g) => g.slug));
  assert.equal(slugs.size, ERROR_GUIDES.length, 'Duplicate slugs found in ERROR_GUIDES');
});

test('all ERROR_GUIDES entries have required bilingual fields, valid tool paths, and clean headings', () => {
  for (const guide of ERROR_GUIDES) {
    assert.ok(guide.slug && /^[a-z0-9-]+$/.test(guide.slug), `Invalid slug: ${guide.slug}`);
    assert.ok(guide.titleZh && !/[。.]$/.test(guide.titleZh), `titleZh ends with period: ${guide.slug}`);
    assert.ok(guide.titleEn && !/[。.]$/.test(guide.titleEn), `titleEn ends with period: ${guide.slug}`);
    assert.ok(guide.directAnswerZh.length > 20, `Missing directAnswerZh for ${guide.slug}`);
    assert.ok(guide.directAnswerEn.length > 20, `Missing directAnswerEn for ${guide.slug}`);
    assert.ok(guide.causesZh.length >= 2 && guide.causesEn.length >= 2, `Need >=2 causes for ${guide.slug}`);
    assert.ok(guide.stepsZh.length >= 2 && guide.stepsEn.length >= 2, `Need >=2 steps for ${guide.slug}`);
    assert.ok(guide.faqZh.length >= 1 && guide.faqEn.length >= 1, `Need >=1 FAQ for ${guide.slug}`);
    assert.ok(guide.toolPathZh.startsWith('/') && !guide.toolPathZh.startsWith('/en/'), `Invalid toolPathZh: ${guide.toolPathZh}`);
    assert.ok(guide.toolPathEn.startsWith('/en/'), `Invalid toolPathEn: ${guide.toolPathEn}`);
    assert.equal(/[\u4e00-\u9fff]/.test(guide.titleEn), false, `Chinese char in titleEn: ${guide.slug}`);
    assert.equal(/[\u4e00-\u9fff]/.test(guide.descEn), false, `Chinese char in descEn: ${guide.slug}`);
  }
});
