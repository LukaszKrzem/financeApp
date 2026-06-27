from fastapi import Depends, HTTPException, status
import sqlalchemy.orm
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
        detail="Sesja wygasła",
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
