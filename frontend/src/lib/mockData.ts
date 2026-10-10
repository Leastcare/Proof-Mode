import type { Contract } from '../types/contract'
import type { VerificationResponse } from '../types/verification'

export const DEMO_INSTRUCTION =
  'Clean this customer dataset. Remove duplicates. Normalize phone numbers. Preserve every unique customer. Don\'t modify email addresses.'

export const MOCK_CONTRACT: Contract = {
  version: '1.0',
  instruction: DEMO_INSTRUCTION,
  entity_key: 'customer_id',
  status: 'PROPOSED',
  clauses: [
    {
      id: 'clause_001',
      type: 'PRESERVE_ENTITY',
      label: 'Every unique customer_id must remain.',
      status_before_verification: 'PROPOSED',
      params: { key: 'customer_id' },
    },
    {
      id: 'clause_002',
      type: 'DEDUPE',
      label: 'Deduplicate based on customer_id.',
      status_before_verification: 'PROPOSED',
      params: { key: 'customer_id' },
    },
    {
      id: 'clause_003',
      type: 'NO_NEW_ENTITY',
      label: 'No new customer_id may be introduced.',
      status_before_verification: 'PROPOSED',
      params: { key: 'customer_id' },
    },
    {
      id: 'clause_004',
      type: 'NORMALIZE',
      label: 'Convert phone numbers to standard format.',
      status_before_verification: 'PROPOSED',
      params: { column: 'phone', rule: 'digits_only' },
    },
    {
      id: 'clause_005',
      type: 'UNCHANGED_COLUMN',
      label: 'Email column must not be modified.',
      status_before_verification: 'PROPOSED',
      params: { column: 'email', apply_to: 'surviving_entities' },
    },
  ],
  ambiguities: [],
  compiler_notes: [
    'Entity key inferred from column name "customer_id".',
    'Phone normalization mapped to digits_only rule.',
  ],
}

// Generate 43 unexplained loss evidence records
const generateMissingEvidence = () => {
  const names = [
    'Priya Sharma', 'Arjun Mehta', 'Zara Khan', 'Liam Osei', 'Sofia Reyes',
    'Noah Tanaka', 'Amara Diallo', 'Ethan Novak', 'Mei Liu', 'Carlos Vega',
    'Fatima Al-Rashid', 'James Okonkwo', 'Ingrid Svensson', 'Ravi Patel', 'Chloe Martin',
    'Omar Farouk', 'Yuki Nakamura', 'Aisha Bello', 'Lucas Ferreira', 'Hannah Schulz',
    'Kofi Asante', 'Elena Popescu', 'Marcus Webb', 'Nadia Ibragimova', 'Diego Torres',
    'Freya Jensen', 'Tariq Hussain', 'Bianca Romano', 'Felix Nguyen', 'Astrid Berg',
    'Emmanuel Osei', 'Valentina Cruz', 'Jack Morrison', 'Leila Tehrani', 'Samuel Adeyemi',
    'Mia Kowalski', 'Ahmed Saleh', 'Clara Dupont', 'Rajesh Kumar', 'Naomi Watanabe',
    'Ivan Petrov', 'Grace Okafor', 'Ben Hartley',
  ]

  return names.map((name, i) => {
    const id = `CUS-0${1800 + i}`
    const email = `${name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z.]/g, '')}@example.com`
    return {
      id: `evidence_${String(i + 1).padStart(3, '0')}`,
      kind: 'missing_id' as const,
      entity_key: id,
      before_row: {
        customer_id: id,
        name,
        email,
        phone: `+91 ${Math.floor(Math.random() * 90000 + 10000)} ${Math.floor(Math.random() * 90000 + 10000)}`,
        created_at: `2024-0${(i % 9) + 1}-${String((i % 28) + 1).padStart(2, '0')}`,
      },
      after_row: null,
      contract_context: {
        clause_id: 'clause_001',
        clause_type: 'PRESERVE_ENTITY',
      },
      explanation:
        'Record exists in the original dataset but is absent from the transformed dataset and is not part of a valid duplicate group.',
    }
  })
}

// Generate 94 legitimate duplicate evidence records
const generateDuplicateEvidence = () => {
  return Array.from({ length: 94 }, (_, i) => {
    const id = `CUS-0${2700 + i}`
    const name = `Customer ${2700 + i}`
    const email = `customer${2700 + i}@example.com`
    return {
      id: `dup_evidence_${String(i + 1).padStart(3, '0')}`,
      kind: 'duplicate_group' as const,
      entity_key: id,
      before_row: {
        customer_id: id,
        name,
        email,
        phone: `9${String(876543210 + i)}`,
        created_at: '2024-03-15',
      },
      after_row: {
        customer_id: id,
        name,
        email,
        phone: `9${String(876543210 + i)}`,
        created_at: '2024-03-15',
      },
      contract_context: {
        clause_id: 'clause_002',
        clause_type: 'DEDUPE',
      },
      explanation: 'Duplicate record removed. Original duplicate kept. This removal is permitted by the approved DEDUPE clause.',
    }
  })
}

export const MOCK_VERIFICATION_FAILED: VerificationResponse = {
  run_id: 'verify_20261008_001',
  contract_status: 'APPROVED',
  verification_mode: 'DETERMINISTIC',
  summary: {
    overall_status: 'FAILED',
    before_row_count: 10000,
    after_row_count: 9863,
    surviving_rows: 9863,
    explained_removals: 94,
    unexplained_losses: 43,
    new_entities: 0,
    verified_clause_count: 4,
    failed_clause_count: 1,
    cant_verify_clause_count: 0,
  },
  reconciliation: {
    entity_key: 'customer_id',
    counts: {
      SURVIVED: 9863,
      LEGITIMATELY_REMOVED_DUPLICATE: 94,
      UNEXPLAINED_LOSS: 43,
      NEW_ENTITY: 0,
    },
    consistency_check: {
      input_total: 10000,
      accounted_total: 10000,
      is_balanced: true,
    },
  },
  clause_results: [
    {
      clause_id: 'clause_001',
      type: 'PRESERVE_ENTITY',
      label: 'Every unique customer_id must remain.',
      status: 'FAILED',
      verification_mode: 'DETERMINISTIC',
      summary: '43 customer IDs present in the original file are absent from the transformed file and unexplained by approved duplicate removal.',
      counts: { missing_entities: 43 },
      evidence_refs: Array.from({ length: 43 }, (_, i) => `evidence_${String(i + 1).padStart(3, '0')}`),
    },
    {
      clause_id: 'clause_002',
      type: 'DEDUPE',
      label: 'Deduplicate based on customer_id.',
      status: 'VERIFIED',
      verification_mode: 'DETERMINISTIC',
      summary: '94 duplicate records removed. All removals are accounted for by exact-key duplicate groups.',
      counts: { duplicate_groups: 47, records_removed: 94 },
      evidence_refs: Array.from({ length: 94 }, (_, i) => `dup_evidence_${String(i + 1).padStart(3, '0')}`),
    },
    {
      clause_id: 'clause_003',
      type: 'NO_NEW_ENTITY',
      label: 'No new customer_id may be introduced.',
      status: 'VERIFIED',
      verification_mode: 'DETERMINISTIC',
      summary: 'No new customer IDs were introduced in the transformed file.',
      counts: { new_entities: 0 },
      evidence_refs: [],
    },
    {
      clause_id: 'clause_004',
      type: 'NORMALIZE',
      label: 'Convert phone numbers to standard format.',
      status: 'VERIFIED',
      verification_mode: 'DETERMINISTIC',
      summary: 'All surviving phone number values pass the digits_only normalization rule.',
      counts: { checked: 9863, passed: 9863, failed: 0 },
      evidence_refs: [],
    },
    {
      clause_id: 'clause_005',
      type: 'UNCHANGED_COLUMN',
      label: 'Email column must not be modified.',
      status: 'VERIFIED',
      verification_mode: 'DETERMINISTIC',
      summary: 'All surviving email values are identical to their original values.',
      counts: { checked: 9863, changed: 0 },
      evidence_refs: [],
    },
  ],
  evidence: [...generateMissingEvidence(), ...generateDuplicateEvidence()],
  highlighted_ids: ['CUS-01800', 'CUS-01801', 'CUS-01802', 'CUS-01803', 'CUS-01804'],
  repair_instruction: `Restore the 43 missing customer records.
Do not modify any other records.
Preserve all approved transformations.
Verify that every unique customer_id from the original dataset exists in the corrected output.
Keep email values unchanged.
Keep phone values normalized to digits only.
Return the corrected CSV with the same column structure and formats.`,
  warnings: [],
}

export const MOCK_VERIFICATION_SUCCESS: VerificationResponse = {
  run_id: 'verify_20261008_002',
  contract_status: 'APPROVED',
  verification_mode: 'DETERMINISTIC',
  summary: {
    overall_status: 'VERIFIED',
    before_row_count: 10000,
    after_row_count: 10000,
    surviving_rows: 10000,
    explained_removals: 0,
    unexplained_losses: 0,
    new_entities: 0,
    verified_clause_count: 5,
    failed_clause_count: 0,
    cant_verify_clause_count: 0,
  },
  reconciliation: {
    entity_key: 'customer_id',
    counts: {
      SURVIVED: 10000,
      LEGITIMATELY_REMOVED_DUPLICATE: 0,
      UNEXPLAINED_LOSS: 0,
      NEW_ENTITY: 0,
    },
    consistency_check: {
      input_total: 10000,
      accounted_total: 10000,
      is_balanced: true,
    },
  },
  clause_results: [
    {
      clause_id: 'clause_001',
      type: 'PRESERVE_ENTITY',
      label: 'Every unique customer_id must remain.',
      status: 'VERIFIED',
      verification_mode: 'DETERMINISTIC',
      summary: 'All 10,000 unique customer IDs are present in the corrected output.',
      counts: { total_unique: 10000, preserved: 10000, missing: 0 },
      evidence_refs: [],
    },
    {
      clause_id: 'clause_002',
      type: 'DEDUPE',
      label: 'Deduplicate based on customer_id.',
      status: 'VERIFIED',
      verification_mode: 'DETERMINISTIC',
      summary: 'No duplicate customer IDs remain in the corrected output.',
      counts: { duplicate_groups: 0, records_removed: 0 },
      evidence_refs: [],
    },
    {
      clause_id: 'clause_003',
      type: 'NO_NEW_ENTITY',
      label: 'No new customer_id may be introduced.',
      status: 'VERIFIED',
      verification_mode: 'DETERMINISTIC',
      summary: 'No new customer IDs were introduced.',
      counts: { new_entities: 0 },
      evidence_refs: [],
    },
    {
      clause_id: 'clause_004',
      type: 'NORMALIZE',
      label: 'Convert phone numbers to standard format.',
      status: 'VERIFIED',
      verification_mode: 'DETERMINISTIC',
      summary: 'All phone number values pass the digits_only normalization rule.',
      counts: { checked: 10000, passed: 10000, failed: 0 },
      evidence_refs: [],
    },
    {
      clause_id: 'clause_005',
      type: 'UNCHANGED_COLUMN',
      label: 'Email column must not be modified.',
      status: 'VERIFIED',
      verification_mode: 'DETERMINISTIC',
      summary: 'All email values are identical to their original values.',
      counts: { checked: 10000, changed: 0 },
      evidence_refs: [],
    },
  ],
  evidence: [],
  highlighted_ids: [],
  repair_instruction: '',
  warnings: [],
}
