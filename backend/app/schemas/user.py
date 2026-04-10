import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr


class UserSignup(BaseModel):
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    created_at: datetime

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    access_token: str
    user: UserResponse
