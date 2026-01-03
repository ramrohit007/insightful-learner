from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
import os

router = APIRouter()

@router.get("/download/{file_type}/{file_id}")
async def download_file(file_type: str, file_id: str):
    """Download uploaded files"""
    if file_type not in ["syllabus", "answers", "text"]:
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    file_path = f"uploads/{file_type}/{file_id}"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(file_path)

