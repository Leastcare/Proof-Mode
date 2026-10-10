"""POST /compile-contract  |  POST /preview-columns"""
from __future__ import annotations

from fastapi import APIRouter, Form, UploadFile, File
from typing import Optional

from app.models.contract import Contract
from app.services.contract_compiler import compile_contract
from app.utils.csv_io import read_upload_file, get_column_names, get_csv_preview

router = APIRouter()


@router.post("/compile-contract", response_model=Contract)
async def compile_contract_endpoint(
    instruction: str = Form(..., description="Plain-English transformation instruction"),
    original_file: Optional[UploadFile] = File(
        default=None,
        description="Original CSV — used to infer column names for the compiler",
    ),
):
    """
    Convert a natural-language instruction into a proposed contract.
    Returns a PROPOSED contract the user must review and approve before verification.
    """
    columns: list[str] = []
    if original_file:
        data = await read_upload_file(original_file)
        columns = get_column_names(data)

    contract = await compile_contract(instruction, columns)
    return contract


@router.post("/preview-columns")
async def preview_columns_endpoint(
    file: UploadFile = File(..., description="CSV file to preview"),
):
    """
    Return column names + first 3 rows from a CSV file.
    Used by the frontend to show the user what columns exist before
    they write the transformation instruction.
    """
    data = await read_upload_file(file)
    preview = get_csv_preview(data, n_rows=3)
    return {
        "filename": file.filename,
        "size_bytes": len(data),
        **preview,
    }
