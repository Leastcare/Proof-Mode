"""POST /compile-contract"""
from __future__ import annotations

from fastapi import APIRouter, Form, UploadFile, File
from typing import Optional

from app.models.contract import Contract
from app.services.contract_compiler import compile_contract
from app.utils.csv_io import read_upload_file, get_column_names

router = APIRouter()


@router.post("/compile-contract", response_model=Contract)
async def compile_contract_endpoint(
    instruction: str = Form(..., description="Plain-English transformation instruction"),
    original_file: Optional[UploadFile] = File(
        default=None,
        description="Original CSV (optional, used to infer column names)",
    ),
):
    """
    Convert a natural-language instruction into a proposed contract.

    - Sends instruction + column hints to the compiler.
    - Returns a PROPOSED contract the user must review and approve.
    - Never returns pass/fail verdicts on the dataset.
    """
    columns: list[str] = []
    if original_file:
        data = await read_upload_file(original_file)
        columns = get_column_names(data)

    contract = await compile_contract(instruction, columns)
    return contract
