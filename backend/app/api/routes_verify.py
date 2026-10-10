"""POST /verify"""
from __future__ import annotations

import json

from fastapi import APIRouter, UploadFile, File, Form, HTTPException

from app.models.contract import Contract, ContractStatus
from app.models.verification import VerificationResponse
from app.services.verifier import run_verification
from app.utils.csv_io import read_upload_file, parse_csv

router = APIRouter()


@router.post("/verify", response_model=VerificationResponse)
async def verify_endpoint(
    original_file:    UploadFile = File(..., description="Original CSV (before transformation)"),
    transformed_file: UploadFile = File(..., description="AI-transformed CSV"),
    contract_json:    str        = Form(..., description="Approved contract as JSON string"),
):
    """
    Deterministic verification of a transformed CSV against an approved contract.

    Accepts:
    - original CSV file
    - transformed CSV file
    - approved contract JSON (as a form field)

    Returns a VerificationResponse with clause results, reconciliation,
    evidence, and a repair instruction.
    """
    # ── Parse contract ────────────────────────────────────────────────────────
    try:
        contract_data = json.loads(contract_json)
        contract = Contract.model_validate(contract_data)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Invalid contract JSON: {exc}")

    if contract.status != ContractStatus.APPROVED:
        raise HTTPException(
            status_code=422,
            detail="Contract must be APPROVED before verification. "
                   "Set status to 'APPROVED' after the user reviews it.",
        )

    # ── Parse CSV files ───────────────────────────────────────────────────────
    before_bytes = await read_upload_file(original_file)
    after_bytes  = await read_upload_file(transformed_file)

    before_df = parse_csv(before_bytes, original_file.filename or "original")
    after_df  = parse_csv(after_bytes,  transformed_file.filename or "transformed")

    # ── Run verification ──────────────────────────────────────────────────────
    result = run_verification(before_df, after_df, contract)
    return result
