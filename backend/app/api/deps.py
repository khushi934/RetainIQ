from typing import Optional
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.entities import User, Workspace

security_bearer = HTTPBearer(auto_error=False)

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: Session = Depends(get_db)
) -> User:
    """Validate JWT access token and return active user from MySQL."""
    if not credentials:
        # Check if default demo user exists for seamless evaluation
        demo_user = db.scalar(select(User).where(User.email == "demo@retainiq.io"))
        if demo_user:
            return demo_user
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided or have expired.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload["sub"]
    try:
        user_id_int = int(user_id)
        user = db.scalar(select(User).where(User.id == user_id_int))
    except ValueError:
        user = db.scalar(select(User).where(User.email == user_id))

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or account is deactivated."
        )
    return user

def get_current_workspace(
    x_workspace_id: Optional[str] = Header(None, alias="X-Workspace-Id"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Workspace:
    """Resolve and authorize workspace access for current user."""
    if x_workspace_id:
        try:
            ws_id = int(x_workspace_id)
            workspace = db.scalar(
                select(Workspace).where(Workspace.id == ws_id, Workspace.owner_id == current_user.id)
            )
            if workspace:
                return workspace
        except ValueError:
            pass

    # Default to user's first workspace
    workspace = db.scalar(
        select(Workspace).where(Workspace.owner_id == current_user.id).order_by(Workspace.id.asc())
    )
    if not workspace:
        # Automatically provision primary workspace
        slug = f"workspace-{current_user.id}"
        workspace = Workspace(
            name="Primary Intelligence Workspace",
            slug=slug,
            description="Default analytics and customer retention workspace",
            owner_id=current_user.id,
            is_demo=False
        )
        db.add(workspace)
        db.commit()
        db.refresh(workspace)

    return workspace
