import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.script import ScriptCreate, ScriptListItem, ScriptResponse, ScriptUpdate
from app.services import scripts as script_service

router = APIRouter()


@router.get("/", response_model=list[ScriptListItem])
async def list_scripts(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    scripts = await script_service.get_scripts_by_user(db, user.id)
    return [ScriptListItem.model_validate(s) for s in scripts]


@router.post("/", response_model=ScriptResponse, status_code=status.HTTP_201_CREATED)
async def create_script(data: ScriptCreate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    script = await script_service.create_script(db, user.id, data.title, data.elements, data.title_page)
    return ScriptResponse.model_validate(script)


@router.get("/{script_id}", response_model=ScriptResponse)
async def get_script(script_id: uuid.UUID, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    script = await script_service.get_script_by_id(db, script_id, user.id)
    if not script:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Script not found")
    return ScriptResponse.model_validate(script)


@router.put("/{script_id}", response_model=ScriptResponse)
async def update_script(script_id: uuid.UUID, data: ScriptUpdate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    script = await script_service.get_script_by_id(db, script_id, user.id)
    if not script:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Script not found")
    updated = await script_service.update_script(db, script, data.model_dump(exclude_unset=True))
    return ScriptResponse.model_validate(updated)


@router.delete("/{script_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_script(script_id: uuid.UUID, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    script = await script_service.get_script_by_id(db, script_id, user.id)
    if not script:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Script not found")
    await script_service.delete_script(db, script)
