import logging
import secrets
import string
from datetime import datetime, timedelta, timezone

import sqlalchemy.orm
from fastapi import HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from jose import JWTError, jwt
from passlib.context import CryptContext

import back.dto.user_dto as user_dto
from back.config import GOOGLE_CLIENT_ID, JWT_SECRET_KEY
from back.service import user_service

logger = logging.getLogger(__name__)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


def hash_password(password: str):
    return pwd_context.hash(password)


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


def register_user(db: sqlalchemy.orm.Session, user_data: user_dto.UserCreate) -> dict:
    existing_user = user_service.get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered"
        )

    hashed_pwd = hash_password(user_data.password)
    new_user = user_service.create_user(user_data, hashed_pwd)
    user_service.add_user(db, new_user)

    token = create_access_token({"sub": new_user.email})
    return {"token": token, "token_type": "bearer", "user": new_user}


def login_user(db: sqlalchemy.orm.Session, form_data: user_dto.UserLogin) -> dict:
    user = user_service.get_user_by_email(db, form_data.email)
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password"
        )

    token = create_access_token({"sub": user.email})
    return {"token": token, "token_type": "bearer", "user": user}


def authenticate_google_user(db: sqlalchemy.orm.Session, google_token: str) -> dict:
    try:
        payload = id_token.verify_token(
            google_token,
            google_requests.Request(),
            audience=GOOGLE_CLIENT_ID,
            certs_url="https://finance-app-lukaszkrzem.vercel.app/api/google-certs",
        )

        if payload.get("iss") not in [
            "accounts.google.com",
            "https://accounts.google.com",
        ]:
            raise ValueError("Wrong issuer.")

        user_email = payload["email"]
        user_name = payload["name"]
    except Exception as e:
        logger.error("Google token verification failed: %s: %s", type(e).__name__, e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Google token"
        )

    existing_user = user_service.get_user_by_email(db, user_email)
    if not existing_user:
        alphabet = string.ascii_letters + string.digits + string.punctuation
        random_password = "".join(secrets.choice(alphabet) for _ in range(32))

        hashed_pwd = hash_password(random_password)
        new_dto = user_dto.UserCreate(
            email=user_email, password=random_password, name=user_name
        )
        new_user = user_service.create_user(new_dto, hashed_pwd)
        user_service.add_user(db, new_user)
    else:
        new_user = existing_user

    token = create_access_token({"sub": new_user.email})
    return {"token": token, "token_type": "bearer", "user": new_user}
