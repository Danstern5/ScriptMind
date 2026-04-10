import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, String, func
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models import Base


class Script(Base):
    __tablename__ = "scripts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False, default="Untitled")
    elements: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    title_page: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship(back_populates="scripts")
