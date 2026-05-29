import sqlalchemy.orm
from back import structure
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr

import back.dto.user_dto
from back.database import get_db
from back.dependencies import get_current_user
from back.service import auth_service, user_service

# To group user endpoints
router = APIRouter(tags=["Users"])


class UserLogin(BaseModel):
    email: EmailStr
    password: str


# Endpoint for user registration. Returns data formated as UserOut DTO
@router.post("/register", response_model=back.dto.user_dto.TokenResponse)
def register(
    user_data: back.dto.user_dto.UserCreate,
    db: sqlalchemy.orm.Session = Depends(get_db),
):
    existing_user = user_service.get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Podany email jest już używany",
        )
    new_user = user_service.create_user(user_data)
    add_user = user_service.add_user(db, new_user)

    token = auth_service.create_access_token({"sub": new_user.email})
    return {"token": token, "token_type": "bearer", "user": new_user}


# Endpoint for user login. Returns message and user info if successful
@router.post("/login", response_model=back.dto.user_dto.TokenResponse)
def login(
    form_data: UserLogin,
    db: sqlalchemy.orm.Session = Depends(get_db),
):
    user = user_service.get_user_by_email(db, form_data.email)
    if not user or not auth_service.verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Invalid email or password"
        )
    token = auth_service.create_access_token({"sub": user.email})
    return {"token": token, "token_type": "bearer", "user": user}


# Endpoint to get current user info based on the provided JWT token. Used for getting user info
@router.get("/me", response_model=back.dto.user_dto.UserOut)
def read_users_me(current_user=Depends(get_current_user)):
    return current_user
