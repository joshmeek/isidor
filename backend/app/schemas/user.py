from typing import Dict, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr


# Shared properties
class UserBase(BaseModel):
    email: EmailStr


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: Optional[str] = None


# Properties to receive via API on update
class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    preferences: Optional[Dict] = None


# Properties shared by models stored in DB
class UserInDBBase(UserBase):
    id: UUID
    preferences: Optional[Dict] = None

    model_config = ConfigDict(from_attributes=True)


# Properties to return via API
class User(UserInDBBase):
    pass


# Properties stored in DB
class UserInDB(UserInDBBase):
    password_hash: str
