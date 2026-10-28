from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.entities import User, Workspace
from app.schemas.auth import UserRegister, UserLogin, UserResponse, Token, WorkspaceSummary
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(req: UserRegister, db: Session = Depends(get_db)):
    """Register a new user account and initialize their workspace."""
    existing = db.scalar(select(User).where(User.email == req.email.lower()))
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    user = User(
        email=req.email.lower(),
        hashed_password=get_password_hash(req.password),
        full_name=req.full_name,
        role="analyst",
        is_active=True
    )
    db.add(user)
    db.flush()

    ws_name = req.workspace_name or f"{req.full_name}'s Workspace"
    ws_slug = f"ws-{user.id}-{int(user.created_at.timestamp())}"
    workspace = Workspace(
        name=ws_name,
        slug=ws_slug,
        description="Main customer retention intelligence workspace",
        owner_id=user.id,
        is_demo=False
    )
    db.add(workspace)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    user_res = UserResponse.model_validate(user)
    user_res.workspaces = [WorkspaceSummary.model_validate(workspace)]
    return Token(access_token=token, token_type="bearer", user=user_res)

@router.post("/login", response_model=Token)
def login(req: UserLogin, db: Session = Depends(get_db)):
    """Authenticate with email and password and return access token."""
    user = db.scalar(select(User).where(User.email == req.email.lower()))
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive."
        )

    token = create_access_token(user.id)
    workspaces = db.scalars(select(Workspace).where(Workspace.owner_id == user.id)).all()
    user_res = UserResponse.model_validate(user)
    user_res.workspaces = [WorkspaceSummary.model_validate(ws) for ws in workspaces]
    return Token(access_token=token, token_type="bearer", user=user_res)

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve profile and workspaces for current authenticated user."""
    workspaces = db.scalars(select(Workspace).where(Workspace.owner_id == current_user.id)).all()
    res = UserResponse.model_validate(current_user)
    res.workspaces = [WorkspaceSummary.model_validate(ws) for ws in workspaces]
    return res

@router.post("/logout")
def logout():
    """Client-side token disposal confirmation."""
    return {"message": "Logged out successfully."}
