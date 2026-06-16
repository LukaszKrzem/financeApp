import os
from datetime import datetime, timedelta, timezone

from fastapi.security import OAuth2PasswordBearer
from google.auth.transport import requests
from google.oauth2 import id_token
from jose import JWTError, jwt
from passlib.context import CryptContext

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# For now left it here maybe later move to some config file idk
GOOGLE_CLIENT_ID = (
    "449318029169-r53vkhiu2pcfoohcdacqks1j9737l5e2.apps.googleusercontent.com"
)

SECRET_KEY = "e7c845b2069818804c7c640e02927236d933e14f6b2803b8782046808791c13d"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = (
    60  # change it to less if you want to test token expiration
)

# Sets up password hashing using Argon2 #
# Used Argon2 coz Bcrypt generated some errors with length and i could not bother to fix that so unlucky we use Argon2
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


# To hash a password
def hash_password(password: str):
    return pwd_context.hash(password)


# To verify a password for login
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


# Used to generate JWT token after successful login
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# Used to verify JWT token and get user info from it
def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


def verify_google_token(token: str):
    try:
        payload = id_token.verify_oauth2_token(
            token, requests.Request(), GOOGLE_CLIENT_ID
        )
        user_email = payload["email"]
        user_name = payload["name"]
        return {"email": user_email, "name": user_name, "password": None}
    except ValueError:
        return None
