"""POST /reverify"""
from __future__ import annotations

import json

from fastapi import APIRouter, UploadFile, File, Form, HTTPException

from app.models.contract import Contract, ContractStatus
from app.models.verification import VerificationResponse
from app.services.verifier import run_verification
from app.utils.csv_io import read_upload_file, parse_csv

router = APIRouter()


@router.post("/reverify", response_model=VerificationResponse)
async def reverify_endpoint(
    original_file:  UploadFile = File(..., description="Original CSV (unchanged)"),
    corrected_file: UploadFile = File(..., description="Corrected CSV (post-repair)"),
    contract_json:  str        = Form(..., description="Same approved contract JSON"),
):
    """
    Re-run verification after the user has applied the repair instruction.

    Uses the same approved contract — only the corrected output file changes.
    Returns the same VerificationResponse shape as /verify.
    """
    try:
        contract_data = json.loads(contract_json)
        contract = Contract.model_validate(contract_data)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Invalid contract JSON: {exc}")

    if contract.status != ContractStatus.APPROVED:
        raise HTTPException(
            status_code=422,
            detail="Contract must be APPROVED to run re-verification.",
        )

    before_bytes   = await read_upload_file(original_file)
    corrected_bytes = await read_upload_file(corrected_file)

    before_df    = parse_csv(before_bytes,   original_file.filename  or "original")
    corrected_df = parse_csv(corrected_bytes, corrected_file.filename or "corrected")

    result = run_verification(before_df, corrected_df, contract)
    return result
