import type { Contract } from '../types/contract'
import type { VerificationResponse } from '../types/verification'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

// ── helpers ───────────────────────────────────────────────────────────────────

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = `HTTP ${res.status}`
    try {
      const body = await res.json()
      detail = body?.detail ?? detail
    } catch { /* ignore */ }
    throw new Error(detail)
  }
  return res.json() as Promise<T>
}

// ── API calls ─────────────────────────────────────────────────────────────────

export async function compileContract(
  instruction: string,
  originalFile?: File | null,
): Promise<Contract> {
  const form = new FormData()
  form.append('instruction', instruction)
  if (originalFile) form.append('original_file', originalFile)

  const res = await fetch(`${BASE_URL}/compile-contract`, {
    method: 'POST',
    body: form,
  })
  return handleResponse<Contract>(res)
}

export async function verifyFiles(
  originalFile: File,
  transformedFile: File,
  contract: Contract,
): Promise<VerificationResponse> {
  const approved = { ...contract, status: 'APPROVED' }
  const form = new FormData()
  form.append('original_file', originalFile)
  form.append('transformed_file', transformedFile)
  form.append('contract_json', JSON.stringify(approved))

  const res = await fetch(`${BASE_URL}/verify`, {
    method: 'POST',
    body: form,
  })
  return handleResponse<VerificationResponse>(res)
}

export async function reverifyFiles(
  originalFile: File,
  correctedFile: File,
  contract: Contract,
): Promise<VerificationResponse> {
  const form = new FormData()
  form.append('original_file', originalFile)
  form.append('corrected_file', correctedFile)
  form.append('contract_json', JSON.stringify(contract))

  const res = await fetch(`${BASE_URL}/reverify`, {
    method: 'POST',
    body: form,
  })
  return handleResponse<VerificationResponse>(res)
}
