import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.script import Script


async def get_scripts_by_user(db: AsyncSession, user_id: uuid.UUID) -> list[Script]:
    result = await db.execute(
        select(Script).where(Script.user_id == user_id).order_by(Script.updated_at.desc())
    )
    return list(result.scalars().all())


async def get_script_by_id(db: AsyncSession, script_id: uuid.UUID, user_id: uuid.UUID) -> Script | None:
    result = await db.execute(
        select(Script).where(Script.id == script_id, Script.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def create_script(db: AsyncSession, user_id: uuid.UUID, title: str, elements: list, title_page: dict) -> Script:
    script = Script(user_id=user_id, title=title, elements=elements, title_page=title_page)
    db.add(script)
    await db.commit()
    await db.refresh(script)
    return script


async def update_script(db: AsyncSession, script: Script, data: dict) -> Script:
    for key, value in data.items():
        if value is not None:
            setattr(script, key, value)
    await db.commit()
    await db.refresh(script)
    return script


async def delete_script(db: AsyncSession, script: Script) -> None:
    await db.delete(script)
    await db.commit()
