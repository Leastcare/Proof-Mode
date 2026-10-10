import clsx, { type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatNumber(n: number): string {
  return n.toLocaleString('en-US')
}

export function getClauseIcon(type: string): string {
  const icons: Record<string, string> = {
    PRESERVE_ENTITY: '◈',
    DEDUPE: '⊘',
    NO_NEW_ENTITY: '⊕',
    NORMALIZE: '≋',
    NO_NEW_NULLS: '∅',
    PRESERVE_SUM: '∑',
    UNCHANGED_COLUMN: '≡',
    ROW_COUNT_RANGE: '⊞',
  }
  return icons[type] ?? '○'
}

export function getClauseLabel(type: string): string {
  const labels: Record<string, string> = {
    PRESERVE_ENTITY: 'PRESERVE ENTITY',
    DEDUPE: 'REMOVE DUPLICATES',
    NO_NEW_ENTITY: 'NO NEW ENTITY',
    NORMALIZE: 'NORMALIZE',
    NO_NEW_NULLS: 'NO NEW NULLS',
    PRESERVE_SUM: 'PRESERVE SUM',
    UNCHANGED_COLUMN: 'UNCHANGED COLUMN',
    ROW_COUNT_RANGE: 'ROW COUNT RANGE',
  }
  return labels[type] ?? type
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'VERIFIED': return 'text-verified-text'
    case 'FAILED': return 'text-failed-text'
    case 'CANT_VERIFY': return 'text-cant-verify-text'
    default: return 'text-muted'
  }
}

export function getStatusBg(status: string): string {
  switch (status) {
    case 'VERIFIED': return 'bg-verified-dim border-verified'
    case 'FAILED': return 'bg-failed-dim border-failed'
    case 'CANT_VERIFY': return 'bg-cant-verify border-cant-verify-text/30'
    default: return 'bg-surface border-ghost'
  }
}
