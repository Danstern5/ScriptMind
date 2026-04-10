import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel


class ScriptCreate(BaseModel):
    title: str = "Untitled"
    elements: list[Any] = []
    title_page: dict[str, Any] = {}


class ScriptUpdate(BaseModel):
    title: str | None = None
    elements: list[Any] | None = None
    title_page: dict[str, Any] | None = None


class ScriptResponse(BaseModel):
    id: uuid.UUID
    title: str
    elements: list[Any]
    title_page: dict[str, Any]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ScriptListItem(BaseModel):
    id: uuid.UUID
    title: str
    updated_at: datetime

    model_config = {"from_attributes": True}
