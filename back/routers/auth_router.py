import back.dto.user_dto as user_dto
import sqlalchemy.orm
from back.database import get_db
from back.service import auth_service
from fastapi import APIRouter, Depends

router = APIRouter(tags=["Authentication"])


@router.post("/register", response_model=user_dto.TokenResponse)
def register(
    user_data: user_dto.UserCreate,
    db: sqlalchemy.orm.Session = Depends(get_db),
):
    return auth_service.register_user(db, user_data)


@router.post("/login", response_model=user_dto.TokenResponse)
def login(
    form_data: user_dto.UserLogin,
    db: sqlalchemy.orm.Session = Depends(get_db),
):
    return auth_service.login_user(db, form_data)


@router.post("/auth/google", response_model=user_dto.TokenResponse)
def auth_google(
    google_token: user_dto.GoogleToken,
    db: sqlalchemy.orm.Session = Depends(get_db),
):
    return auth_service.authenticate_google_user(db, google_token.token)
