import secrets
import string

import back.dto.user_dto
import sqlalchemy.orm
from back.database import get_db
from back.dependencies import get_current_user
from back.service import auth_service, user_service
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr

# To group user endpoints
router = APIRouter(tags=["Users"])


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class GoogleToken(BaseModel):
    token: str


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
    user_service.add_user(db, new_user)

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


# Endpoint to get current userinfo based on provided JWT token. Used for gettin userinfo
@router.get("/me", response_model=back.dto.user_dto.UserOut)
def read_users_me(current_user=Depends(get_current_user)):
    return current_user


@router.post("/auth/google", response_model=back.dto.user_dto.TokenResponse)
def auth_google(
    google_token: GoogleToken,
    db: sqlalchemy.orm.Session = Depends(get_db),
):
    user_data = auth_service.verify_google_token(google_token.token)
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Google token"
        )

    existing_user = user_service.get_user_by_email(db, user_data["email"])
    if not existing_user:
        alphabet = string.ascii_letters + string.digits + string.punctuation
        random_password = "".join(secrets.choice(alphabet) for i in range(32))
        user_data["password"] = random_password
        new_user = user_service.create_user(back.dto.user_dto.UserCreate(**user_data))
        user_service.add_user(db, new_user)
    else:
        new_user = existing_user
    token = auth_service.create_access_token({"sub": new_user.email})
    return {"token": token, "token_type": "bearer", "user": new_user}
