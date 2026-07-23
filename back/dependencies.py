import sqlalchemy.orm
from fastapi import Depends, HTTPException, status

import back.database
import back.structure
from back.service import auth_service, user_service

# File for shared dependencies


# Dependency to get the current user based on the JWT token provided
def get_current_user(
    token: str = Depends(auth_service.oauth2_scheme),
    db: sqlalchemy.orm.Session = Depends(back.database.get_db),
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Session expired or invalid credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = auth_service.verify_token(token)
    if payload is None:
        raise credentials_exception

    email: str = payload.get("sub")
    if email is None:
        raise credentials_exception

    user = user_service.get_user_by_email(db, email=email)
    if user is None:
        raise credentials_exception

    return user


def prevent_demo_destruction(
    current_user: back.structure.User = Depends(get_current_user),
):
    """
    Prevents destructive operations (e.g. account deletion, credential removal)
    for the public demo account.
    """
    from back.config import DEMO_USER_EMAIL

    if current_user and current_user.email.lower() == DEMO_USER_EMAIL.lower():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=("DEMO MODE: THIS OPERATION IS DISABLED."),
        )
    return current_user
