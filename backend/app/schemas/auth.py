from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, ConfigDict

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=2)
    workspace_name: Optional[str] = "Default Workspace"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class WorkspaceSummary(BaseModel):
    id: int
    name: str
    slug: str
    is_demo: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    workspaces: List[WorkspaceSummary] = []
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
