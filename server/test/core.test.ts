import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BLOOD_GROUPS, canDonate, compatibleDonorGroups, compatibleRecipientGroups } from '../src/services/compatibility.js';
import { canonicalize, hashRecord, recordIdFor, referenceHashFor } from '../src/services/hash.js';
import { donorEligibility, ageOn } from '../src/services/eligibility.js';
import { verhoeffGenerate, isWellFormedAadhaar } from '../src/services/verhoeff.js';

test('O- is a universal donor and AB+ a universal recipient', () => {
  for (const g of BLOOD_GROUPS) {
    assert.equal(canDonate('O-', g), true, `O- -> ${g}`);
    assert.equal(canDonate(g, 'AB+'), true, `${g} -> AB+`);
  }
  assert.equal(compatibleRecipientGroups('O-').length, 8);
  assert.equal(compatibleDonorGroups('AB+').length, 8);
});

test('compatibility matches the standard RBC chart exactly', () => {
  const chart: Record<string, string[]> = {
    'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    'O+': ['O+', 'A+', 'B+', 'AB+'],
    'A-': ['A-', 'A+', 'AB-', 'AB+'],
    'A+': ['A+', 'AB+'],
    'B-': ['B-', 'B+', 'AB-', 'AB+'],
    'B+': ['B+', 'AB+'],
    'AB-': ['AB-', 'AB+'],
    'AB+': ['AB+'],
  };
  for (const donor of BLOOD_GROUPS) {
    assert.deepEqual([...compatibleRecipientGroups(donor)].sort(), [...chart[donor]].sort(), `donor ${donor}`);
  }
});

test('specific incompatibilities are rejected', () => {
  assert.equal(canDonate('A+', 'A-'), false); // Rh mismatch
  assert.equal(canDonate('A+', 'O+'), false); // ABO mismatch
  assert.equal(canDonate('AB+', 'O-'), false);
  assert.equal(canDonate('B+', 'A+'), false);
  assert.equal(canDonate('O+', 'O-'), false);
});

test('canonical hashing is deterministic and key-order independent', () => {
  const a = { b: 2, a: 1, nested: { y: [3, 2], x: 'z' } };
  const b = { nested: { x: 'z', y: [3, 2] }, a: 1, b: 2 };
  assert.equal(canonicalize(a), canonicalize(b));
  assert.equal(hashRecord(a), hashRecord(b));
  assert.match(hashRecord(a), /^0x[0-9a-f]{64}$/);
  assert.notEqual(hashRecord(a), hashRecord({ ...a, a: 2 }));
  assert.equal(canonicalize({ a: undefined, b: 1 }), '{"b":1}');
  assert.equal(canonicalize({ d: new Date('2025-01-02T03:04:05.000Z') }), '{"d":"2025-01-02T03:04:05.000Z"}');
});

test('record ids are stable and type-scoped', () => {
  assert.equal(recordIdFor('DONATION', 'abc'), recordIdFor('DONATION', 'abc'));
  assert.notEqual(recordIdFor('DONATION', 'abc'), recordIdFor('MATCH', 'abc'));
  assert.equal(referenceHashFor(undefined), '0x' + '0'.repeat(64));
});

test('donor eligibility enforces age and donation interval', () => {
  const now = new Date('2026-06-01T00:00:00Z');
  assert.equal(donorEligibility({ dateOfBirth: new Date('2000-01-01') }, now).eligible, true);
  assert.equal(donorEligibility({ dateOfBirth: new Date('2012-01-01') }, now).eligible, false);
  assert.equal(donorEligibility({ dateOfBirth: new Date('1950-01-01') }, now).eligible, false);
  assert.equal(donorEligibility({}, now).eligible, false);
  const recent = donorEligibility({ dateOfBirth: new Date('2000-01-01'), lastDonationAt: new Date('2026-05-01') }, now);
  assert.equal(recent.eligible, false);
  assert.ok(recent.nextEligibleDate);
  assert.equal(donorEligibility({ dateOfBirth: new Date('2000-01-01'), lastDonationAt: new Date('2026-01-01') }, now).eligible, true);
  assert.equal(ageOn(new Date('2000-06-02'), now), 25);
});

test('Verhoeff checksum validates generated numbers and rejects typos', () => {
  const base = '23456789012';
  const full = base + verhoeffGenerate(base);
  assert.equal(isWellFormedAadhaar(full), true);
  const typo = full.slice(0, 5) + String((Number(full[5]) + 1) % 10) + full.slice(6);
  assert.equal(isWellFormedAadhaar(typo), false);
  assert.equal(isWellFormedAadhaar('123'), false);
  assert.equal(isWellFormedAadhaar('0' + full.slice(1)), false);
});
