import os
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login") 

# For now left it here maybe later move to some config file idk
SECRET_KEY = "e7c845b2069818804c7c640e02927236d933e14f6b2803b8782046808791c13d"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Sets up password hashing using Argon2
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
